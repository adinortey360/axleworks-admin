import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  Gauge,
  Fuel,
  Activity,
  ClipboardList,
  Droplets,
  Wrench,
  Settings,
  Phone,
  Hash,
  Stethoscope,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PageLoading } from '../../components/ui/Loading';
import { ConsultationIntakeForm, ConsultationIntakeData } from '../../components/consultation/ConsultationIntakeForm';
import { formatDate } from '../../utils';
import api from '../../api/client';
import type { Vehicle, Customer } from '../../types';

interface VehicleWithCustomer extends Vehicle {
  customer?: Customer;
}

interface ServiceEntry {
  _id: string;
  serviceType: string;
  serviceDate: string;
  mileageAtService?: number;
  notes?: string;
  cost?: number;
}

interface DiagnosticReport {
  _id: string;
  reportId: string;
  generatedAt: string;
  consultationId?: string;
  summary: {
    totalIssues: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    dtcCount: number;
    testsPerformed: number;
    testsPassed: number;
  };
  customerReport?: {
    vehicleHealth?: {
      overallStatus: 'good' | 'fair' | 'needs_attention' | 'critical';
      overallScore: number;
    };
  };
}

type EntryServiceType =
  | 'oil_change' | 'brake_service' | 'tire_service' | 'battery_service'
  | 'fluid_service' | 'filter_service' | 'wiper_service' | 'light_check'
  | 'general_inspection';

interface QuickService {
  key: string;
  label: string;
  servicesPerformed: string[];
  /** Full-record fluids patch (changed fluids read as full). */
  patch: Record<string, unknown>;
  /** Lightweight history entry type (service-entries log). */
  entryType: EntryServiceType;
}

const QUICK_SERVICES: QuickService[] = [
  {
    key: 'oil-change',
    label: 'Oil change',
    servicesPerformed: ['Oil change'],
    patch: { oil: { level: 'full', condition: 'clean', changed: true } },
    entryType: 'oil_change',
  },
  {
    key: 'tire-rotation',
    label: 'Tire rotation',
    servicesPerformed: ['Tire rotation'],
    patch: {},
    entryType: 'tire_service',
  },
  {
    key: 'brake-service',
    label: 'Brake service',
    servicesPerformed: ['Brake service'],
    patch: { brakeFluid: { level: 'full', condition: 'good', changed: true } },
    entryType: 'brake_service',
  },
  {
    key: 'coolant-flush',
    label: 'Coolant flush',
    servicesPerformed: ['Coolant flush'],
    patch: { coolant: { level: 'full', condition: 'good', changed: true } },
    entryType: 'fluid_service',
  },
  {
    key: 'transmission-service',
    label: 'Transmission service',
    servicesPerformed: ['Transmission service'],
    patch: { transmissionFluid: { level: 'full', condition: 'good', changed: true } },
    entryType: 'fluid_service',
  },
  {
    key: 'inspection',
    label: 'Inspection',
    servicesPerformed: ['Inspection'],
    patch: {},
    entryType: 'general_inspection',
  },
];

const defaultFluids = {
  oil: { level: 'not_checked', condition: 'not_checked', changed: false },
  brakeFluid: { level: 'not_checked', condition: 'not_checked', changed: false },
  transmissionFluid: { level: 'not_checked', condition: 'not_checked', changed: false },
  coolant: { level: 'not_checked', condition: 'not_checked', changed: false },
  powerSteeringFluid: { level: 'not_checked', changed: false },
  washerFluid: { level: 'not_checked', changed: false },
};

function FluidRow({ label, value, changed }: { label: string; value?: string; changed?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 capitalize">
          {(value || 'not checked').replace(/_/g, ' ')}
        </span>
        {changed && (
          <span className="text-[11px] font-medium px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
            changed
          </span>
        )}
      </span>
    </div>
  );
}

