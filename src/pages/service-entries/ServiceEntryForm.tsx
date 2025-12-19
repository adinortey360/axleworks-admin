import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Car } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import api from '../../api/client';

type ServiceType = 'oil_change' | 'brake_service' | 'tire_service' | 'battery_service' | 'fluid_service' | 'filter_service' | 'wiper_service' | 'light_check' | 'general_inspection';

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'brake_service', label: 'Brake Service' },
  { value: 'tire_service', label: 'Tire Service' },
  { value: 'battery_service', label: 'Battery Service' },
  { value: 'fluid_service', label: 'Fluid Service' },
  { value: 'filter_service', label: 'Filter Service' },
  { value: 'wiper_service', label: 'Wiper Service' },
  { value: 'light_check', label: 'Light Check' },
  { value: 'general_inspection', label: 'General Inspection' },
];

interface ServiceEntryData {
  vehicleId: string;
  serviceType: ServiceType;
  serviceDate: string;
  mileageAtService: number;
  data: Record<string, any>;
  notes: string;
  cost: number;
}

const defaultFormData: ServiceEntryData = {
  vehicleId: '',
  serviceType: 'oil_change',
  serviceDate: new Date().toISOString().split('T')[0],
  mileageAtService: 0,
  data: {},
  notes: '',
  cost: 0,
};

