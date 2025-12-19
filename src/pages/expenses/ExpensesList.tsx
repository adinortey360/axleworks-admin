import { useQuery } from '@tanstack/react-query';
import { Plus, Wallet } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { formatCurrency, formatDate } from '../../utils';
import api from '../../api/client';
import type { Expense } from '../../types';

export function ExpensesList() {
  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await api.get('/workshop/expenses');
      return res.data;
    },
  });

  const expenses = data?.data || [];

  return (
    <>
      <Header
        title="Expenses"
        subtitle="Track business expenses"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />}>Add Expense</Button>}
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Expense #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vendor</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.map((expense: Expense) => (
                      <tr key={expense._id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{expense.expenseNumber}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-900">{expense.description}</p>
                          {expense.taxDeductible && (
                            <Badge variant="info" className="mt-1">Tax Deductible</Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 capitalize">{expense.category}</td>
                        <td className="py-4 px-4 text-gray-500">{expense.vendor || '-'}</td>
                        <td className="py-4 px-4 text-gray-500">{formatDate(expense.date)}</td>
                        <td className="py-4 px-4 text-right font-medium text-red-600">
                          {formatCurrency(expense.amount)}
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
