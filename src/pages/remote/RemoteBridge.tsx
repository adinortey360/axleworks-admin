import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Square, RefreshCw, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';

interface RemoteVehicle {
  clientId?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
}

export interface RemoteSession {
  sessionId: string;
  vehicle: RemoteVehicle;
  ownerPhone?: string;
  connectedAt: string;
  lastSeenAt: string;
  /** Raw CAN window expiry (ms epoch) while active. */
  rawUntil?: number;
}

interface AuditRow {
  _id: string;
  sessionId: string;
  make?: string;
  model?: string;
  vin?: string;
  adminEmail?: string;
  cmd: string;
  allowed: boolean;
  blockReason?: string;
  ok?: boolean;
  latencyMs?: number;
  error?: string;
  createdAt: string;
}

interface LogEntry {
  at: number;
  dir: 'out' | 'in' | 'sys';
  text: string;
  ok?: boolean;
}

function wsUrl(): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined) || 'https://axleworks-api.onrender.com/api/v1';
  const host = base.replace(/\/api\/v1\/?$/, '').replace(/^http/, 'ws');
  return `${host}/ws/remote-console`;
}

const PRESETS = ['ATRV', 'ATDPN', '0100', '010C', '010D', '0105', '03', '0902', '0900'];

export function RemoteBridge() {
  const [sessions, setSessions] = useState<RemoteSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [cmd, setCmd] = useState('010C');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingRef = useRef(new Map<string, (m: any) => void>());

  const selected = useMemo(
    () => sessions.find((s) => s.sessionId === selectedId) ?? null,
    [sessions, selectedId]
  );
  const rawActive = !!selected?.rawUntil && selected.rawUntil > Date.now();

  const pushLog = useCallback((entry: LogEntry) => {
    setLog((prev) => [...prev.slice(-199), entry]);
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await api.get('/remote/sessions');
      const list: RemoteSession[] = res.data?.data ?? [];
      setSessions(list);
      if (list.length > 0) {
        setSelectedId((cur) => (cur && list.some((s) => s.sessionId === cur) ? cur : list[0].sessionId));
      }
    } catch {
      // relay offline or unauthorized - the list simply stays empty
    }
  }, []);

  const loadAudit = useCallback(async (sessionId: string | null) => {
    try {
      const res = await api.get('/remote/audit', { params: { limit: 100, ...(sessionId ? { sessionId } : {}) } });
      setAudit(res.data?.data ?? []);
    } catch {
      // ignore - audit is best-effort here
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const t = setInterval(loadSessions, 5000);
    return () => clearInterval(t);
  }, [loadSessions]);

  useEffect(() => {
    if (selectedId) loadAudit(selectedId);
  }, [selectedId, loadAudit]);

  const ensureSocket = useCallback((): Promise<WebSocket> => {
    const live = wsRef.current;
    if (live && live.readyState === WebSocket.OPEN) return Promise.resolve(live);
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token') ?? '';
      const ws = new WebSocket(wsUrl());
      const timer = setTimeout(() => {
        try {
          ws.close();
        } catch {
          // ignore
        }
        reject(new Error('console socket timed out'));
      }, 10000);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'hello', role: 'console', token }));
      };
      ws.onmessage = (ev) => {
        let msg: any;
        try {
          msg = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        if (msg?.type === 'welcome') {
          clearTimeout(timer);
          wsRef.current = ws;
          setConnected(true);
          if (Array.isArray(msg.sessions)) {
            setSessions(msg.sessions);
            if (msg.sessions.length > 0) {
              setSelectedId((cur) => cur ?? msg.sessions[0].sessionId);
            }
          }
          resolve(ws);
          return;
        }
        if (msg?.type === 'sessions' && Array.isArray(msg.sessions)) {
          setSessions(msg.sessions);
          return;
        }
        if (msg?.type === 'result' && msg?.id) {
          const done = pendingRef.current.get(String(msg.id));
          if (done) {
            pendingRef.current.delete(String(msg.id));
            done(msg);
          }
          return;
        }
        if (msg?.type === 'error') {
          clearTimeout(timer);
          reject(new Error(String(msg.error ?? 'relay refused the console')));
        }
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error('console socket error'));
      };
      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null;
          setConnected(false);
        }
      };
    });
  }, []);

  useEffect(
    () => () => {
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
    },
    []
  );

  const toggleRaw = useCallback(async () => {
    if (!selected || busy) return;
    const want = !rawActive;
    if (
      want &&
      !window.confirm(
        'Enable RAW CAN mode for 15 minutes? The phone may then execute any diagnostic command (except clear codes / actuations). Everything is audit-logged.'
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const ws = await ensureSocket();
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('no reply within 10s')), 10000);
        const onMsg = (ev: MessageEvent) => {
          let m: any;
          try {
            m = JSON.parse(String(ev.data));
          } catch {
            return;
          }
          if (m?.type === 'result' && m.id == null) {
            clearTimeout(timer);
            ws.removeEventListener('message', onMsg);
            if (m.ok) resolve();
            else reject(new Error(String(m.error ?? 'toggle failed')));
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ type: 'raw', sessionId: selected.sessionId, on: want }));
      });
      pushLog({ at: Date.now(), dir: 'sys', text: want ? 'raw CAN enabled (15 min)' : 'raw CAN disabled' });
      loadSessions();
    } catch (e) {
      pushLog({ at: Date.now(), dir: 'in', text: `FAILED: ${e instanceof Error ? e.message : String(e)}`, ok: false });
    } finally {
      setBusy(false);
    }
  }, [selected, busy, rawActive, ensureSocket, pushLog, loadSessions]);

  const sendCommand = useCallback(async () => {
    const command = cmd.trim();
    if (!command || !selectedId || busy) return;
    setBusy(true);
    pushLog({ at: Date.now(), dir: 'out', text: command });
    try {
      const ws = await ensureSocket();
      const id = `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
      const res: any = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingRef.current.delete(id);
          reject(new Error('no reply within 30s'));
        }, 30000);
        pendingRef.current.set(id, (m) => {
          clearTimeout(timer);
          resolve(m);
        });
        ws.send(JSON.stringify({ type: 'exec', id, sessionId: selectedId, cmd: command, timeoutMs: 20000 }));
      });
      const text = res?.ok ? String(res.response ?? 'ok').trim() : `FAILED: ${res?.error ?? 'unknown error'}`;
      pushLog({ at: Date.now(), dir: 'in', text, ok: !!res?.ok });
    } catch (e) {
      pushLog({ at: Date.now(), dir: 'in', text: `FAILED: ${e instanceof Error ? e.message : String(e)}`, ok: false });
    } finally {
      setBusy(false);
      loadSessions();
      if (selectedId) loadAudit(selectedId);
    }
  }, [cmd, selectedId, busy, ensureSocket, pushLog, loadSessions, loadAudit]);

  const carTitle = selected
    ? `${selected.vehicle.year ?? ''} ${selected.vehicle.make ?? ''} ${selected.vehicle.model ?? ''}`.trim() || 'Console'
    : 'Console';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Remote Bridge</h1>
          <p className="text-sm text-gray-500">
            Drive a connected customer car over the internet. Read-only: Mode 04/08 are blocked on both ends.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-gray-600">{connected ? 'Console live' : 'Console idle'}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadSessions();
              if (selectedId) loadAudit(selectedId);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Live cars ({sessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No cars sharing right now. A customer starts this from Diagnostics → Workshop Live Link in the app.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sessions.map((s) => (
                  <li key={s.sessionId}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 ${s.sessionId === selectedId ? 'bg-gray-100' : ''}`}
                      onClick={() => setSelectedId(s.sessionId)}
                    >
                      <div className="font-medium text-gray-900">
                        {s.vehicle.year ?? ''} {s.vehicle.make ?? 'Unknown make'} {s.vehicle.model ?? ''}
                        {!!s.rawUntil && s.rawUntil > Date.now() && (
                          <span className="ml-2 text-[10px] font-bold text-red-600 border border-red-300 rounded px-1">RAW</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {s.vehicle.vin ?? 'no VIN'} · {s.ownerPhone ?? 'unknown owner'}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{carTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-gray-500">Select a live car to send commands to it.</p>
            ) : (
              <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button
                  onClick={() => void toggleRaw()}
                  disabled={busy}
                  title="Raw CAN: any diagnostic service except clear codes / actuations, auto-expires in 15 minutes"
                  className={`px-2 py-1 text-xs font-semibold rounded border ${
                    rawActive
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rawActive ? 'RAW ON — click to disable' : 'Enable raw CAN (15 min)'}
                </button>
                {rawActive && selected.rawUntil && (
                  <span className="text-xs text-red-600">
                    expires {new Date(selected.rawUntil).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCmd(p)}
                      className="px-2 py-1 text-xs font-mono bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={cmd}
                    onChange={(e) => setCmd(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void sendCommand();
                    }}
                    placeholder="010C or AT SH 7E2 + 22 199A…"
                    spellCheck={false}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button onClick={() => void sendCommand()} disabled={busy || !cmd.trim()}>
                    <Send className="h-4 w-4 mr-1" /> Send
                  </Button>
                </div>
                <div className="mt-3 h-64 overflow-y-auto bg-gray-950 text-gray-100 rounded-lg p-3 font-mono text-xs space-y-1">
                  {log.length === 0 ? (
                    <div className="text-gray-500">Replies from the car appear here.</div>
                  ) : (
                    [...log].reverse().map((e, i) => (
                      <div
                        key={`${e.at}-${i}`}
                        className={e.dir === 'out' ? 'text-sky-300' : e.ok === false ? 'text-red-300' : 'text-emerald-300'}
                      >
                        <span className="text-gray-500">{e.dir === 'out' ? '>> ' : '<< '}</span>
                        {e.text}
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                  <ShieldAlert className="h-3 w-3" /> Blocked commands (clear codes, actuations, monitor mode) never leave
                  this page.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit trail</CardTitle>
          </CardHeader>
          <CardContent>
            {audit.length === 0 ? (
              <p className="text-sm text-gray-500">No remote commands recorded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto text-sm">
                {audit.map((r) => (
                  <li key={r._id} className="py-2">
                    <div className="font-mono text-xs text-gray-900">{r.cmd}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleTimeString()} · {r.adminEmail ?? 'console'} ·{' '}
                      {r.allowed ? (r.ok ? `${r.latencyMs ?? '?'}ms` : `failed: ${r.error ?? ''}`) : `blocked: ${r.blockReason ?? ''}`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {selected && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setSelectedId(null)}>
                <Square className="h-4 w-4 mr-1" /> Deselect car
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
