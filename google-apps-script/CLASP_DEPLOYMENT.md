# Clasp Deployment Guide - SIDAK Backend

## ✅ Status Upload
**Tanggal:** 18 November 2025  
**Status:** Berhasil deployed

### Files Uploaded (8 files)
- ✅ appsscript.json - Configuration & OAuth scopes
- ✅ Code.gs - Main router (450 lines)
- ✅ Config.gs - Constants (137 lines)
- ✅ Utils.gs - Helpers (264 lines)
- ✅ Auth.gs - Authentication (196 lines)
- ✅ MasterData.gs - Master data CRUD (340 lines)
- ✅ Assets.gs - Asset CRUD (383 lines)
- ✅ Setup.gs - Initialization (420 lines)

### Project Info
- **Script ID:** `1m8HKo8P2sTeE-ZazIplibfZ1twvqZJgPHe1EDhCIUp-lBF-6PmtVoa9a`
- **Spreadsheet ID:** `1w8u6O7LWxssXbqii8Ktvy-LVTlL2JRhaWVgkPj9Ol_0`
- **Script URL:** https://script.google.com/u/0/home/projects/1m8HKo8P2sTeE-ZazIplibfZ1twvqZJgPHe1EDhCIUp-lBF-6PmtVoa9a/edit

### Deployments
1. **@HEAD** - AKfycbxt2oIz5yK42rve1bYZnguIrhGL21PRYe54KbiWioM
2. **@6** - AKfycbwJvNByb9HSjU4QxPK2o0UZshTQPJDdm7yAX1t7LO7Wd688YdMCPi8iIHR3iEriFyUJ
   - Description: "Modular Backend v1.0 - Split into 7 modules (Config, Utils, Auth, MasterData, Assets, Setup, Code)"
3. **@5** - AKfycbwEyic2MFAJYFVjlrm_1VPIZINNedpPatqZHoW492N-qdWgopDHpwgkMTZjg4gsmqFG (Previous version)

---

## 📝 Clasp Commands Reference

### Setup (Sudah selesai)
```bash
# Login ke Google Account
clasp login

# Clone existing project
clasp clone [scriptId]

# Atau create new project attached to spreadsheet
clasp create --type sheets --title "SIDAK Backend" --parentId [spreadsheetId]
```

### Daily Workflow

#### 1. Push Changes
```bash
# Push semua perubahan ke Apps Script
clasp push

# Push dengan force (overwrite)
clasp push --force

# Push dan watch for changes
clasp push --watch
```

#### 2. Pull Changes
```bash
# Pull latest dari Apps Script (jika ada edit di web editor)
clasp pull

# Pull specific version
clasp pull --versionNumber [version]
```

#### 3. Deploy
```bash
# List deployments
clasp deployments

# Create new deployment
clasp deploy --description "Version description here"

# Deploy specific version
clasp deploy --versionNumber [version] --description "Description"

# Undeploy
clasp undeploy [deploymentId]
```

#### 4. Versioning
```bash
# Create new version
clasp version "Version description"

# List versions
clasp versions

# List versions with details
clasp versions --all
```

#### 5. Status & Info
```bash
# Check project status
clasp status

# List files
clasp list

# Show project info
clasp
```

---

## 🚀 Deploy as Web App (Manual Steps)

Karena clasp tidak support Web App deployment secara otomatis, kita perlu deploy manual via web interface:

### Steps:

1. **Buka Apps Script Editor:**
   ```
   https://script.google.com/u/0/home/projects/1m8HKo8P2sTeE-ZazIplibfZ1twvqZJgPHe1EDhCIUp-lBF-6PmtVoa9a/edit
   ```

2. **Deploy as Web App:**
   - Klik "Deploy" → "New deployment"
   - Select type: "Web app"
   - Description: "SIDAK Backend Modular v1.0"
   - Execute as: "Me (your-email@gmail.com)"
   - Who has access: "Anyone"
   - Klik "Deploy"

3. **Copy Web App URL:**
   - Format: `https://script.google.com/macros/s/[deploymentId]/exec`
   - Simpan URL ini untuk digunakan di frontend

