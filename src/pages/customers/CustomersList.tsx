import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Mail, Car, Smartphone } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/Loading';
import { formatCurrency, formatDate, formatPhone } from '../../utils';
import api from '../../api/client';
import type { Customer } from '../../types';

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: 'walk-in' | 'referral' | 'website';
  notes: string;
}

const initialFormData: CustomerFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  source: 'walk-in',
  notes: '',
};

export function CustomersList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const res = await api.post('/workshop/customers', data);
      return res.data;
    },
    onSuccess: async () => {
      // Force refetch the customers list
      await queryClient.refetchQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      alert(error.response?.data?.message || error.message || 'Failed to create customer');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.append('search', search);
      const res = await api.get(`/workshop/customers?${params}`);
      return res.data;
    },
  });

  const customers = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Header
        title="Customers"
        subtitle="Manage your customer database"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
            Add Customer
          </Button>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vehicles</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total Spent</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Last Visit</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map((customer: Customer) => (
                      <tr
                        key={customer._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/customers/${customer._id}`)}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {customer.visitCount} visits
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {formatPhone(customer.phone)}
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {customer.userId || customer.source === 'app' ? (
                            <Badge variant="info" className="flex items-center gap-1 w-fit">
                              <Smartphone className="h-3 w-3" />
                              App User
                            </Badge>
                          ) : (
                            <Badge variant="default">
                              {customer.source === 'walk-in' ? 'Walk-in' :
                               customer.source === 'referral' ? 'Referral' :
                               customer.source === 'website' ? 'Website' : 'Manual'}
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {customer.vehicles?.length || 0} vehicles
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium text-gray-900">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {customer.lastVisit ? formatDate(customer.lastVisit) : 'Never'}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={customer.isActive ? 'success' : 'default'}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Customer" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as CustomerFormData['source'] })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="walk-in">Walk-in</option>
              <option value="referral">Referral</option>
              <option value="website">Website</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
