import { useState } from 'react';
import {
  AlertCircle,
  Gauge,
  Volume2,
  Settings,
  CircleDot,
  Zap,
  Navigation,
  Snowflake,
  Droplet,
  Cloud,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';

// Types
export type VisitType =
  | 'diagnostic'
  | 'maintenance'
  | 'repair_followup'
  | 'pre_purchase'
  | 'state_inspection'
  | 'performance'
  | 'electrical'
  | 'noise_vibration'
  | 'other';

export interface ConsultationIntakeData {
  visitType: VisitType;
  primaryConcern: string;
  selectedSymptoms: string[];
  warningLights: string[];
  conditions: string[];
  onsetType: 'sudden' | 'gradual' | 'intermittent' | 'unknown';
  frequency: 'always' | 'often' | 'sometimes' | 'rarely' | 'once';
  recentAccident: boolean;
  recentFuelUp: boolean;
  recentRepairs: string;
  customerDescription: string;
}

interface Props {
  onSubmit: (data: ConsultationIntakeData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  vehicleInfo: {
    year: number;
    make: string;
    model: string;
    licensePlate?: string;
  };
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

const VISIT_TYPES: { value: VisitType; label: string; description: string }[] = [
  { value: 'diagnostic', label: 'Diagnostic', description: 'Check engine light or unknown issue' },
  { value: 'maintenance', label: 'Maintenance', description: 'Oil change, scheduled service' },
  { value: 'repair_followup', label: 'Repair Follow-up', description: 'Verify previous repair' },
  { value: 'pre_purchase', label: 'Pre-Purchase', description: 'Buying a used vehicle' },
  { value: 'state_inspection', label: 'State Inspection', description: 'Annual safety/emissions' },
  { value: 'noise_vibration', label: 'Noise/Vibration', description: 'NVH concerns' },
  { value: 'electrical', label: 'Electrical', description: 'Electrical system issues' },
  { value: 'performance', label: 'Performance', description: 'Tuning or modifications' },
];

const WARNING_LIGHTS = [
  { id: 'check_engine', name: 'Check Engine', color: 'yellow' },
  { id: 'oil_pressure', name: 'Oil Pressure', color: 'red' },
  { id: 'battery', name: 'Battery', color: 'red' },
  { id: 'temperature', name: 'Temperature', color: 'red' },
  { id: 'abs', name: 'ABS', color: 'yellow' },
  { id: 'airbag', name: 'Airbag/SRS', color: 'red' },
  { id: 'traction', name: 'Traction', color: 'yellow' },
  { id: 'tpms', name: 'Tire Pressure', color: 'yellow' },
  { id: 'brake', name: 'Brake', color: 'red' },
  { id: 'transmission', name: 'Transmission', color: 'yellow' },
  { id: 'power_steering', name: 'Power Steering', color: 'yellow' },
  { id: 'service', name: 'Service Required', color: 'yellow' },
];

const SYMPTOM_CATEGORIES = [
  {
    id: 'engine',
    name: 'Engine',
    icon: Gauge,
    symptoms: [
      { id: 'eng_rough_idle', label: 'Rough idle' },
      { id: 'eng_stalling', label: 'Stalling' },
      { id: 'eng_hard_start', label: 'Hard to start' },
      { id: 'eng_no_start', label: 'No start' },
      { id: 'eng_misfire', label: 'Misfiring' },
      { id: 'eng_power_loss', label: 'Loss of power' },
      { id: 'eng_surge', label: 'Surging' },
      { id: 'eng_overheating', label: 'Overheating' },
    ],
  },
  {
    id: 'noise',
    name: 'Noise',
    icon: Volume2,
    symptoms: [
      { id: 'noise_knock', label: 'Knocking' },
      { id: 'noise_tick', label: 'Ticking' },
      { id: 'noise_squeal', label: 'Squealing' },
      { id: 'noise_grind', label: 'Grinding' },
      { id: 'noise_whine', label: 'Whining' },
      { id: 'noise_rattle', label: 'Rattling' },
      { id: 'noise_clunk', label: 'Clunking' },
      { id: 'noise_hum', label: 'Humming' },
    ],
  },
  {
    id: 'transmission',
    name: 'Transmission',
    icon: Settings,
    symptoms: [
      { id: 'trans_slip', label: 'Slipping' },
      { id: 'trans_hard_shift', label: 'Hard shifting' },
      { id: 'trans_delay', label: 'Delayed engagement' },
      { id: 'trans_no_reverse', label: 'No reverse' },
      { id: 'trans_shudder', label: 'Shuddering' },
    ],
  },
  {
    id: 'brakes',
    name: 'Brakes',
    icon: CircleDot,
    symptoms: [
      { id: 'brake_squeak', label: 'Squeaking' },
      { id: 'brake_grind', label: 'Grinding' },
      { id: 'brake_soft', label: 'Soft pedal' },
      { id: 'brake_pull', label: 'Pulling' },
      { id: 'brake_vibration', label: 'Vibration' },
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: Zap,
    symptoms: [
      { id: 'elec_dead_battery', label: 'Dead battery' },
      { id: 'elec_no_charge', label: 'Not charging' },
      { id: 'elec_lights_dim', label: 'Dim lights' },
      { id: 'elec_lights_flicker', label: 'Flickering' },
      { id: 'elec_windows', label: 'Power windows' },
    ],
  },
  {
    id: 'steering',
    name: 'Steering',
    icon: Navigation,
    symptoms: [
      { id: 'steer_pull', label: 'Pulling' },
      { id: 'steer_vibration', label: 'Vibration' },
      { id: 'steer_heavy', label: 'Heavy steering' },
      { id: 'steer_noise', label: 'Noise when turning' },
      { id: 'susp_bounce', label: 'Excessive bounce' },
    ],
  },
  {
    id: 'hvac',
    name: 'HVAC',
    icon: Snowflake,
    symptoms: [
      { id: 'hvac_no_cold', label: 'No cold air' },
      { id: 'hvac_no_heat', label: 'No heat' },
      { id: 'hvac_weak', label: 'Weak airflow' },
      { id: 'hvac_smell', label: 'Bad smell' },
    ],
  },
  {
    id: 'fluids',
    name: 'Fluids/Leaks',
    icon: Droplet,
    symptoms: [
      { id: 'fluid_oil_leak', label: 'Oil leak' },
      { id: 'fluid_coolant_leak', label: 'Coolant leak' },
      { id: 'fluid_trans_leak', label: 'Transmission leak' },
      { id: 'fluid_burning', label: 'Burning smell' },
    ],
  },
  {
    id: 'exhaust',
    name: 'Exhaust',
    icon: Cloud,
    symptoms: [
      { id: 'exh_smoke_black', label: 'Black smoke' },
      { id: 'exh_smoke_white', label: 'White smoke' },
      { id: 'exh_smoke_blue', label: 'Blue smoke' },
      { id: 'exh_loud', label: 'Loud exhaust' },
    ],
  },
];

const CONDITIONS = [
  { key: 'cold_start', label: 'Cold Start' },
  { key: 'warm_engine', label: 'Warm Engine' },
  { key: 'idle', label: 'At Idle' },
  { key: 'acceleration', label: 'Accelerating' },
  { key: 'deceleration', label: 'Decelerating' },
  { key: 'cruising', label: 'Cruising' },
  { key: 'turning', label: 'Turning' },
  { key: 'braking', label: 'Braking' },
  { key: 'under_load', label: 'Under Load' },
  { key: 'ac_on', label: 'A/C On' },
];

export function ConsultationIntakeForm({
  onSubmit,
  onCancel,
  isSubmitting,
  vehicleInfo,
  customerInfo,
}: Props) {
  const [step, setStep] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState<ConsultationIntakeData>({
    visitType: 'diagnostic',
    primaryConcern: '',
    selectedSymptoms: [],
    warningLights: [],
    conditions: [],
    onsetType: 'unknown',
    frequency: 'sometimes',
    recentAccident: false,
    recentFuelUp: false,
    recentRepairs: '',
    customerDescription: '',
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleSymptom = (symptomId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSymptoms: prev.selectedSymptoms.includes(symptomId)
        ? prev.selectedSymptoms.filter((s) => s !== symptomId)
        : [...prev.selectedSymptoms, symptomId],
    }));
  };

  const toggleWarningLight = (lightId: string) => {
    setFormData((prev) => ({
      ...prev,
      warningLights: prev.warningLights.includes(lightId)
        ? prev.warningLights.filter((l) => l !== lightId)
        : [...prev.warningLights, lightId],
    }));
  };

  const toggleCondition = (conditionKey: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(conditionKey)
        ? prev.conditions.filter((c) => c !== conditionKey)
        : [...prev.conditions, conditionKey],
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const totalSteps = 3;

  return (
    <div className="space-y-6">
      {/* Header with vehicle/customer info */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <p className="text-sm text-gray-500">Vehicle</p>
          <p className="font-medium text-gray-900">
            {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
          </p>
          {vehicleInfo.licensePlate && (
            <p className="text-sm text-gray-500 font-mono">{vehicleInfo.licensePlate}</p>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">Customer</p>
          <p className="font-medium text-gray-900">
            {customerInfo.firstName} {customerInfo.lastName}
          </p>
          <p className="text-sm text-gray-500">{customerInfo.phone}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s === step
                ? 'bg-primary-600 text-white'
                : s < step
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {s < step ? <Check className="h-4 w-4" /> : s}
          </div>
        ))}
      </div>

      {/* Step 1: Visit Type & Primary Concern */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Visit Type & Chief Complaint</h3>

          {/* Visit Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What type of visit is this?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {VISIT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, visitType: type.value })}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formData.visitType === type.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Concern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What brings the customer in today?
            </label>
            <textarea
              value={formData.primaryConcern}
              onChange={(e) => setFormData({ ...formData, primaryConcern: e.target.value })}
              placeholder="Describe the main issue in the customer's own words..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Warning Lights */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warning Lights On Dashboard
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {WARNING_LIGHTS.map((light) => (
                <button
                  key={light.id}
                  type="button"
                  onClick={() => toggleWarningLight(light.id)}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    formData.warningLights.includes(light.id)
                      ? light.color === 'red'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <AlertCircle
                    className={`h-5 w-5 mx-auto mb-1 ${
                      formData.warningLights.includes(light.id)
                        ? light.color === 'red'
                          ? 'text-red-500'
                          : 'text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                  <div className="text-[10px] leading-tight">{light.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Symptoms */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Symptoms</h3>
          <p className="text-sm text-gray-500">Select all symptoms that apply</p>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {SYMPTOM_CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategories.includes(category.id);
              const selectedCount = category.symptoms.filter((s) =>
                formData.selectedSymptoms.includes(s.id)
              ).length;

              return (
                <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 text-primary-600" />
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      {selectedCount > 0 && (
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {category.symptoms.map((symptom) => (
                        <button
                          key={symptom.id}
                          type="button"
                          onClick={() => toggleSymptom(symptom.id)}
                          className={`px-3 py-2 rounded-lg border text-left text-sm transition-colors ${
                            formData.selectedSymptoms.includes(symptom.id)
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {symptom.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Context & History */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Context & History</h3>

          {/* When does it happen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When does the issue occur?
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {CONDITIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCondition(key)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    formData.conditions.includes(key)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Onset & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How did it start?</label>
              <div className="grid grid-cols-2 gap-2">
                {(['sudden', 'gradual', 'intermittent', 'unknown'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, onsetType: value })}
                    className={`px-3 py-2 rounded-lg border text-sm capitalize transition-colors ${
                      formData.onsetType === value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How often?</label>
              <div className="grid grid-cols-3 gap-2">
                {(['always', 'often', 'sometimes', 'rarely', 'once'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, frequency: value })}
                    className={`px-3 py-2 rounded-lg border text-sm capitalize transition-colors ${
                      formData.frequency === value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recent History</label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.recentAccident}
                    onChange={(e) => setFormData({ ...formData, recentAccident: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Recent accident or collision</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.recentFuelUp}
                    onChange={(e) => setFormData({ ...formData, recentFuelUp: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Issue started after fill-up</span>
                </label>
              </div>
              <input
                type="text"
                value={formData.recentRepairs}
                onChange={(e) => setFormData({ ...formData, recentRepairs: e.target.value })}
                placeholder="Recent repairs or services (e.g., oil change 2 weeks ago)"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.customerDescription}
              onChange={(e) => setFormData({ ...formData, customerDescription: e.target.value })}
              placeholder="Any other details..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <div>
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {step < totalSteps ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Consultation'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
