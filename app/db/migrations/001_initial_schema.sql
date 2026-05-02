-- SI Banting Database Schema
-- Version: 1.0.0
-- Description: Sistem Informasi Banting untuk RKP Bayi Cegah Stunting

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('orang_tua', 'kader', 'puskesmas');
CREATE TYPE wilayah_type AS ENUM ('desa', 'kelurahan', 'puskesmas');
CREATE TYPE jenis_kelamin AS ENUM ('laki_laki', 'perempuan');

-- =====================================================
-- TABLE: wilayah
-- =====================================================

CREATE TABLE wilayah (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_wilayah VARCHAR(255) NOT NULL,
  tipe wilayah_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for wilayah
CREATE INDEX idx_wilayah_tipe ON wilayah(tipe);
CREATE INDEX idx_wilayah_nama ON wilayah(nama_wilayah);

-- =====================================================
-- TABLE: users
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  wilayah_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_users_wilayah FOREIGN KEY (wilayah_id) 
    REFERENCES wilayah(id) 
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- Indexes for users
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_wilayah ON users(wilayah_id);

-- =====================================================
-- TABLE: anak
-- =====================================================

CREATE TABLE anak (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nama VARCHAR(255) NOT NULL,
  tanggal_lahir DATE NOT NULL,
  jenis_kelamin jenis_kelamin NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_anak_user FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Indexes for anak
CREATE INDEX idx_anak_user_id ON anak(user_id);
CREATE INDEX idx_anak_tanggal_lahir ON anak(tanggal_lahir);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE anak ENABLE ROW LEVEL SECURITY;
ALTER TABLE wilayah ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" 
  ON users FOR SELECT 
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" 
  ON users FOR UPDATE 
  USING (auth.uid()::text = id::text);

-- RLS Policies for anak table
CREATE POLICY "Parents can view their own children" 
  ON anak FOR SELECT 
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Parents can insert their own children" 
  ON anak FOR INSERT 
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Parents can update their own children" 
  ON anak FOR UPDATE 
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Parents can delete their own children" 
  ON anak FOR DELETE 
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Kader and Puskesmas can view all children in their wilayah"
  ON anak FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1 
      WHERE u1.id = anak.user_id
      AND EXISTS (
        SELECT 1 FROM users u2 
        WHERE u2.id::text = auth.uid()::text
        AND u2.role IN ('kader', 'puskesmas')
        AND u1.wilayah_id = u2.wilayah_id
      )
    )
  );

-- RLS Policies for wilayah table
CREATE POLICY "Wilayah is viewable by everyone" 
  ON wilayah FOR SELECT 
  USING (true);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert sample wilayah
INSERT INTO wilayah (id, nama_wilayah, tipe) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Puskesmas Sentral', 'puskesmas'),
  ('10000000-0000-0000-0000-000000000002', 'Kelurahan Maju Jaya', 'kelurahan'),
  ('10000000-0000-0000-0000-000000000003', 'Desa Sejahtera', 'desa'),
  ('10000000-0000-0000-0000-000000000004', 'Kelurahan Harmoni', 'kelurahan'),
  ('10000000-0000-0000-0000-000000000005', 'Desa Makmur', 'desa');

-- Note: User passwords should be hashed in production
-- These are sample users for development only
INSERT INTO users (id, name, email, password, role, wilayah_id) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'Ibu Siti Nurhaliza',
    'siti@parent.com',
    'parent123', -- In production, use bcrypt hash
    'orang_tua',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Kader Aminah',
    'aminah@cadre.com',
    'cadre123', -- In production, use bcrypt hash
    'kader',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Dr. Budi Santoso',
    'budi@puskesmas.com',
    'puskesmas123', -- In production, use bcrypt hash
    'puskesmas',
    '10000000-0000-0000-0000-000000000001'
  );

-- Insert sample anak data
INSERT INTO anak (user_id, nama, tanggal_lahir, jenis_kelamin) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'Ahmad Rizki',
    '2023-06-15',
    'laki_laki'
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    'Siti Aisyah',
    '2024-02-20',
    'perempuan'
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'Tabel pengguna sistem dengan role-based access';
COMMENT ON TABLE anak IS 'Tabel data anak yang terdaftar dalam sistem RKP';
COMMENT ON TABLE wilayah IS 'Tabel wilayah administrasi (desa, kelurahan, puskesmas)';

COMMENT ON COLUMN users.role IS 'Role pengguna: orang_tua, kader, atau puskesmas';
COMMENT ON COLUMN users.wilayah_id IS 'Referensi ke wilayah tempat user terdaftar';
COMMENT ON COLUMN anak.user_id IS 'Referensi ke orang tua (user dengan role orang_tua)';
COMMENT ON COLUMN anak.jenis_kelamin IS 'Jenis kelamin anak: laki_laki atau perempuan';
