// User & Auth
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin' | 'manager' | 'technician';
  phone?: string;
  avatar?: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Customer
export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: Address;
  vehicles?: string[];
  totalSpent: number;
  visitCount: number;
  lastVisit?: string;
  tags?: string[];
  source?: 'walk-in' | 'app' | 'referral' | 'website';
  isActive: boolean;
  createdAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Vehicle
export interface Vehicle {
  _id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  vehicleType?: 'sedan' | 'suv' | 'pickup' | 'hatchback' | 'truck' | 'coupe' | 'van' | 'motorcycle';
  fuelType?: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  mileage?: number;
  healthStatus?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  color?: string;
  isActive?: boolean;
  createdAt: string;
}

// Appointment
export interface Appointment {
  _id: string;
  customerId: Customer;
  vehicleId: Vehicle;
  serviceType: 'inspection' | 'oil_change' | 'brake_service' | 'tire_service' | 'diagnostic' | 'repair' | 'maintenance' | 'other';
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  estimatedDuration?: number;
  assignedTechnicianId?: string;
  createdAt: string;
}

// Work Order
export interface WorkOrder {
  _id: string;
  workOrderNumber: string;
  customerId: Customer;
  vehicleId: Vehicle;
  status: 'created' | 'in_progress' | 'waiting_parts' | 'waiting_approval' | 'ready' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  type: 'maintenance' | 'repair' | 'inspection' | 'diagnostic' | 'warranty' | 'recall';
  jobs: WorkOrderJob[];
  parts: WorkOrderPart[];
  mileageIn: number;
  assignedTechnicianId?: Employee;
  labourTotal: number;
  partsTotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
}

export interface WorkOrderJob {
  _id?: string;
  description: string;
  estimatedHours: number;
  actualHours?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  technicianId?: string;
}

export interface WorkOrderPart {
  _id?: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  total: number;
}

// Estimate
export interface Estimate {
  _id: string;
  estimateNumber: string;
  customerId: Customer;
  vehicleId: Vehicle;
  lineItems: EstimateItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'pending' | 'approved' | 'declined' | 'expired' | 'converted';
  validUntil: string;
  createdAt: string;
}

export interface EstimateItem {
  _id?: string;
  description: string;
  type: 'part' | 'labour' | 'service' | 'misc';
  quantity: number;
  unitPrice: number;
  total: number;
}

// Invoice
export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: Customer;
  vehicleId: Vehicle;
  workOrderId?: string;
  lineItems: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
}

export interface InvoiceItem {
  _id?: string;
  description: string;
  type: 'part' | 'labour' | 'service' | 'misc';
  quantity: number;
  unitPrice: number;
  total: number;
}

// Payment
export interface Payment {
  _id: string;
  paymentNumber: string;
  invoiceId: Invoice;
  customerId: Customer;
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'mobile_payment';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  createdAt: string;
}

// Inventory
export interface InventoryItem {
  _id: string;
  partNumber: string;
  name: string;
  description?: string;
  category: 'engine' | 'transmission' | 'brakes' | 'suspension' | 'electrical' | 'body' | 'fluids' | 'filters' | 'tires' | 'accessories' | 'other';
  brand?: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
  minQuantity: number;
  location?: string;
  supplierId?: string;
  isActive: boolean;
  createdAt: string;
}

// Supplier
export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address?: Address;
  categories?: string[];
  rating?: number;
  isActive: boolean;
  createdAt: string;
}

// Employee
export interface Employee {
  _id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'technician' | 'service_advisor' | 'manager' | 'admin' | 'receptionist';
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  department?: 'service' | 'parts' | 'admin' | 'management';
  specializations?: string[];
  certifications?: Certification[];
  hourlyRate?: number;
  hireDate: string;
  createdAt: string;
}

export interface Certification {
  _id?: string;
  name: string;
  issuer?: string;
  issuedAt?: string;
  expiresAt?: string;
}

// Expense
export interface Expense {
  _id: string;
  expenseNumber: string;
  category: 'inventory' | 'equipment' | 'utilities' | 'rent' | 'wages' | 'insurance' | 'marketing' | 'supplies' | 'other';
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  taxDeductible: boolean;
  approvedBy?: string;
  createdAt: string;
}

// Reports
export interface DailyReport {
  date: string;
  revenue: {
    total: number;
    byMethod: Record<string, number>;
  };
  invoices: {
    created: number;
    totalValue: number;
  };
  workOrders: {
    created: number;
    completed: number;
  };
  appointments: Record<string, number>;
  newCustomers: number;
}

export interface ProfitLossReport {
  period: string;
  revenue: number;
  expenses: Record<string, number>;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
