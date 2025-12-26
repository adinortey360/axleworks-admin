import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Gauge,
  Thermometer,
  Fuel,
  Battery,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Car,
  Zap,
  Clock,
  Wind,
  Settings,
  Wrench,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/Loading';
import { useOBDWebSocket, VehicleStream } from '../../hooks/useOBDWebSocket';
import api from '../../api/client';

// Gauge component for displaying values
function GaugeCard({
  title,
  value,
  unit,
  icon: Icon,
  min = 0,
  max = 100,
  warning,
  danger,
  color = 'blue',
}: {
  title: string;
  value: number | undefined | null;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  min?: number;
  max?: number;
  warning?: number;
  danger?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const displayValue = value ?? '--';
  const percentage = value != null ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;

  let statusColor = 'bg-blue-500';
  if (value != null) {
    if (danger != null && value >= danger) {
      statusColor = 'bg-red-500';
    } else if (warning != null && value >= warning) {
      statusColor = 'bg-yellow-500';
    } else {
      statusColor = `bg-${color}-500`;
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-gray-500">
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{title}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">{displayValue}</span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${statusColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Collapsible section component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-500 mb-2 hover:text-gray-700"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && children}
    </div>
  );
}

// Format runtime as hours:minutes:seconds
function formatRuntime(seconds: number | undefined): string {
  if (seconds == null) return '--';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

// Live stream card for a vehicle
function VehicleStreamCard({ stream }: { stream: VehicleStream }) {
  const data = stream.data;
  const vehicle = stream.vehicle;

  return (
    <div className="space-y-4">
      {/* Vehicle Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Car className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}
            </h3>
            {vehicle?.licensePlate && (
              <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stream.isStreaming ? (
            <Badge status="good" className="flex items-center gap-1">
              <Activity className="h-3 w-3 animate-pulse" />
              Live
            </Badge>
          ) : (
            <Badge status="inactive" className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          )}
          {stream.lastUpdate && (
            <span className="text-xs text-gray-400">
              Updated {stream.lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Diagnostics - Always show at top */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Diagnostics
        </h4>
        {data?.milStatus || (data?.activeDTCs && data.activeDTCs.length > 0) ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">Check Engine Light Active</p>
                  <p className="text-sm text-red-700 mt-1">
                    {data?.dtcCount ?? 0} Trouble Code{(data?.dtcCount ?? 0) !== 1 ? 's' : ''} Detected
                  </p>
                  {data?.activeDTCs && data.activeDTCs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {data.activeDTCs.map((dtc) => (
                        <span
                          key={dtc}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-mono font-medium bg-red-100 text-red-800"
                        >
                          {dtc}
                        </span>
                      ))}
                    </div>
                  )}
                  {data?.distanceWithMIL != null && data.distanceWithMIL > 0 && (
                    <p className="text-xs text-red-600 mt-2">
                      Distance with MIL: {data.distanceWithMIL} km
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">No Trouble Codes</p>
                  <p className="text-sm text-green-700">Check engine light is off</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Engine & Performance */}
      <CollapsibleSection title="Engine & Performance" icon={Zap}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GaugeCard
            title="RPM"
            value={data?.rpm}
            unit="rpm"
            icon={Gauge}
            min={0}
            max={8000}
            warning={5500}
            danger={7000}
          />
          <GaugeCard
            title="Speed"
            value={data?.speed}
            unit="km/h"
            icon={Activity}
            min={0}
            max={200}
            color="green"
          />
          <GaugeCard
            title="Engine Load"
            value={data?.engineLoad}
            unit="%"
            icon={Gauge}
            min={0}
            max={100}
            warning={80}
            danger={95}
          />
          <GaugeCard
            title="Timing Advance"
            value={data?.timingAdvance}
            unit="°"
            icon={Clock}
            min={-10}
            max={50}
            color="green"
          />
        </div>
      </CollapsibleSection>

      {/* Temperatures */}
      <CollapsibleSection title="Temperatures" icon={Thermometer}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GaugeCard
            title="Coolant"
            value={data?.coolantTemp}
            unit="°C"
            icon={Thermometer}
            min={0}
            max={130}
            warning={100}
            danger={110}
          />
          <GaugeCard
            title="Intake Air"
            value={data?.intakeTemp}
            unit="°C"
            icon={Thermometer}
            min={-20}
            max={80}
            warning={50}
            danger={60}
            color="blue"
          />
          <GaugeCard
            title="Ambient"
            value={data?.ambientTemp}
            unit="°C"
            icon={Thermometer}
            min={-20}
            max={50}
            color="green"
          />
          <GaugeCard
            title="Catalyst"
            value={data?.catalystTemp}
            unit="°C"
            icon={Thermometer}
            min={0}
            max={900}
            warning={700}
            danger={800}
          />
        </div>
      </CollapsibleSection>

      {/* Fuel System */}
      <CollapsibleSection title="Fuel System" icon={Fuel}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GaugeCard
            title="Fuel Level"
            value={data?.fuelLevel}
            unit="%"
            icon={Fuel}
            min={0}
            max={100}
            color="green"
          />
          <GaugeCard
            title="Fuel Pressure"
            value={data?.fuelPressure}
            unit="kPa"
            icon={Gauge}
            min={0}
            max={400}
            color="blue"
          />
          <GaugeCard
            title="Short Fuel Trim"
            value={data?.shortTermFuelTrim}
            unit="%"
            icon={Activity}
            min={-25}
            max={25}
            warning={15}
            danger={20}
            color="purple"
          />
          <GaugeCard
            title="Long Fuel Trim"
            value={data?.longTermFuelTrim}
            unit="%"
            icon={Activity}
            min={-25}
            max={25}
            warning={10}
            danger={15}
            color="purple"
          />
        </div>
      </CollapsibleSection>

      {/* Air & Pressure */}
      <CollapsibleSection title="Air & Pressure" icon={Wind}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GaugeCard
            title="MAF"
            value={data?.maf}
            unit="g/s"
            icon={Wind}
            min={0}
            max={300}
            color="blue"
          />
          <GaugeCard
            title="MAP"
            value={data?.manifoldPressure}
            unit="kPa"
            icon={Gauge}
            min={0}
            max={250}
            color="purple"
          />
          <GaugeCard
            title="Barometric"
            value={data?.barometricPressure}
            unit="kPa"
            icon={Gauge}
            min={90}
            max={110}
            color="green"
          />
          <GaugeCard
            title="Boost"
            value={data?.boostPressure != null ? Math.round(data.boostPressure * 100) / 100 : undefined}
            unit="bar"
            icon={Zap}
            min={-1}
            max={2}
            color="purple"
          />
        </div>
      </CollapsibleSection>

      {/* Throttle & Pedal */}
      <CollapsibleSection title="Throttle & Pedal" icon={Settings} defaultOpen={false}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GaugeCard
            title="Throttle Position"
            value={data?.throttlePosition}
            unit="%"
            icon={Activity}
            min={0}
            max={100}
            color="purple"
          />
          <GaugeCard
            title="Relative Throttle"
            value={data?.relativeThrottle}
            unit="%"
            icon={Activity}
            min={0}
            max={100}
            color="blue"
          />
          <GaugeCard
            title="Accelerator D"
            value={data?.acceleratorPedalD}
            unit="%"
            icon={Activity}
            min={0}
            max={100}
            color="green"
          />
          <GaugeCard
            title="Commanded Throttle"
            value={data?.commandedThrottle}
            unit="%"
            icon={Activity}
            min={0}
            max={100}
            color="purple"
          />
        </div>
      </CollapsibleSection>

      {/* Electrical */}
      <CollapsibleSection title="Electrical" icon={Battery}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GaugeCard
            title="Battery"
            value={data?.batteryVoltage}
            unit="V"
            icon={Battery}
            min={10}
            max={15}
            warning={11.5}
            danger={11}
            color="yellow"
          />
          <GaugeCard
            title="Control Module"
            value={data?.controlModuleVoltage}
            unit="V"
            icon={Battery}
            min={10}
            max={16}
            color="blue"
          />
        </div>
      </CollapsibleSection>

      {/* EGR & Emissions */}
      <CollapsibleSection title="EGR & Emissions" icon={Wind} defaultOpen={false}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GaugeCard
            title="Commanded EGR"
            value={data?.commandedEGR}
            unit="%"
            icon={Activity}
            min={0}
            max={100}
            color="green"
          />
          <GaugeCard
            title="EGR Error"
            value={data?.egrError}
            unit="%"
            icon={Activity}
            min={-20}
            max={20}
            warning={10}
            danger={15}
            color="purple"
          />
        </div>
      </CollapsibleSection>

      {/* Maintenance Info */}
      <CollapsibleSection title="Maintenance Info" icon={Wrench} defaultOpen={false}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Engine Runtime</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {formatRuntime(data?.engineRuntime)}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Distance Since DTC Clear</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {data?.distanceSinceDTCCleared != null ? `${data.distanceSinceDTCCleared} km` : '--'}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Thermometer className="h-4 w-4" />
                <span className="text-sm font-medium">Warmups Since Clear</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {data?.warmupsSinceDTCCleared ?? '--'}
              </span>
            </CardContent>
          </Card>
          <GaugeCard
            title="Absolute Load"
            value={data?.absoluteLoad}
            unit="%"
            icon={Gauge}
            min={0}
            max={100}
            color="blue"
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}

export function OBDLiveMonitor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedVehicleId = searchParams.get('vehicleId');

  const {
    status,
    isConnected,
    error,
    vehicleStreams,
    activeStreamCount,
    connect,
    disconnect,
    subscribeToVehicle,
    subscribeToAll,
  } = useOBDWebSocket();

  // Fetch all vehicles
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles?limit=100');
      return res.data;
    },
  });

  const vehicles = vehiclesData?.data || [];

  // Auto-connect on mount
  useEffect(() => {
    if (status === 'disconnected') {
      connect();
    }
  }, [status, connect]);

  // Subscribe to selected vehicle or all when connected
  useEffect(() => {
    if (isConnected) {
      if (selectedVehicleId) {
        subscribeToVehicle(selectedVehicleId);
      } else {
        subscribeToAll();
      }
    }
  }, [isConnected, selectedVehicleId, subscribeToVehicle, subscribeToAll]);

  const handleVehicleSelect = (id: string) => {
    setSearchParams({ vehicleId: id });
    if (isConnected) {
      subscribeToVehicle(id);
    }
  };

  const handleViewAll = () => {
    setSearchParams({});
    if (isConnected) {
      subscribeToAll();
    }
  };

  // Get the selected stream or all streams
  const selectedStream = selectedVehicleId ? vehicleStreams.get(selectedVehicleId) : null;
  const allStreams = Array.from(vehicleStreams.values());

  if (vehiclesLoading) {
    return <PageLoading />;
  }

  return (
    <>
      <Header
        title="OBD Live Monitor"
        subtitle="Real-time vehicle telemetry data"
        actions={
          <div className="flex items-center gap-3">
            {isConnected ? (
              <Badge status="good" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge status="inactive" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                {status === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </Badge>
            )}
            {activeStreamCount > 0 && (
              <Badge status="info">
                {activeStreamCount} Active Stream{activeStreamCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {selectedVehicleId && (
              <Link to={`/obd-history?vehicleId=${selectedVehicleId}`}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<TrendingUp className="h-4 w-4" />}
                >
                  View History
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`h-4 w-4 ${status === 'connecting' ? 'animate-spin' : ''}`} />}
              onClick={() => {
                disconnect();
                setTimeout(connect, 500);
              }}
            >
              Reconnect
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Select Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleViewAll}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedVehicleId
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Vehicles
              </button>
              {vehicles.map((vehicle: any) => {
                const stream = vehicleStreams.get(vehicle._id);
                return (
                  <button
                    key={vehicle._id}
                    onClick={() => handleVehicleSelect(vehicle._id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      selectedVehicleId === vehicle._id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {vehicle.year} {vehicle.make} {vehicle.model}
                    {stream?.isStreaming && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stream Content */}
        {selectedVehicleId ? (
          // Single vehicle view
          selectedStream ? (
            <Card>
              <CardContent className="p-6">
                <VehicleStreamCard stream={selectedStream} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <WifiOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Data Available
                </h3>
                <p className="text-gray-500">
                  This vehicle is not currently streaming data. The mobile app needs to be connected
                  to an OBD adapter and streaming data.
                </p>
              </CardContent>
            </Card>
          )
        ) : (
          // All vehicles view
          <div className="space-y-4">
            {allStreams.length > 0 ? (
              allStreams.map((stream) => (
                <Card key={stream.vehicleId}>
                  <CardContent className="p-6">
                    <VehicleStreamCard stream={stream} />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Active Streams
                  </h3>
                  <p className="text-gray-500">
                    No vehicles are currently streaming OBD data. When users connect their mobile
                    app to an OBD adapter, their data will appear here in real-time.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* How it works */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              1. Customer connects the mobile app to their car's OBD-II port via Bluetooth adapter
            </p>
            <p>
              2. The app reads real-time engine data and streams it to the server
            </p>
            <p>
              3. You can monitor the data here in real-time as it comes in
            </p>
            <p>
              4. Data is stored for later analysis even when you're not viewing this page
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
