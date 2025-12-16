/**
 * Auth.gs - Authentication & Authorization
 * SIDAK Backend Authentication Module
 */

// ============================================
// LOGIN & TOKEN MANAGEMENT
// ============================================

/**
 * Login user with username and password
 */
function login(data) {
  const { username, password } = data;
  
  if (!username || !password) {
    return createResponse({ error: 'Username dan password harus diisi' }, 400);
  }
  
  // Ensure Users sheet initialized and defaults present
  try {
    ensureUsersSheetInitialized();
    ensureDefaultUsersPresent();
  } catch (initErr) {
    Logger.log('ensureDefaultUsersPresent error: ' + initErr);
  }
  
  const sheet = getSheet(USERS_SHEET);
  const users = sheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < users.length; i++) {
    const [storedUsername, storedPasswordHash, role, unitAccess, email, createdAt, salt, resetToken, resetExpires] = users[i];
    if (storedUsername === username && verifyPassword(password, salt, storedPasswordHash)) {
      const token = generateToken(username);
      
      // Parse allowedUnits (stored as comma-separated string)
      let allowedUnits = [];
      if (unitAccess && typeof unitAccess === 'string') {
        allowedUnits = unitAccess.split(',').map(u => u.trim()).filter(u => u);
      }
      
      return createResponse({
        success: true,
        token: token,
        user: { 
          username: storedUsername, 
          role: role, 
          email: email,
          allowedUnits: (role === 'editor' || role === 'viewer') ? allowedUnits : undefined // Return for editors and viewers
        }
      });
    }
  }
  
  return createResponse({ error: 'Username atau password salah' }, 401);
}

/**
 * Check if authentication token is valid
 */
function checkAuth(e) {
  const token = e.parameter.token;
  
  if (!token) {
    return createResponse({ error: 'Token tidak ditemukan' }, 401);
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  const info = getUserInfo(decoded.username);
  return createResponse({ 
    success: true, 
    username: decoded.username, 
    role: info && info.role, 
    email: info && info.email 
  });
}

/**
 * Generate simple authentication token
 * Note: For production, consider using proper JWT library
 */
function generateToken(username) {
  const timestamp = new Date().getTime();
  const tokenData = username + '|' + timestamp;
  return Utilities.base64Encode(tokenData);
}

/**
 * Verify and decode authentication token
 * Returns: { username, timestamp } or null if invalid/expired
 */
function verifyToken(token) {
  try {
    const decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    const [username, timestamp] = decoded.split('|');
    
    // Token valid for 24 hours
    const tokenAge = new Date().getTime() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return { username, timestamp };
  } catch (error) {
    return null;
  }
}

/**
 * Get full user info from token (including role & allowedUnits)
 */
function getUserInfoFromToken(token) {
  const verified = verifyToken(token);
  if (!verified) {
    return null;
  }
  
  try {
    const sheet = getSheet(USERS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // Find user by username
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const username = row[0]; // Column A
      
      if (username === verified.username) {
        const role = row[2] || 'viewer'; // Column C
        const unitAccessStr = row[3] || ''; // Column D
        const allowedUnits = unitAccessStr ? unitAccessStr.split(',').map(u => u.trim()) : [];
        
        // DEBUG: Log parsed data
        Logger.log('DEBUG getUserInfoFromToken - Username: ' + username);
        Logger.log('DEBUG getUserInfoFromToken - Role from sheet: ' + row[2]);
        Logger.log('DEBUG getUserInfoFromToken - UnitAccess raw: "' + unitAccessStr + '"');
        Logger.log('DEBUG getUserInfoFromToken - AllowedUnits parsed: ' + JSON.stringify(allowedUnits));
        
        return {
          username: username,
          role: role,
          allowedUnits: allowedUnits,
          email: row[4] || '' // Column E
        };
      }
    }
    
    return null; // User not found
  } catch (error) {
    Logger.log('Error in getUserInfoFromToken: ' + error);
    return null;
  }
}

// ============================================
// PASSWORD HASHING
// ============================================

/**
 * Convert byte array to hex string
 */
function toHex(bytes) {
  return bytes.map(function(x) {
    const h = (x & 0xff).toString(16);
    return (h.length === 1) ? '0' + h : h;
  }).join('');
}

/**
 * Generate random salt for password hashing
 */
function generateSalt() {
  return Utilities.getUuid();
}

/**
 * Hash password with salt using SHA-256
 */
function hashPassword(password, salt) {
  const raw = salt + '|' + password;
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, 
    raw, 
    Utilities.Charset.UTF_8
  );
  return toHex(digest);
}

