import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Car,
  User,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  FileText,
  Wrench,
  Shield,
  Activity,
  Phone,
  Mail,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { formatDate } from '../../utils';
import api from '../../api/client';

interface Finding {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  affectedSystem?: string;
  confidence?: number;
}

interface DTC {
  code: string;
  status: 'confirmed' | 'pending' | 'history';
  module: string;
  description: string;
  possibleCauses?: string[];
}

interface TestResult {
  testId: string;
  testName: string;
  result: 'passed' | 'failed' | 'not_tested';
  notes?: string;
  failureIndicates?: string;
}

interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedUrgency: 'immediate' | 'soon' | 'when_convenient' | 'monitor';
}

interface RepairItem {
  id: string;
  category: 'safety' | 'recommended' | 'preventive' | 'informational';
  title: string;
  description: string;
  whyItMatters: string;
  urgency: 'immediate' | 'soon' | 'schedule' | 'monitor';
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
}

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
    email?: string;
  };
  generatedAt: string;
  vehicleSnapshot: {
    make: string;
    model: string;
    year: number;
    vin?: string;
    licensePlate?: string;
    mileage?: number;
  };
  sessionInfo: {
    startTime: string;
    endTime: string;
    dataPointsCollected: number;
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
  findings: Finding[];
  dtcs: DTC[];
  testResults: TestResult[];
  recommendations: Recommendation[];
  customerReport?: {
    vehicleHealth: {
      overallStatus: 'good' | 'fair' | 'needs_attention' | 'critical';
      overallScore: number;
      safetyStatus: 'safe' | 'concerns' | 'unsafe';
      summaryText: string;
    };
    repairItems: RepairItem[];
    approvalStatus: 'pending' | 'partial' | 'approved' | 'declined';
  };
  inspectionCertificate?: {
    certificateNumber: string;
    expiresAt: string;
    overallVerdict: 'pass' | 'conditional' | 'fail';
    overallScore: number;
  };
  syncedAt: string;
  syncedByDevice?: string;
}

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
};

const priorityConfig = {
  critical: { label: 'Critical', variant: 'danger' as const },
  high: { label: 'High', variant: 'warning' as const },
  medium: { label: 'Medium', variant: 'default' as const },
  low: { label: 'Low', variant: 'default' as const },
};

const urgencyConfig = {
  immediate: { label: 'Immediate', color: 'text-red-600' },
  soon: { label: 'Soon', color: 'text-yellow-600' },
  when_convenient: { label: 'When Convenient', color: 'text-blue-600' },
  monitor: { label: 'Monitor', color: 'text-gray-600' },
  schedule: { label: 'Schedule', color: 'text-blue-600' },
};

