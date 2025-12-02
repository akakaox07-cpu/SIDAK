/**
 * Config.gs - Configuration & Constants
 * SIDAK Backend Configuration File
 */

// ============================================
// SPREADSHEET CONFIGURATION
// ============================================

const SPREADSHEET_ID = '1w8u6O7LWxssXbqii8Ktvy-LVTlL2JRhaWVgkPj9Ol_0'; // Ganti dengan ID spreadsheet Anda

// ============================================
// SHEET NAMES
// ============================================

const USERS_SHEET = 'Users';
const INVENTARIS_SHEET = 'Inventaris_Barang';
const TANAH_SHEET = 'Tanah';
const BANGUNAN_SHEET = 'Bangunan';
const UNITS_SHEET = 'Master_Units';
const CATEGORIES_SHEET = 'Master_Categories';
const SOURCES_SHEET = 'Master_Sources';

// ============================================
// DEFAULT USERS
// ============================================

const DEFAULT_USERS = [
  { 
    username: 'admin', 
    password: 'admin123', 
    role: 'admin', 
    email: 'admin@sidak.kelurahan.id'
    // unitAccess will be empty (admin has access to all units)
  },
  { 
    username: 'editor', 
    password: 'editor123', 
    role: 'editor', 
    email: 'editor@sidak.kelurahan.id'
    // unitAccess will be dynamically assigned from Master_Units (first 3 units)
  },
  { 
    username: 'viewer', 
    password: 'viewer123', 
    role: 'viewer', 
    email: 'viewer@sidak.kelurahan.id'
    // unitAccess will be dynamically assigned from Master_Units (first 4 units)
  }
];

// ============================================
// SHEET HEADERS DEFINITIONS
// ============================================

/**
 * Get headers for Inventaris_Barang sheet
 */
function getInventarisHeaders() {
  return [
    'id', 'jenisInventaris', 'noKodeBarang', 'namaBarang', 'merkModel', 'noSeriPabrik',
    'ukuran', 'bahan', 'tahunPembuatan', 'jumlahBarang', 'hargaBeli', 'sumberPerolehan',
    'keadaanBarang', 'unit', 'ruangan', 'keterangan', 'photos',
    'createdAt', 'updatedAt', 'createdBy'
  ];
}

/**
 * Get headers for Tanah sheet
 */
function getTanahHeaders() {
  return [
    'id', 'kodeBarang', 'namaBarang', 'jenisInventaris', 'register', 'luasTanah', 'tahunPerolehan',
    'alamat', 'latitude', 'longitude', 'statusHakTanah', 'statusTanah', 'tanggalSertifikat',
  'nomorSertifikat', 'penggunaan', 'asalUsul', 'harga', 'statusBarang', 'kondisi', 
    'tglBuku', 'noBAST', 'tglBAST', 'idPenerimaan', 'statusAset',
    'unit', 'keterangan', 'photos',
    'createdAt', 'updatedAt', 'createdBy'
  ];
}

/**
 * Get headers for Bangunan sheet
 */
function getBangunanHeaders() {
  return [
    'id', 'kodeBarang', 'namaBarang', 'register', 'kondisi', 'bertingkat', 'beton',
    'luasBangunan', 'alamat', 'tahunPerolehan', 'tanggalDokumen', 'nomorDokumen', 
    'luasTanah', 'statusTanah', 'kodeTanah', 'asalUsul', 'harga',
    'latitude', 'longitude', 'jenisInventaris', 'unit', 'keterangan', 'photos',
    'createdAt', 'updatedAt', 'createdBy'
  ];
}

// ============================================
// DEFAULT MASTER DATA
// ============================================

/**
 * Get default units for Master_Units sheet
 */
function getDefaultUnits() {
  return [
    'Kelurahan Babakan',
    'Balai Warga RW 001', 'Balai Warga RW 002', 'Balai Warga RW 003',
    'Balai Warga RW 004', 'Balai Warga RW 005', 'Balai Warga RW 006',
    'Balai Warga RW 007', 'Balai Warga RW 008', 'Balai Warga RW 009',
    'Balai Warga RW 010', 'Balai Warga RW 011', 'Balai Warga RW 012'
  ];
}

/**
 * Get default categories for Master_Categories sheet
 */
function getDefaultCategories() {
  return [
    { name: 'Elektronik', code: 'ELK' },
    { name: 'Perabot', code: 'PRB' },
    { name: 'Kendaraan', code: 'KDR' },
    { name: 'Alat Tulis', code: 'ALT' },
    { name: 'Alat Kebersihan', code: 'ALB' },
    { name: 'Alat Dapur', code: 'ADP' },
    { name: 'Alat Kesehatan', code: 'AKS' },
    { name: 'Alat Olahraga', code: 'AOR' },
    { name: 'Alat Musik', code: 'AMS' },
    { name: 'Alat Listrik', code: 'ALS' },
    { name: 'Alat Pendingin', code: 'APD' },
    { name: 'Alat Komunikasi', code: 'AKM' },
    { name: 'Alat Pengolah Data', code: 'APD2' },
    { name: 'Alat Bantu', code: 'ABT' },
    { name: 'Lainnya', code: 'LNN' }
  ];
}

/**
 * Get default sources for Master_Sources sheet
 */
function getDefaultSources() {
  return [
    'Pembelian', 'Hibah', 'Bantuan Pemerintah', 'Bantuan Swasta',
    'Sumbangan', 'Wakaf', 'Dana BOS', 'Dana Desa',
    'APBD', 'APBN', 'Swadaya Masyarakat', 'Lainnya'
  ];
}
