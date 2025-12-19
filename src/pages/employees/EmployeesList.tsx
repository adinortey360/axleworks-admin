import { useQuery } from '@tanstack/react-query';
import { Plus, Phone, Mail } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { formatPhone, formatDate } from '../../utils';
import api from '../../api/client';
import type { Employee } from '../../types';

export function EmployeesList() {
  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/workshop/employees');
      return res.data;
    },
  });

  const employees = data?.data || [];

  return (
    <>
      <Header
        title="Employees"
        subtitle="Manage staff members"
        actions={<Button leftIcon={<Plus className="h-4 w-4" />}>Add Employee</Button>}
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Department</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Hire Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map((emp: Employee) => (
                      <tr key={emp._id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                              <p className="text-sm text-gray-500">{emp.employeeNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {formatPhone(emp.phone)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {emp.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 capitalize">{emp.role?.replace('_', ' ')}</td>
                        <td className="py-4 px-4 capitalize">{emp.department || '-'}</td>
                        <td className="py-4 px-4 text-gray-500">{formatDate(emp.hireDate)}</td>
                        <td className="py-4 px-4">
                          <Badge status={emp.status}>{emp.status}</Badge>
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
