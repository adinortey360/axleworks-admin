import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { formatCurrency, formatDateTime } from '../../utils';
import api from '../../api/client';
import type { Payment } from '../../types';

export function PaymentsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await api.get('/workshop/payments');
      return res.data;
    },
  });

  const payments = data?.data || [];

  return (
    <>
      <Header title="Payments" subtitle="View payment history" />

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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Payment #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Method</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment: Payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary-600" />
                            <span className="font-medium">{payment.paymentNumber}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">{payment.customerId?.firstName} {payment.customerId?.lastName}</td>
                        <td className="py-4 px-4 capitalize">{payment.method?.replace('_', ' ')}</td>
                        <td className="py-4 px-4"><Badge status={payment.status}>{payment.status}</Badge></td>
                        <td className="py-4 px-4 text-gray-500">{formatDateTime(payment.createdAt)}</td>
                        <td className="py-4 px-4 text-right font-medium text-green-600">{formatCurrency(payment.amount)}</td>
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
