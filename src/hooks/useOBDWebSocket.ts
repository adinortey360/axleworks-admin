/**
 * useOBDWebSocket Hook
 *
 * Manages WebSocket connection for real-time OBD data updates.
 * Allows admin to subscribe to vehicle telemetry streams.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://axleworks-api.onrender.com';
const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';

export interface OBDData {
  rpm?: number;
  engineLoad?: number;
  coolantTemp?: number;
  speed?: number;
  throttlePosition?: number;
  fuelLevel?: number;
  shortTermFuelTrim?: number;
  longTermFuelTrim?: number;
  intakeAirTemp?: number;
  mafAirFlow?: number;
  manifoldPressure?: number;
  timingAdvance?: number;
  barometricPressure?: number;
  ambientAirTemp?: number;
  catalystTemp?: number;
  batteryVoltage?: number;
  controlModuleVoltage?: number;
  milStatus?: boolean;
  dtcCount?: number;
  activeDTCs?: string[];
  boostPressure?: number;
  timestamp?: string;
}

export interface VehicleStream {
  vehicleId: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
  };
  data: OBDData | null;
  isStreaming: boolean;
  lastUpdate: Date | null;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'authenticated' | 'error';

interface UseOBDWebSocketReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  error: string | null;
  vehicleStreams: Map<string, VehicleStream>;
  activeStreamCount: number;
  subscribeToVehicle: (vehicleId: string) => void;
  unsubscribeFromVehicle: (vehicleId: string) => void;
  subscribeToAll: () => void;
  connect: () => void;
  disconnect: () => void;
}

export function useOBDWebSocket(): UseOBDWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [vehicleStreams, setVehicleStreams] = useState<Map<string, VehicleStream>>(new Map());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);

  const updateVehicleStream = useCallback((vehicleId: string, update: Partial<VehicleStream>) => {
    setVehicleStreams(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(vehicleId) || {
        vehicleId,
        data: null,
        isStreaming: false,
        lastUpdate: null,
      };
      newMap.set(vehicleId, { ...existing, ...update });
      return newMap;
    });
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'connected':
          console.log('[WS Admin] Connected to server');
          break;

        case 'auth_success':
          console.log('[WS Admin] Authenticated');
          setStatus('authenticated');
          setError(null);
          reconnectAttempts.current = 0;
          break;

        case 'auth_error':
          console.error('[WS Admin] Auth error:', message.message);
          setStatus('error');
          setError(message.message);
          break;

        case 'subscribed':
          console.log('[WS Admin] Subscribed to vehicle:', message.vehicleId);
          updateVehicleStream(message.vehicleId, {
            isStreaming: message.isStreaming,
          });
          break;

        case 'subscribed_all':
          console.log('[WS Admin] Subscribed to all vehicles, active:', message.activeStreams);
          break;

        case 'unsubscribed':
          console.log('[WS Admin] Unsubscribed from vehicle:', message.vehicleId);
          setVehicleStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(message.vehicleId);
            return newMap;
          });
          break;

        case 'vehicle_streaming':
          console.log('[WS Admin] Vehicle started streaming:', message.vehicleId);
          updateVehicleStream(message.vehicleId, {
            vehicle: message.vehicle,
            isStreaming: true,
          });
          break;

        case 'vehicle_stream_ended':
          console.log('[WS Admin] Vehicle stopped streaming:', message.vehicleId);
          updateVehicleStream(message.vehicleId, {
            isStreaming: false,
          });
          break;

        case 'obd_update':
          updateVehicleStream(message.vehicleId, {
            vehicle: message.vehicle,
            data: message.data,
            isStreaming: true,
            lastUpdate: new Date(message.timestamp),
          });
          break;

        case 'pong':
          // Heartbeat response
          break;

        case 'error':
          console.error('[WS Admin] Server error:', message.message);
          setError(message.message);
          break;

        default:
          console.log('[WS Admin] Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('[WS Admin] Error parsing message:', err);
    }
  }, [updateVehicleStream]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      console.log('[WS Admin] Connecting to:', WS_URL);
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS Admin] WebSocket opened');
        setStatus('connected');
        startHeartbeat();

        // Authenticate
        ws.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = handleMessage;

      ws.onerror = (event) => {
        console.error('[WS Admin] WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        console.log('[WS Admin] WebSocket closed:', event.code, event.reason);
        stopHeartbeat();
        wsRef.current = null;

        if (status !== 'disconnected') {
          setStatus('disconnected');

          // Attempt reconnect
          if (reconnectAttempts.current < 5) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            console.log(`[WS Admin] Reconnecting in ${delay}ms...`);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        }
      };
    } catch (err) {
      console.error('[WS Admin] Error creating WebSocket:', err);
      setStatus('error');
      setError('Failed to connect');
    }
  }, [handleMessage, startHeartbeat, stopHeartbeat, status]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnecting');
      wsRef.current = null;
    }

    setStatus('disconnected');
    setVehicleStreams(new Map());
  }, [stopHeartbeat]);

  const subscribeToVehicle = useCallback((vehicleId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_vehicle',
        vehicleId,
      }));
    }
  }, []);

  const unsubscribeFromVehicle = useCallback((vehicleId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe_vehicle',
        vehicleId,
      }));
    }
  }, []);

  const subscribeToAll = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_all_vehicles',
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    isConnected: status === 'authenticated',
    error,
    vehicleStreams,
    activeStreamCount: Array.from(vehicleStreams.values()).filter(v => v.isStreaming).length,
    subscribeToVehicle,
    unsubscribeFromVehicle,
    subscribeToAll,
    connect,
    disconnect,
  };
}

export default useOBDWebSocket;
