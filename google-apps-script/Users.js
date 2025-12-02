/**
 * Users.js - User Management Module
 * SIDAK Backend - User CRUD Operations (Admin Only)
 */

// ============================================
// USER MANAGEMENT (ADMIN ONLY)
// ============================================

/**
 * Get all users (admin only)
 */
function getUsers(data) {
  const { token } = data;
  
  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  // Check if user is admin
  const userInfo = getUserInfo(decoded.username);
  if (!userInfo || userInfo.role !== 'admin') {
    return createResponse({ error: 'Akses ditolak. Hanya admin yang dapat melihat daftar user.' }, 403);
  }
  
  const sheet = getSheet(USERS_SHEET);
  const sheetData = sheet.getDataRange().getValues();
  
  const users = [];
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (row[0]) { // username exists
      // Parse allowedUnits (column 4)
      let allowedUnits = [];
      if (row[3] && typeof row[3] === 'string') {
        allowedUnits = row[3].split(',').map(u => u.trim()).filter(u => u);
      }
      
      users.push({
        id: (i).toString(), // row number as ID
        username: row[0],
        role: row[2],
        email: row[4],
        createdAt: row[5],
        isActive: true, // semua user dianggap active kecuali dihapus
        allowedUnits: (row[2] === 'editor' || row[2] === 'viewer') ? allowedUnits : undefined // Return for editors and viewers
      });
    }
  }
  
  return createResponse({ success: true, users: users });
}

/**
 * Create new user (admin only)
 */
function createUser(data) {
  const { token, username, password, email, role, allowedUnits } = data;
  
  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  // Check if user is admin
  const userInfo = getUserInfo(decoded.username);
  if (!userInfo || userInfo.role !== 'admin') {
    return createResponse({ error: 'Akses ditolak. Hanya admin yang dapat membuat user.' }, 403);
  }
  
  // Validate input
  if (!username || !password || !email || !role) {
    return createResponse({ error: 'Username, password, email, dan role wajib diisi' }, 400);
  }
  
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return createResponse({ error: 'Role harus salah satu dari: admin, editor, viewer' }, 400);
  }
  
  const sheet = ensureUsersSheetInitialized();
  
  // Check if username already exists (case-insensitive)
  const existingUsers = sheet.getDataRange().getValues();
  const usernameLower = username.toLowerCase().trim();
  for (let i = 1; i < existingUsers.length; i++) {
    if (existingUsers[i][0] && existingUsers[i][0].toLowerCase().trim() === usernameLower) {
      return createResponse({ error: 'Username sudah digunakan' }, 400);
    }
  }
  
  // Check if email already exists
  const emailLower = email.toLowerCase().trim();
  for (let i = 1; i < existingUsers.length; i++) {
    if (existingUsers[i][3] && existingUsers[i][3].toLowerCase().trim() === emailLower) {
      return createResponse({ error: 'Email sudah digunakan' }, 400);
    }
  }
  
  // Create new user with hashed password
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();
  
  // Convert allowedUnits array to comma-separated string
  const allowedUnitsStr = (allowedUnits && Array.isArray(allowedUnits)) ? allowedUnits.join(',') : '';
  
  sheet.appendRow([
    username.trim(),
    passwordHash,
    role,
    allowedUnitsStr, // unitAccess
    email.trim(),
    now,
    salt,
    '', // resetToken
    '' // resetExpires
  ]);
  
  return createResponse({
    success: true,
    message: 'User berhasil ditambahkan',
    user: {
      username: username.trim(),
      email: email.trim(),
      role: role,
      allowedUnits: (role === 'editor' || role === 'viewer') ? allowedUnits : undefined,
      createdAt: now
    }
  });
}

/**
 * Update user (admin only)
 */
