import { useQuery } from '@tanstack/react-query';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { PageLoading } from '../../components/ui/Loading';
import { formatCurrency } from '../../utils';
import api from '../../api/client';
import type { InventoryItem } from '../../types';

export function InventoryList() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/workshop/inventory');
      return res.data;
    },
  });

  const items = data?.data || [];

  return (
    <>
      <Header
        title="Inventory"
        subtitle="Manage parts and supplies"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />}>Add Item</Button>}
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Part #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Qty</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Min Qty</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Cost</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item: InventoryItem) => (
                      <tr key={item._id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="font-mono text-sm">{item.partNumber}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
                        </td>
                        <td className="py-4 px-4 capitalize">{item.category}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={item.quantity <= item.minQuantity ? 'text-red-600 font-medium' : ''}>
                            {item.quantity}
                          </span>
                          {item.quantity <= item.minQuantity && (
                            <AlertTriangle className="inline h-4 w-4 text-red-500 ml-1" />
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-gray-500">{item.minQuantity}</td>
                        <td className="py-4 px-4 text-right text-gray-500">{formatCurrency(item.unitCost)}</td>
                        <td className="py-4 px-4 text-right font-medium">{formatCurrency(item.unitPrice)}</td>
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
