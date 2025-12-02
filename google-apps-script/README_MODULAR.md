# SIDAK Backend - Modular Structure Documentation

## Overview
SIDAK Backend telah dimodularisasi dari file monolithic 2161 baris menjadi 7 file terpisah dengan separation of concerns yang jelas.

## File Structure

```
google-apps-script/
├── Code.gs              # Main router & entry point (~450 lines)
├── Config.gs            # Constants & configuration (137 lines)
├── Utils.gs             # Helper functions (264 lines)
├── Auth.gs              # Authentication module (196 lines)
├── MasterData.gs        # Master data CRUD (340 lines)
├── Assets.gs            # Asset CRUD operations (383 lines)
├── Setup.gs             # Database initialization (420 lines)
└── Code_old_backup.gs   # Backup of original monolithic file
```

## Module Descriptions

### 1. **Code.gs** - Main Router
**Purpose:** Entry point for Web App, menu initialization, and request routing

**Key Functions:**
- `onOpen()` - Creates custom menu when spreadsheet opens
- `doGet(e)` - Handles GET requests (getAssets, getAsset, checkAuth)
- `doPost(e)` - Routes POST requests to appropriate modules
- `doOptions(e)` - CORS preflight handler
- Menu handlers: `testLoginAdmin()`, `menuResetUserPassword()`, etc.
- `importSampleData()` - Import test data
- `showDeploymentInstructions()` - Deployment guide

**Dependencies:** All other modules (calls functions from other files)

---

### 2. **Config.gs** - Configuration & Constants
**Purpose:** Central location for all constants, default data, and configuration

**Contains:**
- `SPREADSHEET_ID` - Target spreadsheet ID
- Sheet name constants: `USERS_SHEET`, `INVENTARIS_SHEET`, `TANAH_SHEET`, etc.
- `DEFAULT_USERS` - Default user accounts (admin, editor, viewer)
- `getInventarisHeaders()` - Column headers for Inventaris sheet
- `getTanahHeaders()` - Column headers for Tanah sheet
- `getBangunanHeaders()` - Column headers for Bangunan sheet
- `getDefaultUnits()` - 13 default units (Kelurahan names)
- `getDefaultCategories()` - 15 default categories with codes
- `getDefaultSources()` - 12 default funding sources

**Dependencies:** None (base module)

**Usage Example:**
```javascript
const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
const units = getDefaultUnits();
```

---

### 3. **Utils.gs** - Utility Functions
**Purpose:** Reusable helper functions used across all modules

**Key Functions:**
- `getSpreadsheet()` - Get spreadsheet with fallback logic
- `getSheet(sheetName)` - Get/create sheet by name
- `generateId()` - Generate UUID for new records
- `createResponse(data, statusCode)` - Create JSON response with CORS
- `getUserInfo(username)` - Get user details from Users sheet
- `getUserByUsername(username)` - Fetch user record
- `requirePermission(username, action)` - Authorization check
- `getAssetSheet(jenisInventaris)` - Determine target sheet for asset type
- `assetToRow(asset, type, id, timestamp, username)` - Convert asset object to row array
- `rowToAsset(row, type)` - Convert row array to asset object
- `findAssetInSheet(sheet, id, type)` - Search for asset by ID
- `normalizeAssetPayload(asset)` - Normalize different payload formats
- `validateAssetData(asset)` - Validate asset data

**Dependencies:** Config.gs (for sheet names and constants)

**Usage Example:**
```javascript
const sheet = getSheet(INVENTARIS_SHEET);
const user = getUserByUsername('admin');
const id = generateId();
```

---

### 4. **Auth.gs** - Authentication & Authorization
**Purpose:** Handle user authentication, token management, and password security

**Key Functions:**
- `login(data)` - Authenticate user with username/password
- `checkAuth(e)` - Verify authentication token
- `generateToken(username)` - Create authentication token
- `verifyToken(token)` - Validate token (24-hour expiry)
- `generateSalt()` - Generate random salt for password hashing
- `toHex(bytes)` - Convert byte array to hex string
- `hashPassword(password, salt)` - Hash password with SHA-256
- `verifyPassword(password, salt, hash)` - Verify password against hash
- `migrateUsersPasswordsToHashed()` - Migrate plain passwords to hashed
- `notifyAdminForgotPassword(data)` - Handle password reset requests

