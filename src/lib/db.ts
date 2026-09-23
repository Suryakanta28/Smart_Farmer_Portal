// Central Reactive Database & Realtime PubSub Engine
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)
// Supports all 18 tables with live reactivity, persistent state, and Supabase client integration

import { supabase, isLiveSupabaseConfigured, isUUID, generateUUID } from './supabase';
import { sendSms } from './sms';

// -------------------------------------------------------------
// TYPES & INTERFACES (All 18 Tables)
// -------------------------------------------------------------

export type UserRole = 'farmer' | 'society_officer' | 'procurement_officer' | 'driver' | 'manager';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email: string;
  password?: string;
  avatar_url?: string;
  designation?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'revoked';
  account_status: 'inactive' | 'active' | 'suspended' | 'revoked';
  verified_at?: string;
  verified_by?: string;
  society_id?: string;
  centre_id?: string;
  created_at: string;
}

export interface Farmer {
  id: string;
  user_id: string;
  name: string;
  father_husband_name: string;
  aadhaar_masked: string;
  aadhaar_encrypted?: string;
  village: string;
  district: string;
  block: string;
  state: string;
  land_area_hectares: number;
  bank_account?: string;
  bank_account_encrypted?: string;
  ifsc_code: string;
  kyc_status: 'pending' | 'verified' | 'rejected' | 'offline_verified';
  verified_at?: string;
  verified_by?: string;
  avatar_url?: string;
  alternate_contact_name?: string;
  alternate_contact_phone?: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface Society {
  id: string;
  name: string;
  code: string;
  district: string;
  block: string;
  address: string;
  contact_phone: string;
  created_at: string;
}

export interface ProcurementCentre {
  id: string;
  name: string;
  code: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity_tonnes_per_day: number;
  operating_hours: string;
  queue_length: number;
  avg_wait_time_minutes: number;
  contact_phone: string;
  created_at: string;
}

export interface Crop {
  id: string;
  farmer_id: string;
  crop_type: string;
  expected_quantity_kg: number;
  harvest_date: string;
  status: 'registered' | 'procurement_requested' | 'vehicle_requested' | 'slot_booked' | 'in_transit' | 'weighed' | 'procured' | 'rejected';
  created_at: string;
}

export interface Slot {
  id: string;
  centre_id: string;
  date: string;
  time_slot: string;
  capacity_farmers: number;
  booked_count: number;
  status: 'available' | 'full' | 'closed';
  created_at: string;
}

export interface Booking {
  id: string;
  farmer_id: string;
  centre_id: string;
  slot_id: string;
  crop_id?: string;
  date: string;
  time_slot: string;
  token_number: number;
  token_code: string;
  qr_code?: string;
  transport_mode: 'self' | 'vehicle';
  pickup_location?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  preferred_pickup_time?: string;
  special_instructions?: string;
  is_offline_farmer?: boolean;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no-show' | 'in_progress';
  created_at: string;
}

export interface Vehicle {
  id: string;
  registration_number: string;
  vehicle_type: string;
  capacity_kg: number;
  driver_user_id?: string;
  driver_name: string;
  driver_phone: string;
  status: 'available' | 'assigned' | 'on_trip' | 'offline' | 'maintenance';
  latitude: number;
  longitude: number;
  last_gps_update: string;
  created_at: string;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  booking_id?: string;
  farmer_id?: string;
  centre_id: string;
  status: 'assigned' | 'accepted' | 'going_to_farmer' | 'arrived' | 'picked_up' | 'going_to_centre' | 'at_centre' | 'completed' | 'cancelled';
  farmer_name?: string;
  farmer_phone?: string;
  village?: string;
  crop_type?: string;
  quantity_kg?: number;
  start_time?: string;
  end_time?: string;
  distance_km?: number;
  eta_minutes?: number;
  created_at: string;
}

export interface QueueItem {
  id: string;
  centre_id: string;
  booking_id: string;
  farmer_id?: string;
  token_number: number;
  token_code: string;
  farmer_name: string;
  position: number;
  status: 'waiting' | 'called' | 'processing' | 'completed' | 'skipped';
  called_at?: string;
  created_at: string;
}

export interface Procurement {
  id: string;
  booking_id: string;
  centre_id: string;
  farmer_id: string;
  farmer_name: string;
  crop_type: string;
  gross_weight_kg: number;
  tare_weight_kg: number;
  net_weight_kg: number;
  moisture_percentage: number;
  foreign_matter_percentage: number;
  quality_grade: 'Grade A' | 'Grade B' | 'Grade C' | 'Rejected';
  msp_rate_per_quintal: number;
  total_amount: number;
  gate_pass_number: string;
  verified_by?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  procurement_id: string;
  farmer_id: string;
  farmer_name: string;
  amount: number;
  pfms_status: 'gate_pass_issued' | 'quality_checked' | 'weighed' | 'initiated' | 'processing' | 'credited' | 'failed';
  pfms_transaction_id: string;
  bank_ref_number: string;
  credited_at?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent' | 'payment' | 'transport';
  read: boolean;
  link?: string;
  created_at: string;
}

export interface OfflineFarmer {
  id: string;
  society_officer_id: string;
  farmer_name: string;
  father_husband_name: string;
  aadhaar_masked: string;
  village: string;
  district: string;
  block: string;
  mobile_optional?: string;
  alternate_contact_name: string;
  alternate_contact_phone: string;
  land_area_hectares: number;
  bank_account_encrypted?: string;
  ifsc_code: string;
  crop_type: string;
  expected_quantity_kg: number;
  harvest_date?: string;
  centre_id: string;
  transport_choice: 'self' | 'vehicle';
  assigned_vehicle_id?: string;
  pickup_location?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  preferred_pickup_time?: string;
  special_instructions?: string;
  slot_id?: string;
  token_number?: number;
  token_code?: string;
  status: 'pending' | 'slot_booked' | 'vehicle_assigned' | 'processing' | 'completed';
  created_at: string;
}

export interface AlertItem {
  id: string;
  centre_id?: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  is_active: boolean;
  created_at: string;
}

export interface VehicleRequest {
  id: string;
  farmer_id: string;
  booking_id?: string;
  farmer_name?: string;
  farmer_phone?: string;
  pickup_location: string;
  pickup_latitude: number;
  pickup_longitude: number;
  crop_quantity_kg: number;
  preferred_pickup_time: string;
  alternate_phone?: string;
  special_instructions?: string;
  assigned_vehicle_id?: string;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  created_at: string;
}

export interface ProcurementRequest {
  id: string;
  farmer_id: string;
  crop_id: string;
  centre_id: string;
  transport_mode?: 'self' | 'vehicle';
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  details: any;
  created_at: string;
}

export interface RegistrationRequest {
  id: string;
  full_name: string;
  role: 'farmer' | 'society_officer' | 'procurement_officer' | 'driver';
  mobile_number: string;
  email?: string;
  password?: string;
  land_area_hectares?: number;
  aadhaar_masked?: string;
  village?: string;
  district?: string;
  block?: string;
  state?: string;
  bank_account?: string;
  ifsc_code?: string;
  society_id?: string;
  centre_id?: string;
  designation?: string;
  vehicle_reg_no?: string;
  details?: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

// -------------------------------------------------------------
// INITIAL HIGH-QUALITY SEED DATA
// -------------------------------------------------------------

const SEED_SOCIETIES: Society[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    name: 'Nilokheri Primary Agri Cooperative',
    code: 'PACS-NIL-01',
    district: 'Karnal',
    block: 'Nilokheri',
    address: 'Nilokheri Mandi Road, Haryana',
    contact_phone: '+919876500001',
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    name: 'Bargarh Farmer Welfare Society (Attabira)',
    code: 'PACS-BAR-02',
    district: 'Bargarh',
    block: 'Attabira',
    address: 'Main Canal Road, Attabira, Bargarh, Odisha',
    contact_phone: '+919876500002',
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    name: 'Sambalpur Central PAC Society',
    code: 'PACS-SBP-03',
    district: 'Sambalpur',
    block: 'Maneswar',
    address: 'NH-53 Junction, Sambalpur, Odisha',
    contact_phone: '+919876500003',
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    name: 'Cuttack Sadar Krishak Sahakari Samiti',
    code: 'PACS-CTC-04',
    district: 'Cuttack',
    block: 'Baranga',
    address: 'Trisulia Chowk, Cuttack, Odisha',
    contact_phone: '+919876500004',
    created_at: new Date().toISOString(),
  },
];

const SEED_CENTRES: ProcurementCentre[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    name: 'Nilokheri Grain Procurement Mandi',
    code: 'PC-NIL-01',
    district: 'Karnal',
    address: 'GT Road, Near Railway Overbridge, Nilokheri, Haryana',
    latitude: 29.8335,
    longitude: 76.9197,
    capacity_tonnes_per_day: 350,
    operating_hours: '08:00 AM - 06:00 PM',
    queue_length: 12,
    avg_wait_time_minutes: 35,
    contact_phone: '+9118001802021',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    name: 'Attabira Rice Procurement Complex',
    code: 'PC-ATT-02',
    district: 'Bargarh',
    address: 'Regulated Market Yard, Attabira, Bargarh, Odisha',
    latitude: 21.3644,
    longitude: 83.7844,
    capacity_tonnes_per_day: 450,
    operating_hours: '08:00 AM - 06:00 PM',
    queue_length: 18,
    avg_wait_time_minutes: 45,
    contact_phone: '+9118001802022',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    name: 'Sambalpur Regulated Market Yard',
    code: 'PC-SBP-03',
    district: 'Sambalpur',
    address: 'Dhanupali Chowk, Sambalpur, Odisha',
    latitude: 21.4550,
    longitude: 83.9850,
    capacity_tonnes_per_day: 380,
    operating_hours: '08:30 AM - 05:30 PM',
    queue_length: 9,
    avg_wait_time_minutes: 25,
    contact_phone: '+9118001802023',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    name: 'Cuttack Central Mandi Complex',
    code: 'PC-CTC-04',
    district: 'Cuttack',
    address: 'Malgodown Road, Cuttack, Odisha',
    latitude: 20.4625,
    longitude: 85.8830,
    capacity_tonnes_per_day: 500,
    operating_hours: '08:00 AM - 06:30 PM',
    queue_length: 24,
    avg_wait_time_minutes: 60,
    contact_phone: '+9118001802024',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222205',
    name: 'Bhubaneswar Agri Warehouse Mandi',
    code: 'PC-BBS-05',
    district: 'Khurda',
    address: 'Chandaka Industrial Area, Bhubaneswar, Odisha',
    latitude: 20.3540,
    longitude: 85.8180,
    capacity_tonnes_per_day: 420,
    operating_hours: '08:00 AM - 06:00 PM',
    queue_length: 15,
    avg_wait_time_minutes: 40,
    contact_phone: '+9118001802025',
    created_at: new Date().toISOString(),
  },
];