export function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [mileage, setMileage] = useState('');
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const createConsultationMutation = useMutation({
    mutationFn: async (intakeData: ConsultationIntakeData) => {
      const res = await api.post('/consultations', {
        vehicleId: id,
        ...intakeData,
      });
      return res.data;
    },
    onSuccess: () => {
      setIsConsultationModalOpen(false);
      navigate('/consultations');
    },
  });

  const { data: vehicleData, isLoading: vehicleLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      const res = await api.get(`/vehicles?search=`);
      const vehicles = res.data.data || [];
      const vehicle = vehicles.find((v: VehicleWithCustomer) => v._id === id);
      return vehicle || null;
    },
    enabled: !!id,
  });

  const { data: serviceEntriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['vehicle-service-entries', id],
    queryFn: async () => {
      const res = await api.get(`/vehicles/${id}/service-entries`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: obdStatsData } = useQuery({
    queryKey: ['vehicle-obd-stats', id],
    queryFn: async () => {
      const res = await api.get(`/vehicles/${id}/obd-data/stats`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: obdSessionsData } = useQuery({
    queryKey: ['vehicle-obd-sessions', id],
    queryFn: async () => {
      const res = await api.get(`/vehicles/${id}/obd-sessions?limit=5`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: diagnosticReportsData } = useQuery({
    queryKey: ['vehicle-diagnostic-reports', id],
    queryFn: async () => {
      const res = await api.get(`/vehicles/${id}/diagnostic-reports?limit=5`);
      return res.data;
    },
    enabled: !!id,
  });

  const vehicle: VehicleWithCustomer | null = vehicleData;
  const serviceEntries: ServiceEntry[] = serviceEntriesData?.data || [];
  const obdStats = obdStatsData?.stats;
  const obdSessions = obdSessionsData?.data || [];
  const diagnosticReports: DiagnosticReport[] = diagnosticReportsData?.data || [];

  // Recent full service records - newest first. Fluids are merged per-fluid
  // below (latest known value each), mirroring what the app shows, so one
  // quick service never hides the fluids from an earlier one.
  const { data: fullRecordsData } = useQuery({
    queryKey: ['vehicle-service-records', id],
    queryFn: async () => {
      const res = await api.get(`/service-records?vehicleId=${id}&limit=25`);
      return (res.data.data || []) as any[];
    },
    enabled: !!id,
  });
  const latestRecord: any = useMemo(
    () => (fullRecordsData && fullRecordsData.length > 0 ? fullRecordsData[0] : null),
    [fullRecordsData]
  );
  const mergedFluids: Record<string, any> | null = useMemo(() => {
    const list: any[] = fullRecordsData || [];
    if (list.length === 0) return null;
    const hasData = (f: any): boolean =>
      !!f && (f.changed === true ||
        (typeof f.level === 'string' && f.level !== 'not_checked') ||
        (typeof f.condition === 'string' && f.condition !== 'not_checked'));
    const pick = (key: string): any => {
      const found = list.find((r: any) => hasData(r?.[key]));
      return (found ? found[key] : list[0][key]) ?? null;
    };
    return {
      oil: pick('oil'),
      brakeFluid: pick('brakeFluid'),
      transmissionFluid: pick('transmissionFluid'),
      coolant: pick('coolant'),
      powerSteeringFluid: pick('powerSteeringFluid'),
      washerFluid: pick('washerFluid'),
    };
  }, [fullRecordsData]);
  const mergedNextChange: number | undefined = useMemo(() => {
    const list: any[] = fullRecordsData || [];
    const withNext = list.find((r: any) => typeof r?.oil?.nextChangeMileage === 'number');
    return withNext ? withNext.oil.nextChangeMileage : undefined;
  }, [fullRecordsData]);

  const logMutation = useMutation({
    mutationFn: async (preset: QuickService) => {
      const mileageAtService = mileage ? parseInt(mileage, 10) : (vehicle?.mileage || 0);
      const body: Record<string, unknown> = {
        vehicleId: id,
        serviceDate,
        mileageAtService,
        overallHealth: 'good',
        notes: `Quick ${preset.label.toLowerCase()} logged from the vehicle page.`,
        recommendations: [],
        servicesPerformed: preset.servicesPerformed,
        brakePads: { frontLeft: 100, frontRight: 100, rearLeft: 100, rearRight: 100 },
        tires: {
          frontLeft: { treadDepth: 8, pressure: 32, condition: 'not_checked' },
          frontRight: { treadDepth: 8, pressure: 32, condition: 'not_checked' },
          rearLeft: { treadDepth: 8, pressure: 32, condition: 'not_checked' },
          rearRight: { treadDepth: 8, pressure: 32, condition: 'not_checked' },
        },
        battery: { voltage: 12.6, health: 'not_checked', replaced: false },
        airFilter: { condition: 'not_checked', replaced: false },
        cabinAirFilter: { condition: 'not_checked', replaced: false },
        wipers: { front: 'not_checked', rear: 'not_checked', replaced: false },
        lights: { headlights: 'not_checked', taillights: 'not_checked', brakeLights: 'not_checked', turnSignals: 'not_checked' },
        ...defaultFluids,
        ...preset.patch,
      };
      if (preset.key === 'oil-change' && mileageAtService) {
        (body as any).oil = { ...(defaultFluids.oil as object), ...(preset.patch.oil as object || {}), nextChangeMileage: mileageAtService + 5000 };
      }
      // Full record (feeds the app's fluids) + lightweight history entry
      // (feeds the Service History list) so both stay in sync.
      const [recordRes] = await Promise.all([
        api.post('/service-records', body),
        api.post('/service-entries', {
          vehicleId: id,
          serviceType: preset.entryType,
          serviceDate,
          mileageAtService,
          notes: `Quick ${preset.label.toLowerCase()} logged from the vehicle page.`,
        }),
      ]);
      return { record: recordRes.data, preset };
    },
    onSuccess: (_data, preset) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-service-records', id] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-service-entries', id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setPendingKey(null);
      setFeedback({ kind: 'ok', text: `${preset.label} logged in history and fluids. The app picks it up as the latest service data.` });
    },
    onError: (err: any) => {
      setPendingKey(null);
      const msg = err?.response?.data?.error || err?.message || 'Failed to log service';
      setFeedback({ kind: 'err', text: String(msg) });
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      await api.delete(`/service-records/${recordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-service-records', id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const handleQuickService = (preset: QuickService) => {
    setFeedback(null);
    setPendingKey(preset.key);
    logMutation.mutate(preset);
  };

  if (vehicleLoading) {
    return <PageLoading />;
  }

  if (!vehicle) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Vehicle not found</h3>
            <p className="text-gray-500 mb-4">
              The vehicle you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/vehicles')}>Back to Vehicles</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const serviceTypeLabels: Record<string, string> = {
    oil_change: 'Oil Change',
    brake_service: 'Brake Service',
    tire_service: 'Tire Service',
    battery_service: 'Battery Service',
    fluid_service: 'Fluid Service',
    filter_service: 'Filter Service',
    wiper_service: 'Wiper Service',
    light_check: 'Light Check',
    general_inspection: 'General Inspection',
  };

  return (
    <>
      <Header
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        subtitle="Vehicle details"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate('/vehicles')}
            >
              Back
            </Button>
            <Button
              leftIcon={<Activity className="h-4 w-4" />}
              onClick={() => navigate(`/obd-monitor?vehicleId=${id}`)}
            >
              OBD Monitor
            </Button>
            <Button
              variant="primary"
              leftIcon={<Stethoscope className="h-4 w-4" />}
              onClick={() => setIsConsultationModalOpen(true)}
            >
              Start Consultation
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Gauge className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mileage</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {vehicle.mileage?.toLocaleString() || 'N/A'} mi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wrench className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service Records</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {serviceEntries.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">OBD Data Points</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {obdStats?.totalRecords?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Added</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatDate(vehicle.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehicle Icon and Name */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Car className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={vehicle.healthStatus === 'good' || vehicle.healthStatus === 'excellent' ? 'success' : vehicle.healthStatus === 'fair' ? 'warning' : 'danger'}>
                      {vehicle.healthStatus || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Vehicle Details */}
              <div className="space-y-3">
                {vehicle.licensePlate && (
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">License Plate</p>
                      <p className="text-gray-900 font-mono">{vehicle.licensePlate}</p>
                    </div>
                  </div>
                )}

                {vehicle.vin && (
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">VIN</p>
                      <p className="text-gray-900 font-mono text-sm">{vehicle.vin}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Fuel className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Fuel Type</p>
                    <p className="text-gray-900 capitalize">{vehicle.fuelType || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Transmission</p>
                    <p className="text-gray-900 capitalize">{vehicle.transmission || 'N/A'}</p>
                  </div>
                </div>

                {vehicle.color && (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: vehicle.color.toLowerCase() }} />
                    <div>
                      <p className="text-sm text-gray-500">Color</p>
                      <p className="text-gray-900 capitalize">{vehicle.color}</p>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gray-200" />

              {/* Owner Info */}
              {vehicle.customer && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Owner</p>
                  <button
                    onClick={() => navigate(`/customers/${vehicle.customer?._id}`)}
                    className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {vehicle.customer.firstName} {vehicle.customer.lastName}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          {vehicle.customer.phone}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service History */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Service History</CardTitle>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<ClipboardList className="h-4 w-4" />}
                onClick={() => navigate(`/service-entries?vehicleId=${id}`)}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading service history...</div>
              ) : serviceEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No service records yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceEntries.slice(0, 5).map((entry) => (
                    <div
                      key={entry._id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Wrench className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {serviceTypeLabels[entry.serviceType] || entry.serviceType}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(entry.serviceDate)}
                              {entry.mileageAtService && ` - ${entry.mileageAtService.toLocaleString()} mi`}
                            </p>
                          </div>
                        </div>
                        {entry.cost && (
                          <span className="text-sm font-medium text-gray-900">
                            ${entry.cost.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="mt-2 text-sm text-gray-600 pl-12">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Log service directly on this vehicle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Log a service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback && (
                <div className={`rounded-lg px-4 py-3 text-sm ${feedback.kind === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {feedback.text}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service date</label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mileage (defaults to {vehicle?.mileage?.toLocaleString() || 0} mi)
                  </label>
                  <input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder={String(vehicle?.mileage || 0)}
                    min={0}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_SERVICES.map((preset) => (
                  <Button
                    key={preset.key}
                    variant="outline"
                    size="sm"
                    disabled={logMutation.isPending}
                    onClick={() => handleQuickService(preset)}
                  >
                    {pendingKey === preset.key ? 'Logging...' : preset.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Quick services post a full service record (oil next-change +5,000 mi) plus a history entry, so history and fluids stay in sync. The app reads the latest record for fluids.
                    </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/service-records/new?vehicleId=${id}`)}
                >
                  Full form →
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Latest fluids
                {latestRecord && (
                  <span className="text-sm font-normal text-gray-500">
                    · {formatDate(latestRecord.serviceDate)} @ {(latestRecord.mileageAtService || 0).toLocaleString()} mi
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!latestRecord || !mergedFluids ? (
                <p className="text-sm text-gray-500">
                  No service records yet. Log one on the left and it becomes the app's fluid baseline.
                </p>
              ) : (
                <div>
                  <FluidRow label="Engine oil" value={mergedFluids.oil?.condition !== 'not_checked' ? mergedFluids.oil?.condition : mergedFluids.oil?.level} changed={mergedFluids.oil?.changed} />
                  <FluidRow label="Brake fluid" value={mergedFluids.brakeFluid?.condition !== 'not_checked' ? mergedFluids.brakeFluid?.condition : mergedFluids.brakeFluid?.level} changed={mergedFluids.brakeFluid?.changed} />
                  <FluidRow label="Transmission fluid" value={mergedFluids.transmissionFluid?.condition !== 'not_checked' ? mergedFluids.transmissionFluid?.condition : mergedFluids.transmissionFluid?.level} changed={mergedFluids.transmissionFluid?.changed} />
                  <FluidRow label="Coolant" value={mergedFluids.coolant?.condition !== 'not_checked' ? mergedFluids.coolant?.condition : mergedFluids.coolant?.level} changed={mergedFluids.coolant?.changed} />
                  <FluidRow label="Power steering" value={mergedFluids.powerSteeringFluid?.level} changed={mergedFluids.powerSteeringFluid?.changed} />
                  <FluidRow label="Washer fluid" value={mergedFluids.washerFluid?.level} changed={mergedFluids.washerFluid?.changed} />
                  {mergedNextChange ? (
                    <p className="text-xs text-gray-500 mt-2">
                      Next oil change at {Number(mergedNextChange).toLocaleString()} mi.
                    </p>
                  ) : null}
                  <p className="text-xs text-gray-400 mt-1">
                    Latest known value per fluid across recent records.
                  </p>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this service record? The app will fall back to the previous one.')) {
                        deleteRecordMutation.mutate(latestRecord._id);
                      }
                    }}
                    className="mt-3 inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete latest record
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* OBD Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent OBD Sessions</CardTitle>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Activity className="h-4 w-4" />}
              onClick={() => navigate(`/obd-history?vehicleId=${id}`)}
            >
              View History
            </Button>
          </CardHeader>
          <CardContent>
            {obdSessions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No OBD sessions recorded</p>
                <p className="text-sm text-gray-400 mt-1">
                  Connect an OBD device to start monitoring this vehicle
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Started</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Ended</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Data Points</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {obdSessions.map((session: any) => (
                      <tr key={session._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatDate(session.startedAt)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {session.endedAt ? formatDate(session.endedAt) : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {session.dataPointCount?.toLocaleString() || 0}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={session.isActive ? 'success' : 'default'}>
                            {session.isActive ? 'Active' : 'Ended'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnostic Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Diagnostic Reports</CardTitle>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FileText className="h-4 w-4" />}
              onClick={() => navigate(`/diagnostic-reports?vehicleId=${id}`)}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {diagnosticReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No diagnostic reports yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Reports will appear here when synced from the diagnostic tool
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {diagnosticReports.map((report) => (
                  <div
                    key={report._id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/diagnostic-reports/${report._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          report.summary?.criticalCount > 0 ? 'bg-red-100' :
                          report.summary?.warningCount > 0 ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          {report.summary?.criticalCount > 0 ? (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          ) : report.summary?.warningCount > 0 ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(report.generatedAt)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {report.summary?.criticalCount > 0 && (
                              <span className="text-xs text-red-600">
                                {report.summary.criticalCount} critical
                              </span>
                            )}
                            {report.summary?.warningCount > 0 && (
                              <span className="text-xs text-yellow-600">
                                {report.summary.warningCount} warnings
                              </span>
                            )}
                            {report.summary?.dtcCount > 0 && (
                              <span className="text-xs text-gray-600">
                                {report.summary.dtcCount} DTCs
                              </span>
                            )}
                            {report.summary?.totalIssues === 0 && report.summary?.dtcCount === 0 && (
                              <span className="text-xs text-green-600">No issues</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.customerReport?.vehicleHealth && (
                          <Badge variant={
                            report.customerReport.vehicleHealth.overallStatus === 'good' ? 'success' :
                            report.customerReport.vehicleHealth.overallStatus === 'fair' ? 'warning' : 'danger'
                          }>
                            {report.customerReport.vehicleHealth.overallScore}%
                          </Badge>
                        )}
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Start Consultation Modal */}
      <Modal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        title="Start New Consultation"
        size="xl"
      >
        {vehicle && vehicle.customer && (
          <ConsultationIntakeForm
            vehicleInfo={{
              year: vehicle.year,
              make: vehicle.make,
              model: vehicle.model,
              licensePlate: vehicle.licensePlate,
            }}
            customerInfo={{
              firstName: vehicle.customer.firstName,
              lastName: vehicle.customer.lastName,
              phone: vehicle.customer.phone,
            }}
            onSubmit={(data) => createConsultationMutation.mutate(data)}
            onCancel={() => setIsConsultationModalOpen(false)}
            isSubmitting={createConsultationMutation.isPending}
          />
        )}
      </Modal>
    </>
  );
}