**Security Features:**
- SHA-256 password hashing with salt
- Token-based authentication (24-hour expiry)
- Role-based access control (admin, editor, viewer)

**Dependencies:** Config.gs, Utils.gs

**Usage Example:**
```javascript
const result = login({ username: 'admin', password: 'admin123' });
const decoded = verifyToken(token);
const hash = hashPassword('password123', salt);
```

---

### 5. **MasterData.gs** - Master Data CRUD
**Purpose:** Manage master data (Units, Categories, Sources) with validation

**Key Functions:**
- `getMasterData(data)` - Fetch master data by type
- `createMasterDataItem(data)` - Create new master data item
- `updateMasterDataItem(data)` - Update existing item
- `deleteMasterDataItem(data)` - Delete item (admin only)

**Validation Features:**
- **Duplicate Prevention:**
  - Unit names (case-insensitive, trimmed)
  - Category names & codes (case-insensitive, uppercase normalized)
  - Source names (case-insensitive, trimmed)
- **Empty Field Validation:** Ensures required fields are not empty
- **Role-Based Access:** Admin-only for delete operations

**Master Data Types:**
1. **Units** (Master_Units):
   - Columns: id, name, isActive, createdAt, updatedAt
   - 13 default Kelurahan names
   
2. **Categories** (Master_Categories):
   - Columns: id, name, code, isActive, createdAt, updatedAt
   - 15 default categories (Elektronik, Mebel, Kendaraan, etc.)
   
3. **Sources** (Master_Sources):
   - Columns: id, name, isActive, createdAt, updatedAt
   - 12 default funding sources (APBD, Hibah, Dana Desa, etc.)

**Dependencies:** Config.gs, Utils.gs, Auth.gs

**Usage Example:**
```javascript
// Get all units
const units = getMasterData({ type: 'units', token: userToken });

// Create new category
const result = createMasterDataItem({
  type: 'categories',
  name: 'Kategori Baru',
  code: 'KB',
  token: userToken
});
```

---

### 6. **Assets.gs** - Asset CRUD Operations
**Purpose:** Manage asset data (Inventaris, Tanah, Bangunan) with validation

**Key Functions:**
- `getAssets(e)` - Fetch all assets from all sheets
- `getAsset(e)` - Get single asset by ID
- `createAsset(data)` - Create new asset
- `updateAsset(data)` - Update existing asset
- `deleteAsset(data)` - Delete asset (admin only)
- `uploadImage(data)` - Upload image to Google Drive

**Validation Features:**
- **Duplicate Prevention:** Kode barang uniqueness check (case-insensitive)
- **Field Validation:** Validates required fields and data types
- **Authorization:** 
  - Editor/Admin: Create, Update
  - Admin only: Delete
  - All roles: View

**Asset Types:**
1. **Inventaris (Barang)** - General inventory items
2. **Tanah** - Land assets
3. **Bangunan** - Building assets

**Image Upload:**
- Uploads to "SIDAK" folder in Google Drive
- Base64 image data support
- Public access with shareable links

**Dependencies:** Config.gs, Utils.gs, Auth.gs

**Usage Example:**
```javascript
// Get all assets
const assets = getAssets({ parameter: { token: userToken } });

// Create new asset
const result = createAsset({
  token: userToken,
  asset: {
    jenisInventaris: 'Elektronik',
    noKodeBarang: 'ELK-2024-001',
    namaBarang: 'Laptop Dell',
    // ... other fields
  }
});
```

---

### 7. **Setup.gs** - Database Initialization
**Purpose:** Initialize and manage database setup, schemas, and default data

**Key Functions:**

**Main Setup:**
- `setupDatabase()` - Complete database setup (Users + Assets + Master Data)
- `setupDefaultUsers()` - Create default users (admin, editor, viewer)
- `setupAssetsSheets()` - Initialize asset sheets with headers
- `setupMasterDataSheets()` - Initialize master data sheets with defaults

