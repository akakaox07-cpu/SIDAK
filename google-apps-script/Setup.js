/**
 * Setup.gs - Database Initialization & Setup
 * SIDAK Backend Setup Module
 */

// ============================================
// MAIN SETUP FUNCTIONS
// ============================================

/**
 * Setup complete database (Users + Assets + Master Data)
 * Otomatis dijalankan saat pertama kali atau sheet tidak ada
 */
function setupDatabase() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Setup Master Data FIRST (Users need to reference Units)
    setupMasterDataSheets();
    
    // Then setup Users (will read from Master_Units)
    setupDefaultUsers();
    
    // Finally setup Assets sheets
    setupAssetsSheets();
    
    ui.alert(
      'Setup Complete ✅',
      'Database berhasil diinisialisasi!\n\n' +
      '✅ Master Data: Units, Categories, Sources\n' +
      '✅ Users: ' + DEFAULT_USERS.length + ' default users (unitAccess dari Master_Units)\n' +
      '✅ Assets: Inventaris, Tanah, Bangunan sheets\n\n' +
      'Database siap digunakan!',
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert(
      'Setup Error ❌',
      'Error: ' + error.toString(),
      ui.ButtonSet.OK
    );
  }
}

/**
 * Auto-initialize database jika belum ada
 * Dipanggil otomatis saat aplikasi diakses
 */
function autoInitializeDatabase() {
  try {
    const ss = getSpreadsheet();
    
    // Check apakah sheets sudah ada
    const usersSheet = ss.getSheetByName(USERS_SHEET);
    const inventarisSheet = ss.getSheetByName(INVENTARIS_SHEET);
    const unitsSheet = ss.getSheetByName(UNITS_SHEET);
    
    // Jika sheet belum ada, setup otomatis
    if (!usersSheet || !inventarisSheet || !unitsSheet) {
      Logger.log('Auto-initializing database...');
      
      // Setup Users (with default users)
      if (!usersSheet || usersSheet.getLastRow() === 0) {
        ensureUsersSheetInitialized();
        ensureDefaultUsersPresent();
      }
      
      // Setup Assets Sheets
      ensureInventarisSheetInitialized();
      ensureTanahSheetInitialized();
      ensureBangunanSheetInitialized();
      
      // Setup Master Data Sheets
      ensureUnitsSheetInitialized();
      ensureCategoriesSheetInitialized();
      ensureSourcesSheetInitialized();
      
      Logger.log('Database auto-initialized successfully');
    }
  } catch (error) {
    Logger.log('Auto-initialization error: ' + error.toString());
  }
}

/**
 * Setup default users
 */
function setupDefaultUsers() {
  const sheet = getSheet(USERS_SHEET);
  
  // Clear existing data except header
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // Ensure headers (unitAccess after role)
  const headers = ["username", "passwordHash", "role", "unitAccess", "email", "createdAt", "salt", "resetToken", "resetExpires"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Ensure Master_Units exists first
  ensureUnitsSheetInitialized();
  
  // Get unit names from Master_Units sheet
  const unitNames = getUnitNamesFromSheet();
  
  // Add default users with dynamic unitAccess from Master_Units
  DEFAULT_USERS.forEach(user => {
    const salt = generateSalt();
    const passwordHash = hashPassword(user.password, salt);
    
    // Determine unitAccess based on role
    let unitAccess = '';
    if (user.role === 'admin') {
      // Admin: empty = access to all units
      unitAccess = '';
    } else if (user.role === 'editor') {
      // Editor: give access to first 3 units from Master_Units
      unitAccess = unitNames.slice(0, 3).join(',');
    } else if (user.role === 'viewer') {
      // Viewer: give access to first 4 units from Master_Units
      unitAccess = unitNames.slice(0, 4).join(',');
    }
    
    sheet.appendRow([
      user.username,
      passwordHash,
      user.role,
      unitAccess,
      user.email,
      new Date().toISOString(),
      salt,
      '',
      '' // resetToken, resetExpires
    ]);
  });
  
  return createResponse({
    success: true,
    message: 'Default users created successfully',
    users: DEFAULT_USERS.map(u => ({ username: u.username, role: u.role }))
  });
}

/**
 * Get unit names from Master_Units sheet
 */
function getUnitNamesFromSheet() {
  try {
    const sheet = getSheet(UNITS_SHEET);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      // No units data, return empty array
      return [];
    }
    
    // Get all unit names (column 2 = name, skip header row)
    const data = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    const unitNames = data.map(row => row[0]).filter(name => name && name.toString().trim() !== '');
    
    return unitNames;
  } catch (error) {
    Logger.log('Error getting unit names: ' + error.toString());
    return [];
  }
}

