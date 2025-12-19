import { useQuery } from '@tanstack/react-query';
import { Plus, FileText } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { formatCurrency, formatDate } from '../../utils';
import api from '../../api/client';
import type { Estimate } from '../../types';

export function EstimatesList() {
  const { data, isLoading } = useQuery({
    queryKey: ['estimates'],
    queryFn: async () => {
      const res = await api.get('/workshop/estimates');
      return res.data;
    },
  });

  const estimates = data?.data || [];

  return (
    <>
      <Header
        title="Estimates"
        subtitle="Manage repair estimates"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />}>New Estimate</Button>}
      />

      <div className="p-6">
        {isLoading ? (
          <PageLoading />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Estimate #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vehicle</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Valid Until</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {estimates.map((est: Estimate) => (
                      <tr key={est._id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary-600" />
                            <span className="font-medium text-primary-600">{est.estimateNumber}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">{est.customerId?.firstName} {est.customerId?.lastName}</td>
                        <td className="py-4 px-4 text-gray-500">
                          {est.vehicleId?.year} {est.vehicleId?.make} {est.vehicleId?.model}
                        </td>
                        <td className="py-4 px-4"><Badge status={est.status}>{est.status}</Badge></td>
                        <td className="py-4 px-4 text-gray-500">{formatDate(est.validUntil)}</td>
                        <td className="py-4 px-4 text-right font-medium">{formatCurrency(est.total)}</td>
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
