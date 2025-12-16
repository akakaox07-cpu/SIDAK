/**
 * SIDAK - Sistem Informasi Data Aset Kelurahan
 * Google Apps Script Backend - Main Router
 * 
 * Setup Instructions:
 * 1. Buat Google Spreadsheet baru dengan nama "SIDAK Database"
 * 2. Set SPREADSHEET_ID di Config.gs
 * 3. Jalankan menu SIDAK Backend → Setup Database
 * 4. Deploy as Web App dengan akses "Anyone"
 * 5. Copy deployment URL ke .env VITE_API_URL
 * 
 * Modular Structure:
 * - Config.gs: Constants and configuration
 * - Utils.gs: Helper functions and utilities
 * - Auth.gs: Authentication and authorization
 * - MasterData.gs: Master data CRUD operations
 * - Assets.gs: Asset CRUD operations
 * - Setup.gs: Database initialization
 * - Code.gs: Main router (this file)
 */

// ============================================
// MENU INITIALIZATION
// ============================================

/**
 * Runs when spreadsheet is opened - creates custom menu
 */
function onOpen() {
  // Auto-initialize database if needed (silent check)
  try {
    autoInitializeDatabase();
  } catch (error) {
    Logger.log('Auto-initialization error: ' + error.toString());
  }
  
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('SIDAK Backend')
    .addItem('🔧 Setup Database', 'setupDatabase')
    .addItem('👥 Setup Default Users', 'setupDefaultUsers')
    .addItem('📋 Setup Assets Sheets', 'setupAssetsSheets')
    .addItem('📁 Setup Master Data Sheets', 'setupMasterDataSheets')
    .addItem('� Migrate Email Column', 'menuMigrateEmailColumn')
    .addItem('� Reset User Password', 'menuResetUserPassword')
    .addItem('🔍 Check User Data', 'menuCheckUserData')
    .addItem('🔐 Authorize Drive Access', 'authorizeDriveAccess')
    .addItem('🔓 Fix Drive File Permissions', 'fixDriveFilePermissions')
    .addSeparator()
    .addItem('📦 Import Sample Data', 'importSampleData')
    .addItem('🗑️ Clear All Assets', 'clearAllAssets')
    .addSeparator()
    .addItem('🧪 Test Login (admin)', 'testLoginAdmin')
    .addItem('📊 View Database Info', 'showDatabaseInfo')
    .addItem('📈 Database Statistics', 'showDatabaseStats')
    .addSeparator()
    .addItem('🔗 Get Deployment URL', 'showDeploymentInstructions')
    .addToUi();

  // Light self-check to help first-time setup
  try {
    if (!SPREADSHEET_ID || SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      ui.alert(
        'Konfigurasi Diperlukan ⚠️',
        'Silakan set nilai SPREADSHEET_ID di Config.gs (bagian CONFIGURATION) ke ID Spreadsheet Anda sebelum menggunakan backend.',
        ui.ButtonSet.OK
      );
      return;
    }
    // Attempt to ensure sheets exist with proper headers (idempotent and quick)
    ensureUsersSheetInitialized();
    ensureInventarisSheetInitialized();
    ensureTanahSheetInitialized();
    ensureBangunanSheetInitialized();
  } catch (err) {
    // Non-fatal: show a brief notice so admin knows something is off
    try {
      ui.alert('Inisialisasi ringan gagal', String(err));
    } catch (_) {}
  }
}

