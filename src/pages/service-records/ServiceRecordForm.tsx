import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Car } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import api from '../../api/client';

type LevelOption = 'full' | 'good' | 'low' | 'critical' | 'not_checked';
type ConditionOption = 'clean' | 'good' | 'dirty' | 'very_dirty' | 'contaminated' | 'burnt' | 'not_checked';
type TireCondition = 'good' | 'fair' | 'worn' | 'replace' | 'not_checked';
type BatteryHealth = 'good' | 'fair' | 'weak' | 'replace' | 'not_checked';
type FilterCondition = 'clean' | 'good' | 'dirty' | 'replace' | 'not_checked';
type WiperCondition = 'good' | 'fair' | 'streaking' | 'replace' | 'not_checked' | 'n/a';
type LightStatus = 'working' | 'dim' | 'out' | 'not_checked';
type OverallHealth = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

interface ServiceRecordData {
  vehicleId: string;
  mileageAtService: number;
  serviceDate: string;
  oil: { level: LevelOption; condition: ConditionOption; changed: boolean; nextChangeMileage?: number };
  brakeFluid: { level: LevelOption; condition: ConditionOption; changed: boolean };
  transmissionFluid: { level: LevelOption; condition: ConditionOption; changed: boolean };
  coolant: { level: LevelOption; condition: ConditionOption; changed: boolean };
  powerSteeringFluid: { level: LevelOption; changed: boolean };
  brakePads: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  tires: {
    frontLeft: { treadDepth: number; pressure: number; condition: TireCondition };
    frontRight: { treadDepth: number; pressure: number; condition: TireCondition };
    rearLeft: { treadDepth: number; pressure: number; condition: TireCondition };
    rearRight: { treadDepth: number; pressure: number; condition: TireCondition };
  };
  battery: { voltage: number; health: BatteryHealth; replaced: boolean };
  airFilter: { condition: FilterCondition; replaced: boolean };
  cabinAirFilter: { condition: FilterCondition; replaced: boolean };
  wipers: { front: WiperCondition; rear: WiperCondition; replaced: boolean };
  lights: { headlights: LightStatus; taillights: LightStatus; brakeLights: LightStatus; turnSignals: LightStatus };
  overallHealth: OverallHealth;
  notes: string;
  recommendations: string[];
  servicesPerformed: string[];
}

const defaultFormData: ServiceRecordData = {
  vehicleId: '',
  mileageAtService: 0,
  serviceDate: new Date().toISOString().split('T')[0],
  oil: { level: 'not_checked', condition: 'not_checked', changed: false },
  brakeFluid: { level: 'not_checked', condition: 'not_checked', changed: false },
  transmissionFluid: { level: 'not_checked', condition: 'not_checked', changed: false },
  coolant: { level: 'not_checked', condition: 'not_checked', changed: false },
  powerSteeringFluid: { level: 'not_checked', changed: false },
  brakePads: { frontLeft: 100, frontRight: 100, rearLeft: 100, rearRight: 100 },
  tires: {
    frontLeft: { treadDepth: 8, pressure: 32, condition: 'not_checked' },
    frontRight: { treadDepth: 8, pressure: 32, condition: 'not_checked' },
    rearLeft: { treadDepth: 8, pressure: 32, condition: 'not_checked' },
    rearRight: { treadDepth: 8, pressure: 32, condition: 'not_checked' },
  },
  battery: { voltage: 12.6, health: 'not_checked', replaced: false },
  airFilter: { condition: 'not_checked', replaced: false },
  cabinAirFilter: { condition: 'not_checked', replaced: false },
  wipers: { front: 'not_checked', rear: 'not_checked', replaced: false },
  lights: { headlights: 'not_checked', taillights: 'not_checked', brakeLights: 'not_checked', turnSignals: 'not_checked' },
  overallHealth: 'good',
  notes: '',
  recommendations: [],
  servicesPerformed: [],
};

const levelOptions: { value: LevelOption; label: string }[] = [
  { value: 'not_checked', label: 'Not Checked' },
  { value: 'full', label: 'Full' },
  { value: 'good', label: 'Good' },
  { value: 'low', label: 'Low' },
  { value: 'critical', label: 'Critical' },
];

