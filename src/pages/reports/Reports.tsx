import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, Users, Wrench, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Header } from '../../components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/Loading';
import { formatCurrency } from '../../utils';
import api from '../../api/client';

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>('weekly');

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports', 'summary', period],
    queryFn: async () => {
      const res = await api.get(`/workshop/reports/${period}-summary`);
      return res.data;
    },
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['reports', 'revenue', period],
    queryFn: async () => {
      // Mock revenue trend data - would come from API
      const days = period === 'daily' ? 24 : period === 'weekly' ? 7 : 30;
      return Array.from({ length: days }, (_, i) => ({
        name: period === 'daily' ? `${i}:00` : period === 'weekly' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i] : `Day ${i + 1}`,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        expenses: Math.floor(Math.random() * 2000) + 500,
      }));
    },
  });

  const { data: servicesData } = useQuery({
    queryKey: ['reports', 'services'],
    queryFn: async () => {
      // Mock service breakdown - would come from API
      return [
        { name: 'Oil Change', value: 35 },
        { name: 'Brake Service', value: 25 },
        { name: 'Tire Service', value: 20 },
        { name: 'Engine Repair', value: 12 },
        { name: 'Other', value: 8 },
      ];
    },
  });

  const summary = summaryData?.data || {};
  const isLoading = summaryLoading || revenueLoading;

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue || 0),
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(summary.totalExpenses || 0),
      change: '+5.2%',
      trend: 'up',
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      title: 'Net Profit',
      value: formatCurrency((summary.totalRevenue || 0) - (summary.totalExpenses || 0)),
      change: '+18.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Work Orders',
      value: summary.workOrdersCompleted || 0,
      change: '+8.1%',
      trend: 'up',
      icon: Wrench,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'New Customers',
      value: summary.newCustomers || 0,
      change: '+15.0%',
      trend: 'up',
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      title: 'Parts Used',
      value: summary.partsUsed || 0,
      change: '+3.2%',
      trend: 'up',
      icon: Package,
      color: 'text-cyan-600',
      bg: 'bg-cyan-100',
    },
  ];

  return (
    <>
      <Header
        title="Reports"
        subtitle="Business analytics and insights"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={period === 'daily' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod('daily')}
            >
              Daily
            </Button>
            <Button
              variant={period === 'weekly' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={period === 'monthly' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod('monthly')}
            >
              Monthly
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {isLoading ? (
          <PageLoading />
        ) : (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444' }}
                        name="Expenses"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={servicesData || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {(servicesData || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Day */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData?.slice(0, 7) || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'John Smith', spent: 4500, visits: 12 },
                      { name: 'Sarah Johnson', spent: 3200, visits: 8 },
                      { name: 'Mike Williams', spent: 2800, visits: 6 },
                      { name: 'Emily Brown', spent: 2100, visits: 5 },
                      { name: 'David Lee', spent: 1900, visits: 4 },
                    ].map((customer, index) => (
                      <div key={customer.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.visits} visits</p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">{formatCurrency(customer.spent)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Oil Change', count: 145, revenue: 7250 },
                      { name: 'Brake Pad Replacement', count: 89, revenue: 12460 },
                      { name: 'Tire Rotation', count: 78, revenue: 3900 },
                      { name: 'Engine Diagnostic', count: 56, revenue: 5600 },
                      { name: 'AC Service', count: 34, revenue: 5100 },
                    ].map((service, index) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600 text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-500">{service.count} completed</p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">{formatCurrency(service.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