export function ServiceEntryForm() {
  const navigate = useNavigate();
  const { id: entryId } = useParams();
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const isEditMode = !!entryId;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ServiceEntryData>({
    ...defaultFormData,
    vehicleId: vehicleId || '',
  });

  // Fetch existing entry for editing
  const { data: existingEntry, isLoading: isLoadingEntry } = useQuery({
    queryKey: ['service-entry', entryId],
    queryFn: async () => {
      if (!entryId) return null;
      const res = await api.get(`/service-entries/${entryId}`);
      return res.data.data;
    },
    enabled: !!entryId,
  });

  // Fetch last entry of same type for prepopulation
  const { data: lastEntry } = useQuery({
    queryKey: ['last-service-entry', vehicleId, formData.serviceType],
    queryFn: async () => {
      if (!vehicleId || isEditMode) return null;
      const res = await api.get(`/service-entries?vehicleId=${vehicleId}&serviceType=${formData.serviceType}&limit=1`);
      return res.data.data?.[0] || null;
    },
    enabled: !!vehicleId && !isEditMode,
  });

  // Fetch vehicle details
  const { data: vehicleData, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      const res = await api.get(`/vehicles?page=1&limit=100`);
      return res.data.data?.find((v: any) => v._id === vehicleId);
    },
    enabled: !!vehicleId,
  });

  // Populate form with existing data (for edit) or last entry (for new)
  useEffect(() => {
    if (existingEntry) {
      setFormData({
        vehicleId: existingEntry.vehicleId?._id || existingEntry.vehicleId || '',
        serviceType: existingEntry.serviceType,
        serviceDate: existingEntry.serviceDate ? new Date(existingEntry.serviceDate).toISOString().split('T')[0] : defaultFormData.serviceDate,
        mileageAtService: existingEntry.mileageAtService || 0,
        data: existingEntry.data || {},
        notes: existingEntry.notes || '',
        cost: existingEntry.cost || 0,
      });
    } else if (lastEntry && !isEditMode) {
      // Prepopulate from last entry of same type
      setFormData(prev => ({
        ...prev,
        data: lastEntry.data || {},
        // Keep today's date and current mileage
      }));
    }
  }, [existingEntry, lastEntry, isEditMode]);

  // Prepopulate mileage from vehicle
  useEffect(() => {
    if (!isEditMode && vehicleData && vehicleData.mileage && formData.mileageAtService === 0) {
      setFormData(prev => ({ ...prev, mileageAtService: vehicleData.mileage }));
    }
  }, [vehicleData, isEditMode, formData.mileageAtService]);

  const createMutation = useMutation({
    mutationFn: async (data: ServiceEntryData) => {
      const res = await api.post('/service-entries', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-entries'] });
      navigate(`/service-entries?vehicleId=${vehicleId}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ServiceEntryData) => {
      const res = await api.put(`/service-entries/${entryId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-entries'] });
      queryClient.invalidateQueries({ queryKey: ['service-entry', entryId] });
      navigate(`/service-entries?vehicleId=${vehicleId}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const updateData = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  if ((isEditMode && isLoadingEntry) || isLoadingVehicle) {
    return <div className="p-6">Loading...</div>;
  }

  const NumberField = ({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );

  const TextField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );

  const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const renderTypeSpecificFields = () => {
    switch (formData.serviceType) {
      case 'oil_change':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Oil Change Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TextField
                label="Oil Brand"
                value={formData.data.oilBrand || ''}
                onChange={(v) => updateData('oilBrand', v)}
                placeholder="e.g., Mobil 1"
              />
              <TextField
                label="Oil Type"
                value={formData.data.oilType || ''}
                onChange={(v) => updateData('oilType', v)}
                placeholder="e.g., 5W-30 Synthetic"
              />
              <NumberField
                label="Next Change (months)"
                value={formData.data.changeIntervalMonths || 6}
                onChange={(v) => updateData('changeIntervalMonths', v)}
                min={1}
                max={24}
              />
              <NumberField
                label="Next Change (miles)"
                value={formData.data.nextChangeMileage || 0}
                onChange={(v) => updateData('nextChangeMileage', v)}
              />
              <SelectField
                label="Oil Level"
                value={formData.data.level || 'full'}
                onChange={(v) => updateData('level', v)}
                options={[
                  { value: 'full', label: 'Full' },
                  { value: 'good', label: 'Good' },
                  { value: 'low', label: 'Low' },
                  { value: 'critical', label: 'Critical' },
                ]}
              />
              <SelectField
                label="Oil Condition"
                value={formData.data.condition || 'clean'}
                onChange={(v) => updateData('condition', v)}
                options={[
                  { value: 'clean', label: 'Clean' },
                  { value: 'good', label: 'Good' },
                  { value: 'dirty', label: 'Dirty' },
                  { value: 'very_dirty', label: 'Very Dirty' },
                ]}
              />
            </CardContent>
          </Card>
        );

      case 'brake_service':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Brake Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberField label="Front Left Pad %" value={formData.data.frontLeftPad || 100} onChange={(v) => updateData('frontLeftPad', v)} min={0} max={100} />
                <NumberField label="Front Right Pad %" value={formData.data.frontRightPad || 100} onChange={(v) => updateData('frontRightPad', v)} min={0} max={100} />
                <NumberField label="Rear Left Pad %" value={formData.data.rearLeftPad || 100} onChange={(v) => updateData('rearLeftPad', v)} min={0} max={100} />
                <NumberField label="Rear Right Pad %" value={formData.data.rearRightPad || 100} onChange={(v) => updateData('rearRightPad', v)} min={0} max={100} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SelectField
                  label="Brake Fluid Level"
                  value={formData.data.fluidLevel || 'full'}
                  onChange={(v) => updateData('fluidLevel', v)}
                  options={[
                    { value: 'full', label: 'Full' },
                    { value: 'good', label: 'Good' },
                    { value: 'low', label: 'Low' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                />
                <SelectField
                  label="Fluid Condition"
                  value={formData.data.fluidCondition || 'clean'}
                  onChange={(v) => updateData('fluidCondition', v)}
                  options={[
                    { value: 'clean', label: 'Clean' },
                    { value: 'good', label: 'Good' },
                    { value: 'dirty', label: 'Dirty' },
                    { value: 'contaminated', label: 'Contaminated' },
                  ]}
                />
                <label className="flex items-center gap-2 cursor-pointer pt-6">
                  <input
                    type="checkbox"
                    checked={formData.data.fluidChanged || false}
                    onChange={(e) => updateData('fluidChanged', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Fluid Changed</span>
                </label>
              </div>
            </CardContent>
          </Card>
        );

      case 'tire_service':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tire Service Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['frontLeft', 'frontRight', 'rearLeft', 'rearRight'].map((position) => (
                  <div key={position} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 capitalize">{position.replace(/([A-Z])/g, ' $1')}</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <NumberField
                        label="Tread (mm)"
                        value={formData.data[`${position}Tread`] || 8}
                        onChange={(v) => updateData(`${position}Tread`, v)}
                        min={0}
                        max={12}
                        step={0.5}
                      />
                      <NumberField
                        label="Pressure (PSI)"
                        value={formData.data[`${position}Pressure`] || 32}
                        onChange={(v) => updateData(`${position}Pressure`, v)}
                        min={0}
                        max={50}
                      />
                      <SelectField
                        label="Condition"
                        value={formData.data[`${position}Condition`] || 'good'}
                        onChange={(v) => updateData(`${position}Condition`, v)}
                        options={[
                          { value: 'good', label: 'Good' },
                          { value: 'fair', label: 'Fair' },
                          { value: 'worn', label: 'Worn' },
                          { value: 'replace', label: 'Replace' },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.data.rotated || false}
                    onChange={(e) => updateData('rotated', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Tires Rotated</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.data.balanced || false}
                    onChange={(e) => updateData('balanced', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Tires Balanced</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.data.aligned || false}
                    onChange={(e) => updateData('aligned', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Wheel Alignment</span>
                </label>
              </div>
            </CardContent>
          </Card>
        );

      case 'battery_service':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Battery Service Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberField
                label="Voltage"
                value={formData.data.voltage || 12.6}
                onChange={(v) => updateData('voltage', v)}
                min={0}
                max={15}
                step={0.1}
              />
              <SelectField
                label="Health"
                value={formData.data.health || 'good'}
                onChange={(v) => updateData('health', v)}
                options={[
                  { value: 'good', label: 'Good' },
                  { value: 'fair', label: 'Fair' },
                  { value: 'weak', label: 'Weak' },
                  { value: 'replace', label: 'Replace' },
                ]}
              />
              <TextField
                label="Brand"
                value={formData.data.brand || ''}
                onChange={(v) => updateData('brand', v)}
                placeholder="e.g., Interstate"
              />
              <label className="flex items-center gap-2 cursor-pointer pt-6">
                <input
                  type="checkbox"
                  checked={formData.data.replaced || false}
                  onChange={(e) => updateData('replaced', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Battery Replaced</span>
              </label>
            </CardContent>
          </Card>
        );

      case 'filter_service':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Filter Service Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Air Filter</h4>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Condition"
                    value={formData.data.airFilterCondition || 'good'}
                    onChange={(v) => updateData('airFilterCondition', v)}
                    options={[
                      { value: 'clean', label: 'Clean' },
                      { value: 'good', label: 'Good' },
                      { value: 'dirty', label: 'Dirty' },
                      { value: 'replace', label: 'Replace' },
                    ]}
                  />
                  <label className="flex items-center gap-2 cursor-pointer pt-6">
                    <input
                      type="checkbox"
                      checked={formData.data.airFilterReplaced || false}
                      onChange={(e) => updateData('airFilterReplaced', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Replaced</span>
                  </label>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Cabin Air Filter</h4>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Condition"
                    value={formData.data.cabinFilterCondition || 'good'}
                    onChange={(v) => updateData('cabinFilterCondition', v)}
                    options={[
                      { value: 'clean', label: 'Clean' },
                      { value: 'good', label: 'Good' },
                      { value: 'dirty', label: 'Dirty' },
                      { value: 'replace', label: 'Replace' },
                    ]}
                  />
                  <label className="flex items-center gap-2 cursor-pointer pt-6">
                    <input
                      type="checkbox"
                      checked={formData.data.cabinFilterReplaced || false}
                      onChange={(e) => updateData('cabinFilterReplaced', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Replaced</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">Add any relevant details in the notes section below.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <>
      <Header
        title={isEditMode ? 'Edit Service Entry' : 'New Service Entry'}
        subtitle={vehicleData ? `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}` : 'Record a service'}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button leftIcon={<Save className="h-4 w-4" />} onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SelectField
              label="Service Type"
              value={formData.serviceType}
              onChange={(v) => setFormData(prev => ({ ...prev, serviceType: v as ServiceType, data: {} }))}
              options={SERVICE_TYPES}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label>
              <input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <NumberField
              label="Mileage"
              value={formData.mileageAtService}
              onChange={(v) => setFormData(prev => ({ ...prev, mileageAtService: v }))}
              min={0}
            />
            <NumberField
              label="Cost ($)"
              value={formData.cost}
              onChange={(v) => setFormData(prev => ({ ...prev, cost: v }))}
              min={0}
              step={0.01}
            />
          </CardContent>
        </Card>

        {/* Type-specific fields */}
        {renderTypeSpecificFields()}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this service..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </CardContent>
        </Card>
      </form>
    </>
  );
}
