import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Wrench,
  Settings,
  Phone,
  Hash,
  Stethoscope,
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

export function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

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

  const vehicle: VehicleWithCustomer | null = vehicleData;
  const serviceEntries: ServiceEntry[] = serviceEntriesData?.data || [];
  const obdStats = obdStatsData?.stats;
  const obdSessions = obdSessionsData?.data || [];

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
