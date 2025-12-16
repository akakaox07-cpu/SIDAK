/**
 * Assets.gs - Asset CRUD Operations
 * SIDAK Backend Assets Module
 * Handles: Barang/Inventaris, Tanah, Bangunan
 */

// ============================================
// GET ASSETS
// ============================================

/**
 * Get all assets from all sheets
 */
function getAssets(e) {
  const token = e.parameter.token;
  
  if (!verifyToken(token)) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  // Get user info to check role & unitAccess
  const userInfo = getUserInfoFromToken(token);
  if (!userInfo) {
    return createResponse({ error: 'User tidak ditemukan' }, 401);
  }
  
  const isAdmin = userInfo.role === 'admin';
  const allowedUnits = userInfo.allowedUnits || []; // Array of allowed unit names
  
  // DEBUG: Log user info
  Logger.log('DEBUG getAssets - Username: ' + userInfo.username);
  Logger.log('DEBUG getAssets - Role: ' + userInfo.role);
  Logger.log('DEBUG getAssets - AllowedUnits: ' + JSON.stringify(allowedUnits));
  
  const inventaris = [];
  const tanah = [];
  const bangunan = [];
  
  // Get Inventaris/Barang
  try {
    const invSheet = getSheet(INVENTARIS_SHEET);
    const invData = invSheet.getDataRange().getValues();
    if (invData.length > 1) {
      const headers = invData[0];
      for (let i = 1; i < invData.length; i++) {
        const asset = rowToAsset(invData[i], headers, 'inventaris');
        
        // DEBUG: Log first 3 assets
        if (i <= 3) {
          Logger.log('DEBUG Asset #' + i + ' - Unit: ' + asset.unit + ', Includes: ' + allowedUnits.includes(asset.unit));
        }
        
        // Filter by unitAccess if not admin
        if (isAdmin || allowedUnits.length === 0 || allowedUnits.includes(asset.unit)) {
          inventaris.push(asset);
        }
      }
    }
  } catch (e) {
    Logger.log('Error loading inventaris: ' + e);
  }
  
  // Get Tanah
  try {
    const tanahSheet = getSheet(TANAH_SHEET);
    const tanahData = tanahSheet.getDataRange().getValues();
    if (tanahData.length > 1) {
      const headers = tanahData[0];
      for (let i = 1; i < tanahData.length; i++) {
        const asset = rowToAsset(tanahData[i], headers, 'tanah');
        // Filter by unitAccess if not admin
        if (isAdmin || allowedUnits.length === 0 || allowedUnits.includes(asset.unit)) {
          tanah.push(asset);
        }
      }
    }
  } catch (e) {
    Logger.log('Error loading tanah: ' + e);
  }
  
  // Get Bangunan
  try {
    const bangunanSheet = getSheet(BANGUNAN_SHEET);
    const bangunanData = bangunanSheet.getDataRange().getValues();
    if (bangunanData.length > 1) {
      const headers = bangunanData[0];
      for (let i = 1; i < bangunanData.length; i++) {
        const asset = rowToAsset(bangunanData[i], headers, 'bangunan');
        // Filter by unitAccess if not admin
        if (isAdmin || allowedUnits.length === 0 || allowedUnits.includes(asset.unit)) {
          bangunan.push(asset);
        }
      }
    }
  } catch (e) {
    Logger.log('Error loading bangunan: ' + e);
  }
  
  return createResponse({
    success: true,
    assets: inventaris.concat(tanah).concat(bangunan)
  });
}

/**
 * Get single asset by ID (search all sheets)
 */
function getAsset(e) {
  const token = e.parameter.token;
  const id = e.parameter.id;
  
  if (!verifyToken(token)) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  if (!id) {
    return createResponse({ error: 'Asset ID required' }, 400);
  }
  
  // Search in Inventaris
  let asset = findAssetInSheet(id, INVENTARIS_SHEET, 'inventaris');
  if (asset) {
    return createResponse({ success: true, asset: asset });
  }
  
  // Search in Tanah
  asset = findAssetInSheet(id, TANAH_SHEET, 'tanah');
  if (asset) {
    return createResponse({ success: true, asset: asset });
  }
  
  // Search in Bangunan
  asset = findAssetInSheet(id, BANGUNAN_SHEET, 'bangunan');
  if (asset) {
    return createResponse({ success: true, asset: asset });
  }
  
  return createResponse({ error: 'Asset not found' }, 404);
}

