import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  DollarSign,
  Smartphone,
  Edit,
  User,
  Activity,
  ClipboardList,
  Plus,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/Loading';
import { formatCurrency, formatDate, formatPhone } from '../../utils';
import api from '../../api/client';
import type { Customer, Vehicle } from '../../types';

interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  vehicleType: string;
  fuelType: string;
  mileage: number;
  color: string;
}

const initialFormData: VehicleFormData = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  licensePlate: '',
  vehicleType: 'sedan',
  fuelType: 'petrol',
  mileage: 0,
  color: '',
};

export function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);

  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const res = await api.post('/vehicles', { ...data, customerId: id });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-vehicles', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats', id] });
      setIsModalOpen(false);
      setFormData(initialFormData);
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const res = await api.delete(`/vehicles/${vehicleId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-vehicles', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats', id] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      alert(error.response?.data?.message || error.message || 'Failed to delete vehicle');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVehicleMutation.mutate(formData);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    if (confirm(`Are you sure you want to delete ${vehicle.year} ${vehicle.make} ${vehicle.model}?`)) {
      deleteVehicleMutation.mutate(vehicle._id);
    }
  };

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await api.get(`/workshop/customers/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['customer-vehicles', id],
    queryFn: async () => {
      const res = await api.get(`/workshop/customers/${id}/vehicles`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: statsData } = useQuery({
    queryKey: ['customer-stats', id],
    queryFn: async () => {
      const res = await api.get(`/workshop/customers/${id}/stats`);
      return res.data;
    },
    enabled: !!id,
  });

  const customer: Customer | undefined = customerData?.data;
  const vehicles: Vehicle[] = vehiclesData?.data || [];
  const stats = statsData?.data;

  if (customerLoading) {
    return <PageLoading />;
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
            <p className="text-gray-500 mb-4">
              The customer you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/customers')}>Back to Customers</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAppUser = customer.userId || customer.source === 'app';

  return (
    <>
      <Header
        title={`${customer.firstName} ${customer.lastName}`}
        subtitle="Customer details"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate('/customers')}
            >
              Back
            </Button>
            <Button leftIcon={<Edit className="h-4 w-4" />}>
              Edit Customer
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(stats?.totalSpent || customer.totalSpent)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Visits</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {stats?.visitCount || customer.visitCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Car className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicles</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {stats?.vehicleCount || vehicles.length}
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
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatDate(stats?.memberSince || customer.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar and Name */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary-600">
                    {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={customer.isActive ? 'success' : 'default'}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {isAppUser && (
                      <Badge variant="info" className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        App User
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Contact Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">
                      {customer.countryCode && `${customer.countryCode} `}
                      {formatPhone(customer.phone)}
                    </p>
                  </div>
                </div>

                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900">{customer.email}</p>
                    </div>
                  </div>
                )}

                {customer.address && (customer.address.street || customer.address.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-900">
                        {[
                          customer.address.street,
                          customer.address.city,
                          customer.address.state,
                          customer.address.postalCode,
                          customer.address.country,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gray-200" />

              {/* Additional Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="text-gray-900 capitalize">
                    {customer.source?.replace('-', ' ') || 'Not specified'}
                  </p>
                </div>

                {customer.lastVisit && (
                  <div>
                    <p className="text-sm text-gray-500">Last Visit</p>
                    <p className="text-gray-900">{formatDate(customer.lastVisit)}</p>
                  </div>
                )}

                {customer.tags && customer.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tag, index) => (
                        <Badge key={index} variant="default">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {customer.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-gray-900 text-sm">{customer.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicles */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vehicles</CardTitle>
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsModalOpen(true)}
              >
                Add Vehicle
              </Button>
            </CardHeader>
            <CardContent>
              {vehiclesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading vehicles...</div>
              ) : vehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No vehicles registered</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle._id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Car className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {vehicle.licensePlate && (
                                <span>Plate: {vehicle.licensePlate}</span>
                              )}
                              {vehicle.vin && <span>VIN: {vehicle.vin}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {vehicle.healthStatus && (
                            <Badge
                              variant={
                                vehicle.healthStatus === 'excellent' || vehicle.healthStatus === 'good'
                                  ? 'success'
                                  : vehicle.healthStatus === 'fair'
                                  ? 'warning'
                                  : 'danger'
                              }
                            >
                              {vehicle.healthStatus}
                            </Badge>
                          )}
                          {vehicle.mileage && (
                            <span className="text-sm text-gray-500">
                              {vehicle.mileage.toLocaleString()} km
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => navigate(`/obd-monitor?vehicleId=${vehicle._id}`)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                        >
                          <Activity className="h-4 w-4" />
                          OBD Monitor
                        </button>
                        <button
                          onClick={() => navigate(`/service-entries?vehicleId=${vehicle._id}`)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-lg transition-colors"
                        >
                          <ClipboardList className="h-4 w-4" />
                          Service History
                        </button>
                        <button
                          onClick={() => navigate(`/consultations/new?customerId=${id}&vehicleId=${vehicle._id}`)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Consultation
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors ml-auto"
                          title="Delete vehicle"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Vehicle" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Info (pre-selected) */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium text-gray-900">
              {customer?.firstName} {customer?.lastName}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Make"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="e.g. Toyota"
              required
            />
            <Input
              label="Model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g. Camry"
              required
            />
            <Input
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="License Plate"
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
            />
            <Input
              label="VIN"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="pickup">Pickup</option>
                <option value="hatchback">Hatchback</option>
                <option value="truck">Truck</option>
                <option value="coupe">Coupe</option>
                <option value="van">Van</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>
            <Input
              label="Color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <Input
            label="Mileage"
            type="number"
            value={formData.mileage}
            onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createVehicleMutation.isPending}>
              {createVehicleMutation.isPending ? 'Creating...' : 'Create Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
