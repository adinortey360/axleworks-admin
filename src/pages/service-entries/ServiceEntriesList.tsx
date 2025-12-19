import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ArrowLeft, Trash2, Edit, Droplet, Disc, Circle, Battery, Filter, Wind, Lightbulb, ClipboardCheck } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { PageLoading } from '../../components/ui/Loading';
import api from '../../api/client';

interface ServiceEntry {
  _id: string;
  vehicleId: { _id: string; make: string; model: string; year: number };
  serviceType: string;
  serviceDate: string;
  mileageAtService: number;
  data: Record<string, any>;
  notes: string;
  cost: number;
  recordedBy?: { firstName: string; lastName: string };
}

const SERVICE_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  oil_change: { label: 'Oil Change', icon: Droplet, color: 'bg-amber-100 text-amber-700' },
  brake_service: { label: 'Brake Service', icon: Disc, color: 'bg-red-100 text-red-700' },
  tire_service: { label: 'Tire Service', icon: Circle, color: 'bg-blue-100 text-blue-700' },
  battery_service: { label: 'Battery Service', icon: Battery, color: 'bg-green-100 text-green-700' },
  fluid_service: { label: 'Fluid Service', icon: Droplet, color: 'bg-purple-100 text-purple-700' },
  filter_service: { label: 'Filter Service', icon: Filter, color: 'bg-gray-100 text-gray-700' },
  wiper_service: { label: 'Wiper Service', icon: Wind, color: 'bg-cyan-100 text-cyan-700' },
  light_check: { label: 'Light Check', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700' },
  general_inspection: { label: 'General Inspection', icon: ClipboardCheck, color: 'bg-indigo-100 text-indigo-700' },
};

export function ServiceEntriesList() {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const [filterType, setFilterType] = useState<string>('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['service-entries', vehicleId, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (vehicleId) params.append('vehicleId', vehicleId);
      if (filterType !== 'all') params.append('serviceType', filterType);
      const res = await api.get(`/service-entries?${params}`);
      return res.data;
    },
  });

  const { data: vehicleData } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      const res = await api.get(`/vehicles?page=1&limit=100`);
      return res.data.data?.find((v: any) => v._id === vehicleId);
    },
    enabled: !!vehicleId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/service-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-entries'] });
    },
  });

  const entries: ServiceEntry[] = entriesData?.data || [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Header
        title="Service History"
        subtitle={vehicleData ? `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}` : 'All service entries'}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/vehicles')}>
              Back to Vehicles
            </Button>
            {vehicleId && (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(`/service-entries/new?vehicleId=${vehicleId}`)}>
                Add Service
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6">
        {/* Service Type Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterType === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Object.entries(SERVICE_TYPE_CONFIG).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === type ? 'bg-primary-600 text-white' : `${config.color} hover:opacity-80`
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PageLoading />
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No service entries found</p>
              {vehicleId && (
                <Button className="mt-4" onClick={() => navigate(`/service-entries/new?vehicleId=${vehicleId}`)}>
                  Add First Service Entry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const config = SERVICE_TYPE_CONFIG[entry.serviceType] || SERVICE_TYPE_CONFIG.general_inspection;
              const Icon = config.icon;

              return (
                <Card key={entry._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{config.label}</h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(entry.serviceDate)}
                            {entry.mileageAtService && ` • ${entry.mileageAtService.toLocaleString()} mi`}
                          </p>
                          {entry.notes && <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>}

                          {/* Type-specific data display */}
                          {entry.serviceType === 'oil_change' && entry.data && (
                            <div className="mt-2 text-sm text-gray-600">
                              {entry.data.oilBrand && <span className="mr-3">{entry.data.oilBrand}</span>}
                              {entry.data.oilType && <span className="mr-3">{entry.data.oilType}</span>}
                              {entry.data.changeIntervalMonths && (
                                <span className="text-gray-400">• Next in {entry.data.changeIntervalMonths} months</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {entry.cost && (
                          <span className="text-sm font-medium text-gray-700">${entry.cost.toFixed(2)}</span>
                        )}
                        <button
                          onClick={() => navigate(`/service-entries/${entry._id}/edit?vehicleId=${vehicleId}`)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this service entry?')) {
                              deleteMutation.mutate(entry._id);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