export function DiagnosticReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['diagnostic-report', id],
    queryFn: async () => {
      const res = await api.get(`/diagnostic-reports/${id}`);
      return res.data;
    },
  });

  const report: DiagnosticReport | undefined = data?.data;

  if (isLoading) {
    return <PageLoading />;
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Report not found</p>
        <Button variant="outline" onClick={() => navigate('/diagnostic-reports')} className="mt-4">
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/diagnostic-reports')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Header
        title={`${report.vehicleSnapshot?.year} ${report.vehicleSnapshot?.make} ${report.vehicleSnapshot?.model}`}
        subtitle={`Diagnostic Report - ${formatDate(report.generatedAt)}`}
      />

      {/* Vehicle & Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Vehicle</span>
              <span className="font-medium">
                {report.vehicleSnapshot?.year} {report.vehicleSnapshot?.make} {report.vehicleSnapshot?.model}
              </span>
            </div>
            {report.vehicleSnapshot?.vin && (
              <div className="flex justify-between">
                <span className="text-gray-500">VIN</span>
                <span className="font-mono text-sm">{report.vehicleSnapshot.vin}</span>
              </div>
            )}
            {report.vehicleSnapshot?.licensePlate && (
              <div className="flex justify-between">
                <span className="text-gray-500">License Plate</span>
                <span className="font-medium">{report.vehicleSnapshot.licensePlate}</span>
              </div>
            )}
            {report.vehicleSnapshot?.mileage && (
              <div className="flex justify-between">
                <span className="text-gray-500">Mileage</span>
                <span className="font-medium">{report.vehicleSnapshot.mileage.toLocaleString()} mi</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">
                {report.customerId?.firstName} {report.customerId?.lastName}
              </span>
            </div>
            {report.customerId?.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {report.customerId.phone}
                </span>
              </div>
            )}
            {report.customerId?.email && (
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {report.customerId.email}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Diagnostic Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{report.summary?.criticalCount || 0}</p>
              <p className="text-sm text-red-600">Critical</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{report.summary?.warningCount || 0}</p>
              <p className="text-sm text-yellow-600">Warnings</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{report.summary?.infoCount || 0}</p>
              <p className="text-sm text-blue-600">Info</p>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <p className="text-2xl font-bold text-gray-700">{report.summary?.dtcCount || 0}</p>
              <p className="text-sm text-gray-600">DTCs</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {report.summary?.testsPassed || 0}/{report.summary?.testsPerformed || 0}
              </p>
              <p className="text-sm text-green-600">Tests Passed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Health (Customer Report) */}
      {report.customerReport?.vehicleHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Vehicle Health Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${
                  report.customerReport.vehicleHealth.overallScore >= 80 ? 'text-green-600' :
                  report.customerReport.vehicleHealth.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {report.customerReport.vehicleHealth.overallScore}
                </div>
                <p className="text-sm text-gray-500">Health Score</p>
              </div>
              <div className="flex-1">
                <Badge variant={
                  report.customerReport.vehicleHealth.overallStatus === 'good' ? 'success' :
                  report.customerReport.vehicleHealth.overallStatus === 'fair' ? 'warning' : 'danger'
                } className="mb-2">
                  {report.customerReport.vehicleHealth.overallStatus.replace('_', ' ').toUpperCase()}
                </Badge>
                <p className="text-gray-600">{report.customerReport.vehicleHealth.summaryText}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Findings */}
      {report.findings && report.findings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Diagnostic Findings ({report.findings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.findings.map((finding) => {
              const config = severityConfig[finding.severity];
              const Icon = config.icon;
              return (
                <div key={finding.id} className={`p-4 rounded-lg border ${config.bg} ${config.border}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{finding.title}</h4>
                        <Badge variant={finding.severity === 'critical' ? 'danger' : finding.severity === 'warning' ? 'warning' : 'info'}>
                          {finding.severity}
                        </Badge>
                        {finding.confidence && (
                          <span className="text-xs text-gray-500">{finding.confidence}% confidence</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{finding.description}</p>
                      {finding.category && (
                        <p className="text-xs text-gray-500 mt-1">Category: {finding.category}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* DTCs */}
      {report.dtcs && report.dtcs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Diagnostic Trouble Codes ({report.dtcs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.dtcs.map((dtc, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg">{dtc.code}</span>
                      <Badge variant={dtc.status === 'confirmed' ? 'danger' : dtc.status === 'pending' ? 'warning' : 'default'}>
                        {dtc.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">{dtc.module}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{dtc.description}</p>
                  {dtc.possibleCauses && dtc.possibleCauses.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Possible Causes:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {dtc.possibleCauses.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {report.testResults && report.testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Test Results ({report.testResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.testResults.map((test) => (
                <div key={test.testId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {test.result === 'passed' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : test.result === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                    <div>
                      <p className="font-medium">{test.testName}</p>
                      {test.notes && <p className="text-sm text-gray-500">{test.notes}</p>}
                    </div>
                  </div>
                  <Badge variant={test.result === 'passed' ? 'success' : test.result === 'failed' ? 'danger' : 'default'}>
                    {test.result.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations ({report.recommendations.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.recommendations.map((rec) => (
              <div key={rec.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityConfig[rec.priority]?.variant || 'default'}>
                      {priorityConfig[rec.priority]?.label || rec.priority}
                    </Badge>
                    <span className={`text-sm ${urgencyConfig[rec.estimatedUrgency]?.color || 'text-gray-600'}`}>
                      {urgencyConfig[rec.estimatedUrgency]?.label || rec.estimatedUrgency}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600">{rec.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Repair Items (Customer Report) */}
      {report.customerReport?.repairItems && report.customerReport.repairItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Repair Items ({report.customerReport.repairItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.customerReport.repairItems.map((item) => (
              <div key={item.id} className={`p-4 border rounded-lg ${
                item.category === 'safety' ? 'border-red-200 bg-red-50' :
                item.category === 'recommended' ? 'border-yellow-200 bg-yellow-50' : ''
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge variant={
                      item.category === 'safety' ? 'danger' :
                      item.category === 'recommended' ? 'warning' : 'default'
                    } className="mb-1">
                      {item.category}
                    </Badge>
                    <h4 className="font-semibold">{item.title}</h4>
                  </div>
                  {item.estimatedCost && (
                    <span className="font-semibold text-green-600">
                      ${item.estimatedCost.min} - ${item.estimatedCost.max}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{item.description}</p>
                <p className="text-sm text-gray-500">
                  <strong>Why it matters:</strong> {item.whyItMatters}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Inspection Certificate */}
      {report.inspectionCertificate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Inspection Certificate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${
                  report.inspectionCertificate.overallVerdict === 'pass' ? 'text-green-600' :
                  report.inspectionCertificate.overallVerdict === 'conditional' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {report.inspectionCertificate.overallScore}
                </div>
                <p className="text-sm text-gray-500">Score</p>
              </div>
              <div>
                <Badge variant={
                  report.inspectionCertificate.overallVerdict === 'pass' ? 'success' :
                  report.inspectionCertificate.overallVerdict === 'conditional' ? 'warning' : 'danger'
                } className="text-lg px-4 py-1">
                  {report.inspectionCertificate.overallVerdict.toUpperCase()}
                </Badge>
                <p className="text-sm text-gray-500 mt-2">
                  Certificate #: {report.inspectionCertificate.certificateNumber}
                </p>
                <p className="text-sm text-gray-500">
                  Expires: {formatDate(report.inspectionCertificate.expiresAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Session Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Session Start</span>
            <span>{report.sessionInfo?.startTime ? formatDate(report.sessionInfo.startTime) : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Session End</span>
            <span>{report.sessionInfo?.endTime ? formatDate(report.sessionInfo.endTime) : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Data Points Collected</span>
            <span>{report.sessionInfo?.dataPointsCollected?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Synced At</span>
            <span>{formatDate(report.syncedAt)}</span>
          </div>
          {report.syncedByDevice && (
            <div className="flex justify-between">
              <span className="text-gray-500">Device ID</span>
              <span className="font-mono text-xs">{report.syncedByDevice}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
