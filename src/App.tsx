import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CustomersList } from './pages/customers/CustomersList';
import { CustomerDetails } from './pages/customers/CustomerDetails';
import { VehiclesList } from './pages/vehicles/VehiclesList';
import { VehicleDetails } from './pages/vehicles/VehicleDetails';
import { AppointmentsList } from './pages/appointments/AppointmentsList';
import { WorkOrdersList } from './pages/workorders/WorkOrdersList';
import { EstimatesList } from './pages/estimates/EstimatesList';
import { InvoicesList } from './pages/invoices/InvoicesList';
import { PaymentsList } from './pages/payments/PaymentsList';
import { InventoryList } from './pages/inventory/InventoryList';
import { SuppliersList } from './pages/suppliers/SuppliersList';
import { EmployeesList } from './pages/employees/EmployeesList';
import { ExpensesList } from './pages/expenses/ExpensesList';
import { Reports } from './pages/reports/Reports';
import { ServiceRecordForm } from './pages/service-records/ServiceRecordForm';
import { ServiceEntriesList } from './pages/service-entries/ServiceEntriesList';
import { ServiceEntryForm } from './pages/service-entries/ServiceEntryForm';
import { OBDLiveMonitor } from './pages/obd/OBDLiveMonitor';
import { OBDHistory } from './pages/obd/OBDHistory';
import { ConsultationsList } from './pages/consultations/ConsultationsList';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<CustomersList />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="vehicles" element={<VehiclesList />} />
        <Route path="vehicles/:id" element={<VehicleDetails />} />
        <Route path="obd-monitor" element={<OBDLiveMonitor />} />
        <Route path="obd-history" element={<OBDHistory />} />
        <Route path="consultations" element={<ConsultationsList />} />
        <Route path="service-records/new" element={<ServiceRecordForm />} />
        <Route path="service-entries" element={<ServiceEntriesList />} />
        <Route path="service-entries/new" element={<ServiceEntryForm />} />
        <Route path="service-entries/:id/edit" element={<ServiceEntryForm />} />
        <Route path="appointments" element={<AppointmentsList />} />
        <Route path="workorders" element={<WorkOrdersList />} />
        <Route path="estimates" element={<EstimatesList />} />
        <Route path="invoices" element={<InvoicesList />} />
        <Route path="payments" element={<PaymentsList />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="suppliers" element={<SuppliersList />} />
        <Route path="employees" element={<EmployeesList />} />
        <Route path="expenses" element={<ExpensesList />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

export default App;