// ============================================
// WEB APP ENTRY POINTS
// ============================================

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'getAssets':
        return getAssets(e);
      case 'getAsset':
        return getAsset(e);
      case 'checkAuth':
        return checkAuth(e);
      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    // Auto-initialize database if needed (silent check)
    autoInitializeDatabase();
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch(action) {
      // Authentication
      case 'login':
        return login(data);
      case 'checkAuth':
        return checkAuth({ parameter: { token: data.token } });
      case 'changeOwnPassword':
        return changeOwnPassword(data);
      
      // Assets
      case 'getAssets':
        return getAssets({ parameter: { token: data.token } });
      case 'getAsset':
        return getAsset({ parameter: { token: data.token, id: data.id } });
      case 'createAsset':
        return createAsset(data);
      case 'updateAsset':
        return updateAsset(data);
      case 'deleteAsset':
        return deleteAsset(data);
      case 'uploadImage':
        return uploadImage(data);
      
      // Master Data
      case 'getMasterData':
        return getMasterData(data);
      case 'createMasterDataItem':
        return createMasterDataItem(data);
      case 'updateMasterDataItem':
        return updateMasterDataItem(data);
      case 'deleteMasterDataItem':
        return deleteMasterDataItem(data);
      
      // User Management (Admin only)
      case 'getUsers':
        return getUsers(data);
      case 'createUser':
        return createUser(data);
      case 'updateUser':
        return updateUser(data);
      case 'deleteUser':
        return deleteUser(data);
      
      // Password Reset
      case 'notifyAdminForgotPassword':
        return notifyAdminForgotPassword(data);
        
      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
}

// ============================================
// MENU HANDLERS
// ============================================

/**
 * Test login with admin credentials
 */
