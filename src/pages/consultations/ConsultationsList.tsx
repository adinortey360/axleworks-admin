import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Car,
  User,
  Clock,
  Lock,
  CheckCircle,
  Play,
  Eye,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PageLoading } from '../../components/ui/Loading';
import { formatDate } from '../../utils';
import api from '../../api/client';

interface Consultation {
  _id: string;
  vehicleId: {
    _id: string;
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
  };
  customerId: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  status: 'pending' | 'locked' | 'in_progress' | 'completed' | 'cancelled';
  chiefComplaint?: string;
  symptoms?: string[];
  diagnosis?: string;
  lockedByDevice?: string;
  lockedAt?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'danger' | 'info' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  locked: { label: 'Locked', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

export function ConsultationsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['consultations', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/consultations?${params}`);
      return res.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/consultations/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      setIsDetailModalOpen(false);
    },
  });

  const consultations: Consultation[] = data?.data || [];
  const pagination = data?.pagination;

  const openDetail = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <>
      <Header
        title="Consultations"
        subtitle="Vehicle diagnostic consultations"
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="locked">Locked</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['pending', 'locked', 'in_progress', 'completed', 'cancelled'].map((status) => {
            const count = consultations.filter((c) => c.status === status).length;
            const config = statusConfig[status];
            return (
              <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(status)}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-500 capitalize">{config.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Consultations List */}
        {consultations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No consultations found</h3>
              <p className="text-gray-500">
                {statusFilter
                  ? `No ${statusFilter} consultations`
                  : 'Start a consultation from a vehicle details page'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vehicle</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Chief Complaint</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Created</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {consultations.filter((c) => c.vehicleId && c.customerId).map((consultation) => {
                      const config = statusConfig[consultation.status];
                      return (
                        <tr
                          key={consultation._id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openDetail(consultation)}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <Car className="h-5 w-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {consultation.vehicleId?.year} {consultation.vehicleId?.make} {consultation.vehicleId?.model}
                                </p>
                                {consultation.vehicleId?.licensePlate && (
                                  <p className="text-sm text-gray-500 font-mono">
                                    {consultation.vehicleId.licensePlate}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-900">
                              {consultation.customerId?.firstName} {consultation.customerId?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{consultation.customerId?.phone}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-gray-900 truncate max-w-[200px]">
                              {consultation.chiefComplaint || '-'}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={config.variant}>{config.label}</Badge>
                            {consultation.status === 'locked' && (
                              <p className="text-xs text-gray-500 mt-1">
                                <Lock className="h-3 w-3 inline mr-1" />
                                {consultation.lockedByDevice}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-500">
                            {formatDate(consultation.createdAt)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {consultation.vehicleId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/vehicles/${consultation.vehicleId._id}`);
                                  }}
                                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="View Vehicle"
                                >
                                  <Car className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail(consultation);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Consultation Details"
        size="lg"
      >
        {selectedConsultation && (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge variant={statusConfig[selectedConsultation.status].variant} className="text-base px-3 py-1">
                {statusConfig[selectedConsultation.status].label}
              </Badge>
              <p className="text-sm text-gray-500">ID: {selectedConsultation._id}</p>
            </div>

            {/* Vehicle */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedConsultation.vehicleId?.year} {selectedConsultation.vehicleId?.make}{' '}
                    {selectedConsultation.vehicleId?.model}
                  </p>
                  {selectedConsultation.vehicleId?.licensePlate && (
                    <p className="text-sm text-gray-500">
                      Plate: {selectedConsultation.vehicleId.licensePlate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedConsultation.customerId?.firstName} {selectedConsultation.customerId?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedConsultation.customerId?.phone}</p>
                </div>
              </div>
            </div>

            {/* Chief Complaint */}
            {selectedConsultation.chiefComplaint && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Chief Complaint</p>
                <p className="text-gray-900">{selectedConsultation.chiefComplaint}</p>
              </div>
            )}

            {/* Symptoms */}
            {selectedConsultation.symptoms && selectedConsultation.symptoms.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Symptoms</p>
                <ul className="list-disc list-inside text-gray-900">
                  {selectedConsultation.symptoms.map((symptom, i) => (
                    <li key={i}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Diagnosis (if completed) */}
            {selectedConsultation.diagnosis && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Diagnosis</p>
                <p className="text-gray-900">{selectedConsultation.diagnosis}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Timeline</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Created: {formatDate(selectedConsultation.createdAt)}</span>
                </div>
                {selectedConsultation.lockedAt && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Lock className="h-4 w-4" />
                    <span>Locked: {formatDate(selectedConsultation.lockedAt)}</span>
                  </div>
                )}
                {selectedConsultation.startedAt && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Play className="h-4 w-4" />
                    <span>Started: {formatDate(selectedConsultation.startedAt)}</span>
                  </div>
                )}
                {selectedConsultation.completedAt && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Completed: {formatDate(selectedConsultation.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              {selectedConsultation.vehicleId && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/vehicles/${selectedConsultation.vehicleId._id}`)}
                >
                  View Vehicle
                </Button>
              )}
              {(selectedConsultation.status === 'pending' || selectedConsultation.status === 'locked') && (
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this consultation?')) {
                      cancelMutation.mutate(selectedConsultation._id);
                    }
                  }}
                  disabled={cancelMutation.isPending}
                >
                  Cancel Consultation
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