// ============================================
// CREATE ASSET
// ============================================

/**
 * Create new asset
 */
function createAsset(data) {
  const { token, asset } = data;
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  // Authorization: editor, admin can create
  const perm = requirePermission(decoded.username, 'create');
  if (!perm.allowed) {
    return createResponse({ error: 'Forbidden: role does not have create permission' }, 403);
  }
  
  // Normalize + validate asset data
  const normalized = normalizeAssetPayload(asset);
  const validationErrors = validateAssetData(normalized);
  if (validationErrors.length > 0) {
    return createResponse({ 
      error: 'Validation failed', 
      details: validationErrors 
    }, 400);
  }
  
  // Determine target sheet based on jenisInventaris
  const { sheet, type } = getAssetSheet(normalized.jenisInventaris);
  
  // Check duplicate kode barang
  const kodeField = type === 'inventaris' ? 'noKodeBarang' : 'kodeBarang';
  if (normalized[kodeField]) {
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const kodeIndex = headers.indexOf(kodeField);
    
    if (kodeIndex !== -1) {
      const kodeBarang = String(normalized[kodeField]).toUpperCase().trim();
      for (let i = 1; i < allData.length; i++) {
        const existingKode = String(allData[i][kodeIndex] || '').toUpperCase().trim();
        if (existingKode === kodeBarang) {
          return createResponse({ 
            error: 'Kode barang "' + normalized[kodeField] + '" sudah digunakan' 
          }, 400);
        }
      }
    }
  }
  
  const id = Utilities.getUuid();
  const now = new Date().toISOString();
  
  try {
    const row = assetToRow(normalized, type, id, now, decoded.username);
    sheet.appendRow(row);
    
    return createResponse({
      success: true,
      id: id,
      message: 'Asset created successfully'
    });
  } catch (error) {
    return createResponse({ 
      error: 'Failed to create asset', 
      details: error.toString() 
    }, 500);
  }
}

// ============================================
// UPDATE ASSET
// ============================================

/**
 * Update existing asset
 */
function updateAsset(data) {
  const { token, id, asset } = data;
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  // Authorization: editor, admin can update
  const perm = requirePermission(decoded.username, 'update');
  if (!perm.allowed) {
    return createResponse({ error: 'Forbidden: role does not have update permission' }, 403);
  }
  
  if (!id) {
    return createResponse({ error: 'Asset ID required' }, 400);
  }
  
  // Normalize + validate asset data
  const normalized = normalizeAssetPayload(asset);
  const validationErrors = validateAssetData(normalized);
  if (validationErrors.length > 0) {
    return createResponse({ 
      error: 'Validation failed', 
      details: validationErrors 
    }, 400);
  }
  
  // Find and update in appropriate sheet
  const sheets = [
    { name: INVENTARIS_SHEET, type: 'inventaris' },
    { name: TANAH_SHEET, type: 'tanah' },
    { name: BANGUNAN_SHEET, type: 'bangunan' }
  ];
  
  for (let s = 0; s < sheets.length; s++) {
    const sheet = getSheet(sheets[s].name);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        try {
          // Check duplicate kode barang (exclude current row)
          const kodeField = sheets[s].type === 'inventaris' ? 'noKodeBarang' : 'kodeBarang';
          if (normalized[kodeField]) {
            const kodeIndex = headers.indexOf(kodeField);
            if (kodeIndex !== -1) {
              const kodeBarang = String(normalized[kodeField]).toUpperCase().trim();
              for (let j = 1; j < data.length; j++) {
                if (j !== i) { // Skip current row being updated
                  const existingKode = String(data[j][kodeIndex] || '').toUpperCase().trim();
                  if (existingKode === kodeBarang) {
                    return createResponse({ 
                      error: 'Kode barang "' + normalized[kodeField] + '" sudah digunakan' 
                    }, 400);
                  }
                }
              }
            }
          }
          
          // Get createdAt and createdBy from existing row
          const createdAtIdx = headers.indexOf('createdAt');
          const createdByIdx = headers.indexOf('createdBy');
          const createdAt = createdAtIdx >= 0 ? data[i][createdAtIdx] : new Date().toISOString();
          const createdBy = createdByIdx >= 0 ? data[i][createdByIdx] : 'unknown';
          
          const row = assetToRow(normalized, sheets[s].type, id, createdAt, createdBy);
          
          // Update row
          for (let j = 0; j < row.length; j++) {
            sheet.getRange(i + 1, j + 1).setValue(row[j]);
          }
          
          return createResponse({
            success: true,
            message: 'Asset updated successfully'
          });
        } catch (error) {
          return createResponse({ 
            error: 'Failed to update asset', 
            details: error.toString() 
          }, 500);
        }
      }
    }
  }
  
  return createResponse({ error: 'Asset not found' }, 404);
}