/**
 * Get category names from Master_Categories sheet
 */
function getCategoryNamesFromSheet() {
  try {
    const sheet = getSheet(CATEGORIES_SHEET);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return [];
    }
    
    // Get all category names (column 2 = name, skip header row)
    const data = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    const categoryNames = data.map(row => row[0]).filter(name => name && name.toString().trim() !== '');
    
    return categoryNames;
  } catch (error) {
    Logger.log('Error getting category names: ' + error.toString());
    return [];
  }
}

/**
 * Get source names from Master_Sources sheet
 */
function getSourceNamesFromSheet() {
  try {
    const sheet = getSheet(SOURCES_SHEET);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return [];
    }
    
    // Get all source names (column 2 = name, skip header row)
    const data = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    const sourceNames = data.map(row => row[0]).filter(name => name && name.toString().trim() !== '');
    
    return sourceNames;
  } catch (error) {
    Logger.log('Error getting source names: ' + error.toString());
    return [];
  }
}

/**
 * Setup assets sheets (Inventaris, Tanah, Bangunan)
 */
function setupAssetsSheets() {
  ensureInventarisSheetInitialized();
  ensureTanahSheetInitialized();
  ensureBangunanSheetInitialized();
  return createResponse({ success: true, message: 'Assets sheets initialized' });
}

/**
 * Setup Master Data Sheets (Units, Categories, Sources)
 */
function setupMasterDataSheets() {
  ensureUnitsSheetInitialized();
  ensureCategoriesSheetInitialized();
  ensureSourcesSheetInitialized();
  
  return createResponse({ 
    success: true, 
    message: 'Master data sheets initialized with default data' 
  });
}

// ============================================
// SHEET INITIALIZATION
// ============================================

/**
 * Ensure Users sheet exists with headers
 */
function ensureUsersSheetInitialized() {
  const sheet = getSheet(USERS_SHEET);
  const desiredHeaders = ["username", "passwordHash", "role", "unitAccess", "email", "createdAt", "salt", "resetToken", "resetExpires"];
  const firstRow = sheet.getRange(1, 1, 1, desiredHeaders.length).getValues()[0];
  const currentHeaderName = firstRow[0];
  
  if (!currentHeaderName) {
    sheet.getRange(1, 1, 1, desiredHeaders.length).setValues([desiredHeaders]);
  } else {
    const existingHeaders = sheet.getRange(1, 1, 1, Math.max(5, desiredHeaders.length)).getValues()[0];
    const isOld = existingHeaders[1] === 'password';
    if (isOld) {
      sheet.getRange(1, 1, 1, desiredHeaders.length).setValues([desiredHeaders]);
      migrateUsersPasswordsToHashed(sheet);
    } else {
      const missing = desiredHeaders.some((h, idx) => existingHeaders[idx] !== h);
      if (missing) {
        sheet.getRange(1, 1, 1, desiredHeaders.length).setValues([desiredHeaders]);
      }
      migrateUsersPasswordsToHashed(sheet);
    }
  }
  return sheet;
}

/**
 * Ensure default users exist (auto-create if missing)
 */