const SEED_VEHICLES: Vehicle[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    registration_number: 'OD-15-AB-1024',
    vehicle_type: 'Mini Truck (1.5T)',
    capacity_kg: 1500,
    driver_user_id: '00000000-0000-0000-0000-000000000005',
    driver_name: 'Suresh Kumar Mohapatra',
    driver_phone: '+919876543210',
    status: 'available',
    latitude: 21.4680,
    longitude: 83.9780,
    last_gps_update: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    registration_number: 'OD-17-CD-3456',
    vehicle_type: 'Tractor Trolley (3.5T)',
    capacity_kg: 3500,
    driver_name: 'Prakash Sethi',
    driver_phone: '+919876543211',
    status: 'on_trip',
    latitude: 21.3690,
    longitude: 83.7790,
    last_gps_update: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    registration_number: 'HR-05-XY-7890',
    vehicle_type: 'Medium Truck (5.0T)',
    capacity_kg: 5000,
    driver_name: 'Gurmeet Singh',
    driver_phone: '+919876543212',
    status: 'available',
    latitude: 29.8310,
    longitude: 76.9150,
    last_gps_update: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333304',
    registration_number: 'OD-02-KL-9988',
    vehicle_type: 'Tata Ace (1.2T)',
    capacity_kg: 1200,
    driver_name: 'Manoj Sahoo',
    driver_phone: '+919876543213',
    status: 'available',
    latitude: 20.4600,
    longitude: 85.8810,
    last_gps_update: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

const SEED_USERS: User[] = [
  {
    id: 'usr-farmer',
    role: 'farmer',
    name: 'Ramesh Chandra Pradhan',
    phone: '+919876543201',
    email: 'farmer@krishiflow.ai',
    password: 'farmer123',
    approval_status: 'approved',
    account_status: 'active',
    society_id: 'soc-03',
    centre_id: 'cen-03',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'usr-farmer-2',
    role: 'farmer',
    name: 'Santosh Meher',
    phone: '+919876543206',
    email: 'santosh.farmer@krishiflow.ai',
    password: 'farmer123',
    approval_status: 'approved',
    account_status: 'active',
    society_id: 'soc-02',
    centre_id: 'cen-02',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'usr-farmer-3',
    role: 'farmer',
    name: 'Debendra Nath Sahoo',
    phone: '+919876543207',
    email: 'debendra.farmer@krishiflow.ai',
    password: 'farmer123',
    approval_status: 'approved',
    account_status: 'active',
    society_id: 'soc-04',
    centre_id: 'cen-04',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'usr-farmer-4',
    role: 'farmer',
    name: 'Kailash Chandra Barik',
    phone: '+919876543208',
    email: 'kailash.farmer@krishiflow.ai',
    password: 'farmer123',
    approval_status: 'pending',
    account_status: 'active',
    society_id: 'soc-03',
    centre_id: 'cen-03',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'usr-society',
    role: 'society_officer',
    name: 'Subhashree Barik',
    phone: '+919876543202',
    email: 'society@krishiflow.ai',
    password: 'society123',
    approval_status: 'approved',
    account_status: 'active',
    society_id: 'soc-03',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'usr-society-2',
    role: 'society_officer',
    name: 'Rajesh Kumar Nayak',
    phone: '+919876543220',
    email: 'rajesh.pacs@krishiflow.ai',
    password: 'society123',
    approval_status: 'approved',
    account_status: 'active',
    society_id: 'soc-02',
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'usr-society-3',
    role: 'society_officer',
    name: 'Priyanka Mohanty',
    phone: '+919876543221',
    email: 'priyanka.pacs@krishiflow.ai',
    password: 'society123',
    approval_status: 'approved',
    account_status: 'active',
    society_id: 'soc-04',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'usr-society-4',
    role: 'society_officer',
    name: 'Manoranjan Panda',
    phone: '+919876543222',
    email: 'manoranjan.pacs@krishiflow.ai',
    password: 'society123',
    approval_status: 'pending',
    account_status: 'active',
    society_id: 'soc-01',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'usr-officer',
    role: 'procurement_officer',
    name: 'Ashok Kumar Behera',
    phone: '+919876543203',
    email: 'officer@krishiflow.ai',
    password: 'officer123',
    approval_status: 'approved',
    account_status: 'active',
    centre_id: 'cen-03',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'usr-officer-2',
    role: 'procurement_officer',
    name: 'Dilip Kumar Rout',
    phone: '+919876543230',
    email: 'dilip.mandi@krishiflow.ai',
    password: 'officer123',
    approval_status: 'approved',
    account_status: 'active',
    centre_id: 'cen-02',
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
  },
  {
    id: 'usr-officer-3',
    role: 'procurement_officer',
    name: 'Bikram Keshari Jena',
    phone: '+919876543231',
    email: 'bikram.mandi@krishiflow.ai',
    password: 'officer123',
    approval_status: 'approved',
    account_status: 'active',
    centre_id: 'cen-04',
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: 'usr-officer-4',
    role: 'procurement_officer',
    name: 'Soumya Ranjan Dash',
    phone: '+919876543232',
    email: 'soumya.mandi@krishiflow.ai',
    password: 'officer123',
    approval_status: 'pending',
    account_status: 'active',
    centre_id: 'cen-05',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'usr-driver',
    role: 'driver',
    name: 'Suresh Kumar Mohapatra',
    phone: '+919876543210',
    email: 'driver@krishiflow.ai',
    password: 'driver123',
    approval_status: 'approved',
    account_status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr-manager',
    role: 'manager',
    name: 'Dr. Alok Ranjan Rath (IAS)',
    phone: '+919876543205',
    email: 'manager@krishiflow.ai',
    password: 'manager123',
    approval_status: 'approved',
    account_status: 'active',
    created_at: new Date().toISOString(),
  },
];

const SEED_FARMERS: Farmer[] = [
  {
    id: 'far-01',
    user_id: 'usr-farmer',
    name: 'Ramesh Chandra Pradhan',
    father_husband_name: 'Late Bipin Bihari Pradhan',
    aadhaar_masked: 'XXXX-XXXX-8921',
    village: 'Nilokheri / Sambalpur Rural',
    district: 'Sambalpur',
    block: 'Maneswar',
    state: 'Odisha',
    land_area_hectares: 2.4,
    ifsc_code: 'SBIN0000178',
    kyc_status: 'verified',
    alternate_contact_name: 'Pravat Pradhan (Son)',
    alternate_contact_phone: '+919876549900',
    latitude: 21.4820,
    longitude: 83.9620,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'far-02',
    user_id: 'usr-farmer-2',
    name: 'Santosh Meher',
    father_husband_name: 'Dhaneswar Meher',
    aadhaar_masked: 'XXXX-XXXX-4532',
    village: 'Attabira Village',
    district: 'Bargarh',
    block: 'Attabira',
    state: 'Odisha',
    land_area_hectares: 3.1,
    ifsc_code: 'UBIN0542381',
    kyc_status: 'verified',
    alternate_contact_name: 'Gitanjali Meher (Wife)',
    alternate_contact_phone: '+919876549901',
    latitude: 21.3520,
    longitude: 83.7710,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'far-03',
    user_id: 'usr-farmer-3',
    name: 'Debendra Nath Sahoo',
    father_husband_name: 'Ranjan Sahoo',
    aadhaar_masked: 'XXXX-XXXX-7619',
    village: 'Baranga Gram',
    district: 'Cuttack',
    block: 'Baranga',
    state: 'Odisha',
    land_area_hectares: 1.8,
    ifsc_code: 'PUNB0019283',
    kyc_status: 'verified',
    alternate_contact_name: 'Minati Sahoo (Mother)',
    alternate_contact_phone: '+919876549902',
    latitude: 20.4510,
    longitude: 85.8720,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'far-04',
    user_id: 'usr-farmer-4',
    name: 'Kailash Chandra Barik',
    father_husband_name: 'Ganesh Barik',
    aadhaar_masked: 'XXXX-XXXX-3341',
    village: 'Maneswar Basti',
    district: 'Sambalpur',
    block: 'Maneswar',
    state: 'Odisha',
    land_area_hectares: 4.2,
    ifsc_code: 'SBIN0000178',
    kyc_status: 'pending',
    alternate_contact_name: 'Anup Barik (Brother)',
    alternate_contact_phone: '+919876549903',
    latitude: 21.4610,
    longitude: 83.9710,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const SEED_CROPS: Crop[] = [
  {
    id: 'crop-01',
    farmer_id: 'far-01',
    crop_type: 'Paddy (Common)',
    expected_quantity_kg: 2400,
    harvest_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    status: 'slot_booked',
    created_at: new Date().toISOString(),
  },
  {
    id: 'crop-02',
    farmer_id: 'far-01',
    crop_type: 'Wheat (Sharbati)',
    expected_quantity_kg: 1800,
    harvest_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status: 'registered',
    created_at: new Date().toISOString(),
  },
];

const SEED_BOOKINGS: Booking[] = [
  {
    id: 'book-01',
    farmer_id: 'far-01',
    centre_id: 'cen-03',
    slot_id: 'slot-101',
    crop_id: 'crop-01',
    date: new Date().toISOString().split('T')[0],
    time_slot: '10:00 AM - 10:30 AM',
    token_number: 1024,
    token_code: 'KFA-1024',
    transport_mode: 'vehicle',
    pickup_location: 'Nilokheri / Sambalpur Rural Village',
    pickup_latitude: 21.4820,
    pickup_longitude: 83.9620,
    preferred_pickup_time: '07:30 AM',
    special_instructions: 'Pack in 50kg standard jute bags by main canal road',
    status: 'confirmed',
    created_at: new Date().toISOString(),
  },
];

const SEED_TRIPS: Trip[] = [
  {
    id: 'trip-01',
    vehicle_id: 'veh-01',
    booking_id: 'book-01',
    farmer_id: 'far-01',
    centre_id: 'cen-03',
    farmer_name: 'Ramesh Chandra Pradhan',
    farmer_phone: '+919876543201',
    village: 'Sambalpur Rural',
    crop_type: 'Paddy (Common)',
    quantity_kg: 2400,
    status: 'going_to_farmer',
    distance_km: 4.8,
    eta_minutes: 14,
    created_at: new Date().toISOString(),
  },
];

const SEED_QUEUE: QueueItem[] = [
  {
    id: 'q-01',
    centre_id: 'cen-03',
    booking_id: 'book-01',
    token_number: 1024,
    token_code: 'KFA-1024',
    farmer_name: 'Ramesh Chandra Pradhan',
    position: 3,
    status: 'waiting',
    created_at: new Date().toISOString(),
  },
  {
    id: 'q-02',
    centre_id: 'cen-03',
    booking_id: 'book-02',
    token_number: 1022,
    token_code: 'KFA-1022',
    farmer_name: 'Gopal Sahu',
    position: 1,
    status: 'called',
    called_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'q-03',
    centre_id: 'cen-03',
    booking_id: 'book-03',
    token_number: 1023,
    token_code: 'KFA-1023',
    farmer_name: 'Dinabandhu Jena',
    position: 2,
    status: 'waiting',
    created_at: new Date().toISOString(),
  },
];

const SEED_PROCUREMENTS: Procurement[] = [
  {
    id: 'proc-01',
    booking_id: 'book-old-01',
    centre_id: 'cen-03',
    farmer_id: 'far-01',
    farmer_name: 'Ramesh Chandra Pradhan',
    crop_type: 'Paddy (Grade A)',
    gross_weight_kg: 5420,
    tare_weight_kg: 420,
    net_weight_kg: 5000,
    moisture_percentage: 12.8,
    foreign_matter_percentage: 0.4,
    quality_grade: 'Grade A',
    msp_rate_per_quintal: 2320,
    total_amount: 116000,
    gate_pass_number: 'GP-2026-9041',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const SEED_PAYMENTS: Payment[] = [
  {
    id: 'pay-01',
    procurement_id: 'proc-01',
    farmer_id: 'far-01',
    farmer_name: 'Ramesh Chandra Pradhan',
    amount: 116000,
    pfms_status: 'credited',
    pfms_transaction_id: 'PFMS-OD-2026-98124',
    bank_ref_number: 'SBIN0029381923',
    credited_at: new Date().toLocaleDateString('en-IN'),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    user_id: 'usr-farmer',
    title: 'Vehicle Pickup Scheduled',
    message: 'Mini Truck OD-15-AB-1024 (Driver Suresh) assigned. Pickup at 07:30 AM.',
    type: 'transport',
    read: false,
    link: '/farmer/vehicle-tracking',
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-02',
    user_id: 'usr-farmer',
    title: 'PFMS DBT Payment Credited',
    message: '₹ 1,16,000 credited to SBI A/c ending 8921 for Paddy Gate Pass #GP-2026-9041.',
    type: 'payment',
    read: false,
    link: '/farmer/payments',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-03',
    user_id: 'usr-society',
    title: 'New Offline Farmer Request',
    message: 'Offline registration submitted for Farmer Ramesh. Vehicle assigned.',
    type: 'info',
    read: false,
    link: '/society/offline-farmers',
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-04',
    user_id: 'usr-officer',
    title: 'Approaching Slot Alert',
    message: 'Farmer token #1024 approaching slot window at Bay 2.',
    type: 'warning',
    read: false,
    link: '/officer/queue',
    created_at: new Date().toISOString(),
  },
];

const SEED_OFFLINE_FARMERS: OfflineFarmer[] = [
  {
    id: 'off-01',
    society_officer_id: 'usr-society',
    farmer_name: 'Baidhar Mallik',
    father_husband_name: 'Bhima Mallik',
    aadhaar_masked: 'XXXX-XXXX-7721',
    village: 'Nuapali Basti',
    district: 'Sambalpur',
    block: 'Maneswar',
    alternate_contact_name: 'Pradeep Mallik (Nephew)',
    alternate_contact_phone: '+919876541122',
    land_area_hectares: 1.8,
    ifsc_code: 'SBIN0000178',
    crop_type: 'Paddy',
    expected_quantity_kg: 1900,
    centre_id: 'cen-03',
    transport_choice: 'self',
    slot_id: 'slot-102',
    token_number: 1042,
    token_code: 'KFA-OF-1042',
    status: 'slot_booked',
    created_at: new Date().toISOString(),
  },
];

const SEED_ALERTS: AlertItem[] = [
  {
    id: 'alt-01',
    centre_id: 'cen-03',
    alert_type: 'Capacity Warning',
    severity: 'high',
    message: 'Centre capacity 92% (current queue > capacity × 0.9)',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'alt-02',
    centre_id: 'cen-03',
    alert_type: 'Slot Congestion',
    severity: 'medium',
    message: '5 farmers approaching slot within 30 minutes',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'alt-03',
    centre_id: 'cen-03',
    alert_type: 'Logistics',
    severity: 'medium',
    message: '3 vehicle requests pending assignment in Sambalpur Zone',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// -------------------------------------------------------------
// PURE RUNTIME REACTIVE ENGINE & LIVE SUPABASE SYNC (ZERO LOCALSTORAGE)
// -------------------------------------------------------------

// Clear any stale localstorage keys from previous mock sessions
try {
  if (typeof localStorage !== 'undefined') {
    const keysToPurge: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('kf_') || k.startsWith('krishiflow'))) {
        keysToPurge.push(k);
      }
    }
    keysToPurge.forEach((k) => localStorage.removeItem(k));
  }
} catch {}

const runtimeMemoryStore = new Map<string, any[]>();

class ReactiveDatabase {
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initStorage();
    this.syncFromSupabase();
    this.initSupabaseRealtime();
    this.startGpsSimulation();
  }

  private initStorage() {
    const keys: [string, any][] = [
      ['societies', SEED_SOCIETIES],
      ['centres', SEED_CENTRES],
      ['vehicles', SEED_VEHICLES],
      ['users', SEED_USERS],
      ['farmers', SEED_FARMERS],
      ['crops', SEED_CROPS],
      ['bookings', SEED_BOOKINGS],
      ['trips', SEED_TRIPS],
      ['queue', SEED_QUEUE],
      ['procurements', SEED_PROCUREMENTS],
      ['payments', SEED_PAYMENTS],
      ['notifications', SEED_NOTIFICATIONS],
      ['offline_farmers', SEED_OFFLINE_FARMERS],
      ['alerts', SEED_ALERTS],
      ['vehicle_requests', []],
      ['audit_logs', []],
      ['registration_requests', []],
    ];

    for (const [key, initialData] of keys) {
      if (!runtimeMemoryStore.has(key)) {
        runtimeMemoryStore.set(key, initialData);
      }
    }
  }

  // Get in-memory collection (live updated from Supabase PostgreSQL)
  public getCollection<T>(key: string): T[] {
    return (runtimeMemoryStore.get(key) as T[]) || [];
  }

  // Save collection in runtime memory, broadcast, and persist
  public setCollection<T>(key: string, data: T[]) {
    runtimeMemoryStore.set(key, data);
    this.emit(key, data);
  }

  // Sync all tables from live Supabase PostgreSQL
  public async syncFromSupabase() {
    if (!isLiveSupabaseConfigured()) return;
    const tableMappings: [string, string][] = [
      ['societies', 'societies'],
      ['centres', 'procurement_centres'],
      ['vehicles', 'vehicles'],
      ['users', 'users'],
      ['farmers', 'farmers'],
      ['crops', 'crops'],
      ['bookings', 'bookings'],
      ['trips', 'trips'],
      ['queue', 'queue'],
      ['procurements', 'procurements'],
      ['payments', 'payments'],
      ['notifications', 'notifications'],
      ['offline_farmers', 'offline_farmers'],
      ['alerts', 'alerts'],
      ['vehicle_requests', 'vehicle_requests'],
      ['audit_logs', 'audit_logs'],
      ['registration_requests', 'registration_requests'],
    ];

    for (const [memKey, tableName] of tableMappings) {
      try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (!error && data && data.length > 0) {
          runtimeMemoryStore.set(memKey, data);
          this.emit(memKey, data);
        }
      } catch (err) {
        console.warn(`Supabase live fetch error for table ${tableName}:`, err);
      }
    }
  }

  // Realtime Supabase PostgreSQL changes listener
  private initSupabaseRealtime() {
    if (!isLiveSupabaseConfigured()) return;
    try {
      supabase
        .channel('public-postgres-realtime')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          const tableName = payload.table;
          const memKey = tableName === 'procurement_centres' ? 'centres' : tableName;
          const currentList = this.getCollection<any>(memKey);
          let updatedList = [...currentList];

          if (payload.eventType === 'INSERT') {
            const exists = updatedList.some((item) => item.id === payload.new.id);
            if (!exists) updatedList.unshift(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            updatedList = updatedList.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item));
          } else if (payload.eventType === 'DELETE') {
            updatedList = updatedList.filter((item) => item.id !== (payload.old as any).id);
          }

          runtimeMemoryStore.set(memKey, updatedList);
          this.emit(memKey, updatedList);
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime Supabase subscription warning:', err);
    }
  }

  // PubSub subscription matching Supabase channel semantics
  public subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    // Immediate emission of current state
    const tableKey = channel.replace('table:', '').split(':')[0];
    const initial = this.getCollection(tableKey);
    if (initial) {
      callback(initial);
    }

    return () => {
      this.subscribers.get(channel)?.delete(callback);
    };
  }

  public emit(channel: string, data: any) {
    // Notify table listeners
    const tableChannel = `table:${channel}`;
    this.subscribers.get(tableChannel)?.forEach((cb) => cb(data));

    // Also notify generic channel
    this.subscribers.get(channel)?.forEach((cb) => cb(data));
  }

  // Simulation: Move vehicles slightly every 10s for live GPS realism
  private startGpsSimulation() {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      const vehicles = this.getCollection<Vehicle>('vehicles');
      let updated = false;

      const newVehicles = vehicles.map((veh) => {
        if (veh.status === 'on_trip' || veh.status === 'assigned') {
          // slight drift towards destination
          const deltaLat = (Math.random() - 0.45) * 0.0008;
          const deltaLng = (Math.random() - 0.45) * 0.0008;
          updated = true;
          return {
            ...veh,
            latitude: Number((veh.latitude + deltaLat).toFixed(6)),
            longitude: Number((veh.longitude + deltaLng).toFixed(6)),
            last_gps_update: new Date().toISOString(),
          };
        }
        return veh;
      });

      if (updated) {
        this.setCollection('vehicles', newVehicles);
        // Also emit specific vehicle channel
        newVehicles.forEach((v) => {
          this.emit(`vehicle:${v.id}`, v);
        });
      }
    }, 10000);
  }

  // -------------------------------------------------------------
  // OPERATIONS & METHODS
  // -------------------------------------------------------------

  // Metrics for Home & Dashboards
  public getLiveMetrics() {
    const procurements = this.getCollection<Procurement>('procurements');
    const payments = this.getCollection<Payment>('payments');
    const vehicles = this.getCollection<Vehicle>('vehicles');
    const farmers = this.getCollection<Farmer>('farmers');
    const queue = this.getCollection<QueueItem>('queue');

    const totalProcurementToday = procurements.reduce((acc, p) => acc + p.net_weight_kg / 100, 4820); // Quintals
    const totalPaymentsToday = payments.reduce((acc, p) => acc + p.amount, 11450000);
    const activeVehiclesCount = vehicles.filter((v) => v.status === 'on_trip' || v.status === 'assigned').length + 18;
    const totalFarmersToday = farmers.length + 142;

    return {
      totalFarmersToday,
      totalProcurementToday: Math.round(totalProcurementToday),
      activeVehiclesCount,
      totalPaymentsToday,
      waitingInQueue: queue.filter((q) => q.status === 'waiting').length,
    };
  }

  // Farmer Profile Management & Cascading Database Sync
  public getFarmerByUserId(userId?: string): Farmer {
    const farmers = this.getCollection<Farmer>('farmers');
    if (userId) {
      const match = farmers.find((f) => f.user_id === userId);
      if (match) return match;

      // Also search if matching user exists
      const users = this.getCollection<User>('users');
      const currentUser = users.find((u) => u.id === userId || u.phone === userId || u.email === userId);
      if (currentUser && currentUser.role === 'farmer') {
        const matchingByNameOrPhone = farmers.find(
          (f) => (currentUser.phone && f.alternate_contact_phone?.includes(currentUser.phone)) || (currentUser.name && f.name.toLowerCase() === currentUser.name.toLowerCase())
        );
        if (matchingByNameOrPhone) {
          matchingByNameOrPhone.user_id = currentUser.id;
          this.setCollection('farmers', farmers);
          return matchingByNameOrPhone;
        }

        // Dynamically create a farmer profile for this registered user (ONLY if user role is farmer)
        const newFarmer: Farmer = {
          id: `far-${currentUser.id}`,
          user_id: currentUser.id,
          name: currentUser.name || 'Registered Farmer',
          father_husband_name: 'Resident of Odisha',
          aadhaar_masked: 'XXXX-XXXX-9821',
          village: 'Sambalpur Rural',
          district: 'Sambalpur',
          block: 'Maneswar',
          state: 'Odisha',
          land_area_hectares: 2.4,
          bank_account: '982100192831',
          ifsc_code: 'SBIN0000178',
          kyc_status: 'verified',
          alternate_contact_phone: currentUser.phone || '+919876543201',
          latitude: 21.482,
          longitude: 83.962,
          avatar_url: currentUser.avatar_url,
          created_at: currentUser.created_at || new Date().toISOString(),
        };
        farmers.push(newFarmer);
        this.setCollection('farmers', farmers);
        return newFarmer;
      }
    }
    const defaultFarmer = farmers.find((f) => f.id === 'far-01') || farmers[0];
    return (
      defaultFarmer || {
        id: 'far-01',
        user_id: userId || 'usr-farmer',
        name: 'Farmer',
        father_husband_name: 'Resident of Odisha',
        aadhaar_masked: 'XXXX-XXXX-8921',
        village: 'Nilokheri / Sambalpur Rural',
        district: 'Sambalpur',
        block: 'Maneswar',
        state: 'Odisha',
        land_area_hectares: 2.4,
        bank_account: '982100192831',
        ifsc_code: 'SBIN0000178',
        kyc_status: 'verified',
        alternate_contact_phone: '+919876543201',
        latitude: 21.482,
        longitude: 83.962,
        created_at: new Date().toISOString(),
      }
    );
  }

  public updateFarmerProfile(
    farmerIdOrUserId: string,
    updates: Partial<Farmer>,
    userId?: string
  ): { success: boolean; farmer: Farmer } {
    const farmers = this.getCollection<Farmer>('farmers');
    const farmerIdx = farmers.findIndex(
      (f) => f.id === farmerIdOrUserId || f.user_id === farmerIdOrUserId || (userId && f.user_id === userId)
    );

    let updatedFarmer: Farmer;

    if (farmerIdx >= 0) {
      updatedFarmer = {
        ...farmers[farmerIdx],
        ...updates,
      };
      farmers[farmerIdx] = updatedFarmer;
    } else {
      updatedFarmer = {
        id: farmerIdOrUserId.startsWith('far-') ? farmerIdOrUserId : `far-${Date.now()}`,
        user_id: userId || 'usr-farmer',
        name: updates.name || 'Farmer',
        father_husband_name: updates.father_husband_name || '',
        aadhaar_masked: updates.aadhaar_masked || 'XXXX-XXXX-8921',
        village: updates.village || 'Sambalpur',
        district: updates.district || 'Sambalpur',
        block: updates.block || 'Maneswar',
        state: updates.state || 'Odisha',
        land_area_hectares: updates.land_area_hectares || 2.0,
        bank_account: updates.bank_account || '',
        ifsc_code: updates.ifsc_code || 'SBIN0000178',
        kyc_status: 'verified',
        alternate_contact_phone: updates.alternate_contact_phone || '+919876543201',
        latitude: updates.latitude || 21.482,
        longitude: updates.longitude || 83.962,
        avatar_url: updates.avatar_url,
        created_at: new Date().toISOString(),
        ...updates,
      };
      farmers.push(updatedFarmer);
    }

    this.setCollection('farmers', farmers);

    // 1. Sync matching record in users collection
    const users = this.getCollection<User>('users');
    const uIdx = users.findIndex(
      (u) => u.id === updatedFarmer.user_id || (userId && u.id === userId) || (updatedFarmer.alternate_contact_phone && u.phone === updatedFarmer.alternate_contact_phone)
    );
    if (uIdx >= 0) {
      users[uIdx] = {
        ...users[uIdx],
        name: updatedFarmer.name || users[uIdx].name,
        avatar_url: updatedFarmer.avatar_url !== undefined ? updatedFarmer.avatar_url : users[uIdx].avatar_url,
        phone: updatedFarmer.alternate_contact_phone || users[uIdx].phone,
      };
      this.setCollection('users', users);
    }

    // 2. Cascade update to trips
    const trips = this.getCollection<Trip>('trips');
    let tripsUpdated = false;
    trips.forEach((t) => {
      if (t.farmer_id === updatedFarmer.id || !t.farmer_id || t.id === 'trip-01') {
        t.farmer_name = updatedFarmer.name;
        t.farmer_phone = updatedFarmer.alternate_contact_phone || t.farmer_phone;
        t.village = updatedFarmer.village;
        tripsUpdated = true;
      }
    });
    if (tripsUpdated) {
      this.setCollection('trips', trips);
    }

    // 3. Cascade update to queue
    const queue = this.getCollection<QueueItem>('queue');
    let queueUpdated = false;
    queue.forEach((q) => {
      if (q.token_code.startsWith('KFA') || q.farmer_name.includes('Ramesh') || q.farmer_name === updatedFarmer.name) {
        q.farmer_name = updatedFarmer.name;
        queueUpdated = true;
      }
    });
    if (queueUpdated) {
      this.setCollection('queue', queue);
    }

    // 4. Cascade update to procurements
    const procurements = this.getCollection<Procurement>('procurements');
    let procUpdated = false;
    procurements.forEach((p) => {
      if (p.farmer_id === updatedFarmer.id || p.farmer_name.includes('Ramesh') || p.id === 'proc-01') {
        p.farmer_name = updatedFarmer.name;
        procUpdated = true;
      }
    });
    if (procUpdated) {
      this.setCollection('procurements', procurements);
    }

    // 5. Cascade update to payments
    const payments = this.getCollection<Payment>('payments');
    let payUpdated = false;
    payments.forEach((p) => {
      if (p.farmer_id === updatedFarmer.id || p.farmer_name.includes('Ramesh') || p.id === 'pay-01') {
        p.farmer_name = updatedFarmer.name;
        payUpdated = true;
      }
    });
    if (payUpdated) {
      this.setCollection('payments', payments);
    }

    // 6. Cascade update to bookings
    const bookings = this.getCollection<Booking>('bookings');
    let bookingsUpdated = false;
    bookings.forEach((b) => {
      if (b.farmer_id === updatedFarmer.id || b.id === 'book-01') {
        b.pickup_location = updatedFarmer.village;
        b.pickup_latitude = updatedFarmer.latitude;
        b.pickup_longitude = updatedFarmer.longitude;
        bookingsUpdated = true;
      }
    });
    if (bookingsUpdated) {
      this.setCollection('bookings', bookings);
    }

    // 7. Cascade update to vehicle requests
    const vehicleRequests = this.getCollection<VehicleRequest>('vehicle_requests');
    let vrUpdated = false;
    vehicleRequests.forEach((vr) => {
      if (vr.farmer_id === updatedFarmer.id) {
        vr.farmer_name = updatedFarmer.name;
        vr.farmer_phone = updatedFarmer.alternate_contact_phone;
        vr.pickup_location = updatedFarmer.village;
        vr.pickup_latitude = updatedFarmer.latitude;
        vr.pickup_longitude = updatedFarmer.longitude;
        vrUpdated = true;
      }
    });
    if (vrUpdated) {
      this.setCollection('vehicle_requests', vehicleRequests);
    }

    // 8. Remote Supabase sync if configured
    if (isLiveSupabaseConfigured()) {
      try {
        supabase
          .from('farmers')
          .upsert({
            id: updatedFarmer.id,
            user_id: updatedFarmer.user_id,
            name: updatedFarmer.name,
            father_husband_name: updatedFarmer.father_husband_name,
            aadhaar_masked: updatedFarmer.aadhaar_masked,
            village: updatedFarmer.village,
            district: updatedFarmer.district,
            block: updatedFarmer.block,
            state: updatedFarmer.state,
            land_area_hectares: updatedFarmer.land_area_hectares,
            bank_account: updatedFarmer.bank_account,
            ifsc_code: updatedFarmer.ifsc_code,
            avatar_url: updatedFarmer.avatar_url,
            latitude: updatedFarmer.latitude,
            longitude: updatedFarmer.longitude,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase remote farmer sync error:', error.message);
          });
      } catch (e) {
        console.warn('Supabase sync exception:', e);
      }
    }

    // Notify listeners on table channels
    this.emit(`farmer:${updatedFarmer.id}`, updatedFarmer);
    if (userId) this.emit(`farmer:user:${userId}`, updatedFarmer);

    return { success: true, farmer: updatedFarmer };
  }

  // Phone uniqueness check across all roles (Farmer, Society Officer, Procurement Officer, Driver, Manager)
  public isPhoneRegistered(phone: string): { registered: boolean; existingUser?: User; message?: string } {
    if (!phone) return { registered: false };
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length < 10) return { registered: false };

    // 1. Check in users collection
    const users = this.getCollection<User>('users');
    const matchedUser = users.find((u) => {
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '').slice(-10);
      return uPhoneDigits === cleanDigits;
    });

    const roleLabels: Record<string, string> = {
      farmer: 'Farmer (Kisan)',
      society_officer: 'Society Officer (PACS)',
      procurement_officer: 'Procurement Officer (Mandi Incharge)',
      driver: 'Vehicle Fleet Driver',
      manager: 'State Admin / Manager',
    };

    if (matchedUser) {
      const roleName = roleLabels[matchedUser.role] || matchedUser.role.toUpperCase();
      return {
        registered: true,
        existingUser: matchedUser,
        message: `This mobile number (+91 ${cleanDigits}) is already registered as "${roleName}" (${matchedUser.name})! A mobile number cannot be registered again in any role. Please login using this number and your password, or use a different mobile number.`,
      };
    }

    // 2. Check in farmers collection
    const farmers = this.getCollection<Farmer>('farmers');
    const matchedFarmer = farmers.find((f) => {
      const fPhoneDigits = (f.alternate_contact_phone || '').replace(/\D/g, '').slice(-10);
      return fPhoneDigits === cleanDigits;
    });

    if (matchedFarmer) {
      return {
        registered: true,
        message: `This mobile number (+91 ${cleanDigits}) is already registered as "Farmer (Kisan)" (${matchedFarmer.name})! A mobile number cannot be registered again in any role. Please login with your credentials or use a different mobile number.`,
      };
    }

    // 3. Check in vehicles collection
    const vehicles = this.getCollection<Vehicle>('vehicles');
    const matchedVehicle = vehicles.find((v) => {
      const vPhoneDigits = (v.driver_phone || '').replace(/\D/g, '').slice(-10);
      return vPhoneDigits === cleanDigits;
    });

    if (matchedVehicle) {
      return {
        registered: true,
        message: `This mobile number (+91 ${cleanDigits}) is already registered as "Vehicle Logistics Driver" (${matchedVehicle.driver_name})! A mobile number cannot be registered again in any role. Please login with your credentials or use a different mobile number.`,
      };
    }

    // 4. Check in registration_requests collection
    const regRequests = this.getCollection<RegistrationRequest>('registration_requests');
    const matchedReq = regRequests.find((r) => {
      const rPhoneDigits = (r.mobile_number || '').replace(/\D/g, '').slice(-10);
      return rPhoneDigits === cleanDigits && r.status === 'pending';
    });

    if (matchedReq) {
      const roleName = roleLabels[matchedReq.role] || matchedReq.role.toUpperCase();
      return {
        registered: true,
        message: `Is mobile number (+91 ${cleanDigits}) se "${roleName}" (${matchedReq.full_name}) ka registration request pehle se PENDING hai. State Manager ke approval ka intezar karein.`,
      };
    }

    return { registered: false };
  }

  public findUserByPhone(phone: string): User | null {
    if (!phone) return null;
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length < 10) return null;

    const users = this.getCollection<User>('users');
    const matchedUser = users.find((u) => {
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '').slice(-10);
      return uPhoneDigits === cleanDigits;
    });

    return matchedUser || null;
  }

  // Crops
  public addCrop(cropData: Omit<Crop, 'id' | 'created_at' | 'status'>): Crop {
    const crops = this.getCollection<Crop>('crops');
    const validCropId = generateUUID();
    const validFarmerId = isUUID(cropData.farmer_id) ? cropData.farmer_id : '44444444-4444-4444-4444-444444444401';

    const newCrop: Crop = {
      ...cropData,
      id: validCropId,
      farmer_id: validFarmerId,
      status: 'registered',
      created_at: new Date().toISOString(),
    };
    crops.unshift(newCrop);
    this.setCollection('crops', crops);

    if (isLiveSupabaseConfigured()) {
      try {
        supabase.from('crops').insert([{
          id: newCrop.id,
          farmer_id: newCrop.farmer_id,
          crop_type: newCrop.crop_type,
          expected_quantity_kg: newCrop.expected_quantity_kg,
          harvest_date: newCrop.harvest_date,
          status: newCrop.status,
          created_at: newCrop.created_at,
        }]).then(({ error }) => {
          if (error) console.warn('Supabase insert crop error:', error.message);
        });
      } catch (e) {
        console.warn('Supabase insert crop error:', e);
      }
    }

    return newCrop;
  }

  public updateCrop(id: string, updates: Partial<Crop>): Crop | null {
    const crops = this.getCollection<Crop>('crops');
    const idx = crops.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    crops[idx] = { ...crops[idx], ...updates };
    this.setCollection('crops', crops);

    if (isLiveSupabaseConfigured()) {
      try {
        supabase.from('crops').update(updates).eq('id', id).then(({ error }) => {
          if (error) console.warn('Supabase update crop error:', error.message);
        });
      } catch (e) {
        console.warn('Supabase update crop error:', e);
      }
    }

    return crops[idx];
  }

  public deleteCrop(id: string): boolean {
    const crops = this.getCollection<Crop>('crops');
    const filtered = crops.filter((c) => c.id !== id);
    this.setCollection('crops', filtered);

    if (isLiveSupabaseConfigured()) {
      try {
        supabase.from('crops').delete().eq('id', id).then(({ error }) => {
          if (error) console.warn('Supabase delete crop error:', error.message);
        });
      } catch (e) {
        console.warn('Supabase delete crop error:', e);
      }
    }

    return true;
  }

  // Self Transport Slot Booking
  public bookSelfTransportSlot(params: {
    farmer_id: string;
    centre_id: string;
    crop_id?: string;
    date: string;
    time_slot: string;
    farmerName?: string;
    farmerPhone?: string;
  }): Booking {
    const bookings = this.getCollection<Booking>('bookings');
    const tokenNumber = 1000 + bookings.length + 1;
    const tokenCode = `KFA-${tokenNumber}`;
    const validBookingId = generateUUID();
    const validFarmerId = isUUID(params.farmer_id) ? params.farmer_id : '44444444-4444-4444-4444-444444444401';
    const validCentreId = isUUID(params.centre_id) ? params.centre_id : '22222222-2222-2222-2222-222222222203';
    const validCropId = params.crop_id && isUUID(params.crop_id) ? params.crop_id : null;

    const newBooking: Booking = {
      id: validBookingId,
      farmer_id: validFarmerId,
      centre_id: validCentreId,
      slot_id: generateUUID(),
      crop_id: validCropId || undefined,
      date: params.date,
      time_slot: params.time_slot,
      token_number: tokenNumber,
      token_code: tokenCode,
      transport_mode: 'self',
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    bookings.unshift(newBooking);
    this.setCollection('bookings', bookings);

    if (isLiveSupabaseConfigured()) {
      try {
        supabase.from('bookings').insert([{
          id: newBooking.id,
          farmer_id: newBooking.farmer_id,
          centre_id: newBooking.centre_id,
          crop_id: newBooking.crop_id || null,
          date: newBooking.date,
          time_slot: newBooking.time_slot,
          token_number: newBooking.token_number,
          token_code: newBooking.token_code,
          transport_mode: newBooking.transport_mode,
          status: newBooking.status,
          created_at: newBooking.created_at,
        }]).then(({ error }) => {
          if (error) console.warn('Supabase booking insert error:', error.message);
        });
      } catch (e) {
        console.warn('Supabase booking insert error:', e);
      }
    }

    // Add to Queue
    const queue = this.getCollection<QueueItem>('queue');
    const newQueueItem: QueueItem = {
      id: generateUUID(),
      centre_id: validCentreId,
      booking_id: newBooking.id,
      token_number: tokenNumber,
      token_code: tokenCode,
      farmer_name: params.farmerName || 'Farmer Ramesh',
      position: queue.filter((q) => q.status === 'waiting').length + 1,
      status: 'waiting',
      created_at: new Date().toISOString(),
    };
    queue.push(newQueueItem);
    this.setCollection('queue', queue);

    if (isLiveSupabaseConfigured()) {
      try {
        supabase.from('queue').insert([{
          id: newQueueItem.id,
          centre_id: newQueueItem.centre_id,
          booking_id: newQueueItem.booking_id,
          token_number: newQueueItem.token_number,
          token_code: newQueueItem.token_code,
          position: newQueueItem.position,
          status: newQueueItem.status,
          created_at: newQueueItem.created_at,
        }]).then(({ error }) => {
          if (error) console.warn('Supabase queue insert error:', error.message);
        });
      } catch (e) {
        console.warn('Supabase queue insert error:', e);
      }
    }

    // Update Crop
    if (params.crop_id) {
      this.updateCrop(params.crop_id, { status: 'slot_booked' });
    }

    // Send SMS
    sendSms({
      phone: params.farmerPhone || '+919876543201',
      message: `Slot booked! Token #${tokenNumber} (${tokenCode}), ${params.date} at ${params.time_slot}. Self transport. Report 15 mins early at Mandi gate.`,
      type: 'transactional',
    });

    // Send Notification
    this.createNotification({
      user_id: validFarmerId,
      title: 'Slot Booked (Self Transport)',
      message: `Your appointment for ${params.date} ${params.time_slot} is confirmed. Token: ${tokenCode}`,
      type: 'success',
      link: '/farmer/slots-tokens',
    });

    return newBooking;
  }

  // Vehicle Transport Request & Auto Assignment
  public submitVehicleRequest(params: {
    farmer_id: string;
    crop_id?: string;
    crop_quantity_kg: number;
    pickup_location: string;
    pickup_latitude: number;
    pickup_longitude: number;
    preferred_pickup_time: string;
    special_instructions?: string;
    alternate_phone?: string;
    farmerName?: string;
    farmerPhone?: string;
  }): { vehicleRequest: VehicleRequest; assignedVehicle: Vehicle | null } {
    const requests = this.getCollection<VehicleRequest>('vehicle_requests');
    const vehicles = this.getCollection<Vehicle>('vehicles');
    const validReqId = generateUUID();
    const validFarmerId = isUUID(params.farmer_id) ? params.farmer_id : '44444444-4444-4444-4444-444444444401';

    // Auto assign nearest available vehicle with capacity
    const eligible = vehicles.filter(
      (v) => v.capacity_kg >= params.crop_quantity_kg && (v.status === 'available' || v.status === 'assigned')
    );

    let assignedVehicle: Vehicle | null = null;
    if (eligible.length > 0) {
      assignedVehicle = eligible[0];
      assignedVehicle.status = 'assigned';
      this.setCollection('vehicles', vehicles);
    }

    const newRequest: VehicleRequest = {
      id: validReqId,
      farmer_id: validFarmerId,
      pickup_location: params.pickup_location,
      pickup_latitude: params.pickup_latitude,
      pickup_longitude: params.pickup_longitude,
      crop_quantity_kg: params.crop_quantity_kg,
      preferred_pickup_time: params.preferred_pickup_time,
      alternate_phone: params.alternate_phone,
      special_instructions: params.special_instructions,
      assigned_vehicle_id: assignedVehicle ? assignedVehicle.id : undefined,
      status: assignedVehicle ? 'assigned' : 'pending',
      created_at: new Date().toISOString(),
    };

    requests.unshift(newRequest);
    this.setCollection('vehicle_requests', requests);

    if (isLiveSupabaseConfigured()) {
      try {
        const prefTimeFormatted = params.preferred_pickup_time.includes(':')
          ? params.preferred_pickup_time.split(' ')[0]
          : '07:30:00';

        supabase.from('vehicle_requests').insert([{
          id: newRequest.id,
          farmer_id: newRequest.farmer_id,
          pickup_location: newRequest.pickup_location,
          pickup_latitude: newRequest.pickup_latitude,
          pickup_longitude: newRequest.pickup_longitude,
          crop_quantity_kg: newRequest.crop_quantity_kg,
          preferred_pickup_time: prefTimeFormatted,
          alternate_phone: newRequest.alternate_phone || null,
          special_instructions: newRequest.special_instructions || null,
          assigned_vehicle_id: newRequest.assigned_vehicle_id || null,
          status: newRequest.status,
          created_at: newRequest.created_at,
        }]).then(({ error }) => {
          if (error) console.warn('Supabase vehicle_requests insert error:', error.message);
        });
      } catch (e) {
        console.warn('Supabase vehicle_requests insert error:', e);
      }
    }

    if (params.crop_id) {
      this.updateCrop(params.crop_id, { status: 'vehicle_requested' });
    }

    if (assignedVehicle) {
      const trips = this.getCollection<Trip>('trips');
      const newTrip: Trip = {
        id: generateUUID(),
        vehicle_id: assignedVehicle.id,
        farmer_id: validFarmerId,
        centre_id: '22222222-2222-2222-2222-222222222203',
        farmer_name: params.farmerName || 'Farmer Ramesh',
        farmer_phone: params.farmerPhone || '+919876543201',
        village: params.pickup_location,
        crop_type: 'Paddy',
        quantity_kg: params.crop_quantity_kg,
        status: 'assigned',
        distance_km: 3.8,
        eta_minutes: 15,
        created_at: new Date().toISOString(),
      };
      trips.unshift(newTrip);
      this.setCollection('trips', trips);

      if (isLiveSupabaseConfigured()) {
        try {
          supabase.from('trips').insert([{
            id: newTrip.id,
            vehicle_id: newTrip.vehicle_id,
            farmer_id: newTrip.farmer_id,
            centre_id: newTrip.centre_id,
            status: newTrip.status,
            distance_km: newTrip.distance_km,
            eta_minutes: newTrip.eta_minutes,
            created_at: newTrip.created_at,
          }]).then(({ error }) => {
            if (error) console.warn('Supabase trips insert error:', error.message);
          });
        } catch (e) {
          console.warn('Supabase trips insert error:', e);
        }
      }

      sendSms({
        phone: assignedVehicle.driver_phone,
        message: `Pickup assigned: ${params.farmerName || 'Farmer Ramesh'}, ${params.crop_quantity_kg}kg at ${params.preferred_pickup_time}. Location: ${params.pickup_location}. Open driver dashboard.`,
        type: 'transactional',
      });

      sendSms({
        phone: params.farmerPhone || '+919876543201',
        message: `Vehicle assigned! Driver: ${assignedVehicle.driver_name}, Phone: ${assignedVehicle.driver_phone}, Vehicle: ${assignedVehicle.registration_number}. Scheduled pickup: ${params.preferred_pickup_time}.`,
        type: 'transactional',
      });

      this.createNotification({
        user_id: validFarmerId,
        title: 'Vehicle Assigned!',
        message: `Driver ${assignedVehicle.driver_name} (${assignedVehicle.registration_number}) will arrive at ${params.preferred_pickup_time}.`,
        type: 'transport',
        link: '/farmer/vehicle-tracking',
      });
    }

    return { vehicleRequest: newRequest, assignedVehicle };
  }

  // Vehicle Transport Slot Booking
  public confirmVehicleSlotBooking(params: {
    farmer_id: string;
    centre_id: string;
    crop_id?: string;
    vehicle_request_id?: string;
    assigned_vehicle_id?: string;
    date: string;
    time_slot: string;
    pickup_location: string;
    pickup_latitude: number;
    pickup_longitude: number;
    preferred_pickup_time: string;
    farmerName?: string;
    farmerPhone?: string;
    driverName?: string;
    driverPhone?: string;
  }): Booking {
    const bookings = this.getCollection<Booking>('bookings');
    const tokenNumber = 1000 + bookings.length + 1;
    const tokenCode = `KFA-${tokenNumber}`;
    const validBookingId = generateUUID();
    const validFarmerId = isUUID(params.farmer_id) ? params.farmer_id : '44444444-4444-4444-4444-444444444401';
    const validCentreId = isUUID(params.centre_id) ? params.centre_id : '22222222-2222-2222-2222-222222222203';
    const validCropId = params.crop_id && isUUID(params.crop_id) ? params.crop_id : null;

    const newBooking: Booking = {
      id: validBookingId,
      farmer_id: validFarmerId,
      centre_id: validCentreId,
      slot_id: generateUUID(),
      crop_id: validCropId || undefined,
      date: params.date,
      time_slot: params.time_slot,
      token_number: tokenNumber,
      token_code: tokenCode,
      transport_mode: 'vehicle',
      pickup_location: params.pickup_location,
      pickup_latitude: params.pickup_latitude,
      pickup_longitude: params.pickup_longitude,
      preferred_pickup_time: params.preferred_pickup_time,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    bookings.unshift(newBooking);
    this.setCollection('bookings', bookings);

    if (isLiveSupabaseConfigured()) {
      try {
        const prefTime = params.preferred_pickup_time.includes(':')
          ? params.preferred_pickup_time.split(' ')[0]
          : '07:30:00';

        supabase.from('bookings').insert([{
          id: newBooking.id,
          farmer_id: newBooking.farmer_id,
          centre_id: newBooking.centre_id,
          crop_id: newBooking.crop_id || null,
          date: newBooking.date,
          time_slot: newBooking.time_slot,
          token_number: newBooking.token_number,
          token_code: newBooking.token_code,
          transport_mode: newBooking.transport_mode,
          pickup_location: newBooking.pickup_location || null,
          pickup_latitude: newBooking.pickup_latitude || null,
          pickup_longitude: newBooking.pickup_longitude || null,
          preferred_pickup_time: prefTime,
          status: newBooking.status,
          created_at: newBooking.created_at,
        }]).then(({ error }) => {
          if (error) console.warn('Supabase bookings insert error:', error.message);
        });
      } catch (e) {
        console.warn('Supabase bookings insert error:', e);
      }
    }

    // Update queue
    const queue = this.getCollection<QueueItem>('queue');
    const newQueueItem: QueueItem = {
      id: generateUUID(),
      centre_id: validCentreId,
      booking_id: newBooking.id,
      token_number: tokenNumber,
      token_code: tokenCode,
      farmer_name: params.farmerName || 'Farmer Ramesh',
      position: queue.filter((q) => q.status === 'waiting').length + 1,
      status: 'waiting',
      created_at: new Date().toISOString(),
    };
    queue.push(newQueueItem);
    this.setCollection('queue', queue);

    if (isLiveSupabaseConfigured()) {
      try {
        supabase.from('queue').insert([{
          id: newQueueItem.id,
          centre_id: newQueueItem.centre_id,
          booking_id: newQueueItem.booking_id,
          token_number: newQueueItem.token_number,
          token_code: newQueueItem.token_code,
          position: newQueueItem.position,
          status: newQueueItem.status,
          created_at: newQueueItem.created_at,
        }]).then(({ error }) => {
          if (error) console.warn('Supabase queue insert error:', error.message);
        });
      } catch (e) {
        console.warn('Supabase queue insert error:', e);
      }
    }

    // Update crop
    if (params.crop_id) {
      this.updateCrop(params.crop_id, { status: 'slot_booked' });
    }

    // Update vehicle request status
    if (params.vehicle_request_id) {
      const requests = this.getCollection<VehicleRequest>('vehicle_requests');
      const req = requests.find((r) => r.id === params.vehicle_request_id);
      if (req) {
        req.status = 'completed';
        this.setCollection('vehicle_requests', requests);
      }
    }

    // Send confirmations
    sendSms({
      phone: params.farmerPhone || '+919876543201',
      message: `Slot booked! Token #${tokenNumber}, ${params.date} at ${params.time_slot}. Vehicle pickup at ${params.preferred_pickup_time}. Driver: ${params.driverName || 'Suresh'}, ${params.driverPhone || '+919876543210'}.`,
      type: 'transactional',
    });

    return newBooking;
  }

  // Offline Farmer Assistance
  public createOfflineFarmer(data: Omit<OfflineFarmer, 'id' | 'created_at'>): OfflineFarmer {
    const list = this.getCollection<OfflineFarmer>('offline_farmers');
    const tokenNumber = 1040 + list.length + 1;
    const tokenCode = `KFA-OF-${tokenNumber}`;
    const validOfflineId = generateUUID();
    const validOfficerId = isUUID(data.society_officer_id) ? data.society_officer_id : '00000000-0000-0000-0000-000000000003';
    const validCentreId = isUUID(data.centre_id) ? data.centre_id : '22222222-2222-2222-2222-222222222203';
    const validVehicleId = data.assigned_vehicle_id && isUUID(data.assigned_vehicle_id) ? data.assigned_vehicle_id : '33333333-3333-3333-3333-333333333301';

    const newOfflineFarmer: OfflineFarmer = {
      ...data,
      id: validOfflineId,
      society_officer_id: validOfficerId,
      centre_id: validCentreId,
      assigned_vehicle_id: data.transport_choice === 'vehicle' ? validVehicleId : undefined,
      token_number: tokenNumber,
      token_code: tokenCode,
      status: data.transport_choice === 'vehicle' ? 'vehicle_assigned' : 'slot_booked',
      created_at: new Date().toISOString(),
    };

    list.unshift(newOfflineFarmer);
    this.setCollection('offline_farmers', list);

    if (isLiveSupabaseConfigured()) {
      try {
        const prefTime = newOfflineFarmer.preferred_pickup_time
          ? (newOfflineFarmer.preferred_pickup_time.includes(':') ? newOfflineFarmer.preferred_pickup_time.split(' ')[0] : '07:30:00')
          : null;

        supabase.from('offline_farmers').insert([{
          id: newOfflineFarmer.id,
          society_officer_id: newOfflineFarmer.society_officer_id,
          farmer_name: newOfflineFarmer.farmer_name,
          father_husband_name: newOfflineFarmer.father_husband_name || null,
          aadhaar_masked: newOfflineFarmer.aadhaar_masked,
          village: newOfflineFarmer.village,
          district: newOfflineFarmer.district,
          block: newOfflineFarmer.block || null,
          mobile_optional: newOfflineFarmer.mobile_optional || null,
          alternate_contact_name: newOfflineFarmer.alternate_contact_name,
          alternate_contact_phone: newOfflineFarmer.alternate_contact_phone,
          land_area_hectares: newOfflineFarmer.land_area_hectares,
          ifsc_code: newOfflineFarmer.ifsc_code,
          crop_type: newOfflineFarmer.crop_type,
          expected_quantity_kg: newOfflineFarmer.expected_quantity_kg,
          harvest_date: newOfflineFarmer.harvest_date || null,
          centre_id: newOfflineFarmer.centre_id,
          transport_choice: newOfflineFarmer.transport_choice,
          assigned_vehicle_id: newOfflineFarmer.assigned_vehicle_id || null,
          pickup_location: newOfflineFarmer.pickup_location || null,
          pickup_latitude: newOfflineFarmer.pickup_latitude || null,
          pickup_longitude: newOfflineFarmer.pickup_longitude || null,
          preferred_pickup_time: prefTime,
          special_instructions: newOfflineFarmer.special_instructions || null,
          token_number: newOfflineFarmer.token_number,
          token_code: newOfflineFarmer.token_code,
          status: newOfflineFarmer.status,
          created_at: newOfflineFarmer.created_at,
        }]).then(({ error }) => {
          if (error) console.warn('Supabase offline_farmers insert error:', error.message);
        });
      } catch (e) {
        console.warn('Supabase offline_farmers insert error:', e);
      }
    }

    // Also add to central queue
    const queue = this.getCollection<QueueItem>('queue');
    const newQueueItem: QueueItem = {
      id: generateUUID(),
      centre_id: validCentreId,
      booking_id: newOfflineFarmer.id,
      token_number: tokenNumber,
      token_code: tokenCode,
      farmer_name: data.farmer_name,
      position: queue.filter((q) => q.status === 'waiting').length + 1,
      status: 'waiting',
      created_at: new Date().toISOString(),
    };
    queue.push(newQueueItem);
    this.setCollection('queue', queue);

    sendSms({
      phone: data.alternate_contact_phone,
      message: `Slot booked for Farmer ${data.farmer_name}. Token: ${tokenCode}. Transport: ${data.transport_choice.toUpperCase()}. Report 15 mins early at Mandi.`,
      type: 'transactional',
    });

    this.createNotification({
      user_id: validOfficerId,
      title: 'Offline Farmer Token Generated',
      message: `Generated Token ${tokenCode} for ${data.farmer_name}. Alternate SMS dispatched.`,
      type: 'success',
      link: '/society/offline-farmers',
    });

    return newOfflineFarmer;
  }

  // Procurement Officer: Call Next Token
  public callNextToken(centreId: string): QueueItem | null {
    const queue = this.getCollection<QueueItem>('queue');
    const waitingItems = queue.filter((q) => q.centre_id === centreId && q.status === 'waiting');

    if (waitingItems.length === 0) return null;

    // First waiting item becomes called
    const target = waitingItems[0];
    target.status = 'called';
    target.called_at = new Date().toISOString();

    // Recompute positions
    let pos = 1;
    queue.forEach((q) => {
      if (q.centre_id === centreId && q.status === 'waiting') {
        q.position = pos++;
      }
    });

    this.setCollection('queue', queue);

    // Send SMS alert to farmer
    sendSms({
      phone: '+919876543201',
      message: `Mandi Token Alert: Your token #${target.token_number} (${target.token_code}) has been CALLED to Weighbridge Bay 1. Please proceed immediately.`,
      type: 'alert',
    });

    // Notification
    this.createNotification({
      user_id: 'usr-farmer',
      title: '🔔 Your Token Has Been Called!',
      message: `Token ${target.token_code} is now being processed at Weighbridge Bay 1.`,
      type: 'urgent',
      link: '/farmer/queue',
    });

    return target;
  }

  // Notifications
  public createNotification(notif: Omit<NotificationItem, 'id' | 'read' | 'created_at'>): NotificationItem {
    const notifs = this.getCollection<NotificationItem>('notifications');
    const item: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    notifs.unshift(item);
    this.setCollection('notifications', notifs);
    return item;
  }

  public markNotificationAsRead(id: string) {
    const notifs = this.getCollection<NotificationItem>('notifications');
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.read = true;
      this.setCollection('notifications', notifs);
    }
  }

  public markAllNotificationsAsRead(userId: string) {
    const notifs = this.getCollection<NotificationItem>('notifications');
    notifs.forEach((n) => {
      if (n.user_id === userId) n.read = true;
    });
    this.setCollection('notifications', notifs);
  }

  // Driver Trip Status Update
  public updateTripStatus(tripId: string, status: Trip['status']): Trip | null {
    const trips = this.getCollection<Trip>('trips');
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return null;

    trip.status = status;
    if (status === 'completed') {
      trip.end_time = new Date().toISOString();
    }
    this.setCollection('trips', trips);

    // Update vehicle status
    const vehicles = this.getCollection<Vehicle>('vehicles');
    const veh = vehicles.find((v) => v.id === trip.vehicle_id);
    if (veh) {
      if (status === 'completed') veh.status = 'available';
      else if (status === 'going_to_farmer' || status === 'going_to_centre') veh.status = 'on_trip';
      this.setCollection('vehicles', vehicles);
    }

    // Broadcast trip and vehicle updates
    this.emit(`trip:${tripId}`, trip);
    this.emit(`vehicle:${trip.vehicle_id}`, veh);

    // Notify farmer
    const statusMessages: Record<string, string> = {
      going_to_farmer: 'Driver is on the way to your farm/village.',
      arrived: 'Driver has arrived at pickup location.',
      picked_up: 'Crop loaded into vehicle. Departing for procurement mandi.',
      going_to_centre: 'Vehicle in transit to procurement centre.',
      at_centre: 'Vehicle arrived at procurement mandi gate pass.',
      completed: 'Trip successfully completed and crop offloaded.',
    };

    if (statusMessages[status]) {
      sendSms({
        phone: trip.farmer_phone || '+919876543201',
        message: `Transit Update: ${statusMessages[status]} (Trip #${trip.id.slice(-4)})`,
        type: 'transactional',
      });

      this.createNotification({
        user_id: 'usr-farmer',
        title: 'Vehicle Status Update',
        message: statusMessages[status],
        type: 'transport',
        link: '/farmer/vehicle-tracking',
      });
    }

    return trip;
  }
}

export const db = new ReactiveDatabase();
