import { useQuery } from '@tanstack/react-query';
import { Plus, Receipt } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { formatCurrency, formatDate } from '../../utils';
import api from '../../api/client';
import type { Invoice } from '../../types';

export function InvoicesList() {
  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await api.get('/workshop/invoices');
      return res.data;
    },
  });

  const invoices = data?.data || [];

  return (
    <>
      <Header
        title="Invoices"
        subtitle="Manage billing and invoices"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />}>New Invoice</Button>}
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Invoice #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Due Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Paid</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((inv: Invoice) => (
                      <tr key={inv._id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary-600" />
                            <span className="font-medium text-primary-600">{inv.invoiceNumber}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">{inv.customerId?.firstName} {inv.customerId?.lastName}</td>
                        <td className="py-4 px-4"><Badge status={inv.status}>{inv.status}</Badge></td>
                        <td className="py-4 px-4 text-gray-500">{formatDate(inv.dueDate)}</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(inv.total)}</td>
                        <td className="py-4 px-4 text-right text-green-600">{formatCurrency(inv.amountPaid)}</td>
                        <td className="py-4 px-4 text-right font-medium text-red-600">{formatCurrency(inv.amountDue)}</td>
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
