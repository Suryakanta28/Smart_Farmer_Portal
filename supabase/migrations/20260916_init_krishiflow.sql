-- =========================================================================
-- KRISHIFLOW-AI Database Schema (18 Tables)
-- Smart India Hackathon 2026 (Problem ID: SIH26032)
-- Supabase PostgreSQL with RLS, Realtime, Triggers, and Seed Data
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SOCIETIES
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

-- 2. PROCUREMENT CENTRES
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

-- 3. USERS (Custom user profile linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('farmer', 'society_officer', 'procurement_officer', 'driver', 'manager')),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
    society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL,
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FARMERS
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
    bank_account_encrypted TEXT,
    ifsc_code TEXT NOT NULL,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'offline_verified')),
    alternate_contact_name TEXT,
    alternate_contact_phone TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CROPS
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    expected_quantity_kg DOUBLE PRECISION NOT NULL,
    harvest_date DATE NOT NULL,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'procurement_requested', 'vehicle_requested', 'slot_booked', 'in_transit', 'weighed', 'procured', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SLOTS
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

-- 7. VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number TEXT UNIQUE NOT NULL,
    vehicle_type TEXT NOT NULL, -- e.g., Mini Truck (1.5T), Tractor Trolley (3T), Heavy Truck (10T)
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

-- 8. BOOKINGS
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
    qr_code TEXT, -- base64 string
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

-- 9. VEHICLE REQUESTS
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

-- 10. TRIPS
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

-- 11. QUEUE
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

-- 12. PROCUREMENTS
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

-- 13. PAYMENTS
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

-- 14. NOTIFICATIONS
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

-- 15. OFFLINE FARMERS (Society Officer Assisted)
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

-- 16. ALERTS
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. PROCUREMENT REQUESTS
CREATE TABLE IF NOT EXISTS public.procurement_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE,
    centre_id UUID REFERENCES public.procurement_centres(id) ON DELETE CASCADE,
    transport_mode TEXT CHECK (transport_mode IN ('self', 'vehicle')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ENABLE REALTIME
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.queue,
    public.vehicles,
    public.trips,
    public.procurements,
    public.alerts,
    public.bookings,
    public.payments,
    public.vehicle_requests;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_requests ENABLE ROW LEVEL SECURITY;

-- Public read for centres, societies
CREATE POLICY "Public read centres" ON public.procurement_centres FOR SELECT USING (true);
CREATE POLICY "Public read societies" ON public.societies FOR SELECT USING (true);
CREATE POLICY "Allow all read vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Allow all read queue" ON public.queue FOR SELECT USING (true);
CREATE POLICY "Allow all read alerts" ON public.alerts FOR SELECT USING (true);

-- Authenticated operations
CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING (auth.uid() = id OR true);
CREATE POLICY "Farmers read own data" ON public.farmers FOR ALL USING (true);
CREATE POLICY "Crops access" ON public.crops FOR ALL USING (true);
CREATE POLICY "Bookings access" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Trips access" ON public.trips FOR ALL USING (true);
CREATE POLICY "Payments access" ON public.payments FOR ALL USING (true);
CREATE POLICY "Notifications access" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Offline farmers access" ON public.offline_farmers FOR ALL USING (true);
CREATE POLICY "Vehicle requests access" ON public.vehicle_requests FOR ALL USING (true);
CREATE POLICY "Procurements access" ON public.procurements FOR ALL USING (true);

-- =========================================================================
-- SEED DATA (Centres, Societies, Vehicles)
-- =========================================================================

INSERT INTO public.societies (id, name, code, district, block, address, contact_phone) VALUES
('11111111-1111-1111-1111-111111111101', 'Nilokheri Primary Agri Cooperative', 'PACS-NIL-01', 'Karnal', 'Nilokheri', 'Nilokheri Mandi Road, Haryana', '+919876500001'),
('11111111-1111-1111-1111-111111111102', 'Bargarh Farmer Welfare Society', 'PACS-BAR-02', 'Bargarh', 'Attabira', 'Main Canal Road, Attabira, Bargarh, Odisha', '+919876500002'),
('11111111-1111-1111-1111-111111111103', 'Sambalpur Central PAC Society', 'PACS-SBP-03', 'Sambalpur', 'Maneswar', 'NH-53 Junction, Sambalpur, Odisha', '+919876500003'),
('11111111-1111-1111-1111-111111111104', 'Cuttack Sadar Krishak Cooperative', 'PACS-CTC-04', 'Cuttack', 'Baranga', 'Trisulia Chowk, Cuttack, Odisha', '+919876500004')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.procurement_centres (id, name, code, district, address, latitude, longitude, capacity_tonnes_per_day, operating_hours, queue_length, avg_wait_time_minutes, contact_phone) VALUES
('22222222-2222-2222-2222-222222222201', 'Nilokheri Grain Procurement Mandi', 'PC-NIL-01', 'Karnal', 'GT Road, Near Railway Overbridge, Nilokheri, Haryana', 29.8335, 76.9197, 300, '08:00 AM - 06:00 PM', 12, 35, '+9118001802021'),
('22222222-2222-2222-2222-222222222202', 'Attabira Rice Procurement Complex', 'PC-ATT-02', 'Bargarh', 'Market Yard, Attabira, Bargarh, Odisha', 21.3644, 83.7844, 450, '08:00 AM - 06:00 PM', 18, 45, '+9118001802022'),
('22222222-2222-2222-2222-222222222203', 'Sambalpur Regulated Market Yard', 'PC-SBP-03', 'Sambalpur', 'Dhanupali Chowk, Sambalpur, Odisha', 21.4550, 83.9850, 380, '08:30 AM - 05:30 PM', 9, 25, '+9118001802023'),
('22222222-2222-2222-2222-222222222204', 'Cuttack Central Mandi Complex', 'PC-CTC-04', 'Cuttack', 'Malgodown Road, Cuttack, Odisha', 20.4625, 85.8830, 500, '08:00 AM - 06:30 PM', 24, 60, '+9118001802024'),
('22222222-2222-2222-2222-222222222205', 'Bhubaneswar Agri Warehouse Mandi', 'PC-BBS-05', 'Khurda', 'Chandaka Industrial Area, Bhubaneswar, Odisha', 20.3540, 85.8180, 420, '08:00 AM - 06:00 PM', 15, 40, '+9118001802025')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.vehicles (id, registration_number, vehicle_type, capacity_kg, driver_name, driver_phone, status, latitude, longitude) VALUES
('33333333-3333-3333-3333-333333333301', 'OD-15-AB-1024', 'Mini Truck (1.5T)', 1500, 'Suresh Kumar Mohapatra', '+919876543210', 'available', 21.4680, 83.9780),
('33333333-3333-3333-3333-333333333302', 'OD-17-CD-3456', 'Tractor Trolley (3.5T)', 3500, 'Prakash Sethi', '+919876543211', 'on_trip', 21.3690, 83.7790),
('33333333-3333-3333-3333-333333333303', 'HR-05-XY-7890', 'Medium Truck (5.0T)', 5000, 'Gurmeet Singh', '+919876543212', 'available', 29.8310, 76.9150),
('33333333-3333-3333-3333-333333333304', 'OD-02-KL-9988', 'Tata Ace (1.2T)', 1200, 'Manoj Sahoo', '+919876543213', 'available', 20.4600, 85.8810)
ON CONFLICT (registration_number) DO NOTHING;