const conditionOptions: { value: ConditionOption; label: string }[] = [
  { value: 'not_checked', label: 'Not Checked' },
  { value: 'clean', label: 'Clean' },
  { value: 'good', label: 'Good' },
  { value: 'dirty', label: 'Dirty' },
  { value: 'very_dirty', label: 'Very Dirty' },
  { value: 'contaminated', label: 'Contaminated' },
  { value: 'burnt', label: 'Burnt' },
];

const batteryHealthOptions: { value: BatteryHealth; label: string }[] = [
  { value: 'not_checked', label: 'Not Checked' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'weak', label: 'Weak' },
  { value: 'replace', label: 'Replace' },
];

const filterConditionOptions: { value: FilterCondition; label: string }[] = [
  { value: 'not_checked', label: 'Not Checked' },
  { value: 'clean', label: 'Clean' },
  { value: 'good', label: 'Good' },
  { value: 'dirty', label: 'Dirty' },
  { value: 'replace', label: 'Replace' },
];

const wiperConditionOptions: { value: WiperCondition; label: string }[] = [
  { value: 'not_checked', label: 'Not Checked' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'streaking', label: 'Streaking' },
  { value: 'replace', label: 'Replace' },
  { value: 'n/a', label: 'N/A' },
];

const lightStatusOptions: { value: LightStatus; label: string }[] = [
  { value: 'not_checked', label: 'Not Checked' },
  { value: 'working', label: 'Working' },
  { value: 'dim', label: 'Dim' },
  { value: 'out', label: 'Out' },
];

const overallHealthOptions: { value: OverallHealth; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'critical', label: 'Critical' },
];

