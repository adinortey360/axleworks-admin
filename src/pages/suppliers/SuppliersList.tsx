import { useQuery } from '@tanstack/react-query';
import { Plus, Truck, Phone, Mail } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { formatPhone } from '../../utils';
import api from '../../api/client';
import type { Supplier } from '../../types';

export function SuppliersList() {
  const { data, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/workshop/suppliers');
      return res.data;
    },
  });

  const suppliers = data?.data || [];

  return (
    <>
      <Header
        title="Suppliers"
        subtitle="Manage parts suppliers"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />}>Add Supplier</Button>}
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Supplier</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Categories</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rating</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {suppliers.map((supplier: Supplier) => (
                      <tr key={supplier._id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Truck className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{supplier.name}</p>
                              {supplier.contactPerson && (
                                <p className="text-sm text-gray-500">{supplier.contactPerson}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {formatPhone(supplier.phone)}
                            </div>
                            {supplier.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-3 w-3" />
                                {supplier.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {supplier.categories?.slice(0, 3).map((cat) => (
                              <Badge key={cat} variant="default">{cat}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {supplier.rating ? `${supplier.rating}/5` : '-'}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={supplier.isActive ? 'success' : 'default'}>
                            {supplier.isActive ? 'Active' : 'Inactive'}
                          </Badge>
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