**Sheet Initialization:**
- `ensureUsersSheetInitialized()` - Create Users sheet with proper schema
- `ensureDefaultUsersPresent()` - Auto-create missing default users
- `ensureInventarisSheetInitialized()` - Create Inventaris sheet
- `ensureTanahSheetInitialized()` - Create Tanah sheet
- `ensureBangunanSheetInitialized()` - Create Bangunan sheet
- `ensureUnitsSheetInitialized()` - Create Units sheet with defaults
- `ensureCategoriesSheetInitialized()` - Create Categories sheet with defaults
- `ensureSourcesSheetInitialized()` - Create Sources sheet with defaults

**Database Info:**
- `showDatabaseInfo()` - Display database statistics in UI
- `showDatabaseStats()` - Show detailed statistics
- `getDatabaseStats()` - Get stats as object

**Utilities:**
- `clearAllAssets()` - Clear all asset data (keep headers)

**Dependencies:** Config.gs, Utils.gs, Auth.gs

**Usage Example:**
```javascript
// Run complete setup
setupDatabase();

// Initialize specific sheets
ensureUnitsSheetInitialized();
ensureCategoriesSheetInitialized();

// Get stats
const stats = getDatabaseStats();
// Returns: { users: 3, inventaris: 10, tanah: 5, bangunan: 2, assets: 17 }
```

---

## Module Dependencies

```
Code.gs (Main Router)
  ├── Config.gs ✓
  ├── Utils.gs ✓
  ├── Auth.gs ✓
  ├── MasterData.gs ✓
  ├── Assets.gs ✓
  └── Setup.gs ✓

Auth.gs
  ├── Config.gs ✓
  └── Utils.gs ✓

MasterData.gs
  ├── Config.gs ✓
  ├── Utils.gs ✓
  └── Auth.gs ✓

Assets.gs
  ├── Config.gs ✓
  ├── Utils.gs ✓
  └── Auth.gs ✓

Setup.gs
  ├── Config.gs ✓
  ├── Utils.gs ✓
  └── Auth.gs ✓

Utils.gs
  └── Config.gs ✓

Config.gs
  └── (No dependencies - base module)
```

## How Google Apps Script Modules Work

**Important Notes:**
1. **Global Scope:** All `.gs` files share the same global scope
2. **No Import/Export:** No need for `import` or `export` statements
3. **Direct Function Calls:** Functions from any file can call functions from any other file
4. **Load Order:** Google Apps Script loads all files automatically
5. **Namespace:** To avoid conflicts, use descriptive function names

## Migration from Monolithic Structure

### Before (Monolithic)
```
Code.gs (2161 lines)
  ├── Configuration (lines 1-40)
  ├── Headers functions (lines 41-80)
  ├── Initialization (lines 81-210)
  ├── Main handlers (lines 211-340)
  ├── Authentication (lines 341-480)
  ├── Master Data (lines 481-680)
  ├── Assets CRUD (lines 681-1250)
  ├── Utilities (lines 1251-1460)
  ├── Password hashing (lines 1461-1550)
  └── Setup functions (lines 1551-2161)
```

### After (Modular)
```
7 separate files with clear responsibilities
Total: ~2190 lines (includes new Setup.gs documentation)
Average: ~313 lines per file
Largest: Assets.gs (383 lines)
Smallest: Config.gs (137 lines)
```

## Benefits of Modular Structure

1. **Maintainability:** Easier to find and update specific functionality
2. **Collaboration:** Multiple developers can work on different modules
3. **Readability:** Clear separation of concerns
4. **Debugging:** Faster to locate issues within specific domains
5. **Testing:** Easier to test individual modules
6. **Scalability:** Add new modules without affecting existing code
7. **Organization:** Logical grouping of related functions

## Setup Instructions

### First-Time Setup

1. **Open Google Apps Script Editor:**
   - Open your Google Spreadsheet
   - Go to Extensions → Apps Script

2. **Create Module Files:**
   - Delete default `Code.gs` if it exists
   - Create files in this order:
     1. Config.gs (copy content from Config.gs)
     2. Utils.gs (copy content from Utils.gs)
     3. Auth.gs (copy content from Auth.gs)
     4. MasterData.gs (copy content from MasterData.gs)
     5. Assets.gs (copy content from Assets.gs)
     6. Setup.gs (copy content from Setup.gs)
     7. Code.gs (copy content from Code.gs - main router)

