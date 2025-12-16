# 🔌 Koneksi Frontend ke Backend - Setup Guide

## Status Saat Ini

### ✅ Konfigurasi yang Sudah Benar

1. **File .env sudah ada:**
   ```env
   VITE_API_URL=https://script.google.com/macros/s/AKfycbwEyic2MFAJYFVjlrm_1VPIZINNedpPatqZHoW492N-qdWgopDHpwgkMTZjg4gsmqFG/exec
   VITE_USE_DEV_PROXY=true
   ```

2. **API Service (src/services/api.ts):** ✅ Menggunakan `import.meta.env.VITE_API_URL`

3. **Vite Proxy (vite.config.ts):** ✅ Proxy `/gas` ke Apps Script untuk bypass CORS di development

4. **Backend Apps Script:** ✅ 8 file modular sudah di-push ke project yang benar

### ⚠️ Yang Perlu Diupdate

**URL di .env masih menggunakan deployment lama (@5)**

URL saat ini: `...AKfycbwEyic2MFAJYFVjlrm_1VPIZINNedpPatqZHoW492N-qdWgopDHpwgkMTZjg4gsmqFG...`

Setelah deploy Web App dengan versi modular terbaru, URL akan berubah.

---

## 🚀 Langkah Deploy Web App (Manual)

### Step 1: Buka Apps Script Editor

Buka link ini di browser:
```
https://script.google.com/u/0/home/projects/1m8HKo8P2sTeE-ZazIplibfZ1twvqZJgPHe1EDhCIUp-lBF-6PmtVoa9a/edit
```

### Step 2: Deploy as Web App

1. Klik tombol **"Deploy"** (pojok kanan atas)
2. Pilih **"Manage deployments"**

### Step 3: Update Existing Deployment

**Opsi A: Update Deployment yang Ada**
1. Klik icon **pencil/edit** di deployment yang aktif
2. Di "Version", pilih **"New version"**
3. Description: "Modular Backend v1.0"
4. Klik **"Deploy"**
5. **Copy Web App URL** yang muncul

**Opsi B: Create New Deployment**
1. Klik **"New deployment"**
2. Type: **"Web app"**
3. Description: "SIDAK Backend Modular v1.0"
4. Execute as: **"Me (your-email@gmail.com)"**
5. Who has access: **"Anyone"**
6. Klik **"Deploy"**
7. **Copy Web App URL** yang muncul

### Step 4: Update .env File

Copy URL yang didapat, lalu update file `.env`:

```env
# Environment variables for Vite
# Apps Script Web App URL
VITE_API_URL=https://script.google.com/macros/s/[NEW_DEPLOYMENT_ID]/exec

VITE_USE_DEV_PROXY=true
```

**Format URL:** `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`

### Step 5: Restart Dev Server

```bash
# Stop server yang running (Ctrl+C)
# Restart
npm run dev
```

---

## 🧪 Test Koneksi

### Test 1: Cek API URL di Browser Console

1. Buka aplikasi: http://localhost:3001
2. Buka Developer Tools (F12)
3. Console tab
4. Check apakah ada error CORS atau connection

### Test 2: Test Login

1. Di halaman login, masukkan:
   - Username: `admin`
   - Password: `admin123`
2. Klik "Login"
3. Harus berhasil redirect ke dashboard

### Test 3: Test via Menu Apps Script

1. Buka spreadsheet: https://docs.google.com/spreadsheets/d/1w8u6O7LWxssXbqii8Ktvy-LVTlL2JRhaWVgkPj9Ol_0/edit
2. Refresh halaman (F5)
3. Menu "SIDAK Backend" → "🧪 Test Login (admin)"
4. Harus muncul dialog success dengan token

### Test 4: Test via cURL (Optional)

```bash
curl -X POST "https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec" \
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

---

## 🔧 Troubleshooting

### Error: "VITE_API_URL is not configured"

**Solution:**
- Pastikan file `.env` ada di root project
- Restart dev server setelah edit `.env`

### Error: CORS di Development

**Solution:**
- Pastikan `VITE_USE_DEV_PROXY=true` di `.env`
- Vite proxy akan forward request ke `/gas` → Apps Script URL

### Error: "Script function not found: onOpen"

**Solution:**
- Refresh spreadsheet (F5)
- Menu SIDAK Backend harus muncul
- Jika tidak, buka Apps Script editor dan run `onOpen()` manual

### Error: 401 Unauthorized saat Login

**Possible causes:**
1. **User belum dibuat:**
   - Menu "SIDAK Backend" → "👥 Setup Default Users"
   
2. **Password salah:**
   - Default password: `admin123`, `editor123`, `viewer123`
   
3. **Sheet Users belum ada:**
   - Menu "SIDAK Backend" → "🔧 Setup Database"

### Error: Cannot read properties (getSheet, etc.)

**Solution:**
- Pastikan semua 8 file modular sudah di-push:
  - Config.js, Utils.js, Auth.js, MasterData.js, Assets.js, Setup.js, Code.js, appsscript.json
- Verify di Apps Script Editor

---

## 📊 Deployment Version Info

### Current Deployments:

| Version | Deployment ID | Description |
|---------|---------------|-------------|
| @HEAD | AKfycbxt2oIz5yK42rve1bYZnguIrhGL21PRYe54KbiWioM | Latest dev |
| @7 | AKfycbwJvNByb9HSjU4QxPK2o0UZshTQPJDdm7yAX1t7LO7Wd688YdMCPi8iIHR3iEriFyUJ | Modular v1.0 |
| @5 | AKfycbwEyic2MFAJYFVjlrm_1VPIZINNedpPatqZHoW492N-qdWgopDHpwgkMTZjg4gsmqFG | Old version (currently in .env) |

**Recommended:** Update Web App deployment to use @7 (Modular v1.0)

---

## ✅ Checklist Setup

- [x] File .env ada di root project
- [x] VITE_API_URL dikonfigurasi
- [x] VITE_USE_DEV_PROXY=true (untuk development)
- [x] Vite proxy configuration benar
- [x] 8 file modular di-push ke Apps Script
- [ ] **Deploy Web App dengan version terbaru (@7)**
- [ ] **Update .env dengan Web App URL baru**
- [ ] **Restart dev server**
- [ ] **Test login di aplikasi**
- [ ] **Run Setup Database di spreadsheet (jika baru)**

---

## 🎯 Quick Fix - Update .env Now

Jika deployment @5 masih berfungsi (belum expired), konfigurasi saat ini sudah benar dan aplikasi seharusnya sudah bisa connect.

**Test sekarang:**
```bash
npm run dev
# Buka http://localhost:3001
# Test login dengan admin/admin123
```

**Jika berhasil:** ✅ Koneksi sudah OK, tidak perlu update .env

**Jika gagal:** ⚠️ Follow langkah "Deploy Web App" di atas untuk update deployment

---

## 📝 Notes

- **Development Mode:** Menggunakan proxy `/gas` untuk bypass CORS
- **Production Build:** Akan langsung hit ke `VITE_API_URL` (no proxy)
- **Deployment ID:** Berubah setiap kali deploy new version
- **Script ID:** Tetap sama (tidak berubah)

---

**Status:** Frontend configuration ✅ | Backend deployed ✅ | Need: Update Web App deployment to latest version
