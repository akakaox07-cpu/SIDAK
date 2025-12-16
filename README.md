# SIDAK - Sistem Informasi Data Aset Kelurahan

Dashboard aplikasi untuk mengelola inventaris aset kelurahan meliputi Barang, Bangunan, dan Tanah.
Built with React, TypeScript, and Tailwind CSS v4.

## ✨ Features

- 🔐 **Authentication** - Login dengan Google Apps Script backend
   - Password disimpan sebagai hash (SHA-256 + salt)
   - Lupa password: kontak admin (reset hanya oleh admin via Spreadsheet atau endpoint admin)
   - Pengguna dapat ganti password sendiri setelah login (endpoint changePassword)
- 📊 **Dashboard** - Statistik dan grafik inventaris
- 📝 **Asset Management** - CRUD untuk Barang, Bangunan, dan Tanah
- 🏷️ **Asset Types** - Filter berdasarkan tipe aset dengan color coding
- 📸 **Photo Management** - Upload, reorder, dan bulk delete foto
- 📄 **PDF Export** - Generate laporan inventaris
- 🔍 **Search & Filter** - Cari aset dengan berbagai kriteria
- 📍 **Geolocation** - Input koordinat untuk tanah & bangunan
- ✅ **Validation** - Real-time validation untuk semua input
 - 🔒 **Role-based Access**
    - viewer: read-only
    - editor: create & update aset
    - admin: full access (create, update, delete)

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Google Account (untuk backend)

### Installation

1. Clone repository dan install dependencies:
   ```bash
   npm install
   ```

2. Setup Google Apps Script Backend (lihat [SETUP_GUIDE](google-apps-script/SETUP_GUIDE.md))

3. Buat file `.env` di root project:
   ```env
   VITE_API_URL=https://script.google.com/macros/s/AKfycbwEyic2MFAJYFVjlrm_1VPIZINNedpPatqZHoW492N-qdWgopDHpwgkMTZjg4gsmqFG/exec
   VITE_USE_DEV_PROXY=true
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173

### Default Login

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| editor | editor123 | editor |
| viewer | viewer123 | viewer |

Catatan keamanan:
- Backend menyimpan password sebagai hash (SHA-256) dengan salt unik per user.
- Lupa password harus melalui admin.
- Admin dapat reset password user melalui Spreadsheet menu: SIDAK Backend → "Reset User Password".
- Pengguna yang sudah login dapat mengganti password sendiri (action: changePassword) dengan memasukkan password lama + baru.

Catatan:
- Akun default di atas akan dibuat otomatis saat backend pertama kali digunakan (login/setup) jika belum ada. Anda juga bisa membuatnya melalui menu Spreadsheet: SIDAK Backend → Setup Database atau Setup Default Users.

## 📚 Documentation

- **[Backend Integration](BACKEND_INTEGRATION.md)** - Setup dan konfigurasi backend
- **[Google Apps Script Setup](google-apps-script/SETUP_GUIDE.md)** - Panduan deploy backend
- **[Master Data Setup](google-apps-script/MASTER_DATA_SETUP.md)** - Setup units, categories, sources di backend
- **[Quick Start](QUICK_START.md)** - Panduan cepat menggunakan aplikasi

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **UI**: Tailwind CSS + Lucide Icons
- **Charts**: Recharts
- **PDF**: jsPDF + html2canvas
- **Validation**: Custom regex patterns

## 📁 Project Structure

```
asset-inventory-dashboard/
├── src/
│   ├── components/      # UI components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── types/          # TypeScript types
│   ├── constants/      # Static data
│   └── lib/            # Utilities
├── google-apps-script/ # Backend code
│   ├── Code.gs         # Apps Script backend
│   └── SETUP_GUIDE.md  # Setup instructions
└── .env                # Environment config
```

## 🔧 Development

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Type Check
```bash
npm run type-check
```

## 📦 Deployment

### Frontend (Vercel/Netlify)
1. Build project: `npm run build`
2. Deploy folder `dist/`
3. Set environment variable `VITE_API_URL`

### Backend (Google Apps Script)
Lihat panduan lengkap di [google-apps-script/SETUP_GUIDE.md](google-apps-script/SETUP_GUIDE.md)
# SIDAK
