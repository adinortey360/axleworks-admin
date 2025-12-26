import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Calendar,
  ChevronLeft,
  Database,
  Download,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { format, subHours, subDays, subMinutes } from 'date-fns';
import { Header } from '../../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/Loading';
import api from '../../api/client';

// Available metrics to graph
const METRICS = [
  { key: 'rpm', label: 'RPM', color: '#3B82F6', unit: 'rpm', min: 0, max: 8000 },
  { key: 'speed', label: 'Speed', color: '#10B981', unit: 'km/h', min: 0, max: 200 },
  { key: 'engineLoad', label: 'Engine Load', color: '#F59E0B', unit: '%', min: 0, max: 100 },
  { key: 'coolantTemp', label: 'Coolant Temp', color: '#EF4444', unit: '°C', min: 0, max: 130 },
  { key: 'intakeTemp', label: 'Intake Temp', color: '#8B5CF6', unit: '°C', min: -20, max: 80 },
  { key: 'throttlePosition', label: 'Throttle', color: '#EC4899', unit: '%', min: 0, max: 100 },
  { key: 'fuelLevel', label: 'Fuel Level', color: '#14B8A6', unit: '%', min: 0, max: 100 },
  { key: 'batteryVoltage', label: 'Battery', color: '#F97316', unit: 'V', min: 10, max: 15 },
  { key: 'maf', label: 'MAF', color: '#6366F1', unit: 'g/s', min: 0, max: 300 },
  { key: 'manifoldPressure', label: 'MAP', color: '#84CC16', unit: 'kPa', min: 0, max: 250 },
  { key: 'timingAdvance', label: 'Timing', color: '#06B6D4', unit: '°', min: -10, max: 50 },
  { key: 'boostPressure', label: 'Boost', color: '#A855F7', unit: 'bar', min: -1, max: 2 },
  { key: 'shortTermFuelTrim', label: 'STFT', color: '#22C55E', unit: '%', min: -25, max: 25 },
  { key: 'longTermFuelTrim', label: 'LTFT', color: '#EAB308', unit: '%', min: -25, max: 25 },
];

// Time range presets
const TIME_RANGES = [
  { label: 'Last 5 min', value: '5m', getFrom: () => subMinutes(new Date(), 5) },
  { label: 'Last 30 min', value: '30m', getFrom: () => subMinutes(new Date(), 30) },
  { label: 'Last 1 hour', value: '1h', getFrom: () => subHours(new Date(), 1) },
  { label: 'Last 6 hours', value: '6h', getFrom: () => subHours(new Date(), 6) },
  { label: 'Last 24 hours', value: '24h', getFrom: () => subHours(new Date(), 24) },
  { label: 'Last 7 days', value: '7d', getFrom: () => subDays(new Date(), 7) },
  { label: 'All Data', value: 'all', getFrom: () => null },
];

