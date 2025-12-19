import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Calendar,
  ClipboardList,
  Receipt,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { StatsCard } from '../components/ui/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageLoading } from '../components/ui/Loading';
import { formatCurrency } from '../utils';
import api from '../api/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function Dashboard() {
  const { data: dailyReport, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['reports', 'daily'],
    queryFn: async () => {
      const res = await api.get('/workshop/reports/daily');
      return res.data.data;
    },
  });

  const { data: weeklyReport, isLoading: isLoadingWeekly } = useQuery({
    queryKey: ['reports', 'weekly'],
    queryFn: async () => {
      const res = await api.get('/workshop/reports/weekly');
      return res.data.data;
    },
  });

  const { data: activeWorkOrders } = useQuery({
    queryKey: ['workorders', 'active'],
    queryFn: async () => {
      const res = await api.get('/workshop/workorders/active');
      return res.data.data;
    },
  });

  const { data: todayAppointments } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const res = await api.get('/workshop/appointments/today');
      return res.data.data;
    },
  });

  if (isLoadingDaily || isLoadingWeekly) {
    return (
      <>
        <Header title="Dashboard" subtitle="Welcome back! Here's what's happening today." />
        <PageLoading />
      </>
    );
  }

  const stats = [
    {
      title: "Today's Revenue",
      value: formatCurrency(dailyReport?.revenue?.total || 0),
      icon: DollarSign,
      trend: { value: 12, isPositive: true },
      description: 'vs yesterday',
    },
    {
      title: 'Appointments Today',
      value: Object.values(dailyReport?.appointments || {}).reduce((a: number, b) => a + (b as number), 0) as number,
      icon: Calendar,
    },
    {
      title: 'Active Work Orders',
      value: activeWorkOrders?.length || 0,
      icon: ClipboardList,
    },
    {
      title: 'Pending Invoices',
      value: dailyReport?.invoices?.created || 0,
      icon: Receipt,
    },
  ];

  const chartData = weeklyReport?.revenueByDay?.map((item: { date: string; total: number }) => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    revenue: item.total,
  })) || [];

  return (
    <>
      <Header title="Dashboard" subtitle="Welcome back! Here's what's happening today." />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatsCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              description={stat.description}
            />
          ))}
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                Weekly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-600" />
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAppointments?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments?.slice(0, 5).map((apt: { _id: string; scheduledTime: string; customerId: { firstName: string; lastName: string }; vehicleId: { make: string; model: string }; serviceType: string; status: string }) => (
                    <div
                      key={apt._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Clock className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {apt.customerId?.firstName} {apt.customerId?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {apt.vehicleId?.make} {apt.vehicleId?.model} - {apt.serviceType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{apt.scheduledTime}</p>
                        <Badge status={apt.status}>{apt.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Work Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary-600" />
              Active Work Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeWorkOrders?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No active work orders</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">WO #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vehicle</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Priority</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeWorkOrders?.slice(0, 5).map((wo: { _id: string; workOrderNumber: string; customerId: { firstName: string; lastName: string }; vehicleId: { make: string; model: string; year: number }; status: string; priority: string; total: number }) => (
                      <tr key={wo._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-primary-600">{wo.workOrderNumber}</td>
                        <td className="py-3 px-4">
                          {wo.customerId?.firstName} {wo.customerId?.lastName}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {wo.vehicleId?.year} {wo.vehicleId?.make} {wo.vehicleId?.model}
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={wo.status}>{wo.status.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={wo.priority}>{wo.priority}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(wo.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
