/**
 * MasterData.gs - Master Data CRUD Operations
 * SIDAK Backend Master Data Module
 * Handles: Units, Categories, Sources
 */

// ============================================
// GET MASTER DATA
// ============================================

/**
 * Get all items from a master data sheet
 * Types: 'units', 'categories', 'sources'
 */
function getMasterData(data) {
  const { type, token } = data;
  
  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  let sheetName;
  switch(type) {
    case 'units':
      sheetName = UNITS_SHEET;
      break;
    case 'categories':
      sheetName = CATEGORIES_SHEET;
      break;
    case 'sources':
      sheetName = SOURCES_SHEET;
      break;
    default:
      return createResponse({ error: 'Invalid master data type' }, 400);
  }
  
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return createResponse({ items: [] });
    }
    
    const headers = data[0];
    const items = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      items.push(item);
    }
    
    return createResponse({ items: items });
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// CREATE MASTER DATA
// ============================================

/**
 * Create new master data item
 * Admin only
 */
function createMasterDataItem(data) {
  const { type, item, token } = data;
  
  // Verify token and admin role
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  const user = getUserByUsername(decoded.username);
  if (!user || user.role !== 'admin') {
    return createResponse({ error: 'Unauthorized - Admin only' }, 403);
  }
  
  let sheetName;
  switch(type) {
    case 'units':
      sheetName = UNITS_SHEET;
      break;
    case 'categories':
      sheetName = CATEGORIES_SHEET;
      break;
    case 'sources':
      sheetName = SOURCES_SHEET;
      break;
    default:
      return createResponse({ error: 'Invalid master data type' }, 400);
  }
  
  try {
    const sheet = getSheet(sheetName);
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    // Validate: name tidak boleh kosong
    if (!item.name || !item.name.trim()) {
      return createResponse({ error: 'Nama tidak boleh kosong' }, 400);
    }
    
    // Check duplicate name (case-insensitive)
    const nameIndex = headers.indexOf('name');
    if (nameIndex !== -1) {
      const existingNames = allData.slice(1).map(row => String(row[nameIndex] || '').toLowerCase().trim());
      const newName = item.name.toLowerCase().trim();
      
      if (existingNames.includes(newName)) {
        return createResponse({ error: 'Nama "' + item.name + '" sudah digunakan' }, 400);
      }
    }
    
    // For categories, validate code is unique
    if (type === 'categories') {
      if (!item.code || !item.code.trim()) {
        return createResponse({ error: 'Kode kategori tidak boleh kosong' }, 400);
      }
      
      const codeIndex = headers.indexOf('code');
      if (codeIndex !== -1) {
        const existingCodes = allData.slice(1).map(row => String(row[codeIndex] || '').toUpperCase().trim());
        const newCode = item.code.toUpperCase().trim();
        
        if (existingCodes.includes(newCode)) {
          return createResponse({ error: 'Kode "' + item.code + '" sudah digunakan' }, 400);
        }
      }
    }
    
    const newRow = [];
    const now = new Date().toISOString();
    
    headers.forEach(header => {
      if (header === 'id') {
        newRow.push(generateId());
      } else if (header === 'createdAt' || header === 'updatedAt') {
        newRow.push(now);
      } else if (header === 'isActive') {
        newRow.push(item[header] !== undefined ? item[header] : true);
      } else if (header === 'code' && type === 'categories') {
        newRow.push(item[header] ? item[header].toUpperCase().trim() : '');
      } else if (header === 'name') {
        newRow.push(item[header].trim());
      } else {
        newRow.push(item[header] || '');
      }
    });
    
    sheet.appendRow(newRow);
    
    return createResponse({ 
      success: true, 
      message: 'Item created successfully',
      id: newRow[0]
    });
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// UPDATE MASTER DATA
// ============================================

/**
 * Update existing master data item
 * Admin only
 */
function updateMasterDataItem(data) {
  const { type, id, updates, token } = data;
  
  // Verify token and admin role
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  const user = getUserByUsername(decoded.username);
  if (!user || user.role !== 'admin') {
    return createResponse({ error: 'Unauthorized - Admin only' }, 403);
  }
  
  let sheetName;
  switch(type) {
    case 'units':
      sheetName = UNITS_SHEET;
      break;
    case 'categories':
      sheetName = CATEGORIES_SHEET;
      break;
    case 'sources':
      sheetName = SOURCES_SHEET;
      break;
    default:
      return createResponse({ error: 'Invalid master data type' }, 400);
  }
  
  try {
    const sheet = getSheet(sheetName);
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    // Find row with matching id
    let rowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === id) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return createResponse({ error: 'Item not found' }, 404);
    }
    
    // Validate updates - name
    if (updates.name !== undefined) {
      if (!updates.name || !updates.name.trim()) {
        return createResponse({ error: 'Nama tidak boleh kosong' }, 400);
      }
      
      // Check duplicate name (exclude current item)
      const nameIndex = headers.indexOf('name');
      if (nameIndex !== -1) {
        const newName = updates.name.toLowerCase().trim();
        for (let i = 1; i < allData.length; i++) {
          if (i !== rowIndex) { // Skip current row being updated
            const existingName = String(allData[i][nameIndex] || '').toLowerCase().trim();
            if (existingName === newName) {
              return createResponse({ 
                error: 'Nama "' + updates.name + '" sudah digunakan' 
              }, 400);
            }
          }
        }
      }
    }
    
    // For categories - validate code
    if (type === 'categories' && updates.code !== undefined) {
      if (!updates.code || !updates.code.trim()) {
        return createResponse({ error: 'Kode kategori tidak boleh kosong' }, 400);
      }
      
      const codeIndex = headers.indexOf('code');
      if (codeIndex !== -1) {
        const newCode = updates.code.toUpperCase().trim();
        for (let i = 1; i < allData.length; i++) {
          if (i !== rowIndex) { // Skip current row
            const existingCode = String(allData[i][codeIndex] || '').toUpperCase().trim();
            if (existingCode === newCode) {
              return createResponse({ 
                error: 'Kode "' + updates.code + '" sudah digunakan' 
              }, 400);
            }
          }
        }
      }
    }
    
    // Update row
    const now = new Date().toISOString();
    headers.forEach((header, colIndex) => {
      if (header === 'updatedAt') {
        sheet.getRange(rowIndex + 1, colIndex + 1).setValue(now);
      } else if (updates[header] !== undefined) {
        let value = updates[header];
        
        // Normalize values
        if (header === 'name' && value) {
          value = value.trim();
        } else if (header === 'code' && type === 'categories' && value) {
          value = value.toUpperCase().trim();
        }
        
        sheet.getRange(rowIndex + 1, colIndex + 1).setValue(value);
      }
    });
    
    return createResponse({ 
      success: true, 
      message: 'Item updated successfully'
    });
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// DELETE MASTER DATA
// ============================================

/**
 * Delete master data item
 * Admin only
 */
function deleteMasterDataItem(data) {
  const { type, id, token } = data;
  
  // Verify token and admin role
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  const user = getUserByUsername(decoded.username);
  if (!user || user.role !== 'admin') {
    return createResponse({ error: 'Unauthorized - Admin only' }, 403);
  }
  
  let sheetName;
  switch(type) {
    case 'units':
      sheetName = UNITS_SHEET;
      break;
    case 'categories':
      sheetName = CATEGORIES_SHEET;
      break;
    case 'sources':
      sheetName = SOURCES_SHEET;
      break;
    default:
      return createResponse({ error: 'Invalid master data type' }, 400);
  }
  
  try {
    const sheet = getSheet(sheetName);
    const allData = sheet.getDataRange().getValues();
    
    // Find row with matching id
    let rowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === id) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return createResponse({ error: 'Item not found' }, 404);
    }
    
    sheet.deleteRow(rowIndex + 1);
    
    return createResponse({ 
      success: true, 
      message: 'Item deleted successfully'
    });
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}
