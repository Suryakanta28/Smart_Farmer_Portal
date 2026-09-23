-- =========================================================================
-- KRISHIFLOW-AI: Master Unified Database Schema & Production Seed Data
-- Smart India Hackathon 2026 (Problem ID: SIH26032)
-- Supabase PostgreSQL with 19 Tables, RLS Policies, Realtime & Complete Seed Data
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. SOCIETIES (PACS - Primary Agricultural Cooperative Societies)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.societies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    district TEXT NOT NULL,
    block TEXT NOT NULL,
    address TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 2. PROCUREMENT CENTRES (Mandi Yards & Warehouses)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.procurement_centres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity_tonnes_per_day NUMERIC DEFAULT 250,
    operating_hours TEXT DEFAULT '09:00 AM - 05:00 PM',
    queue_length INTEGER DEFAULT 0,
    avg_wait_time_minutes INTEGER DEFAULT 45,
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 3. USERS (Multi-Role Portal Personnel, Managers & Admins)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('farmer', 'society_officer', 'procurement_officer', 'driver', 'manager')),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    designation TEXT,
    avatar_url TEXT,
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revoked')),
    account_status TEXT NOT NULL DEFAULT 'inactive' CHECK (account_status IN ('inactive', 'active', 'suspended', 'revoked')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.users(id),
    society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL,
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 4. FARMERS (Farmer Profiles, Land & KYC)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    father_husband_name TEXT,
    aadhaar_masked TEXT NOT NULL,
    aadhaar_encrypted TEXT,
    village TEXT NOT NULL,
    district TEXT NOT NULL,
    block TEXT,
    state TEXT DEFAULT 'Odisha',
    land_area_hectares DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    bank_account TEXT,
    bank_account_encrypted TEXT,
    ifsc_code TEXT NOT NULL,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'offline_verified')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.users(id),
    avatar_url TEXT,
    alternate_contact_name TEXT,
    alternate_contact_phone TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =========================================================================