4. **Update .env File:**
   ```env
   VITE_API_URL=https://script.google.com/macros/s/[deploymentId]/exec
   ```

---

## 🔄 Update Workflow

Setelah edit code lokal:

```bash
# 1. Push changes
cd google-apps-script
clasp push

# 2. Create new version (optional tapi recommended)
clasp version "Description of changes"

# 3. Deploy new version
clasp deploy --description "Version x.x.x - Changes description"

# 4. Manual: Update Web App deployment di web interface
#    (Deploy → Manage deployments → Edit → New version → Deploy)
```

---

## 📋 .claspignore

File yang di-exclude dari upload (sudah dikonfigurasi):

```
# Backup files
Code_OLD.gs
Code_old_backup.gs

# Documentation
README_MODULAR.md
VALIDATION_IMPROVEMENTS.md
MENU_GUIDE.md

# Config
.git
.gitignore
.claspignore
```

---

## ⚙️ appsscript.json Configuration

OAuth scopes yang digunakan:

```json
{
  "timeZone": "Asia/Jakarta",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
  ]
}
```

**Scopes Explanation:**
- `spreadsheets` - Read/write spreadsheet data
- `drive.file` - Create and manage files created by this app
- `drive` - Full Drive access (untuk folder SIDAK)

---

## 🧪 Testing After Deploy

### 1. Test Login via Menu
Di spreadsheet, klik menu:
- **SIDAK Backend** → **🧪 Test Login (admin)**
- Harus menampilkan success dialog dengan token

### 2. Test API Endpoint
```bash
curl -X POST "https://script.google.com/macros/s/[deploymentId]/exec" \
  -H "Content-Type: application/json" \
  -d '{"action":"login","username":"admin","password":"admin123"}'
```

Expected response:
```json
{
  "success": true,
  "token": "...",
  "user": {
    "username": "admin",
    "role": "admin",
    "email": "admin@sidak.kelurahan.id"
  }
}
```

### 3. Test Frontend Connection
1. Update `.env` dengan Web App URL
2. Restart dev server: `npm run dev`
3. Test login di aplikasi

---

## 🔧 Troubleshooting

### Error: "Script not found"
```bash
# Pull latest
clasp pull

# Atau clone ulang
clasp clone [scriptId]
```

### Error: "Manifest file update"
```bash
# Push dengan konfirmasi yes
clasp push
# Pilih "Yes" untuk overwrite manifest
```

### Error: "Authorization required"
```bash
# Login ulang
clasp login --creds credentials.json
```

### Web App returns old version
1. Buka Apps Script Editor
2. Deploy → Manage deployments
3. Edit deployment
4. Version: "New version"
5. Click "Deploy"

### Permission errors di runtime
1. Klik menu **SIDAK Backend** → **🔐 Authorize Drive Access**
2. Follow authorization prompts
3. Redeploy: Deploy → Manage deployments → New version

---

## 📊 Version History

| Version | Date | Description | Deployment ID |
|---------|------|-------------|---------------|
| @HEAD | 2025-11-18 | Latest development | AKfycbz... |
| @1 | 2025-11-18 | Modular Backend v1.0 - Split into 7 modules | AKfycbw... |

---

## 🔗 Quick Links

- **Apps Script Editor:** https://script.google.com/d/1HNeLqlI6O_GSudVokC14LuYVkklNAfhzeaKmNGqsbC4xAcbXrzHmpTjL/edit
- **Spreadsheet:** https://docs.google.com/spreadsheets/d/1wBbgapHs1AQmMfZ61CJ2ZYf95j3PHEddaH4uc9hpkYg/edit
- **Clasp Documentation:** https://github.com/google/clasp

---

## ✅ Next Steps

1. [ ] Deploy as Web App via web interface
2. [ ] Copy Web App URL
3. [ ] Update `.env` file di frontend project
4. [ ] Test login & API endpoints
5. [ ] Run menu "Setup Database" jika spreadsheet baru
6. [ ] Authorize Drive access untuk image uploads

---

**Status:** ✅ Files uploaded successfully, ready for Web App deployment