3. **Configure Spreadsheet ID:**
   - Open Config.gs
   - Update `SPREADSHEET_ID` constant with your spreadsheet ID
   - Save all files (Ctrl+S)

4. **Run Setup:**
   - Go back to Spreadsheet
   - Refresh page (F5)
   - Menu "SIDAK Backend" should appear
   - Click "🔧 Setup Database"
   - Authorize when prompted

5. **Deploy as Web App:**
   - In Apps Script Editor: Deploy → New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Click Deploy
   - Copy Web App URL

6. **Test Integration:**
   - Use menu "🧪 Test Login (admin)"
   - Should show success with token

### Updating Existing Installation

If you already have a monolithic Code.gs:

1. **Backup Current Code:**
   - Copy entire Code.gs content
   - Save to a text file as backup

2. **Create New Modules:**
   - Follow "First-Time Setup" steps 2-4

3. **Redeploy:**
   - Apps Script Editor: Deploy → Manage deployments
   - Click pencil icon (Edit)
   - Version: New version
   - Click Deploy

## API Endpoints

All endpoints remain the same after modularization:

### Authentication
- `POST /exec` - `{ action: 'login', username, password }`
- `POST /exec` - `{ action: 'checkAuth', token }`

### Assets
- `GET /exec` - `?action=getAssets&token=xxx`
- `GET /exec` - `?action=getAsset&token=xxx&id=xxx`
- `POST /exec` - `{ action: 'createAsset', token, asset }`
- `POST /exec` - `{ action: 'updateAsset', token, id, asset }`
- `POST /exec` - `{ action: 'deleteAsset', token, id }`
- `POST /exec` - `{ action: 'uploadImage', token, imageData, fileName }`

### Master Data
- `POST /exec` - `{ action: 'getMasterData', type, token }`
- `POST /exec` - `{ action: 'createMasterDataItem', type, name, code?, token }`
- `POST /exec` - `{ action: 'updateMasterDataItem', type, id, name, code?, token }`
- `POST /exec` - `{ action: 'deleteMasterDataItem', type, id, token }`

## Troubleshooting

### Common Issues

1. **Function Not Found:**
   - Ensure all module files are created
   - Check function names for typos
   - Verify file is saved

2. **Circular Dependency:**
   - Not possible in Apps Script (all files load together)
   - If seeing errors, check for syntax issues

3. **SPREADSHEET_ID Not Set:**
   - Open Config.gs
   - Update `SPREADSHEET_ID` constant
   - Save file

4. **Authorization Required:**
   - Run any function from Apps Script editor
   - Click "Review Permissions"
   - Allow access

5. **Menu Not Showing:**
   - Refresh spreadsheet (F5)
   - Check `onOpen()` function in Code.gs
   - Verify no syntax errors in any file

## Best Practices

1. **Always Edit in Apps Script Editor:**
   - Don't edit files outside of Google Apps Script
   - Use built-in editor for syntax checking

2. **Test After Changes:**
   - Use menu items to test functionality
   - Check logs: View → Logs

3. **Version Control:**
   - Use Apps Script versioning: Deploy → Manage deployments
   - Keep backup copies of working versions

4. **Comments:**
   - Maintain JSDoc comments for functions
   - Document complex logic

5. **Consistent Naming:**
   - Use descriptive function names
   - Follow existing naming conventions

## Future Enhancements

Potential modules to add:

- **Reports.gs** - PDF/Excel report generation
- **Notifications.gs** - Email notifications
- **Audit.gs** - Audit trail logging
- **Analytics.gs** - Usage analytics
- **Backup.gs** - Automated backups

---

## Summary

The modular structure provides:
- ✅ Clear separation of concerns
- ✅ Easier maintenance and debugging
- ✅ Better collaboration potential
- ✅ Improved code organization
- ✅ Same functionality as monolithic version
- ✅ No breaking changes to API

**Total Reduction:** 2161 lines → 7 organized modules averaging 313 lines each