-- 5. REGISTRATION REQUESTS (Approval Workflow Queue)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.registration_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'society_officer', 'procurement_officer', 'driver')),
    mobile_number TEXT NOT NULL,
    email TEXT,
    password TEXT,
    land_area_hectares DOUBLE PRECISION,
    aadhaar_masked TEXT,
    village TEXT,
    district TEXT,
    block TEXT,
    state TEXT DEFAULT 'Odisha',
    bank_account TEXT,
    ifsc_code TEXT,
    society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL,
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE SET NULL,
    designation TEXT,
    vehicle_reg_no TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_by_name TEXT,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 6. CROPS (Registered Crop Offerings)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    expected_quantity_kg DOUBLE PRECISION NOT NULL,
    harvest_date DATE NOT NULL,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'procurement_requested', 'vehicle_requested', 'slot_booked', 'in_transit', 'weighed', 'procured', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 7. SLOTS (Procurement Center Time Slots)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    capacity_farmers INTEGER DEFAULT 10,
    booked_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'full', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 8. VEHICLES (Transport & Logistics Fleet)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number TEXT UNIQUE NOT NULL,
    vehicle_type TEXT NOT NULL,
    capacity_kg DOUBLE PRECISION NOT NULL,
    driver_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    driver_name TEXT NOT NULL,
    driver_phone TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'on_trip', 'offline', 'maintenance')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    last_gps_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 9. BOOKINGS (Farmer Procurement Appointments)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES public.slots(id) ON DELETE SET NULL,
    crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    token_number INTEGER NOT NULL,
    token_code TEXT NOT NULL UNIQUE,
    qr_code TEXT,
    transport_mode TEXT NOT NULL CHECK (transport_mode IN ('self', 'vehicle')),
    pickup_location TEXT,
    pickup_latitude DOUBLE PRECISION,
    pickup_longitude DOUBLE PRECISION,
    preferred_pickup_time TIME,
    special_instructions TEXT,
    is_offline_farmer BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no-show', 'in_progress')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 10. VEHICLE REQUESTS (Free Farm-Gate Pickup Requests)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.vehicle_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    pickup_location TEXT NOT NULL,
    pickup_latitude DOUBLE PRECISION NOT NULL,
    pickup_longitude DOUBLE PRECISION NOT NULL,
    crop_quantity_kg DOUBLE PRECISION NOT NULL,
    preferred_pickup_time TIME NOT NULL,
    alternate_phone TEXT,
    special_instructions TEXT,
    assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 11. TRIPS (Realtime Fleet Logistics Trips)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'assigned' CHECK (status IN (
        'assigned', 'accepted', 'going_to_farmer', 'arrived', 
        'picked_up', 'going_to_centre', 'at_centre', 'completed', 'cancelled'
    )),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    distance_km DOUBLE PRECISION,
    eta_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 12. QUEUE (Mandi Gate & Weighbridge Token Queue)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    token_number INTEGER NOT NULL,
    token_code TEXT NOT NULL,
    position INTEGER NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'processing', 'completed', 'skipped')),
    called_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 13. PROCUREMENTS (Weighbridge, Moisture & Quality Grading)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.procurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    gross_weight_kg DOUBLE PRECISION NOT NULL,
    tare_weight_kg DOUBLE PRECISION NOT NULL,
    net_weight_kg DOUBLE PRECISION NOT NULL,
    moisture_percentage DOUBLE PRECISION NOT NULL,
    foreign_matter_percentage DOUBLE PRECISION DEFAULT 0.5,
    quality_grade TEXT NOT NULL CHECK (quality_grade IN ('Grade A', 'Grade B', 'Grade C', 'Rejected')),
    msp_rate_per_quintal NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    gate_pass_number TEXT UNIQUE NOT NULL,
    verified_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 14. PAYMENTS (Direct Benefit Transfer - PFMS Gateway)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procurement_id UUID REFERENCES public.procurements(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    pfms_status TEXT DEFAULT 'initiated' CHECK (pfms_status IN ('gate_pass_issued', 'quality_checked', 'weighed', 'initiated', 'processing', 'credited', 'failed')),
    pfms_transaction_id TEXT,
    bank_ref_number TEXT,
    credited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 15. NOTIFICATIONS (Live In-App Alerts & SMS Logs)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'urgent', 'payment', 'transport')),
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 16. OFFLINE FARMERS (Society Officer Assisted Onboarding)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.offline_farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_officer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    farmer_name TEXT NOT NULL,
    father_husband_name TEXT,
    aadhaar_masked TEXT NOT NULL,
    village TEXT NOT NULL,
    district TEXT NOT NULL,
    block TEXT,
    mobile_optional TEXT,
    alternate_contact_name TEXT NOT NULL,
    alternate_contact_phone TEXT NOT NULL,
    land_area_hectares DOUBLE PRECISION NOT NULL,
    bank_account_encrypted TEXT,
    ifsc_code TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    expected_quantity_kg DOUBLE PRECISION NOT NULL,
    harvest_date DATE,
    centre_id UUID REFERENCES public.procurement_centres(id),
    transport_choice TEXT NOT NULL CHECK (transport_choice IN ('self', 'vehicle')),
    assigned_vehicle_id UUID REFERENCES public.vehicles(id),
    pickup_location TEXT,
    pickup_latitude DOUBLE PRECISION,
    pickup_longitude DOUBLE PRECISION,
    preferred_pickup_time TIME,
    special_instructions TEXT,
    slot_id UUID REFERENCES public.slots(id),
    token_number INTEGER,
    token_code TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'slot_booked', 'vehicle_assigned', 'processing', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 17. ALERTS (State Procurement Bottleneck & Surge Alerts)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 18. PROCUREMENT REQUESTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.procurement_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE,
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE CASCADE,
    transport_mode TEXT CHECK (transport_mode IN ('self', 'vehicle')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 19. AUDIT LOGS (Immutable Activity Ledger)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- QUERY PERFORMANCE INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_approval ON public.users(approval_status);

CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON public.farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_district ON public.farmers(district);

CREATE INDEX IF NOT EXISTS idx_reg_requests_status ON public.registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_reg_requests_role ON public.registration_requests(role);
CREATE INDEX IF NOT EXISTS idx_reg_requests_mobile ON public.registration_requests(mobile_number);
CREATE INDEX IF NOT EXISTS idx_reg_requests_requested_at ON public.registration_requests(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON public.bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_centre_id ON public.bookings(centre_id);

-- =========================================================================
-- SUPABASE REALTIME REPLICATION (ALL 19 TABLES)
-- =========================================================================
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.registration_requests,
            public.users,
            public.farmers,
            public.societies,
            public.procurement_centres,
            public.crops,
            public.slots,
            public.vehicles,
            public.bookings,
            public.vehicle_requests,
            public.trips,
            public.queue,
            public.procurements,
            public.payments,
            public.notifications,
            public.offline_farmers,
            public.alerts,
            public.procurement_requests,
            public.audit_logs;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN others THEN NULL;
    END;
END $$;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public access policies for connected client & anonymous registration
DROP POLICY IF EXISTS "Public registration requests insert" ON public.registration_requests;
CREATE POLICY "Public registration requests insert" ON public.registration_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public registration requests select" ON public.registration_requests;
CREATE POLICY "Public registration requests select" ON public.registration_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public registration requests update" ON public.registration_requests;
CREATE POLICY "Public registration requests update" ON public.registration_requests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public registration requests delete" ON public.registration_requests;
CREATE POLICY "Public registration requests delete" ON public.registration_requests FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read centres" ON public.procurement_centres;
CREATE POLICY "Public read centres" ON public.procurement_centres FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read societies" ON public.societies;
CREATE POLICY "Public read societies" ON public.societies FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all users" ON public.users;
CREATE POLICY "Allow all users" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all farmers" ON public.farmers;
CREATE POLICY "Allow all farmers" ON public.farmers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all crops" ON public.crops;
CREATE POLICY "Allow all crops" ON public.crops FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all slots" ON public.slots;
CREATE POLICY "Allow all slots" ON public.slots FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all vehicles" ON public.vehicles;
CREATE POLICY "Allow all vehicles" ON public.vehicles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all bookings" ON public.bookings;
CREATE POLICY "Allow all bookings" ON public.bookings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all trips" ON public.trips;
CREATE POLICY "Allow all trips" ON public.trips FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all queue" ON public.queue;
CREATE POLICY "Allow all queue" ON public.queue FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all procurements" ON public.procurements;
CREATE POLICY "Allow all procurements" ON public.procurements FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all payments" ON public.payments;
CREATE POLICY "Allow all payments" ON public.payments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all notifications" ON public.notifications;
CREATE POLICY "Allow all notifications" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all offline_farmers" ON public.offline_farmers;
CREATE POLICY "Allow all offline_farmers" ON public.offline_farmers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all alerts" ON public.alerts;
CREATE POLICY "Allow all alerts" ON public.alerts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all vehicle_requests" ON public.vehicle_requests;
CREATE POLICY "Allow all vehicle_requests" ON public.vehicle_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all procurement_requests" ON public.procurement_requests;
CREATE POLICY "Allow all procurement_requests" ON public.procurement_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all audit_logs" ON public.audit_logs FOR ALL USING (true);

-- =========================================================================
-- COMPLETE PRODUCTION SEED DATA (ALL 19 TABLES)
-- =========================================================================

-- 1. Societies (PACS)
INSERT INTO public.societies (id, name, code, district, block, address, contact_phone) VALUES
('11111111-1111-1111-1111-111111111101', 'Nilokheri Primary Agri Cooperative', 'PACS-NIL-01', 'Karnal', 'Nilokheri', 'Nilokheri Mandi Road, Haryana', '+919876500001'),
('11111111-1111-1111-1111-111111111102', 'Bargarh Farmer Welfare Society (Attabira)', 'PACS-BAR-02', 'Bargarh', 'Attabira', 'Main Canal Road, Attabira, Bargarh, Odisha', '+919876500002'),
('11111111-1111-1111-1111-111111111103', 'Sambalpur Central PAC Society', 'PACS-SBP-03', 'Sambalpur', 'Maneswar', 'NH-53 Junction, Sambalpur, Odisha', '+919876500003'),
('11111111-1111-1111-1111-111111111104', 'Cuttack Sadar Krishak Sahakari Samiti', 'PACS-CTC-04', 'Cuttack', 'Baranga', 'Trisulia Chowk, Cuttack, Odisha', '+919876500004')
ON CONFLICT (code) DO NOTHING;

-- 2. Procurement Centres (Mandis)
INSERT INTO public.procurement_centres (id, name, code, district, address, latitude, longitude, capacity_tonnes_per_day, operating_hours, queue_length, avg_wait_time_minutes, contact_phone) VALUES
('22222222-2222-2222-2222-222222222201', 'Nilokheri Grain Procurement Mandi', 'PC-NIL-01', 'Karnal', 'GT Road, Near Railway Overbridge, Nilokheri, Haryana', 29.8335, 76.9197, 350, '08:00 AM - 06:00 PM', 12, 35, '+9118001802021'),
('22222222-2222-2222-2222-222222222202', 'Attabira Rice Procurement Complex', 'PC-ATT-02', 'Bargarh', 'Regulated Market Yard, Attabira, Bargarh, Odisha', 21.3644, 83.7844, 450, '08:00 AM - 06:00 PM', 18, 45, '+9118001802022'),
('22222222-2222-2222-2222-222222222203', 'Sambalpur Regulated Market Yard', 'PC-SBP-03', 'Sambalpur', 'Dhanupali Chowk, Sambalpur, Odisha', 21.4550, 83.9850, 380, '08:30 AM - 05:30 PM', 9, 25, '+9118001802023'),
('22222222-2222-2222-2222-222222222204', 'Cuttack Central Mandi Complex', 'PC-CTC-04', 'Cuttack', 'Malgodown Road, Cuttack, Odisha', 20.4625, 85.8830, 500, '08:00 AM - 06:30 PM', 24, 60, '+9118001802024'),
('22222222-2222-2222-2222-222222222205', 'Bhubaneswar Agri Warehouse Mandi', 'PC-BBS-05', 'Khurda', 'Chandaka Industrial Area, Bhubaneswar, Odisha', 20.3540, 85.8180, 420, '08:00 AM - 06:00 PM', 15, 40, '+9118001802025')
ON CONFLICT (code) DO NOTHING;

-- 3. Users (Managers, Admins, Officers, Drivers, Farmers)
INSERT INTO public.users (id, role, name, phone, email, password, designation, approval_status, account_status, society_id, centre_id, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'manager', 'Dr. Alok Ranjan Rath (IAS)', '+919876543205', 'manager@krishiflow.ai', 'manager123', 'State Procurement Commissioner & IAS Officer', 'approved', 'active', NULL, NULL, NOW()),
('00000000-0000-0000-0000-000000000002', 'manager', 'Suryakanta Ray (State Admin)', '+919876543200', 'admin@krishiflow.ai', 'manager123', 'State Agriculture HQ Administrator', 'approved', 'active', NULL, NULL, NOW()),
('00000000-0000-0000-0000-000000000003', 'society_officer', 'Subhashree Barik', '+919876543202', 'society@krishiflow.ai', 'society123', 'PACS Senior Secretary', 'approved', 'active', '11111111-1111-1111-1111-111111111103', NULL, NOW() - INTERVAL '60 days'),
('00000000-0000-0000-0000-000000000004', 'procurement_officer', 'Ashok Kumar Behera', '+919876543203', 'officer@krishiflow.ai', 'officer123', 'Mandi Senior Weighbridge Incharge', 'approved', 'active', NULL, '22222222-2222-2222-2222-222222222203', NOW() - INTERVAL '90 days'),
('00000000-0000-0000-0000-000000000005', 'driver', 'Suresh Kumar Mohapatra', '+919876543210', 'driver@krishiflow.ai', 'driver123', 'Logistics Fleet Driver', 'approved', 'active', NULL, NULL, NOW()),
('00000000-0000-0000-0000-000000000006', 'farmer', 'Ramesh Chandra Pradhan', '+919876543201', 'farmer@krishiflow.ai', 'farmer123', 'Registered Progressive Kisan', 'approved', 'active', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000007', 'farmer', 'Santosh Meher', '+919876543206', 'santosh.farmer@krishiflow.ai', 'farmer123', 'Registered Kisan', 'approved', 'active', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', NOW() - INTERVAL '25 days'),
('00000000-0000-0000-0000-000000000008', 'farmer', 'Debendra Nath Sahoo', '+919876543207', 'debendra.farmer@krishiflow.ai', 'farmer123', 'Registered Kisan', 'approved', 'active', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222204', NOW() - INTERVAL '15 days'),
('00000000-0000-0000-0000-000000000009', 'farmer', 'Kailash Chandra Barik', '+919876543208', 'kailash.farmer@krishiflow.ai', 'farmer123', 'Applicant Kisan', 'pending', 'active', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000010', 'society_officer', 'Rajesh Kumar Nayak', '+919876543220', 'rajesh.pacs@krishiflow.ai', 'society123', 'PACS Assistant Secretary', 'approved', 'active', '11111111-1111-1111-1111-111111111102', NULL, NOW() - INTERVAL '45 days'),
('00000000-0000-0000-0000-000000000011', 'procurement_officer', 'Dilip Kumar Rout', '+919876543230', 'dilip.mandi@krishiflow.ai', 'officer123', 'Mandi Weighbridge Operator', 'approved', 'active', NULL, '22222222-2222-2222-2222-222222222202', NOW() - INTERVAL '50 days')
ON CONFLICT (phone) DO UPDATE SET 
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    approval_status = EXCLUDED.approval_status,
    account_status = EXCLUDED.account_status,
    society_id = EXCLUDED.society_id,
    centre_id = EXCLUDED.centre_id;

-- 4. Farmers Profile Table
INSERT INTO public.farmers (id, user_id, name, father_husband_name, aadhaar_masked, village, district, block, state, land_area_hectares, bank_account, ifsc_code, kyc_status, alternate_contact_name, alternate_contact_phone, latitude, longitude, created_at) VALUES
('44444444-4444-4444-4444-444444444401', '00000000-0000-0000-0000-000000000006', 'Ramesh Chandra Pradhan', 'Late Bipin Bihari Pradhan', 'XXXX-XXXX-8921', 'Maneswar Rural', 'Sambalpur', 'Maneswar', 'Odisha', 2.4, '982100192831', 'SBIN0000178', 'verified', 'Pravat Pradhan (Son)', '+919876549900', 21.4820, 83.9620, NOW() - INTERVAL '30 days'),
('44444444-4444-4444-4444-444444444402', '00000000-0000-0000-0000-000000000007', 'Santosh Meher', 'Dhaneswar Meher', 'XXXX-XXXX-4532', 'Attabira Village', 'Bargarh', 'Attabira', 'Odisha', 3.1, '982100192832', 'UBIN0542381', 'verified', 'Gitanjali Meher (Wife)', '+919876549901', 21.3520, 83.7710, NOW() - INTERVAL '25 days'),
('44444444-4444-4444-4444-444444444403', '00000000-0000-0000-0000-000000000008', 'Debendra Nath Sahoo', 'Ranjan Sahoo', 'XXXX-XXXX-7619', 'Baranga Gram', 'Cuttack', 'Baranga', 'Odisha', 1.8, '982100192833', 'PUNB0019283', 'verified', 'Minati Sahoo (Mother)', '+919876549902', 20.4510, 85.8720, NOW() - INTERVAL '15 days'),
('44444444-4444-4444-4444-444444444404', '00000000-0000-0000-0000-000000000009', 'Kailash Chandra Barik', 'Ganesh Barik', 'XXXX-XXXX-3341', 'Maneswar Basti', 'Sambalpur', 'Maneswar', 'Odisha', 4.2, '982100192834', 'SBIN0000178', 'pending', 'Anup Barik (Brother)', '+919876549903', 21.4610, 83.9710, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Registration Requests (Approval Queue)
INSERT INTO public.registration_requests (id, full_name, role, mobile_number, email, password, land_area_hectares, aadhaar_masked, village, district, block, state, bank_account, ifsc_code, society_id, centre_id, designation, details, status, requested_at) VALUES
('12345678-1234-1234-1234-123456789001', 'Manas Ranjan Swain', 'farmer', '+919876543290', 'manas.farmer@krishiflow.ai', 'farmer123', 3.5, 'XXXX-XXXX-9912', 'Rengali Basti', 'Sambalpur', 'Maneswar', 'Odisha', '981234567890', 'SBIN0000178', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', NULL, '{"crop_intent": "Paddy", "irrigation": "Canal"}'::jsonb, 'pending', NOW() - INTERVAL '4 hours'),
('12345678-1234-1234-1234-123456789002', 'Alok Kumar Panigrahi', 'society_officer', '+919876543291', 'alok.pacs@krishiflow.ai', 'society123', NULL, NULL, NULL, 'Bargarh', 'Attabira', 'Odisha', NULL, NULL, '11111111-1111-1111-1111-111111111102', NULL, 'PACS Sub-Secretary', '{"staff_id": "PACS-BAR-998"}'::jsonb, 'pending', NOW() - INTERVAL '3 hours'),
('12345678-1234-1234-1234-123456789003', 'Birendra Kumar Sahu', 'procurement_officer', '+919876543292', 'birendra.mandi@krishiflow.ai', 'officer123', NULL, NULL, NULL, 'Sambalpur', 'Maneswar', 'Odisha', NULL, NULL, NULL, '22222222-2222-2222-2222-222222222203', 'Mandi Quality Supervisor', '{"mandi_id": "PC-SBP-03-Q1"}'::jsonb, 'pending', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- 6. Vehicles Fleet
INSERT INTO public.vehicles (id, registration_number, vehicle_type, capacity_kg, driver_user_id, driver_name, driver_phone, status, latitude, longitude, last_gps_update) VALUES
('33333333-3333-3333-3333-333333333301', 'OD-15-AB-1024', 'Mini Truck (1.5T)', 1500, '00000000-0000-0000-0000-000000000005', 'Suresh Kumar Mohapatra', '+919876543210', 'available', 21.4680, 83.9780, NOW()),
('33333333-3333-3333-3333-333333333302', 'OD-17-CD-3456', 'Tractor Trolley (3.5T)', 3500, NULL, 'Prakash Sethi', '+919876543211', 'on_trip', 21.3690, 83.7790, NOW()),
('33333333-3333-3333-3333-333333333303', 'HR-05-XY-7890', 'Medium Truck (5.0T)', 5000, NULL, 'Gurmeet Singh', '+919876543212', 'available', 29.8310, 76.9150, NOW()),
('33333333-3333-3333-3333-333333333304', 'OD-02-KL-9988', 'Tata Ace (1.2T)', 1200, NULL, 'Manoj Sahoo', '+919876543213', 'available', 20.4600, 85.8810, NOW())
ON CONFLICT (registration_number) DO NOTHING;

-- 7. Slots (Mandi Capacity Slots)
INSERT INTO public.slots (id, centre_id, date, time_slot, capacity_farmers, booked_count, status) VALUES
('66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222203', CURRENT_DATE, '10:00 AM - 10:30 AM', 10, 3, 'available'),
('66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222203', CURRENT_DATE, '10:30 AM - 11:00 AM', 10, 2, 'available'),
('66666666-6666-6666-6666-666666666603', '22222222-2222-2222-2222-222222222202', CURRENT_DATE, '09:00 AM - 09:30 AM', 15, 5, 'available'),
('66666666-6666-6666-6666-666666666604', '22222222-2222-2222-2222-222222222204', CURRENT_DATE, '11:00 AM - 11:30 AM', 12, 4, 'available'),
('66666666-6666-6666-6666-666666666605', '22222222-2222-2222-2222-222222222201', CURRENT_DATE, '09:30 AM - 10:00 AM', 15, 2, 'available')
ON CONFLICT (id) DO NOTHING;

-- 8. Crops
INSERT INTO public.crops (id, farmer_id, crop_type, expected_quantity_kg, harvest_date, status) VALUES
('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', 'Paddy (Common)', 2400, CURRENT_DATE - INTERVAL '2 days', 'slot_booked'),
('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444401', 'Wheat (Sharbati)', 1800, CURRENT_DATE + INTERVAL '5 days', 'registered'),
('55555555-5555-5555-5555-555555555503', '44444444-4444-4444-4444-444444444402', 'Paddy (Grade A)', 3200, CURRENT_DATE - INTERVAL '1 day', 'registered'),
('55555555-5555-5555-5555-555555555504', '44444444-4444-4444-4444-444444444403', 'Maize (Hybrid)', 2000, CURRENT_DATE, 'registered')
ON CONFLICT (id) DO NOTHING;

-- 9. Bookings
INSERT INTO public.bookings (id, farmer_id, centre_id, slot_id, crop_id, date, time_slot, token_number, token_code, qr_code, transport_mode, pickup_location, pickup_latitude, pickup_longitude, preferred_pickup_time, special_instructions, status) VALUES
('77777777-7777-7777-7777-777777777701', '44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222203', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', CURRENT_DATE, '10:00 AM - 10:30 AM', 1024, 'KFA-1024', 'QR-KFA-1024-SBP', 'vehicle', 'Maneswar Rural, Sambalpur', 21.4820, 83.9620, '07:30:00', 'Pack in 50kg standard jute bags by main canal road', 'confirmed'),
('77777777-7777-7777-7777-777777777702', '44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222203', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555503', CURRENT_DATE, '10:00 AM - 10:30 AM', 1022, 'KFA-1022', 'QR-KFA-1022-SBP', 'self', NULL, NULL, NULL, NULL, NULL, 'confirmed'),
('77777777-7777-7777-7777-777777777703', '44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222203', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555504', CURRENT_DATE, '10:00 AM - 10:30 AM', 1023, 'KFA-1023', 'QR-KFA-1023-SBP', 'self', NULL, NULL, NULL, NULL, NULL, 'confirmed')
ON CONFLICT (token_code) DO NOTHING;

-- 10. Vehicle Requests (Farm-gate pickup)
INSERT INTO public.vehicle_requests (id, farmer_id, booking_id, pickup_location, pickup_latitude, pickup_longitude, crop_quantity_kg, preferred_pickup_time, special_instructions, assigned_vehicle_id, status) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffff01', '44444444-4444-4444-4444-444444444401', '77777777-7777-7777-7777-777777777701', 'Maneswar Rural, Sambalpur', 21.4820, 83.9620, 2400, '07:30:00', 'Pack in 50kg standard jute bags by main canal road', '33333333-3333-3333-3333-333333333301', 'assigned')
ON CONFLICT (id) DO NOTHING;

-- 11. Trips (Realtime Logistics)
INSERT INTO public.trips (id, vehicle_id, booking_id, farmer_id, centre_id, status, distance_km, eta_minutes, start_time) VALUES
('88888888-8888-8888-8888-888888888801', '33333333-3333-3333-3333-333333333301', '77777777-7777-7777-7777-777777777701', '44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222203', 'going_to_farmer', 4.8, 14, NOW())
ON CONFLICT (id) DO NOTHING;

-- 12. Queue
INSERT INTO public.queue (id, centre_id, booking_id, token_number, token_code, position, status) VALUES
('99999999-9999-9999-9999-999999999901', '22222222-2222-2222-2222-222222222203', '77777777-7777-7777-7777-777777777701', 1024, 'KFA-1024', 3, 'waiting'),
('99999999-9999-9999-9999-999999999902', '22222222-2222-2222-2222-222222222203', '77777777-7777-7777-7777-777777777702', 1022, 'KFA-1022', 1, 'called'),
('99999999-9999-9999-9999-999999999903', '22222222-2222-2222-2222-222222222203', '77777777-7777-7777-7777-777777777703', 1023, 'KFA-1023', 2, 'waiting')
ON CONFLICT (id) DO NOTHING;

-- 13. Procurements (Weighbridge & Quality)
INSERT INTO public.procurements (id, booking_id, centre_id, farmer_id, crop_type, gross_weight_kg, tare_weight_kg, net_weight_kg, moisture_percentage, foreign_matter_percentage, quality_grade, msp_rate_per_quintal, total_amount, gate_pass_number, verified_by, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '77777777-7777-7777-7777-777777777701', '22222222-2222-2222-2222-222222222203', '44444444-4444-4444-4444-444444444401', 'Paddy (Grade A)', 5420, 420, 5000, 12.8, 0.4, 'Grade A', 2320, 116000, 'GP-2026-9041', '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 day')
ON CONFLICT (gate_pass_number) DO NOTHING;

-- 14. Payments (PFMS DBT)
INSERT INTO public.payments (id, procurement_id, farmer_id, amount, pfms_status, pfms_transaction_id, bank_ref_number, credited_at, created_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '44444444-4444-4444-4444-444444444401', 116000, 'credited', 'PFMS-OD-2026-98124', 'SBIN0029381923', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 15. Notifications
INSERT INTO public.notifications (id, user_id, title, message, type, read, link, created_at) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccc01', '00000000-0000-0000-0000-000000000006', 'Vehicle Pickup Scheduled', 'Mini Truck OD-15-AB-1024 (Driver Suresh) assigned. Pickup at 07:30 AM.', 'transport', FALSE, '/farmer/vehicle-tracking', NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccc02', '00000000-0000-0000-0000-000000000006', 'PFMS DBT Payment Credited', '₹ 1,16,000 credited to SBI A/c ending 8921 for Paddy Gate Pass #GP-2026-9041.', 'payment', FALSE, '/farmer/payments', NOW() - INTERVAL '1 hour'),
('cccccccc-cccc-cccc-cccc-cccccccccc03', '00000000-0000-0000-0000-000000000003', 'New Offline Farmer Request', 'Offline registration submitted for Farmer Baidhar Mallik. Vehicle assigned.', 'info', FALSE, '/society/offline-farmers', NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccc04', '00000000-0000-0000-0000-000000000004', 'Approaching Slot Alert', 'Farmer token #1024 approaching slot window at Bay 2.', 'warning', FALSE, '/officer/queue', NOW())
ON CONFLICT (id) DO NOTHING;

-- 16. Offline Farmers (Assisted Onboarding)
INSERT INTO public.offline_farmers (id, society_officer_id, farmer_name, father_husband_name, aadhaar_masked, village, district, block, alternate_contact_name, alternate_contact_phone, land_area_hectares, ifsc_code, crop_type, expected_quantity_kg, centre_id, transport_choice, slot_id, token_number, token_code, status) VALUES
('dddddddd-dddd-dddd-dddd-ddddddddddd1', '00000000-0000-0000-0000-000000000003', 'Baidhar Mallik', 'Bhima Mallik', 'XXXX-XXXX-7721', 'Nuapali Basti', 'Sambalpur', 'Maneswar', 'Pradeep Mallik (Nephew)', '+919876541122', 1.8, 'SBIN0000178', 'Paddy', 1900, '22222222-2222-2222-2222-222222222203', 'self', '66666666-6666-6666-6666-666666666602', 1042, 'KFA-OF-1042', 'slot_booked')
ON CONFLICT (id) DO NOTHING;

-- 17. Alerts (Bottleneck Alerts)
INSERT INTO public.alerts (id, centre_id, alert_type, severity, message, is_active) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '22222222-2222-2222-2222-222222222203', 'Capacity Warning', 'high', 'Centre capacity 92% (current queue > capacity × 0.9)', TRUE),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', '22222222-2222-2222-2222-222222222203', 'Slot Congestion', 'medium', '5 farmers approaching slot within 30 minutes', TRUE),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', '22222222-2222-2222-2222-222222222203', 'Logistics', 'medium', '3 vehicle requests pending assignment in Sambalpur Zone', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 18. Procurement Requests
INSERT INTO public.procurement_requests (id, farmer_id, crop_id, centre_id, transport_mode, status) VALUES
('aaaaaaaa-1111-2222-3333-444444444441', '44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222203', 'vehicle', 'accepted'),
('aaaaaaaa-1111-2222-3333-444444444442', '44444444-4444-4444-4444-444444444402', '55555555-5555-5555-5555-555555555503', '22222222-2222-2222-2222-222222222203', 'self', 'pending')
ON CONFLICT (id) DO NOTHING;

-- 19. Audit Logs
INSERT INTO public.audit_logs (id, user_id, action, entity, details) VALUES
('bbbbbbbb-1111-2222-3333-444444444441', '00000000-0000-0000-0000-000000000001', 'SYSTEM_INITIALIZATION', 'DATABASE', '{"version": "2.0.0", "status": "active", "environment": "production"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
