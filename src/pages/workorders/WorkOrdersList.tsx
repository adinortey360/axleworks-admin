import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ClipboardList } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { formatCurrency } from '../../utils';
import api from '../../api/client';
import type { WorkOrder } from '../../types';

export function WorkOrdersList() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['workorders', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      const res = await api.get(`/workshop/workorders?${params}`);
      return res.data;
    },
  });

  const workOrders = data?.data || [];
  const statuses = ['created', 'in_progress', 'waiting_parts', 'waiting_approval', 'ready', 'completed'];

  return (
    <>
      <Header
        title="Work Orders"
        subtitle="Manage service work orders"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            New Work Order
          </Button>
        }
      />

      <div className="p-6">
        <div className="mb-6 flex gap-2 flex-wrap">
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">WO #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vehicle</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Priority</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {workOrders.map((wo: WorkOrder) => (
                      <tr key={wo._id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary-600" />
                            <span className="font-medium text-primary-600">{wo.workOrderNumber}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {wo.customerId?.firstName} {wo.customerId?.lastName}
                        </td>
                        <td className="py-4 px-4 text-gray-500">
                          {wo.vehicleId?.year} {wo.vehicleId?.make} {wo.vehicleId?.model}
                        </td>
                        <td className="py-4 px-4 capitalize">{wo.type}</td>
                        <td className="py-4 px-4">
                          <Badge status={wo.status}>{wo.status.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge status={wo.priority}>{wo.priority}</Badge>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">{formatCurrency(wo.total)}</td>
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