function ensureDefaultUsersPresent() {
  const sheet = ensureUsersSheetInitialized();
  const values = sheet.getDataRange().getValues();
  const headerOffset = 1;
  const existing = values.slice(headerOffset).map(r => ({ username: r[0], role: r[2] }));
  
  // Get existing usernames untuk check duplicate
  const existingUsernames = new Set(existing.map(u => u.username).filter(Boolean));
  
  const roleCounts = existing.reduce((acc, u) => {
    if (!u.role) return acc;
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  
  const roles = Array.from(new Set(DEFAULT_USERS.map(u => u.role)));
  let created = [];
  
  // Ensure Master_Units exists to get unit names
  ensureUnitsSheetInitialized();
  const unitNames = getUnitNamesFromSheet();
  
  roles.forEach(role => {
    const count = roleCounts[role] || 0;
    if (count < 1) {
      const def = DEFAULT_USERS.find(u => u.role === role);
      if (def) {
        // Check username duplicate sebelum append
        if (existingUsernames.has(def.username)) {
          Logger.log('User ' + def.username + ' already exists, skipping');
          return;
        }
        
        const salt = generateSalt();
        const passwordHash = hashPassword(def.password, salt);
        
        // Determine unitAccess based on role
        let unitAccess = '';
        if (def.role === 'admin') {
          unitAccess = '';
        } else if (def.role === 'editor') {
          unitAccess = unitNames.slice(0, 3).join(',');
        } else if (def.role === 'viewer') {
          unitAccess = unitNames.slice(0, 4).join(',');
        }
        
        // Schema: username, passwordHash, role, unitAccess, email, createdAt, salt, resetToken, resetExpires
        sheet.appendRow([
          def.username,
          passwordHash,
          def.role,
          unitAccess,        // Column 4 - unitAccess
          def.email,         // Column 5 - email
          new Date().toISOString(), // Column 6 - createdAt
          salt,              // Column 7 - salt
          '',                // Column 8 - resetToken
          ''                 // Column 9 - resetExpires
        ]);
        created.push({ username: def.username, role: def.role });
        existingUsernames.add(def.username);
      }
    }
  });
  
  return createResponse({
    success: true,
    message: created.length > 0
      ? ('Users created for missing roles: ' + created.map(u => u.role + ' (' + u.username + ')').join(', '))
      : 'All default roles already initialized',
    created
  });
}

/**
 * Ensure Inventaris sheet exists with headers
 */
function ensureInventarisSheetInitialized() {
  const sheet = getSheet(INVENTARIS_SHEET);
  
  if (sheet.getLastRow() === 0) {
    const headers = getInventarisHeaders();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Ensure Tanah sheet exists with headers
 */
function ensureTanahSheetInitialized() {
  const sheet = getSheet(TANAH_SHEET);
  
  if (sheet.getLastRow() === 0) {
    const headers = getTanahHeaders();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Ensure Bangunan sheet exists with headers
 */
function ensureBangunanSheetInitialized() {
  const sheet = getSheet(BANGUNAN_SHEET);
  
  if (sheet.getLastRow() === 0) {
    const headers = getBangunanHeaders();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Ensure Units sheet exists with headers and default data
 */
function ensureUnitsSheetInitialized() {
  const sheet = getSheet(UNITS_SHEET);
  
  if (sheet.getLastRow() === 0) {
    const headers = ['id', 'name', 'isActive', 'createdAt', 'updatedAt'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    const defaultUnits = getDefaultUnits();
    const now = new Date().toISOString();
    const rows = defaultUnits.map((name, index) => [
      generateId(),
      name,
      true,
      now,
      now
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Ensure Categories sheet exists with headers and default data
 */
function ensureCategoriesSheetInitialized() {
  const sheet = getSheet(CATEGORIES_SHEET);
  
  if (sheet.getLastRow() === 0) {
    const headers = ['id', 'name', 'code', 'isActive', 'createdAt', 'updatedAt'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    const defaultCategories = getDefaultCategories();
    const now = new Date().toISOString();
    const rows = defaultCategories.map(cat => [
      generateId(),
      cat.name,
      cat.code,
      true,
      now,
      now
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Ensure Sources sheet exists with headers and default data
 */
function ensureSourcesSheetInitialized() {
  const sheet = getSheet(SOURCES_SHEET);
  
  if (sheet.getLastRow() === 0) {
    const headers = ['id', 'name', 'isActive', 'createdAt', 'updatedAt'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    const defaultSources = getDefaultSources();
    const now = new Date().toISOString();
    const rows = defaultSources.map(name => [
      generateId(),
      name,
      true,
      now,
      now
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

// ============================================
// DATABASE INFO & STATS
// ============================================

/**
 * Show database information dialog
 */
function showDatabaseInfo() {
  const ui = SpreadsheetApp.getUi();
  const ss = getSpreadsheet();
  
  const usersSheet = ss.getSheetByName(USERS_SHEET);
  const inventarisSheet = ss.getSheetByName(INVENTARIS_SHEET);
  const tanahSheet = ss.getSheetByName(TANAH_SHEET);
  const bangunanSheet = ss.getSheetByName(BANGUNAN_SHEET);
  
  const usersCount = usersSheet ? usersSheet.getLastRow() - 1 : 0;
  const inventarisCount = inventarisSheet ? inventarisSheet.getLastRow() - 1 : 0;
  const tanahCount = tanahSheet ? tanahSheet.getLastRow() - 1 : 0;
  const bangunanCount = bangunanSheet ? bangunanSheet.getLastRow() - 1 : 0;
  
  ui.alert(
    'Database Info 📊',
    'Spreadsheet ID: ' + (ss && ss.getId ? ss.getId() : SPREADSHEET_ID) + '\n\n' +
    '👥 Users: ' + usersCount + ' users\n' +
    '📦 Inventaris: ' + inventarisCount + ' items\n' +
    '🗺️ Tanah: ' + tanahCount + ' items\n' +
    '🏠 Bangunan: ' + bangunanCount + ' items\n\n' +
    'Sheets Status:\n' +
    '  • Users: ' + (usersSheet ? '✅ Ready' : '❌ Not found') + '\n' +
    '  • Inventaris: ' + (inventarisSheet ? '✅ Ready' : '❌ Not found') + '\n' +
    '  • Tanah: ' + (tanahSheet ? '✅ Ready' : '❌ Not found') + '\n' +
    '  • Bangunan: ' + (bangunanSheet ? '✅ Ready' : '❌ Not found'),
    ui.ButtonSet.OK
  );
}

/**
 * Show detailed database statistics dialog
 */
function showDatabaseStats() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const stats = getDatabaseStats();
    
    ui.alert(
      'Database Statistics 📈',
      '👥 Total Users: ' + stats.users + '\n' +
      '📦 Total Assets: ' + stats.assets + '\n\n' +
      'Breakdown by Type:\n' +
      '  • 📦 Inventaris: ' + stats.inventaris + '\n' +
      '  • 🗺️ Tanah: ' + stats.tanah + '\n' +
      '  • 🏠 Bangunan: ' + stats.bangunan + '\n\n' +
      'Last Updated: ' + new Date().toLocaleString('id-ID'),
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('Error', 'Failed to get statistics: ' + error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Get database statistics
 */
function getDatabaseStats() {
  const ss = getSpreadsheet();
  
  const usersSheet = ss.getSheetByName(USERS_SHEET);
  const inventarisSheet = ss.getSheetByName(INVENTARIS_SHEET);
  const tanahSheet = ss.getSheetByName(TANAH_SHEET);
  const bangunanSheet = ss.getSheetByName(BANGUNAN_SHEET);
  
  const users = usersSheet ? Math.max(0, usersSheet.getLastRow() - 1) : 0;
  const inventaris = inventarisSheet ? Math.max(0, inventarisSheet.getLastRow() - 1) : 0;
  const tanah = tanahSheet ? Math.max(0, tanahSheet.getLastRow() - 1) : 0;
  const bangunan = bangunanSheet ? Math.max(0, bangunanSheet.getLastRow() - 1) : 0;
  
  return {
    users: users,
    inventaris: inventaris,
    tanah: tanah,
    bangunan: bangunan,
    assets: inventaris + tanah + bangunan
  };
}

// ============================================
// CLEAR DATA
// ============================================

/**
 * Clear all assets data (keep headers)
 */
function clearAllAssets() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    'Clear All Assets ⚠️',
    'Ini akan menghapus SEMUA data aset (Inventaris, Tanah, Bangunan).\n\n' +
    'Users tidak akan terhapus.\n' +
    'Headers akan tetap ada.\n\n' +
    'Yakin ingin melanjutkan?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  try {
    const ss = getSpreadsheet();
    
    // Clear Inventaris
    const invSheet = ss.getSheetByName(INVENTARIS_SHEET);
    if (invSheet && invSheet.getLastRow() > 1) {
      invSheet.deleteRows(2, invSheet.getLastRow() - 1);
    }
    
    // Clear Tanah
    const tanahSheet = ss.getSheetByName(TANAH_SHEET);
    if (tanahSheet && tanahSheet.getLastRow() > 1) {
      tanahSheet.deleteRows(2, tanahSheet.getLastRow() - 1);
    }
    
    // Clear Bangunan
    const bangunanSheet = ss.getSheetByName(BANGUNAN_SHEET);
    if (bangunanSheet && bangunanSheet.getLastRow() > 1) {
      bangunanSheet.deleteRows(2, bangunanSheet.getLastRow() - 1);
    }
    
    ui.alert(
      'Clear Complete ✅',
      'Semua data aset telah dihapus.\n\n' +
      'Headers masih ada dan siap digunakan.',
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('Error', 'Failed to clear assets: ' + error.toString(), ui.ButtonSet.OK);
  }
}