export function OBDHistory() {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['rpm', 'speed']);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch vehicle info
  const { data: vehicleData } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      const res = await api.get(`/vehicles/${vehicleId}`);
      return res.data.data;
    },
    enabled: !!vehicleId,
  });

  // Fetch OBD stats
  const { data: statsData } = useQuery({
    queryKey: ['obd-stats', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      const res = await api.get(`/vehicles/${vehicleId}/obd-data/stats`);
      return res.data.stats;
    },
    enabled: !!vehicleId,
  });

  // Fetch OBD history data
  const { data: historyData, isLoading, isFetching } = useQuery({
    queryKey: ['obd-history', vehicleId, timeRange, selectedMetrics],
    queryFn: async () => {
      if (!vehicleId) return { data: [], pagination: { total: 0 } };

      const range = TIME_RANGES.find(r => r.value === timeRange);
      const from = range?.getFrom();

      const params: any = {
        limit: 2000,
        fields: [...selectedMetrics, 'timestamp'].join(','),
      };

      if (from) {
        params.from = from.toISOString();
      }

      // Downsample for large date ranges
      if (timeRange === '7d' || timeRange === 'all') {
        params.downsample = 5;
      } else if (timeRange === '24h') {
        params.downsample = 2;
      }

      const res = await api.get(`/vehicles/${vehicleId}/obd-data`, { params });
      return res.data;
    },
    enabled: !!vehicleId,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Format data for charts
  const chartData = useMemo(() => {
    if (!historyData?.data) return [];
    return historyData.data.map((d: any) => ({
      ...d,
      time: new Date(d.timestamp).getTime(),
      timeLabel: format(new Date(d.timestamp), 'HH:mm:ss'),
    }));
  }, [historyData]);

  const toggleMetric = (key: string) => {
    setSelectedMetrics(prev =>
      prev.includes(key)
        ? prev.filter(m => m !== key)
        : [...prev, key]
    );
  };

  // Export data as CSV
  const exportCSV = () => {
    if (!chartData.length) return;

    const headers = ['timestamp', ...selectedMetrics].join(',');
    const rows = chartData.map((d: any) =>
      [d.timestamp, ...selectedMetrics.map(m => d[m] ?? '')].join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obd-data-${vehicleId}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!vehicleId) {
    return (
      <>
        <Header title="OBD History" subtitle="Select a vehicle to view history" />
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicle Selected</h3>
              <p className="text-gray-500 mb-4">
                Go to the OBD Live Monitor and select a vehicle to view its history.
              </p>
              <Link to="/obd-monitor">
                <Button>Go to OBD Monitor</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="OBD Data History"
        subtitle={vehicleData ? `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}` : 'Loading...'}
        actions={
          <div className="flex items-center gap-3">
            <Link to={`/obd-monitor?vehicleId=${vehicleId}`}>
              <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="h-4 w-4" />}>
                Back to Monitor
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={exportCSV}
              disabled={!chartData.length}
            >
              Export CSV
            </Button>
            <Button
              variant={autoRefresh ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh'}
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Card */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Records</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {statsData.totalRecords.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 ml-1">/ {statsData.maxRecords.toLocaleString()}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Oldest Record</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {statsData.oldestRecord
                    ? format(new Date(statsData.oldestRecord), 'MMM d, HH:mm')
                    : 'N/A'}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Newest Record</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {statsData.newestRecord
                    ? format(new Date(statsData.newestRecord), 'MMM d, HH:mm')
                    : 'N/A'}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">Showing</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {chartData.length.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 ml-1">points</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Time Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Time Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {TIME_RANGES.map(range => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Metric Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Metrics to Display</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {METRICS.map(metric => (
                <button
                  key={metric.key}
                  onClick={() => toggleMetric(metric.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedMetrics.includes(metric.key)
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedMetrics.includes(metric.key) ? metric.color : undefined,
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: metric.color }}
                  />
                  {metric.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Data Graph
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <PageLoading />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-96 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No data available for this time range</p>
                </div>
              </div>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(val) => format(new Date(val), 'HH:mm:ss')}
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      labelFormatter={(val) => format(new Date(val), 'MMM d, HH:mm:ss')}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend />
                    <Brush
                      dataKey="time"
                      height={30}
                      stroke="#6366F1"
                      tickFormatter={(val) => format(new Date(val), 'HH:mm')}
                    />
                    {selectedMetrics.map(metricKey => {
                      const metric = METRICS.find(m => m.key === metricKey);
                      if (!metric) return null;
                      return (
                        <Line
                          key={metricKey}
                          type="monotone"
                          dataKey={metricKey}
                          name={`${metric.label} (${metric.unit})`}
                          stroke={metric.color}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Individual Metric Charts */}
        {selectedMetrics.length > 1 && chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedMetrics.map(metricKey => {
              const metric = METRICS.find(m => m.key === metricKey);
              if (!metric) return null;

              return (
                <Card key={metricKey}>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: metric.color }}
                      />
                      {metric.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis
                            dataKey="time"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(val) => format(new Date(val), 'HH:mm')}
                            stroke="#9CA3AF"
                            fontSize={10}
                          />
                          <YAxis
                            domain={[metric.min, metric.max]}
                            stroke="#9CA3AF"
                            fontSize={10}
                            tickFormatter={(val) => `${val}${metric.unit}`}
                          />
                          <Tooltip
                            labelFormatter={(val) => format(new Date(val), 'HH:mm:ss')}
                            formatter={(val: number) => [`${val.toFixed(1)} ${metric.unit}`, metric.label]}
                          />
                          {metric.key === 'coolantTemp' && (
                            <ReferenceLine y={100} stroke="#EF4444" strokeDasharray="5 5" label="Warning" />
                          )}
                          <Line
                            type="monotone"
                            dataKey={metricKey}
                            stroke={metric.color}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default OBDHistory;
