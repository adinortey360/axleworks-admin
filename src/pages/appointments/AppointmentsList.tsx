import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar, Clock } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { formatDate } from '../../utils';
import api from '../../api/client';
import type { Appointment } from '../../types';

export function AppointmentsList() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      const res = await api.get(`/workshop/appointments?${params}`);
      return res.data;
    },
  });

  const appointments = data?.data || [];

  const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  return (
    <>
      <Header
        title="Appointments"
        subtitle="Manage service appointments"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            New Appointment
          </Button>
        }
      />

      <div className="p-6">
        <div className="mb-6 flex gap-2">
          <Button variant={status === '' ? 'primary' : 'outline'} size="sm" onClick={() => setStatus('')}>
            All
          </Button>
          {statuses.map((s) => (
            <Button key={s} variant={status === s ? 'primary' : 'outline'} size="sm" onClick={() => setStatus(s)}>
              {s.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <PageLoading />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date & Time</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vehicle</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Service</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {appointments.map((apt: Appointment) => (
                      <tr key={apt._id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-lg">
                              <Calendar className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{formatDate(apt.scheduledDate)}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {apt.scheduledTime}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {apt.customerId?.firstName} {apt.customerId?.lastName}
                        </td>
                        <td className="py-4 px-4 text-gray-500">
                          {apt.vehicleId?.year} {apt.vehicleId?.make} {apt.vehicleId?.model}
                        </td>
                        <td className="py-4 px-4 capitalize">{apt.serviceType?.replace('_', ' ')}</td>
                        <td className="py-4 px-4">
                          <Badge status={apt.status}>{apt.status?.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