function updateUser(data) {
  const { token, userId, username, email, role, password, allowedUnits } = data;
  
  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  // Check if user is admin
  const userInfo = getUserInfo(decoded.username);
  if (!userInfo || userInfo.role !== 'admin') {
    return createResponse({ error: 'Akses ditolak. Hanya admin yang dapat mengupdate user.' }, 403);
  }
  
  // Validate input
  if (!userId) {
    return createResponse({ error: 'User ID wajib diisi' }, 400);
  }
  
  const sheet = getSheet(USERS_SHEET);
  const rowIndex = parseInt(userId);
  
  if (isNaN(rowIndex) || rowIndex < 1) {
    return createResponse({ error: 'User ID tidak valid' }, 400);
  }
  
  const allData = sheet.getDataRange().getValues();
  if (rowIndex >= allData.length) {
    return createResponse({ error: 'User tidak ditemukan' }, 404);
  }
  
  const currentRow = allData[rowIndex];
  const currentUsername = currentRow[0];
  
  // Check username uniqueness (except current user)
  if (username && username !== currentUsername) {
    const usernameLower = username.toLowerCase().trim();
    for (let i = 1; i < allData.length; i++) {
      if (i !== rowIndex && allData[i][0] && allData[i][0].toLowerCase().trim() === usernameLower) {
        return createResponse({ error: 'Username sudah digunakan' }, 400);
      }
    }
  }
  
  // Check email uniqueness (except current user)
  if (email && email !== currentRow[4]) {
    const emailLower = email.toLowerCase().trim();
    for (let i = 1; i < allData.length; i++) {
      if (i !== rowIndex && allData[i][4] && allData[i][4].toLowerCase().trim() === emailLower) {
        return createResponse({ error: 'Email sudah digunakan' }, 400);
      }
    }
  }
  
  // Update fields
  const actualRowIndex = rowIndex + 1; // Sheet rows are 1-indexed
  
  if (username) {
    sheet.getRange(actualRowIndex, 1).setValue(username.trim());
  }
  
  if (role && ['admin', 'editor', 'viewer'].includes(role)) {
    sheet.getRange(actualRowIndex, 3).setValue(role);
  }
  
  if (email) {
    sheet.getRange(actualRowIndex, 5).setValue(email.trim());
  }
  
  // Update password if provided
  if (password) {
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    sheet.getRange(actualRowIndex, 2).setValue(passwordHash);
    sheet.getRange(actualRowIndex, 7).setValue(salt);
  }
  
  // Update allowedUnits (column 4)
  if (allowedUnits !== undefined) {
    const allowedUnitsStr = (allowedUnits && Array.isArray(allowedUnits)) ? allowedUnits.join(',') : '';
    sheet.getRange(actualRowIndex, 4).setValue(allowedUnitsStr);
  }
  
  return createResponse({
    success: true,
    message: 'User berhasil diupdate'
  });
}

/**
 * Delete user (admin only)
 */
function deleteUser(data) {
  const { token, userId } = data;
  
  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  // Check if user is admin
  const userInfo = getUserInfo(decoded.username);
  if (!userInfo || userInfo.role !== 'admin') {
    return createResponse({ error: 'Akses ditolak. Hanya admin yang dapat menghapus user.' }, 403);
  }
  
  // Validate input
  if (!userId) {
    return createResponse({ error: 'User ID wajib diisi' }, 400);
  }
  
  const sheet = getSheet(USERS_SHEET);
  const rowIndex = parseInt(userId);
  
  if (isNaN(rowIndex) || rowIndex < 1) {
    return createResponse({ error: 'User ID tidak valid' }, 400);
  }
  
  const allData = sheet.getDataRange().getValues();
  if (rowIndex >= allData.length) {
    return createResponse({ error: 'User tidak ditemukan' }, 404);
  }
  
  const username = allData[rowIndex][0];
  
  // Prevent deleting self
  if (username === decoded.username) {
    return createResponse({ error: 'Tidak dapat menghapus user yang sedang login' }, 400);
  }
  
  // Delete row (add 1 because sheet rows are 1-indexed)
  sheet.deleteRow(rowIndex + 1);
  
  return createResponse({
    success: true,
    message: 'User berhasil dihapus'
  });
}