function testLoginAdmin() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const result = login({ username: 'admin', password: 'admin123' });
    const data = JSON.parse(result.getContent());
    
    if (data.success) {
      ui.alert(
        'Login Test ✅',
        'Login berhasil!\n\n' +
        'Username: ' + data.user.username + '\n' +
        'Role: ' + data.user.role + '\n' +
        'Email: ' + data.user.email + '\n\n' +
        'Token: ' + data.token.substring(0, 20) + '...',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('Login Test ❌', 'Error: ' + data.error, ui.ButtonSet.OK);
    }
  } catch (error) {
    ui.alert('Login Test ❌', 'Error: ' + error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Admin menu action: reset a user's password via prompts
 */
function menuResetUserPassword() {
  const ui = SpreadsheetApp.getUi();
  try {
    const userResp = ui.prompt('Reset Password', 'Masukkan username yang ingin direset:', ui.ButtonSet.OK_CANCEL);
    if (userResp.getSelectedButton() !== ui.Button.OK) return;
    const username = userResp.getResponseText().trim();
    if (!username) return ui.alert('Username tidak boleh kosong');
    
    const passResp = ui.prompt('Password Baru', 'Masukkan password baru untuk user ' + username + ':', ui.ButtonSet.OK_CANCEL);
    if (passResp.getSelectedButton() !== ui.Button.OK) return;
    const newPassword = passResp.getResponseText();
    if (!newPassword) return ui.alert('Password baru tidak boleh kosong');
    
    // Set langsung hash + salt untuk user tersebut (admin-only menu)
    const sheet = ensureUsersSheetInitialized();
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === username) {
        const salt = generateSalt();
        const hash = hashPassword(newPassword, salt);
        sheet.getRange(i + 1, 2).setValue(hash);   // passwordHash
        sheet.getRange(i + 1, 7).setValue(salt);   // salt
        sheet.getRange(i + 1, 8).setValue('');     // resetToken
        sheet.getRange(i + 1, 9).setValue('');     // resetExpires
        ui.alert('Berhasil ✅', 'Password untuk ' + username + ' telah direset.', ui.ButtonSet.OK);
        return;
      }
    }
    ui.alert('Gagal ❌', 'User tidak ditemukan', ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Error', err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Authorize Google Drive access for image uploads
 */
function authorizeDriveAccess() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Explicitly request Drive access - this will trigger OAuth consent on first run
    const folderName = 'SIDAK';
    let folder;
    
    // This line requires Drive scope and will trigger authorization prompt
    const folders = DriveApp.getFoldersByName(folderName);
    
    if (folders.hasNext()) {
      folder = folders.next();
      ui.alert(
        'Authorization Complete ✅',
        'Drive access berhasil!\n\n' +
        'Folder "SIDAK" sudah ada di Drive.\n\n' +
        'NEXT STEP:\n' +
        '1. Deploy → Manage deployments\n' +
        '2. Click pencil icon to edit\n' +
        '3. Select "New version"\n' +
        '4. Click Deploy\n' +
        '5. Test upload dari aplikasi',
        ui.ButtonSet.OK
      );
    } else {
      // Create folder if doesn't exist
      folder = DriveApp.createFolder(folderName);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      ui.alert(
        'Authorization Complete ✅',
        'Drive access berhasil!\n\n' +
        'Folder "SIDAK" telah dibuat di Drive.\n' +
        'Folder ID: ' + folder.getId() + '\n\n' +
        'NEXT STEP:\n' +
        '1. Deploy → Manage deployments\n' +
        '2. Click pencil icon to edit\n' +
        '3. Select "New version"\n' +
        '4. Click Deploy\n' +
        '5. Test upload dari aplikasi',
        ui.ButtonSet.OK
      );
    }
  } catch (err) {
    // Show detailed error with instructions
    const errorMsg = String(err);
    
    if (errorMsg.includes('tidak memiliki izin') || errorMsg.includes('permission')) {
      ui.alert(
        'Authorization Needed 🔐',
        'Anda perlu memberikan izin Drive kepada Apps Script.\n\n' +
        'CARA AUTHORIZE:\n' +
        '1. Tutup dialog ini\n' +
        '2. Extensions → Apps Script\n' +
        '3. Pilih function "authorizeDriveAccess" dari dropdown\n' +
        '4. Click Run (▶️)\n' +
        '5. Click "Review Permissions" di popup\n' +
        '6. Pilih akun Google Anda\n' +
        '7. Click "Advanced"\n' +
        '8. Click "Go to SIDAK Backend (unsafe)"\n' +
        '9. Click "Allow"\n\n' +
        'Setelah authorize, kembali ke Spreadsheet dan jalankan menu ini lagi.',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        'Authorization Failed ❌',
        'Error: ' + errorMsg + '\n\n' +
        'Silakan coba authorize manual via Apps Script editor.',
        ui.ButtonSet.OK
      );
    }
  }
}

/**
 * Fix permissions for all files in SIDAK folder
 */
function fixDriveFilePermissions() {
  const ui = SpreadsheetApp.getUi();
  try {
    const folderName = 'SIDAK';
    const folders = DriveApp.getFoldersByName(folderName);
    if (!folders.hasNext()) {
      ui.alert('Folder Not Found', 'Folder "' + folderName + '" tidak ditemukan di Drive.', ui.ButtonSet.OK);
      return;
    }
    const folder = folders.next();
    const files = folder.getFiles();
    let count = 0;
    while (files.hasNext()) {
      const f = files.next();
      try {
        f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (_) {}
      try {
        f.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
      } catch (_) {}
      count++;
    }
    ui.alert('Fix Complete ✅', 'Permissions diperbaiki untuk ' + count + ' file di folder SIDAK.', ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('Fix Failed ❌', String(err), ui.ButtonSet.OK);
  }
}

/**
 * Import sample data for testing
 */
function importSampleData() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    'Import Sample Data',
    'Ini akan menambahkan 3 contoh aset (Laptop, Kursi, Tanah) ke database.\n\n' +
    'Data akan menggunakan unit, category, dan source dari Master sheets.\n\n' +
    'Lanjutkan?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  // Get data from Master sheets
  const units = getUnitNamesFromSheet();
  const categories = getCategoryNamesFromSheet();
  const sources = getSourceNamesFromSheet();
  
  // Validation: ensure master data exists
  if (units.length === 0) {
    ui.alert('Error', 'Master_Units kosong! Jalankan Setup Master Data Sheets terlebih dahulu.', ui.ButtonSet.OK);
    return;
  }
  
  // Use first available unit, category, source (or fallback)
  const defaultUnit = units[0] || 'Unit Default';
  const categoryElektronik = categories.find(c => c.toLowerCase().includes('elektronik')) || categories[0] || 'Elektronik';
  const categoryMebel = categories.find(c => c.toLowerCase().includes('mebel') || c.toLowerCase().includes('perabot')) || categories[0] || 'Mebel';
  const defaultSource = sources.find(s => s.toLowerCase().includes('pembelian')) || sources[0] || 'Pembelian';
  
  const sampleAssets = [
    {
      jenisInventaris: categoryElektronik,
      noKodeBarang: 'ELK-2024-001',
      namaBarang: 'Laptop Dell Latitude',
      merkModel: 'Dell Latitude 5420',
      noSeriPabrik: 'XYZ123ABC',
      ukuran: '14 inch',
      bahan: 'Plastik/Aluminium',
      tahunPembuatan: '2024',
      jumlahBarang: 1,
      hargaBeli: 15000000,
      sumberPerolehan: defaultSource,
      keadaanBarang: 'Baik',
      unit: defaultUnit,
      ruangan: 'Ruang Staf',
      keterangan: 'Laptop untuk administrasi',
      photos: []
    },
    {
      jenisInventaris: categoryMebel,
      noKodeBarang: 'MBL-2024-001',
      namaBarang: 'Kursi Kantor',
      merkModel: 'Chitose',
      tahunPembuatan: '2024',
      jumlahBarang: 10,
      hargaBeli: 500000,
      keadaanBarang: 'Baik',
      unit: defaultUnit,
      ruangan: 'Ruang Meeting',
      keterangan: 'Kursi untuk ruang rapat',
      photos: []
    },
    {
      jenisInventaris: 'Tanah',
      kodeBarang: 'TNH-2020-001',
      namaBarang: 'Tanah Kantor',
      unit: defaultUnit,
      register: 'REG-001',
      luasTanah: 500,
      tahunPerolehan: 2020,
      alamat: 'Jl. Raya No. 123',
      latitude: '-6.234567',
      longitude: '106.123456',
      statusHakTanah: 'Hak Milik',
      tanggalSertifikat: '15-01-2020',
      nomorSertifikat: 'SHM-001/2020',
      penggunaan: 'Kantor Pemerintahan',
      asalUsul: defaultSource,
      harga: 500000000,
      keterangan: 'Tanah untuk kantor',
      photos: []
    }
  ];
  
  let successCount = 0;
  const now = new Date().toISOString();
  
  sampleAssets.forEach(asset => {
    const normalized = normalizeAssetPayload(asset);
    const { sheet, type } = getAssetSheet(normalized.jenisInventaris);
    const id = generateId();
    const row = assetToRow(normalized, type, id, now, 'admin');
    sheet.appendRow(row);
    successCount++;
  });
  
  ui.alert(
    'Import Complete ✅',
    successCount + ' sample assets berhasil ditambahkan!\n\nSilahkan refresh aplikasi untuk melihat data.',
    ui.ButtonSet.OK
  );
}

/**
 * Show deployment instructions
 */
function showDeploymentInstructions() {
  const ui = SpreadsheetApp.getUi();
  
  ui.alert(
    'Deployment Instructions 🔗',
    'Untuk deploy sebagai Web App:\n\n' +
    '1. Klik Deploy → New deployment\n' +
    '2. Select type → Web app\n' +
    '3. Execute as: Me\n' +
    '4. Who has access: Anyone\n' +
    '5. Click Deploy\n' +
    '6. Copy Web app URL\n' +
    '7. Paste ke .env file:\n' +
    '   VITE_API_URL=<your-url>\n\n' +
    'Setelah deploy, test dengan:\n' +
    'curl -X POST "URL" -d \'{"action":"login","username":"admin","password":"admin123"}\'',
    ui.ButtonSet.OK
  );
}

/**
 * Menu: Migrate email column from old position to new position
 */
function menuMigrateEmailColumn() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    'Migrasi Kolom Email 🔄',
    'Fungsi ini akan memindahkan data email dari posisi lama (kolom 4/9) ke posisi baru (kolom 5).\n\n' +
    'SKEMA BARU:\n' +
    '1. username\n' +
    '2. passwordHash\n' +
    '3. role\n' +
    '4. unitAccess\n' +
    '5. email ← POSISI BARU\n' +
    '6. createdAt\n' +
    '7. salt\n' +
    '8. resetToken\n' +
    '9. resetExpires\n\n' +
    'Lanjutkan migrasi?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  try {
    const sheet = getSheet(USERS_SHEET);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      ui.alert('Info', 'Tidak ada data user untuk dimigrasi.', ui.ButtonSet.OK);
      return;
    }
    
    // Update header dulu
    const headers = ["username", "passwordHash", "role", "unitAccess", "email", "createdAt", "salt", "resetToken", "resetExpires"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Migrasi setiap baris
    let migrated = 0;
    for (let i = 2; i <= lastRow; i++) {
      const row = sheet.getRange(i, 1, 1, 9).getValues()[0];
      const [username, passwordHash, role, oldEmailOrUnit, maybeEmail, createdAt, salt, resetToken, resetExpires] = row;
      
      // Deteksi apakah kolom 4 adalah email (mengandung @) atau unitAccess
      let email = '';
      let unitAccess = '';
      
      if (oldEmailOrUnit && oldEmailOrUnit.toString().includes('@')) {
        // Kolom 4 adalah email (struktur lama tanpa unitAccess)
        email = oldEmailOrUnit;
        unitAccess = '';
      } else {
        // Kolom 4 adalah unitAccess, kolom 5 adalah email (struktur baru)
        unitAccess = oldEmailOrUnit || '';
        email = maybeEmail || '';
      }
      
      // Tulis ulang dengan struktur baru
      sheet.getRange(i, 1, 1, 9).setValues([[
        username,
        passwordHash,
        role,
        unitAccess,
        email,
        createdAt,
        salt,
        resetToken,
        resetExpires
      ]]);
      
      migrated++;
    }
    
    ui.alert(
      'Migrasi Selesai ✅',
      'Berhasil migrasi ' + migrated + ' user.\n\n' +
      'Kolom email sekarang berada di posisi 5.\n' +
      'Silakan cek sheet Users untuk memverifikasi.',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    ui.alert(
      'Error ❌',
      'Terjadi kesalahan saat migrasi:\n' + error.toString(),
      ui.ButtonSet.OK
    );
  }
}

/**
 * Menu: Check User Data
 * Display all users with their role and unitAccess
 */
function menuCheckUserData() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const sheet = getSheet(USERS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      ui.alert('Info', 'Tidak ada user di sheet Users.', ui.ButtonSet.OK);
      return;
    }
    
    let message = 'DATA USERS:\n\n';
    
    // Headers: username | passwordHash | role | unitAccess | email | createdAt | salt | resetToken | resetExpires
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const username = row[0] || '';
      const role = row[2] || '';
      const unitAccess = row[3] || '';
      const email = row[4] || '';
      
      message += `${i}. ${username}\n`;
      message += `   Role: ${role}\n`;
      message += `   UnitAccess: "${unitAccess}"\n`;
      message += `   Email: ${email}\n\n`;
    }
    
    // Show in dialog (max 2000 chars for alert)
    if (message.length > 2000) {
      Logger.log(message);
      ui.alert(
        'User Data (Logged)',
        'Data terlalu panjang untuk ditampilkan.\nSilakan cek View > Logs untuk detail lengkap.\n\nTotal users: ' + (data.length - 1),
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('User Data', message, ui.ButtonSet.OK);
    }
    
  } catch (error) {
    ui.alert('Error', 'Gagal membaca data user:\n' + error.toString(), ui.ButtonSet.OK);
  }
}
