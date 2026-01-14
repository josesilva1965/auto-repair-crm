import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iygufdkbticpalescryr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Z3VmZGtidGljcGFsZXNjcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzEyNjAsImV4cCI6MjA4MDM0NzI2MH0.J45-nDuu6YUE-XsK6pz1t1wtgqPWAgkUg22GReNi3rw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  vat_rate: number | null;
  default_discount: number | null;
  created_at: string;
};

export type Technician = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  hourly_rate: number;
  status: string | null;
  created_at: string;
};

export type Vehicle = {
  id: string;
  customer_id: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  license_plate: string | null;
  color: string | null;
  mileage: number | null;
  notes: string | null;
  created_at: string;
};

export type InventoryPart = {
  id: string;
  part_number: string;
  name: string;
  category: string | null;
  quantity: number;
  unit_cost: number;
  selling_price: number;
  min_stock: number;
  supplier: string | null;
  created_at: string;
};

export type WorkOrder = {
  id: string;
  customer_id: string;
  vehicle_id: string;
  technician_id: string | null;
  status: string;
  priority: string;
  description: string | null;
  diagnosis: string | null;
  estimated_cost: number;
  actual_cost: number;
  scheduled_date: string | null;
  completed_date: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  work_order_id: string;
  customer_id: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
};

export type ServiceHistory = {
  id: string;
  vehicle_id: string;
  work_order_id: string | null;
  service_type: string | null;
  description: string | null;
  mileage_at_service: number | null;
  cost: number | null;
  service_date: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  customer_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  read: boolean;
  created_at: string;
};

export type ServiceReminder = {
  id: string;
  vehicle_id: string;
  customer_id: string;
  service_type: string;
  due_date: string;
  status: 'pending' | 'sent' | 'completed' | 'cancelled';
  created_at: string;
};

export type WorkOrderItem = {
  id: string;
  work_order_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type: 'part' | 'labor' | 'other';
  created_at: string;
};

export type Estimate = {
  id: string;
  estimate_number: string;
  work_order_id: string;
  customer_id: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  sent_via: 'email' | 'sms' | 'print' | 'none';
  sent_at: string | null;
  approved_at: string | null;
  expires_at: string | null;
  approval_token?: string;
  notes: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  type: 'estimate_approved' | 'estimate_rejected' | 'invoice_paid' | 'message_received' | 'estimate_sent' | 'job_completed';
  work_order_id: string | null;
  customer_id: string | null;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
};


export type PurchaseOrder = {
  id: string;
  part_number: string;
  part_name: string;
  quantity: number;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  work_order_id: string | null;
  supplier: string | null;
  estimated_cost: number | null;
  created_at: string;
  updated_at: string;
};

export type TimeLog = {
  id: string;
  work_order_id: string;
  technician_id: string | null;
  technician_name: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  description: string | null;
  created_at: string;
};

export type InspectionTemplate = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type TemplateItem = {
  id: string;
  template_id: string;
  label: string;
  category: string;
  display_order: number;
  created_at: string;
};

export type Inspection = {
  id: string;
  work_order_id: string;
  template_id: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'sent';
  token: string | null;
  created_at: string;
  completed_at: string | null;
};

export type InspectionItem = {
  id: string;
  inspection_id: string;
  template_item_id: string | null;
  label: string;
  category: string | null;
  status: 'green' | 'yellow' | 'red' | null;
  notes: string | null;
  recommendation: string | null;
  customer_decision: 'approved' | 'declined' | null;
  estimated_cost: number | null;
  created_at: string;
};

export type InspectionPhoto = {
  id: string;
  inspection_item_id: string;
  url: string;
  caption: string | null;
  created_at: string;
};
