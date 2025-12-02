/**
 * Utils.gs - Utility & Helper Functions
 * SIDAK Backend Utilities
 */

// ============================================
// SPREADSHEET ACCESS
// ============================================

/**
 * Get spreadsheet by ID or active spreadsheet
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      try {
        const active = SpreadsheetApp.getActiveSpreadsheet();
        if (active) return active;
      } catch (_) {}
      throw e;
    }
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('SPREADSHEET_ID is not set and no active spreadsheet is available. Set SPREADSHEET_ID in Config.gs.');
}

/**
 * Get sheet by name (creates if not exists)
 */
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  return sheet;
}

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate unique ID
 */
function generateId() {
  return Utilities.getUuid();
}

// ============================================
// HTTP RESPONSE
// ============================================

/**
 * Create JSON response for web app
 * Note: Apps Script doesn't support CORS headers directly
 * Use text/plain content type to avoid preflight
 */
function createResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// USER HELPERS
// ============================================

/**
 * Get user info by username
 */
function getUserInfo(username) {
  if (!username) return null;
  const sheet = getSheet(USERS_SHEET);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row[0] === username) {
      return { username: row[0], role: row[2], email: row[4] };
    }
  }
  return null;
}

/**
 * Get user by username (alias for consistency)
 */
function getUserByUsername(username) {
  return getUserInfo(username);
}

/**
 * Check user permission for action
 */
function requirePermission(username, action) {
  const info = getUserInfo(username);
  const role = info && info.role ? String(info.role).toLowerCase() : '';
  let allowed = false;
  
  switch (action) {
    case 'create':
    case 'update':
      allowed = role === 'admin' || role === 'editor';
      break;
    case 'delete':
      allowed = role === 'admin';
      break;
    case 'read':
      allowed = role === 'admin' || role === 'editor' || role === 'viewer';
      break;
    default:
      allowed = false;
  }
  
  return { allowed: allowed, role: role };
}

// ============================================
// ASSET HELPERS
// ============================================

/**
 * Determine which sheet to use based on jenisInventaris
 */
function getAssetSheet(jenisInventaris) {
  const jenis = String(jenisInventaris || '').toLowerCase();
  
  if (jenis === 'tanah') {
    return { sheet: getSheet(TANAH_SHEET), type: 'tanah' };
  } else if (jenis === 'bangunan') {
    return { sheet: getSheet(BANGUNAN_SHEET), type: 'bangunan' };
  } else {
    return { sheet: getSheet(INVENTARIS_SHEET), type: 'inventaris' };
  }
}

/**
 * Convert asset object to row array
 */
function assetToRow(asset, type, id, createdAt, createdBy) {
  const now = new Date().toISOString();
  let headers;
  
  if (type === 'tanah') {
    headers = getTanahHeaders();
  } else if (type === 'bangunan') {
    headers = getBangunanHeaders();
  } else {
    headers = getInventarisHeaders();
  }
  
  const row = [];
  for (let i = 0; i < headers.length; i++) {
    const key = headers[i];
    let value = asset[key];
    
    // Special handling for certain fields
    if (key === 'id') {
      value = id;
    } else if (key === 'createdAt') {
      value = createdAt || now;
    } else if (key === 'updatedAt') {
      value = now;
    } else if (key === 'createdBy') {
      value = createdBy;
    } else if (key === 'photos' && Array.isArray(value)) {
      value = JSON.stringify(value);
    }
    
    row.push(value !== undefined ? value : '');
  }
  
  return row;
}

/**
 * Convert row array to asset object
 */
function rowToAsset(row, headers, type) {
  const asset = {};
  for (let j = 0; j < headers.length; j++) {
    const key = headers[j];
    let value = row[j];
    
    // Parse photos JSON if exists
    if (key === 'photos' && value) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = [];
      }
    }
    
    asset[key] = value;
  }
  
  // Add jenisInventaris based on type
  if (!asset.jenisInventaris) {
    if (type === 'tanah') {
      asset.jenisInventaris = 'Tanah';
    } else if (type === 'bangunan') {
      asset.jenisInventaris = 'Bangunan';
    } else {
      asset.jenisInventaris = asset.jenisInventaris || 'Barang';
    }
  }
  
  return asset;
}

/**
 * Find asset in specific sheet by ID
 */
function findAssetInSheet(id, sheetName, type) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) return null;
  
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return rowToAsset(data[i], headers, type);
    }
  }
  
  return null;
}

// ============================================
// DATA VALIDATION
// ============================================

/**
 * Normalize asset payload
 */
function normalizeAssetPayload(asset) {
  const normalized = {};
  
  for (let key in asset) {
    if (asset.hasOwnProperty(key)) {
      let value = asset[key];
      
      // Convert empty strings to null for consistency
      if (value === '') {
        value = null;
      }
      
      // Trim string values
      if (typeof value === 'string') {
        value = value.trim();
      }
      
      normalized[key] = value;
    }
  }
  
  return normalized;
}

/**
 * Validate asset data
 */
function validateAssetData(asset) {
  const errors = [];
  
  // Required fields validation
  if (!asset.namaBarang || !asset.namaBarang.trim()) {
    errors.push('Nama barang harus diisi');
  }
  
  if (!asset.jenisInventaris) {
    errors.push('Jenis inventaris harus diisi');
  }
  
  // Numeric validations
  if (asset.hargaBeli && isNaN(Number(asset.hargaBeli))) {
    errors.push('Harga beli harus berupa angka');
  }
  
  if (asset.jumlahBarang && isNaN(Number(asset.jumlahBarang))) {
    errors.push('Jumlah barang harus berupa angka');
  }
  
  return errors;
}
