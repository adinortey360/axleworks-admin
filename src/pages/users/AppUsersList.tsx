import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Phone, Smartphone } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/Loading';
import { formatDate } from '../../utils';
import api from '../../api/client';

interface AppUser {
  _id: string;
  phone: string;
  countryCode: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileComplete?: boolean;
  createdAt: string;
}

export function AppUsersList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['app-users', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.append('search', search);
      const res = await api.get(`/users?${params}`);
      return res.data;
    },
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  const formatPhone = (countryCode: string, phone: string) => {
    return `${countryCode} ${phone}`;
  };

  return (
    <>
      <Header
        title="App Users"
        subtitle="Users registered via the mobile app"
      />

      <div className="p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {isLoading ? (
          <PageLoading />
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Smartphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No app users yet</h3>
              <p className="text-gray-500">
                Users will appear here when they sign up via the mobile app.
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Registered</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user: AppUser) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                              {user.firstName ? (
                                <span className="text-sm font-medium text-primary-600">
                                  {user.firstName.charAt(0)}{user.lastName?.charAt(0) || ''}
                                </span>
                              ) : (
                                <Phone className="h-4 w-4 text-primary-600" />
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : 'No name'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatPhone(user.countryCode, user.phone)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {user.email || '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={user.profileComplete ? 'success' : 'default'}>
                            {user.profileComplete ? 'Complete' : 'Incomplete'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.total > 0 && (
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
    </>
  );
}