/**
 * Verify password against stored hash
 */
function verifyPassword(password, salt, passwordHash) {
  if (!salt || !passwordHash) return false;
  const h = hashPassword(password, salt);
  return h === passwordHash;
}

/**
 * Migrate plain text passwords to hashed passwords
 * Used for backward compatibility during sheet migration
 */
function migrateUsersPasswordsToHashed(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return;
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const passwordOrHash = row[1];
    const salt = row[6];
    
    // Skip if already has salt (already hashed)
    if (salt) continue;
    
    if (passwordOrHash) {
      const newSalt = generateSalt();
      const newHash = hashPassword(passwordOrHash, newSalt);
      sheet.getRange(i + 1, 2).setValue(newHash);
      sheet.getRange(i + 1, 7).setValue(newSalt);
      sheet.getRange(i + 1, 8).setValue(''); // resetToken
      sheet.getRange(i + 1, 9).setValue(''); // resetExpires
    }
  }
}

// ============================================
// PASSWORD MANAGEMENT
// ============================================

/**
 * Change own password (any authenticated user)
 */
function changeOwnPassword(data) {
  const { token, oldPassword, newPassword } = data;
  
  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return createResponse({ error: 'Token tidak valid' }, 401);
  }
  
  // Validate input
  if (!oldPassword || !newPassword) {
    return createResponse({ error: 'Password lama dan password baru wajib diisi' }, 400);
  }
  
  if (newPassword.length < 6) {
    return createResponse({ error: 'Password baru minimal 6 karakter' }, 400);
  }
  
  const sheet = getSheet(USERS_SHEET);
  const users = sheet.getDataRange().getValues();
  
  // Find user and verify old password
  for (let i = 1; i < users.length; i++) {
    const [storedUsername, storedPasswordHash, role, unitAccess, email, createdAt, salt] = users[i];
    
    if (storedUsername === decoded.username) {
      // Verify old password
      if (!verifyPassword(oldPassword, salt, storedPasswordHash)) {
        return createResponse({ error: 'Password lama salah' }, 401);
      }
      
      // Generate new password hash
      const newSalt = generateSalt();
      const newPasswordHash = hashPassword(newPassword, newSalt);
      
      // Update password in spreadsheet
      const rowIndex = i + 1; // Sheet rows are 1-indexed
      sheet.getRange(rowIndex, 2).setValue(newPasswordHash); // passwordHash column
      sheet.getRange(rowIndex, 7).setValue(newSalt); // salt column
      
      return createResponse({
        success: true,
        message: 'Password berhasil diubah'
      });
    }
  }
  
  return createResponse({ error: 'User tidak ditemukan' }, 404);
}

// ============================================
// PASSWORD RESET
// ============================================

/**
 * Notify admin about forgotten password
 * Frontend can call this to request password reset
 */
function notifyAdminForgotPassword(data) {
  const { username, email } = data;
  
  if (!username && !email) {
    return createResponse({ 
      error: 'Username atau email harus diisi' 
    }, 400);
  }
  
  // Just log the request - actual password reset should be done by admin via spreadsheet
  Logger.log('Password reset requested for: ' + (username || email));
  
  return createResponse({
    success: true,
    message: 'Permintaan reset password telah dicatat. Silakan hubungi administrator untuk reset password.'
  });
}