// ============================================
// DELETE ASSET
// ============================================

/**
 * Delete asset
 */
function deleteAsset(data) {
  const { token, id } = data;
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  // Authorization: only admin can delete
  const perm = requirePermission(decoded.username, 'delete');
  if (!perm.allowed) {
    return createResponse({ error: 'Forbidden: only admin can delete assets' }, 403);
  }
  
  if (!id) {
    return createResponse({ error: 'Asset ID required' }, 400);
  }
  
  // Search and delete in all sheets
  const sheets = [INVENTARIS_SHEET, TANAH_SHEET, BANGUNAN_SHEET];
  
  for (let s = 0; s < sheets.length; s++) {
    const sheet = getSheet(sheets[s]);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        try {
          sheet.deleteRow(i + 1);
          return createResponse({
            success: true,
            message: 'Asset deleted successfully'
          });
        } catch (error) {
          return createResponse({ 
            error: 'Failed to delete asset', 
            details: error.toString() 
          }, 500);
        }
      }
    }
  }
  
  return createResponse({ error: 'Asset not found' }, 404);
}

// ============================================
// IMAGE UPLOAD
// ============================================

/**
 * Upload image to Google Drive
 */
function uploadImage(data) {
  const { token, imageData, fileName, mimeType, assetId } = data;
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  // Authorization: editor, admin can upload
  const perm = requirePermission(decoded.username, 'create');
  if (!perm.allowed) {
    return createResponse({ error: 'Forbidden: insufficient permission' }, 403);
  }
  
  if (!imageData || !fileName) {
    return createResponse({ error: 'Image data and filename required' }, 400);
  }
  
  try {
    // Get or create SIDAK folder in Drive
    let folder;
    const folders = DriveApp.getFoldersByName('SIDAK');
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder('SIDAK');
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    // Create subfolder for asset if assetId provided
    if (assetId) {
      const subFolders = folder.getFoldersByName(assetId);
      if (subFolders.hasNext()) {
        folder = subFolders.next();
      } else {
        folder = folder.createFolder(assetId);
      }
    }
    
    // Parse base64 data - handle data URL format (data:image/png;base64,...)
    let base64String = imageData;
    let detectedMimeType = mimeType || 'image/jpeg';
    
    // If it's a data URL, extract MIME type and base64
    if (imageData && imageData.startsWith('data:')) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedMimeType = match[1];  // Extract MIME type
        base64String = match[2];      // Extract base64 data
      }
    }
    
    // Decode and create blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64String),
      detectedMimeType,
      fileName
    );
    
    // Upload to Drive
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    // Return thumbnail URL that can be directly embedded in img tags
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
    
    return createResponse({
      success: true,
      url: thumbnailUrl,  // Use thumbnail URL instead of file.getUrl()
      id: fileId,
      driveUrl: file.getUrl(),  // Keep original for reference
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    return createResponse({ 
      error: 'Failed to upload image', 
      details: error.toString() 
    }, 500);
  }
}
