// Mapping jenis to kode prefix
const JENIS_KODE_MAP: Record<string, string> = {
  'Elektronik': 'ELK',
  'Perabot': 'PRB',
  'Kendaraan': 'KDR',
  'Alat Tulis': 'ALT',
  'Alat Kebersihan': 'ALB',
  'Alat Dapur': 'ADP',
  'Alat Kesehatan': 'AKS',
  'Alat Olahraga': 'AOR',
  'Alat Musik': 'AMS',
  'Alat Listrik': 'ALS',
  'Alat Pendingin': 'APD',
  'Alat Komunikasi': 'AKM',
  'Alat Pengolah Data': 'APD2',
  'Alat Bantu': 'ABT',
  'Lainnya': 'LNN',
};
import React, { useEffect, useMemo, useState } from 'react';
import { sendNotification, requestExternalConfirmation, isExternalMode } from '@/lib/notificationBridge';
import { Asset, AssetStatus, Unit } from '@/types';
import { ImageUpload, DuplicateAssetModal } from '@/components/ui';
import { uploadImageToDrive } from '@/services/imageUpload';
import { ItemForm, LandForm, BuildingForm } from '@/components/forms';

type FormType = 'item' | 'land' | 'building';

// ConfirmDialog Component
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}> = ({ isOpen, title, message, confirmText = 'Konfirmasi', cancelText = 'Batal', onConfirm, onCancel, type = 'warning' }) => {
  if (!isOpen) return null;

  const colorClasses = {
    danger: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  const buttonClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className={`px-6 py-4 rounded-t-xl ${colorClasses[type]}`}>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 rounded-lg text-white transition-colors font-medium ${buttonClasses[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AssetFormPageProps {
  onSave: (asset: Omit<Asset, 'id' | 'tanggalInput'>) => void | Promise<void>;
  onCancel: () => void;
  asset?: Asset | null;
  formType?: FormType;
  onDuplicateRequest?: (asset: Asset, entries: any[]) => void | Promise<void>;
  currentUser?: { username: string; role: string; allowedUnits?: string[]; email?: string } | null;
  dynamicUnits?: string[];
}

const todayYear = new Date().getFullYear();

const AssetFormPage: React.FC<AssetFormPageProps> = ({ onSave, onCancel, asset, formType = 'item', onDuplicateRequest, currentUser, dynamicUnits = [] }) => {
  // All assets for kode barang & dropdowns
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [activeType, setActiveType] = useState<FormType>(formType);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [savedAsset, setSavedAsset] = useState<Asset | null>(null);
  const [isSaving, setIsSaving] = useState(false); // New: Loading state untuk submit

  const externalMode = isExternalMode();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', context?: Record<string, any>) => {
    sendNotification(message, type, context);
    if (!externalMode) setToast({ message, type });
  };
  
  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = async (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning') => {
    const externalResult = await requestExternalConfirmation({ id: '', title, message, type });
    if (externalResult === true) { onConfirm(); return; }
    if (externalResult === false) { return; }
    if (!externalMode) setConfirmDialog({ isOpen: true, title, message, onConfirm, type });
  };

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };


  // Fetch all assets for dropdown options (move to top)
  // (Sudah dideklarasikan di atas, hapus baris ini)
  useEffect(() => {
    import('@/services/api').then(api => {
      api.getAssets().then(res => {
        if (res.success && Array.isArray(res.data)) setAllAssets(res.data as Asset[]);
      });
    });
  }, []);

  const initialCommon = useMemo(() => ({
    unit: (asset?.unit as Unit) || (dynamicUnits[0] as Unit) || '',
    namaBarang: asset?.namaBarang || '',
    jenisInventaris: asset?.jenisInventaris || (formType === 'land' ? 'Tanah' : formType === 'building' ? 'Bangunan' : 'Barang'),
    imageUrl: (asset?.photos && asset.photos[0]) || '',
    keterangan: asset?.keterangan || '',
  }), [asset, formType, dynamicUnits]);

  const [common, setCommon] = useState(initialCommon);



  // ITEM fields
  const [item, setItem] = useState({
    code: asset?.noKodeBarang || '',
    brand: asset?.merkModel || '',
    serialNumber: asset?.noSeriPabrik || '',
    size: asset?.ukuran || '',
    material: asset?.bahan || '',
    purchaseYear: asset?.tahunPembuatan || String(todayYear),
    quantity: asset?.jumlahBarang ?? 1,
    purchasePrice: asset?.hargaBeli ?? 0,
    acquisition: asset?.sumberPerolehan || 'APBD',
    status: asset?.keadaanBarang || AssetStatus.Baik,
    location: asset?.ruangan || '',
  });

  // Generate kode barang otomatis saat jenisInventaris berubah
  useEffect(() => {
    if (activeType !== 'item') return;
    if (asset?.noKodeBarang) return; // Jangan generate ulang jika edit mode (sudah ada kode)
    const jenis = common.jenisInventaris;
    const kodePrefix = JENIS_KODE_MAP[jenis] || 'INV';
    if (!jenis) return;
    // Cari kode terakhir dari allAssets yang prefixnya sama
    const usedCodes = allAssets
      .filter(a => (a.jenisInventaris === jenis) && a.noKodeBarang && a.noKodeBarang.startsWith(kodePrefix + '-'))
      .map(a => a.noKodeBarang);
    let maxNum = 0;
    usedCodes.forEach(code => {
      const match = code.match(/-(\d{3,})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    let nextNum = maxNum + 1;
    let nextCode = `${kodePrefix}-${String(nextNum).padStart(3, '0')}`;
    // Pastikan tidak ada duplikat kode
    while (usedCodes.includes(nextCode)) {
      nextNum++;
      nextCode = `${kodePrefix}-${String(nextNum).padStart(3, '0')}`;
    }
    setItem(item => ({ ...item, code: nextCode }));
  }, [common.jenisInventaris, allAssets, activeType, asset?.noKodeBarang]);



  // Filter unit options based on user role and allowed units
  const availableUnits = useMemo(() => {
    if (currentUser?.role === 'admin') {
      return dynamicUnits; // Admin bisa akses semua unit dari backend
    } else if ((currentUser?.role === 'editor' || currentUser?.role === 'viewer') && 
               currentUser.allowedUnits && currentUser.allowedUnits.length > 0) {
      return currentUser.allowedUnits; // Editor/Viewer hanya bisa akses unit yang diizinkan
    }
    return dynamicUnits; // Default fallback menggunakan dynamic units
  }, [currentUser, dynamicUnits]);

  // Set default unit from availableUnits when user/units change
  useEffect(() => {
    if (!asset && availableUnits.length > 0) {
      // Only set default for new assets (not editing)
      console.log('🔧 AssetFormPage - Setting default unit from availableUnits:', availableUnits[0]);
      console.log('🔧 AssetFormPage - User role:', currentUser?.role);
      console.log('🔧 AssetFormPage - AllowedUnits:', currentUser?.allowedUnits);
      setCommon(prev => ({
        ...prev,
        unit: (availableUnits[0] as Unit) || ''
      }));
    }
  }, [availableUnits, asset]);

  // Extract unique options
  const jenisOptions = useMemo(() => {
    const opts = Array.from(new Set(allAssets.map(a => a.jenisInventaris).filter(Boolean)));
    return opts.length ? opts : ['Elektronik', 'Perabot', 'Kendaraan', 'Barang Lainnya'];
  }, [allAssets]);
  const sumberOptions = useMemo(() => {
    const opts = Array.from(new Set(allAssets.map(a => a.sumberPerolehan).filter(Boolean)));
    return opts.length ? opts : ['Pembelian', 'Hibah', 'Bantuan', 'Lainnya'];
  }, [allAssets]);
  const ruanganOptions = useMemo(() => {
    // Filter assets by selected unit to get relevant room suggestions
    const assetsInSelectedUnit = allAssets.filter(a => a.unit === common.unit);
    const opts = Array.from(new Set(assetsInSelectedUnit.map(a => a.ruangan).filter(Boolean)));
    return opts; // No fallback - ItemForm will handle empty case
  }, [allAssets, common.unit]);
  const brandOptions = useMemo(() => {
    const opts = Array.from(new Set(allAssets.map(a => a.merkModel).filter(Boolean)));
    return opts;
  }, [allAssets]);

  // LAND fields
  const [land, setLand] = useState({
    kodeBarang: asset?.kodeBarang || asset?.noKodeBarang || '',
    register: asset?.register || '',
    luas: asset?.luasTanah ?? 0,
    tahunPerolehan: asset?.tahunPerolehan ?? todayYear,
    letakAlamat: asset?.alamat || asset?.letakAlamat || '',
    hak: asset?.statusHakTanah || asset?.hak || '',
    statusTanah: asset?.statusTanah || '',
    sertifikatTanggal: asset?.tanggalSertifikat || asset?.sertifikatTanggal || '',
    sertifikatNomor: asset?.nomorSertifikat || asset?.sertifikatNomor || '',
    penggunaan: asset?.penggunaan || '',
    asalUsul: asset?.asalUsul || '',
    statusBarang: asset?.statusBarang || '',
    kondisi: asset?.kondisi || '',
    tglBuku: asset?.tglBuku || '',
    noBAST: asset?.noBAST || '',
    tglBAST: asset?.tglBAST || '',
    idPenerimaan: asset?.idPenerimaan || '',
    statusAset: asset?.statusAset || '',
    harga: asset?.harga ?? 0,
    latitude: asset?.latitude || '',
    longitude: asset?.longitude || '',
  });

  // BUILDING fields
  const [building, setBuilding] = useState({
    kodeBarang: asset?.kodeBarang || asset?.noKodeBarang || '',
    register: asset?.register || '',
    kondisiBangunan: asset?.kondisi || '',
    bertingkat: asset?.bertingkat || '',
    beton: asset?.beton || '',
    luasBangunan: asset?.luasBangunan ?? 0,
    letakAlamat: asset?.alamat || '',
    tahunPerolehan: asset?.tahunPerolehan ? String(asset.tahunPerolehan) : String(todayYear),
    dokumenTanggal: asset?.tanggalDokumen || '',
    dokumenNomor: asset?.nomorDokumen || '',
    luasTanah: asset?.luasTanah ?? 0,
    statusTanah: asset?.statusTanah || '',
    kodeTanah: asset?.kodeTanah || '',
    asalUsul: asset?.asalUsul || '',
    harga: asset?.harga ?? 0,
    latitude: asset?.latitude || '',
    longitude: asset?.longitude || '',
  });

  // Sync activeType with formType prop
  useEffect(() => {
    setActiveType(formType);
  }, [formType]);

  // Re-initialize land state when asset changes (for edit mode)
  useEffect(() => {
    if (asset && formType === 'land') {
      setLand({
        kodeBarang: asset.kodeBarang || asset.noKodeBarang || '',
        register: asset.register || '',
        luas: asset.luasTanah ?? 0,
        tahunPerolehan: asset.tahunPerolehan ?? todayYear,
        letakAlamat: asset.alamat || asset.letakAlamat || '',
        hak: asset.statusHakTanah || asset.hak || '',
        statusTanah: asset.statusTanah || '',
        sertifikatTanggal: asset.tanggalSertifikat || asset.sertifikatTanggal || '',
        sertifikatNomor: asset.nomorSertifikat || asset.sertifikatNomor || '',
        penggunaan: asset.penggunaan || '',
        asalUsul: asset.asalUsul || '',
        statusBarang: asset.statusBarang || '',
        kondisi: asset.kondisi || '',
        tglBuku: asset.tglBuku || '',
        noBAST: asset.noBAST || '',
        tglBAST: asset.tglBAST || '',
        idPenerimaan: asset.idPenerimaan || '',
        statusAset: asset.statusAset || '',
        harga: asset.harga ?? 0,
        latitude: asset.latitude || '',
        longitude: asset.longitude || '',
      });
    }
  }, [asset, formType]);

  // Re-initialize building state when asset changes (for edit mode)
  useEffect(() => {
    if (asset && formType === 'building') {
      setBuilding({
        kodeBarang: asset.kodeBarang || asset.noKodeBarang || '',
        register: asset.register || '',
        kondisiBangunan: asset.kondisi || '',
        bertingkat: asset.bertingkat || '',
        beton: asset.beton || '',
        luasBangunan: asset.luasBangunan ?? 0,
        letakAlamat: asset.alamat || '',
        tahunPerolehan: asset.tahunPerolehan ? String(asset.tahunPerolehan) : String(todayYear),
        dokumenTanggal: asset.tanggalDokumen || '',
        dokumenNomor: asset.nomorDokumen || '',
        luasTanah: asset.luasTanah ?? 0,
        statusTanah: asset.statusTanah || '',
        kodeTanah: asset.kodeTanah || '',
        asalUsul: asset.asalUsul || '',
        harga: asset.harga ?? 0,
        latitude: asset.latitude || '',
        longitude: asset.longitude || '',
      });
    }
  }, [asset, formType]);

  // Re-initialize item state when asset changes (for edit mode)
  useEffect(() => {
    if (asset && formType === 'item') {
      setItem({
        code: asset.noKodeBarang || '',
        brand: asset.merkModel || '',
        serialNumber: asset.noSeriPabrik || '',
        size: asset.ukuran || '',
        material: asset.bahan || '',
        purchaseYear: asset.tahunPembuatan || String(todayYear),
        quantity: asset.jumlahBarang ?? 1,
        purchasePrice: asset.hargaBeli ?? 0,
        acquisition: asset.sumberPerolehan || '',
        status: asset.keadaanBarang || AssetStatus.Baik,
        location: asset.ruangan || '',
      });
    }
  }, [asset, formType]);

  // Re-initialize common state when asset changes
  useEffect(() => {
    if (asset) {
      setCommon({
        unit: (asset.unit as Unit) || (dynamicUnits[0] as Unit) || '',
        namaBarang: asset.namaBarang || '',
        jenisInventaris: asset.jenisInventaris || (formType === 'land' ? 'Tanah' : formType === 'building' ? 'Bangunan' : 'Barang'),
        imageUrl: (asset.photos && asset.photos[0]) || '',
        keterangan: asset.keterangan || '',
      });
    }
  }, [asset, formType, dynamicUnits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submit
    if (isSaving || isUploadingImage) {
      return;
    }

    // DEBUG: Log nilai unit sebelum submit
    console.log('💾 AssetFormPage SUBMIT - common.unit:', common.unit);
    console.log('💾 AssetFormPage SUBMIT - availableUnits:', availableUnits);
    console.log('💾 AssetFormPage SUBMIT - currentUser:', currentUser);

    // Basic validations
        if (!common.namaBarang.trim()) {
          showToast('Nama barang wajib diisi', 'error');
      return;
    }
    if (!common.unit) {
          showToast('Unit wajib dipilih', 'error');
      return;
    }

    // Validasi kode barang untuk item
    if (activeType === 'item') {
      const kodeBarang = item.code.trim();
      if (!kodeBarang) {
            showToast('Kode barang wajib diisi', 'error');
        return;
      }
      // Cek duplikasi kode barang (kecuali saat edit dengan kode yang sama)
      const isDuplicate = allAssets.some(a => 
        a.noKodeBarang === kodeBarang && a.id !== asset?.id
      );
      if (isDuplicate) {
            showToast(`Kode barang "${kodeBarang}" sudah digunakan. Silakan gunakan kode lain.`, 'error');
        return;
      }
    }

    // Set loading state
    setIsSaving(true);

    try {
      // Upload image to Google Drive if there's a pending file
      let finalImageUrl = common.imageUrl;
      if (pendingImageFile) {
        setIsUploadingImage(true);
        try {
          const token = localStorage.getItem('sidak_token');
          if (!token) {
            showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
            setIsSaving(false);
            return;
          }
          finalImageUrl = await uploadImageToDrive(pendingImageFile, token);
        } catch (error) {
          showToast('Gagal mengupload gambar. Silakan coba lagi.', 'error');
          setIsUploadingImage(false);
          setIsSaving(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

    const base: Omit<Asset, 'id' | 'tanggalInput'> = {
      unit: common.unit as Unit,
      namaBarang: common.namaBarang.trim(),
      jenisInventaris: activeType === 'land' ? 'Tanah' : activeType === 'building' ? 'Bangunan' : (common.jenisInventaris || 'Barang'),
      keterangan: common.keterangan,
      photos: finalImageUrl ? [finalImageUrl] : [],
      // Default item fields to avoid undefined access elsewhere
      noKodeBarang: item.code || land.kodeBarang || building.kodeBarang || `INV-${Date.now()}`,
      tahunPembuatan: item.purchaseYear || String(todayYear),
      jumlahBarang: item.quantity ?? 1,
      hargaBeli: item.purchasePrice ?? 0,
      keadaanBarang: item.status || AssetStatus.Baik,
      ruangan: item.location || '',
    } as any;

    let payload: Omit<Asset, 'id' | 'tanggalInput'> = base;

    if (activeType === 'item') {
      payload = {
        ...base,
        merkModel: item.brand,
        noSeriPabrik: item.serialNumber,
        ukuran: item.size,
        bahan: item.material,
        sumberPerolehan: item.acquisition,
      } as any;
    } else if (activeType === 'land') {
      payload = {
        ...base,
        namaBarang: common.namaBarang,
        kodeBarang: land.kodeBarang,
        register: land.register,
        luasTanah: Number(land.luas) || 0,
        tahunPerolehan: Number(land.tahunPerolehan) || todayYear,
        alamat: land.letakAlamat,
        letakAlamat: land.letakAlamat,
        statusHakTanah: land.hak,
        hak: land.hak,
        statusTanah: land.statusTanah,
        tanggalSertifikat: land.sertifikatTanggal,
        sertifikatTanggal: land.sertifikatTanggal,
        nomorSertifikat: land.sertifikatNomor,
        sertifikatNomor: land.sertifikatNomor,
        penggunaan: land.penggunaan,
        asalUsul: land.asalUsul,
        statusBarang: land.statusBarang,
        kondisi: land.kondisi,
        tglBuku: land.tglBuku,
        noBAST: land.noBAST,
        tglBAST: land.tglBAST,
        idPenerimaan: land.idPenerimaan,
        statusAset: land.statusAset,
        harga: Number(land.harga) || 0,
        keterangan: common.keterangan,
        latitude: land.latitude,
        longitude: land.longitude,
      } as any;
    } else if (activeType === 'building') {
      payload = {
        ...base,
        kodeBarang: building.kodeBarang,
        register: building.register,
        kondisi: building.kondisiBangunan,
        bertingkat: building.bertingkat,
        beton: building.beton,
        luasBangunan: Number(building.luasBangunan) || 0,
        alamat: building.letakAlamat,
        tahunPerolehan: building.tahunPerolehan || String(todayYear),
        tanggalDokumen: building.dokumenTanggal,
        nomorDokumen: building.dokumenNomor,
        luasTanah: Number(building.luasTanah) || 0,
        statusTanah: building.statusTanah,
        kodeTanah: building.kodeTanah,
        asalUsul: building.asalUsul,
        harga: Number(building.harga) || 0,
        latitude: building.latitude,
        longitude: building.longitude,
      } as any;
    }

    await onSave(payload);
    } catch (error: any) {
      console.error('Error saving asset:', error);
  showToast('Gagal menyimpan data: ' + (error.message || 'Terjadi kesalahan'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 text-sm font-semibold flex items-center justify-between">
          <span>{asset ? 'Edit Aset' : 'Tambah Aset Baru'}</span>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-normal mr-2">Jenis Form:</span>
            <div className="inline-flex rounded-lg overflow-hidden border border-gray-300">
              {([
                { key: 'item', label: 'Barang' },
                { key: 'land', label: 'Tanah' },
                { key: 'building', label: 'Bangunan' },
              ] as { key: FormType; label: string }[]).map(({ key, label }, idx, arr) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setActiveType(key)}
                  className={`px-3 py-1 text-xs font-medium transition-colors duration-150
                    ${activeType === key ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}
                    hover:text-blue-600 focus:text-blue-600 hover:bg-white focus:bg-white
                    ${idx < arr.length - 1 ? 'border-r border-gray-300' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Switcher (moved to header, removed duplicate) */}

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
              <input
                type="text"
                value={common.namaBarang}
                onChange={(e) => setCommon((s) => ({ ...s, namaBarang: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama barang"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={common.unit}
                onChange={(e) => setCommon((s) => ({ ...s, unit: e.target.value as Unit }))}
                className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
                disabled={
                  (currentUser?.role === 'editor' || currentUser?.role === 'viewer') && 
                  (!currentUser.allowedUnits || currentUser.allowedUnits.length === 0)
                }
              >
                {availableUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {(currentUser?.role === 'editor' || currentUser?.role === 'viewer') && 
               (!currentUser.allowedUnits || currentUser.allowedUnits.length === 0) && (
                <p className="text-xs text-red-600 mt-1">
                  Anda belum diberi akses ke unit manapun. Hubungi admin.
                </p>
              )}
            </div>

            {/* Image Upload with Drag & Drop */}
            <div className="md:col-span-2">
              <ImageUpload
                value={common.imageUrl}
                onChange={(url) => setCommon((s) => ({ ...s, imageUrl: url }))}
                onFileSelected={(file) => setPendingImageFile(file)}
                onNotify={(msg, type) => showToast(msg, type || 'info')}
              />
            </div>
          </div>

          {/* Type-specific fields */}
          {activeType === 'item' && (
            <ItemForm
              data={item}
              onChange={setItem}
              jenisInventaris={common.jenisInventaris}
              onJenisChange={(v) => setCommon((s) => ({ ...s, jenisInventaris: v }))}
              ruanganOptions={ruanganOptions}
              brandOptions={brandOptions}
              currentUnit={common.unit}
              allAssets={allAssets}
            />
          )}

          {activeType === 'land' && (
            <LandForm
              data={land}
              onChange={setLand}
            />
          )}

          {activeType === 'building' && (
            <BuildingForm
              data={building}
              onChange={setBuilding}
            />
          )}

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea
              value={common.keterangan}
              onChange={(e) => setCommon((s) => ({ ...s, keterangan: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                showConfirm(
                  'Batalkan Perubahan?',
                  'Semua data yang Anda masukkan akan hilang. Apakah Anda yakin ingin membatalkan?',
                  () => {
                    onCancel();
                    closeConfirm();
                  },
                  'warning'
                );
              }}
              disabled={isSaving || isUploadingImage}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            
            {/* Tombol Duplikasi - muncul jika jumlah > 1 */}
            {activeType === 'item' && item.quantity > 1 && onDuplicateRequest && (
              <button
                type="button"
                disabled={isSaving || isUploadingImage}
                onClick={() => {
                  // Validasi basic dulu
                  if (!common.namaBarang.trim()) {
                    showToast('Nama barang wajib diisi', 'error');
                    return;
                  }
                  if (!common.unit) {
                    showToast('Unit wajib dipilih', 'error');
                    return;
                  }
                  if (!item.code.trim()) {
                    showToast('Kode barang wajib diisi', 'error');
                    return;
                  }
                  
                  showConfirm(
                    'Duplikasi Aset ke Lokasi Berbeda?',
                    `Anda akan menduplikasi ${item.quantity} unit "${common.namaBarang}" ke beberapa lokasi berbeda. Lanjutkan?`,
                    () => {
                      // Buat temporary asset untuk modal
                      const tempPayload: Omit<Asset, 'id' | 'tanggalInput'> = {
                        unit: common.unit as Unit,
                        namaBarang: common.namaBarang.trim(),
                        jenisInventaris: common.jenisInventaris || 'Barang',
                        keterangan: common.keterangan,
                        photos: common.imageUrl ? [common.imageUrl] : [],
                        noKodeBarang: item.code,
                        tahunPembuatan: item.purchaseYear || String(todayYear),
                        jumlahBarang: item.quantity,
                        hargaBeli: item.purchasePrice ?? 0,
                        keadaanBarang: item.status || AssetStatus.Baik,
                        ruangan: item.location || '',
                        merkModel: item.brand,
                        noSeriPabrik: item.serialNumber,
                        ukuran: item.size,
                        bahan: item.material,
                        sumberPerolehan: item.acquisition,
                      } as any;
                      
                      const tempAsset: Asset = {
                        ...tempPayload,
                        id: 'temp-' + Date.now(),
                        tanggalInput: new Date().toISOString(),
                      } as Asset;
                      
                      setSavedAsset(tempAsset);
                      setShowDuplicateModal(true);
                      closeConfirm();
                    },
                    'info'
                  );
                }}
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplikasi ke Lokasi Berbeda
              </button>
            )}
            
            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(isSaving || isUploadingImage) && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isUploadingImage ? 'Mengupload Gambar...' : isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Asset Modal */}
      {showDuplicateModal && savedAsset && onDuplicateRequest && (
        <DuplicateAssetModal
          asset={savedAsset}
          onDuplicate={(entries) => {
            onDuplicateRequest(savedAsset, entries);
            setShowDuplicateModal(false);
          }}
          onCancel={() => setShowDuplicateModal(false)}
          onNotify={(msg, type) => showToast(msg, type || 'info')}
        />
      )}

      {/* Confirmation Dialog (disabled in external mode) */}
      {!externalMode && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirm}
          type={confirmDialog.type}
        />
      )}

      {/* Toast Notification (disabled in external mode) */}
      {!externalMode && toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AssetFormPage;

// Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className="fixed top-4 right-4 z-[10001] animate-slide-in-right">
      <div className={`${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]`}>
        <span className="text-xl font-bold">{icons[type]}</span>
        <p className="flex-1 font-medium">{message}</p>
        <button onClick={onClose} className="text-white hover:text-gray-200 text-xl font-bold">×</button>
      </div>
    </div>
  );
};
