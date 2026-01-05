import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Car,
  User,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronRight,
  Eye,
  Clock,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { formatDate } from '../../utils';
import api from '../../api/client';

interface DiagnosticReport {
  _id: string;
  reportId: string;
  vehicleId: {
    _id: string;
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
  };
  customerId: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  consultationId?: string;
  generatedAt: string;
  vehicleSnapshot?: {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    licensePlate?: string;
    mileage?: number;
  };
  summary: {
    totalIssues: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    dtcCount: number;
    confirmedDTCs: number;
    pendingDTCs: number;
    testsPerformed: number;
    testsPassed: number;
    testsFailed: number;
  };
  customerReport?: {
    vehicleHealth?: {
      overallStatus: 'good' | 'fair' | 'needs_attention' | 'critical';
      overallScore: number;
      safetyStatus: 'safe' | 'concerns' | 'unsafe';
    };
    approvalStatus?: 'pending' | 'partial' | 'approved' | 'declined';
  };
  inspectionCertificate?: {
    overallVerdict: 'pass' | 'conditional' | 'fail';
    overallScore: number;
  };
  syncedAt: string;
  syncedByDevice?: string;
}

const healthStatusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'danger' }> = {
  good: { label: 'Good', variant: 'success' },
  fair: { label: 'Fair', variant: 'warning' },
  needs_attention: { label: 'Needs Attention', variant: 'warning' },
  critical: { label: 'Critical', variant: 'danger' },
};

const verdictConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'danger' }> = {
  pass: { label: 'Pass', variant: 'success' },
  conditional: { label: 'Conditional', variant: 'warning' },
  fail: { label: 'Fail', variant: 'danger' },
};

export function DiagnosticReportsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['diagnostic-reports', page],
    queryFn: async () => {
      const res = await api.get(`/diagnostic-reports?page=${page}&limit=20`);
      return res.data;
    },
  });

  const reports: DiagnosticReport[] = data?.data || [];
  const pagination = data?.pagination;

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <Header
        title="Diagnostic Reports"
        subtitle="View diagnostic reports synced from the desktop diagnostic tool"
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Reports</p>
                <p className="text-2xl font-bold">{pagination?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {reports.reduce((acc, r) => acc + (r.summary?.criticalCount || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reports.reduce((acc, r) => acc + (r.summary?.warningCount || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tests Passed</p>
                <p className="text-2xl font-bold text-green-600">
                  {reports.reduce((acc, r) => acc + (r.summary?.testsPassed || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
            <p className="text-gray-500">
              Diagnostic reports will appear here when synced from the desktop diagnostic tool.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card
              key={report._id}
              className="hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => navigate(`/diagnostic-reports/${report._id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Car className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {report.vehicleSnapshot?.year || report.vehicleId?.year}{' '}
                          {report.vehicleSnapshot?.make || report.vehicleId?.make}{' '}
                          {report.vehicleSnapshot?.model || report.vehicleId?.model}
                        </h3>
                        {report.customerReport?.vehicleHealth && (
                          <Badge variant={healthStatusConfig[report.customerReport.vehicleHealth.overallStatus]?.variant || 'default'}>
                            {healthStatusConfig[report.customerReport.vehicleHealth.overallStatus]?.label || report.customerReport.vehicleHealth.overallStatus}
                          </Badge>
                        )}
                        {report.inspectionCertificate && (
                          <Badge variant={verdictConfig[report.inspectionCertificate.overallVerdict]?.variant || 'default'}>
                            Inspection: {verdictConfig[report.inspectionCertificate.overallVerdict]?.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {report.customerId?.firstName} {report.customerId?.lastName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(report.generatedAt)}
                        </span>
                        {report.vehicleSnapshot?.mileage && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {report.vehicleSnapshot.mileage.toLocaleString()} mi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-gray-400" />
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-3">
                  {report.summary?.criticalCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      {report.summary.criticalCount} Critical
                    </div>
                  )}
                  {report.summary?.warningCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-600">
                      <AlertTriangle className="w-3 h-3" />
                      {report.summary.warningCount} Warnings
                    </div>
                  )}
                  {report.summary?.infoCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600">
                      <Info className="w-3 h-3" />
                      {report.summary.infoCount} Info
                    </div>
                  )}
                  {report.summary?.dtcCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                      <FileText className="w-3 h-3" />
                      {report.summary.dtcCount} DTCs
                    </div>
                  )}
                  {report.summary?.testsPerformed > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      {report.summary.testsPassed}/{report.summary.testsPerformed} Tests Passed
                    </div>
                  )}
                  {report.summary?.totalIssues === 0 && report.summary?.dtcCount === 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      No issues found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