export function ServiceRecordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const recordId = searchParams.get('recordId');
  const isEditMode = !!recordId;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ServiceRecordData>({
    ...defaultFormData,
    vehicleId: vehicleId || '',
  });
  const [newRecommendation, setNewRecommendation] = useState('');
  const [newService, setNewService] = useState('');

  // Fetch existing service record for editing
  const { data: existingRecord, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['service-record', recordId],
    queryFn: async () => {
      if (!recordId) return null;
      const res = await api.get(`/service-records/${recordId}`);
      return res.data;
    },
    enabled: !!recordId,
  });

  // Populate form with existing data when editing
  useEffect(() => {
    if (existingRecord) {
      setFormData({
        vehicleId: existingRecord.vehicleId?._id || existingRecord.vehicleId || '',
        mileageAtService: existingRecord.mileageAtService || 0,
        serviceDate: existingRecord.serviceDate ? new Date(existingRecord.serviceDate).toISOString().split('T')[0] : defaultFormData.serviceDate,
        oil: existingRecord.oil || defaultFormData.oil,
        brakeFluid: existingRecord.brakeFluid || defaultFormData.brakeFluid,
        transmissionFluid: existingRecord.transmissionFluid || defaultFormData.transmissionFluid,
        coolant: existingRecord.coolant || defaultFormData.coolant,
        powerSteeringFluid: existingRecord.powerSteeringFluid || defaultFormData.powerSteeringFluid,
        brakePads: existingRecord.brakePads || defaultFormData.brakePads,
        tires: existingRecord.tires || defaultFormData.tires,
        battery: existingRecord.battery || defaultFormData.battery,
        airFilter: existingRecord.airFilter || defaultFormData.airFilter,
        cabinAirFilter: existingRecord.cabinAirFilter || defaultFormData.cabinAirFilter,
        wipers: existingRecord.wipers || defaultFormData.wipers,
        lights: existingRecord.lights || defaultFormData.lights,
        overallHealth: existingRecord.overallHealth || defaultFormData.overallHealth,
        notes: existingRecord.notes || '',
        recommendations: existingRecord.recommendations || [],
        servicesPerformed: existingRecord.servicesPerformed || [],
      });
    }
  }, [existingRecord]);

  // Fetch vehicle details
  const { data: vehicleData } = useQuery({
    queryKey: ['vehicle', vehicleId || existingRecord?.vehicleId],
    queryFn: async () => {
      const vId = vehicleId || existingRecord?.vehicleId?._id || existingRecord?.vehicleId;
      if (!vId) return null;
      const res = await api.get(`/vehicles?page=1&limit=100`);
      return res.data.data?.find((v: any) => v._id === vId);
    },
    enabled: !!(vehicleId || existingRecord?.vehicleId),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ServiceRecordData) => {
      const res = await api.post('/service-records', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-records'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      navigate('/vehicles');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ServiceRecordData) => {
      const res = await api.put(`/service-records/${recordId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-records'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['service-record', recordId] });
      navigate('/vehicles');
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

  if (isEditMode && isLoadingRecord) {
    return <div className="p-6">Loading...</div>;
  }

  const addRecommendation = () => {
    if (newRecommendation.trim()) {
      setFormData(prev => ({
        ...prev,
        recommendations: [...prev.recommendations, newRecommendation.trim()],
      }));
      setNewRecommendation('');
    }
  };

  const removeRecommendation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index),
    }));
  };

  const addService = () => {
    if (newService.trim()) {
      setFormData(prev => ({
        ...prev,
        servicesPerformed: [...prev.servicesPerformed, newService.trim()],
      }));
      setNewService('');
    }
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      servicesPerformed: prev.servicesPerformed.filter((_, i) => i !== index),
    }));
  };

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

  const CheckboxField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  return (
    <>
      <Header
        title={isEditMode ? "Edit Service Record" : "New Service Record"}
        subtitle={vehicleData ? `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}` : 'Record maintenance data'}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button leftIcon={<Save className="h-4 w-4" />} onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : (isEditMode ? 'Update Record' : 'Save Record')}
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
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              label="Mileage at Service"
              value={formData.mileageAtService}
              onChange={(v) => setFormData(prev => ({ ...prev, mileageAtService: v }))}
              min={0}
            />
            <SelectField
              label="Overall Health"
              value={formData.overallHealth}
              onChange={(v) => setFormData(prev => ({ ...prev, overallHealth: v as OverallHealth }))}
              options={overallHealthOptions}
            />
          </CardContent>
        </Card>

        {/* Fluids */}
        <Card>
          <CardHeader>
            <CardTitle>Fluids</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Oil */}
            <div className="border-b pb-4">
              <h4 className="font-medium mb-3">Engine Oil</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SelectField label="Level" value={formData.oil.level} onChange={(v) => setFormData(prev => ({ ...prev, oil: { ...prev.oil, level: v as LevelOption } }))} options={levelOptions} />
                <SelectField label="Condition" value={formData.oil.condition} onChange={(v) => setFormData(prev => ({ ...prev, oil: { ...prev.oil, condition: v as ConditionOption } }))} options={conditionOptions} />
                <NumberField label="Next Change (mi)" value={formData.oil.nextChangeMileage || 0} onChange={(v) => setFormData(prev => ({ ...prev, oil: { ...prev.oil, nextChangeMileage: v } }))} />
                <div className="flex items-end">
                  <CheckboxField label="Oil Changed" checked={formData.oil.changed} onChange={(v) => setFormData(prev => ({ ...prev, oil: { ...prev.oil, changed: v } }))} />
                </div>
              </div>
            </div>

            {/* Brake Fluid */}
            <div className="border-b pb-4">
              <h4 className="font-medium mb-3">Brake Fluid</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SelectField label="Level" value={formData.brakeFluid.level} onChange={(v) => setFormData(prev => ({ ...prev, brakeFluid: { ...prev.brakeFluid, level: v as LevelOption } }))} options={levelOptions} />
                <SelectField label="Condition" value={formData.brakeFluid.condition} onChange={(v) => setFormData(prev => ({ ...prev, brakeFluid: { ...prev.brakeFluid, condition: v as ConditionOption } }))} options={conditionOptions} />
                <div className="flex items-end">
                  <CheckboxField label="Fluid Changed" checked={formData.brakeFluid.changed} onChange={(v) => setFormData(prev => ({ ...prev, brakeFluid: { ...prev.brakeFluid, changed: v } }))} />
                </div>
              </div>
            </div>

            {/* Transmission Fluid */}
            <div className="border-b pb-4">
              <h4 className="font-medium mb-3">Transmission Fluid</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SelectField label="Level" value={formData.transmissionFluid.level} onChange={(v) => setFormData(prev => ({ ...prev, transmissionFluid: { ...prev.transmissionFluid, level: v as LevelOption } }))} options={levelOptions} />
                <SelectField label="Condition" value={formData.transmissionFluid.condition} onChange={(v) => setFormData(prev => ({ ...prev, transmissionFluid: { ...prev.transmissionFluid, condition: v as ConditionOption } }))} options={conditionOptions} />
                <div className="flex items-end">
                  <CheckboxField label="Fluid Changed" checked={formData.transmissionFluid.changed} onChange={(v) => setFormData(prev => ({ ...prev, transmissionFluid: { ...prev.transmissionFluid, changed: v } }))} />
                </div>
              </div>
            </div>

            {/* Coolant */}
            <div className="border-b pb-4">
              <h4 className="font-medium mb-3">Coolant</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SelectField label="Level" value={formData.coolant.level} onChange={(v) => setFormData(prev => ({ ...prev, coolant: { ...prev.coolant, level: v as LevelOption } }))} options={levelOptions} />
                <SelectField label="Condition" value={formData.coolant.condition} onChange={(v) => setFormData(prev => ({ ...prev, coolant: { ...prev.coolant, condition: v as ConditionOption } }))} options={conditionOptions} />
                <div className="flex items-end">
                  <CheckboxField label="Coolant Changed" checked={formData.coolant.changed} onChange={(v) => setFormData(prev => ({ ...prev, coolant: { ...prev.coolant, changed: v } }))} />
                </div>
              </div>
            </div>

            {/* Power Steering */}
            <div>
              <h4 className="font-medium mb-3">Power Steering Fluid</h4>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Level" value={formData.powerSteeringFluid.level} onChange={(v) => setFormData(prev => ({ ...prev, powerSteeringFluid: { ...prev.powerSteeringFluid, level: v as LevelOption } }))} options={levelOptions} />
                <div className="flex items-end">
                  <CheckboxField label="Fluid Changed" checked={formData.powerSteeringFluid.changed} onChange={(v) => setFormData(prev => ({ ...prev, powerSteeringFluid: { ...prev.powerSteeringFluid, changed: v } }))} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brake Pads */}
        <Card>
          <CardHeader>
            <CardTitle>Brake Pads (% Remaining)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumberField label="Front Left" value={formData.brakePads.frontLeft} onChange={(v) => setFormData(prev => ({ ...prev, brakePads: { ...prev.brakePads, frontLeft: v } }))} min={0} max={100} />
            <NumberField label="Front Right" value={formData.brakePads.frontRight} onChange={(v) => setFormData(prev => ({ ...prev, brakePads: { ...prev.brakePads, frontRight: v } }))} min={0} max={100} />
            <NumberField label="Rear Left" value={formData.brakePads.rearLeft} onChange={(v) => setFormData(prev => ({ ...prev, brakePads: { ...prev.brakePads, rearLeft: v } }))} min={0} max={100} />
            <NumberField label="Rear Right" value={formData.brakePads.rearRight} onChange={(v) => setFormData(prev => ({ ...prev, brakePads: { ...prev.brakePads, rearRight: v } }))} min={0} max={100} />
          </CardContent>
        </Card>

        {/* Battery */}
        <Card>
          <CardHeader>
            <CardTitle>Battery</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <NumberField label="Voltage" value={formData.battery.voltage} onChange={(v) => setFormData(prev => ({ ...prev, battery: { ...prev.battery, voltage: v } }))} min={0} max={15} step={0.1} />
            <SelectField label="Health" value={formData.battery.health} onChange={(v) => setFormData(prev => ({ ...prev, battery: { ...prev.battery, health: v as BatteryHealth } }))} options={batteryHealthOptions} />
            <div className="flex items-end">
              <CheckboxField label="Battery Replaced" checked={formData.battery.replaced} onChange={(v) => setFormData(prev => ({ ...prev, battery: { ...prev.battery, replaced: v } }))} />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Air Filter</h4>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Condition" value={formData.airFilter.condition} onChange={(v) => setFormData(prev => ({ ...prev, airFilter: { ...prev.airFilter, condition: v as FilterCondition } }))} options={filterConditionOptions} />
                <div className="flex items-end">
                  <CheckboxField label="Replaced" checked={formData.airFilter.replaced} onChange={(v) => setFormData(prev => ({ ...prev, airFilter: { ...prev.airFilter, replaced: v } }))} />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Cabin Air Filter</h4>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Condition" value={formData.cabinAirFilter.condition} onChange={(v) => setFormData(prev => ({ ...prev, cabinAirFilter: { ...prev.cabinAirFilter, condition: v as FilterCondition } }))} options={filterConditionOptions} />
                <div className="flex items-end">
                  <CheckboxField label="Replaced" checked={formData.cabinAirFilter.replaced} onChange={(v) => setFormData(prev => ({ ...prev, cabinAirFilter: { ...prev.cabinAirFilter, replaced: v } }))} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wipers */}
        <Card>
          <CardHeader>
            <CardTitle>Wipers</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SelectField label="Front" value={formData.wipers.front} onChange={(v) => setFormData(prev => ({ ...prev, wipers: { ...prev.wipers, front: v as WiperCondition } }))} options={wiperConditionOptions} />
            <SelectField label="Rear" value={formData.wipers.rear} onChange={(v) => setFormData(prev => ({ ...prev, wipers: { ...prev.wipers, rear: v as WiperCondition } }))} options={wiperConditionOptions} />
            <div className="flex items-end">
              <CheckboxField label="Wipers Replaced" checked={formData.wipers.replaced} onChange={(v) => setFormData(prev => ({ ...prev, wipers: { ...prev.wipers, replaced: v } }))} />
            </div>
          </CardContent>
        </Card>

        {/* Lights */}
        <Card>
          <CardHeader>
            <CardTitle>Lights</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SelectField label="Headlights" value={formData.lights.headlights} onChange={(v) => setFormData(prev => ({ ...prev, lights: { ...prev.lights, headlights: v as LightStatus } }))} options={lightStatusOptions} />
            <SelectField label="Taillights" value={formData.lights.taillights} onChange={(v) => setFormData(prev => ({ ...prev, lights: { ...prev.lights, taillights: v as LightStatus } }))} options={lightStatusOptions.filter(o => o.value !== 'dim')} />
            <SelectField label="Brake Lights" value={formData.lights.brakeLights} onChange={(v) => setFormData(prev => ({ ...prev, lights: { ...prev.lights, brakeLights: v as LightStatus } }))} options={lightStatusOptions.filter(o => o.value !== 'dim')} />
            <SelectField label="Turn Signals" value={formData.lights.turnSignals} onChange={(v) => setFormData(prev => ({ ...prev, lights: { ...prev.lights, turnSignals: v as LightStatus } }))} options={lightStatusOptions.filter(o => o.value !== 'dim')} />
          </CardContent>
        </Card>

        {/* Services Performed */}
        <Card>
          <CardHeader>
            <CardTitle>Services Performed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="e.g., Oil change, Tire rotation..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
              />
              <Button type="button" onClick={addService}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.servicesPerformed.map((service, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {service}
                  <button type="button" onClick={() => removeService(i)} className="hover:text-green-600">&times;</button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newRecommendation}
                onChange={(e) => setNewRecommendation(e.target.value)}
                placeholder="e.g., Replace brake pads within 5000 miles..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecommendation())}
              />
              <Button type="button" onClick={addRecommendation}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.recommendations.map((rec, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  {rec}
                  <button type="button" onClick={() => removeRecommendation(i)} className="hover:text-yellow-600">&times;</button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about the service..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </CardContent>
        </Card>
      </form>
    </>
  );
}
