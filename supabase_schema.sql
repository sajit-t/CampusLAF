-- Schema definition for Campus Lost & Found System

-- Disable trigger checks temporarily for clean migration if needed
SET session_replication_role = 'replica';

-- Drop tables if they exist
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS claims;
DROP TABLE IF EXISTS lost_items;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS students;

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Students Table
CREATE TABLE students (
    roll_number VARCHAR(50) PRIMARY KEY,
    register_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(10) NOT NULL,
    section VARCHAR(10) NOT NULL,
    college_email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    profile_photo TEXT,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles (Authentication Map)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    roll_number VARCHAR(50) REFERENCES students(roll_number) ON DELETE SET NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'admin', 'super_admin')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Lost Items Table
CREATE TABLE lost_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    found_by_roll_number VARCHAR(50) REFERENCES students(roll_number) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    color VARCHAR(50),
    description TEXT NOT NULL,
    estimated_value DECIMAL(10,2) DEFAULT 0,
    found_location VARCHAR(255) NOT NULL,
    building VARCHAR(100),
    floor INT,
    room VARCHAR(50),
    found_date DATE NOT NULL,
    found_time TIME,
    office_received_date DATE DEFAULT CURRENT_DATE,
    office_received_time TIME DEFAULT CURRENT_TIME,
    received_by_admin UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) CHECK (status IN ('Waiting for Owner', 'Claim Requested', 'Claimed & Collected', 'Archived')) DEFAULT 'Waiting for Owner',
    notes TEXT,
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Claims Table
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES lost_items(id) ON DELETE CASCADE,
    claimant_roll_number VARCHAR(50) REFERENCES students(roll_number) ON DELETE CASCADE,
    approval_status VARCHAR(20) CHECK (approval_status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    claim_request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_collection_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    claimed_date TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    receipt_code VARCHAR(50)
);

-- 5. Audit Logs Table (Visible only to Super Admin)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    affected_record_table VARCHAR(50) NOT NULL,
    affected_record_id VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Re-enable trigger checks
SET session_replication_role = 'origin';

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active lost items (for students)
CREATE POLICY "Allow public read access to active lost items" 
ON lost_items FOR SELECT 
USING (status != 'Archived');

-- Allow students to read their own profile
CREATE POLICY "Allow users to read their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow admins full access to everything
CREATE POLICY "Allow full admin control on students" ON students TO service_role USING (true);
CREATE POLICY "Allow full admin control on profiles" ON profiles TO service_role USING (true);
CREATE POLICY "Allow full admin control on lost_items" ON lost_items TO service_role USING (true);
CREATE POLICY "Allow full admin control on claims" ON claims TO service_role USING (true);
CREATE POLICY "Allow full admin control on audit_logs" ON audit_logs TO service_role USING (true);
