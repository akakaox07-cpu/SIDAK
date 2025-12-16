import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { sendNotification, requestExternalConfirmation, isExternalMode } from './lib/notificationBridge';
import { Asset, AssetStatus, Unit } from '@/types';
import { Header } from '@/components/layout';
import { Dashboard, AssetListPage, AssetFormPage, AssetDetailPage, LoginPage, ReportPage, SettingsPage, AssetPrintPage, ReportPrintTableAll, ReportPrintDetailAll, ReportPrintTableBarang, ReportPrintTableTanah, ReportPrintTableBangunan, ReportPrintKIR } from '@/pages';
import * as api from '@/services/api';

export type Page = 'dashboard' | 'inventory' | 'assetForm' | 'assetDetail' | 'reports' | 'settings';

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
    <div className="fixed top-4 right-4 z-10001 animate-slide-in-right">
      <div className={`${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]`}>
        <span className="text-xl font-bold">{icons[type]}</span>
        <p className="flex-1 font-medium">{message}</p>
        <button onClick={onClose} className="text-white hover:text-gray-200 text-xl font-bold">×</button>
      </div>
    </div>
  );
};

// LoadingOverlay Component
const LoadingOverlay: React.FC<{ isVisible: boolean; message?: string }> = ({ isVisible, message = 'Memproses...' }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-scale-in">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-700 font-medium text-lg">{message}</p>
      </div>
    </div>
  );
};

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
}> = ({ isOpen, title, message, confirmText = 'Konfirmasi', cancelText = 'Batal', onConfirm, onCancel, type = 'danger' }) => {
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
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 animate-fade-in">
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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false); // prevent login flicker while checking
  const [printAssetId] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('printAssetId');
    } catch { return null; }
  });
  const [printReportType] = useState(() => {
    try { return new URLSearchParams(window.location.search).get('printReport'); } catch { return null; }
  });
  const [printIds] = useState(() => {
    try { 
      const s = new URLSearchParams(window.location.search).get('ids');
      return s ? s.split(',').filter(Boolean) : null;
    } catch { return null; }
  });
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; email: string; allowedUnits?: string[] } | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dynamicUnits, setDynamicUnits] = useState<string[]>([]);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedFormType, setSelectedFormType] = useState<'item' | 'building' | 'land'>('item');
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isSavingAsset, setIsSavingAsset] = useState(false); // New: Loading state untuk save
  const [isDeletingAsset, setIsDeletingAsset] = useState(false); // New: Loading state untuk delete
  const externalMode = isExternalMode();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', context?: Record<string, any>) => {
    // Bridge out every notification
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

  const showConfirm = async (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
    // Try external confirmation first
    const externalResult = await requestExternalConfirmation({ id: '', title, message, type });
    if (externalResult === true) {
      onConfirm();
      return;
    }
    if (externalResult === false) {
      return; // canceled externally
    }
    if (!externalMode) {
      setConfirmDialog({ isOpen: true, title, message, onConfirm, type });
    }
  };

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  // Check for existing session and load assets on mount
  useEffect(() => {
    const checkAuthAndLoadAssets = async () => {
      const user = api.getCurrentUser();
      
      if (user) {
        const isValid = await api.checkAuth();
        
        if (isValid) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          
          // Load dynamic units from backend
          const unitsResult = await api.getMasterData('units');
          if (unitsResult.success && unitsResult.data) {
            const unitNames = unitsResult.data
              .filter((item: any) => item.isActive !== false)
              .map((item: any) => item.name)
              .filter(Boolean);
            setDynamicUnits(unitNames);
          }
          
          // Load assets from backend
          setIsLoadingAssets(true);
          const result = await api.getAssets();
          setIsLoadingAssets(false);
          
          if (result.success && result.data) {
            // Normalize asset data to ensure all required fields exist
            const normalized = result.data.map((a: any) => ({
              id: a.id ?? '',
              jenisInventaris: a.jenisInventaris ?? '',
              noKodeBarang: a.noKodeBarang ?? a.kodeBarang ?? '',
              namaBarang: a.namaBarang ?? '',
              unit: a.unit ?? '',
              tanggalInput: a.tanggalInput ?? '',
              // ...spread the rest
              ...a
            }));
            setAssets(normalized);
            // Deep-link: open asset detail if ?assetId= present
            try {
              const params = new URLSearchParams(window.location.search);
              const assetId = params.get('assetId');
              if (assetId) {
                const found = result.data.find((a: Asset) => a.id === assetId);
                if (found) {
                  const normalized = {
                    id: found.id ?? '',
                    jenisInventaris: found.jenisInventaris ?? '',
                    noKodeBarang: found.noKodeBarang ?? found.kodeBarang ?? '',
                    namaBarang: found.namaBarang ?? '',
                    unit: found.unit ?? '',
                    tanggalInput: found.tanggalInput ?? '',
                    ...found
                  };
                  setSelectedAsset(normalized);
                  setCurrentPage('assetDetail');
                }
              }
            } catch {}
          } else {
            // Show error but keep empty array - pure backend mode
            console.error('Failed to load assets:', result.error);
            setAssets([]);
          }
        } else {
          // Token expired or invalid
          api.clearToken();
        }
      }
      setIsAuthResolved(true);
    };

    checkAuthAndLoadAssets();
  }, []);

  const handleLogin = useCallback((user: { username: string; role: string; email: string }) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    
    // Load assets after successful login
    const loadAssets = async () => {
      setIsLoadingAssets(true);
      const result = await api.getAssets();
      setIsLoadingAssets(false);
      
      if (result.success && result.data) {
        // Normalize asset data to ensure all required fields exist
        const normalized = result.data.map((a: any) => ({
          id: a.id ?? '',
          jenisInventaris: a.jenisInventaris ?? '',
          noKodeBarang: a.noKodeBarang ?? a.kodeBarang ?? '',
          namaBarang: a.namaBarang ?? '',
          unit: a.unit ?? '',
          tanggalInput: a.tanggalInput ?? '',
          ...a
        }));
        setAssets(normalized);
        // Deep-link after login as well
        try {
          const params = new URLSearchParams(window.location.search);
          const assetId = params.get('assetId');
          if (assetId) {
            const found = result.data.find((a: Asset) => a.id === assetId);
            if (found) {
              const normalized = {
                id: found.id ?? '',
                jenisInventaris: found.jenisInventaris ?? '',
                noKodeBarang: found.noKodeBarang ?? found.kodeBarang ?? '',
                namaBarang: found.namaBarang ?? '',
                unit: found.unit ?? '',
                tanggalInput: found.tanggalInput ?? '',
                ...found
              };
              setSelectedAsset(normalized);
              setCurrentPage('assetDetail');
            }
          }
        } catch {}
      } else {
        // Show error but keep empty - pure backend mode
        console.error('Failed to load assets:', result.error);
        setAssets([]);
      }
    };
    
    loadAssets();
  }, []);

  const handleLogout = useCallback(() => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      api.clearToken();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentPage('dashboard');
      setAssets([]); // Clear all data on logout
    }
  }, []);

  // Filter assets based on user role and allowed units
  const filteredAssetsByRole = useMemo(() => {
    if (!currentUser) return assets;
    
    // Admin can see all assets
    if (currentUser.role === 'admin') {
      return assets;
    }
    
    // Editor and Viewer can only see assets from their allowed units
    if ((currentUser.role === 'editor' || currentUser.role === 'viewer') && 
        currentUser.allowedUnits && currentUser.allowedUnits.length > 0) {
      return assets.filter(asset => currentUser.allowedUnits!.includes(asset.unit));
    }
    
    // Default: show all assets if no unit restriction
    return assets;
  }, [assets, currentUser]);

  const handleAddNewAsset = useCallback((formType: 'item' | 'building' | 'land' = 'item') => {
    // Viewer tidak boleh menambah aset
    if (currentUser?.role === 'viewer') {
      showToast('Viewer tidak memiliki akses untuk menambah aset.', 'error');
      return;
    }
    setEditingAsset(null);
    setSelectedFormType(formType);
    setCurrentPage('assetForm');
  }, [currentUser]);

  const handleEditAsset = useCallback((asset: Asset) => {
    // Viewer tidak boleh mengedit aset
    if (currentUser?.role === 'viewer') {
      showToast('Viewer tidak memiliki akses untuk mengedit aset.', 'error');
      return;
    }
    
    // Check if editor has permission to edit this asset
    if (currentUser?.role === 'editor' && currentUser.allowedUnits && currentUser.allowedUnits.length > 0) {
      if (!currentUser.allowedUnits.includes(asset.unit)) {
        showToast('Anda tidak memiliki akses untuk mengedit aset dari unit ini.', 'error');
        return;
      }
    }
    
    setEditingAsset(asset);
    
    // Determine form type based on asset type
    const assetType = asset.jenisInventaris?.toLowerCase() || '';
    if (assetType.includes('tanah')) {
      setSelectedFormType('land');
    } else if (assetType.includes('bangunan')) {
      setSelectedFormType('building');
    } else {
      setSelectedFormType('item');
    }
    
    setCurrentPage('assetForm');
  }, [currentUser]);
  
  const handleCancelSave = useCallback(() => {
    setEditingAsset(null);
    setCurrentPage('inventory');
  }, []);
  
  const initialFormData: Omit<Asset, 'id' | 'tanggalInput'> = {
    jenisInventaris: '',
    noKodeBarang: `INV-${Date.now()}`,
    namaBarang: '',
    tahunPembuatan: new Date().getFullYear().toString(),
    jumlahBarang: 1,
    hargaBeli: 0,
    keadaanBarang: AssetStatus.Baik,
    unit: (dynamicUnits[0] as Unit) || '',
    ruangan: '',
    photos: [],
  };

  const handleSaveAsset = useCallback(async (assetData: Omit<Asset, 'id' | 'tanggalInput'>) => {
    // Prevent double submit
    if (isSavingAsset) {
      return;
    }

    setIsSavingAsset(true);
    
    try {
      if (editingAsset) {
        // Update existing asset
        const result = await api.updateAsset(editingAsset.id, assetData);
        
        if (result.success) {
          setAssets(prevAssets => prevAssets.map(a => 
            a.id === editingAsset.id ? { ...editingAsset, ...assetData } : a
          ));
          handleCancelSave();
          showToast('Data aset berhasil diperbarui', 'success');
        } else {
          showToast('Gagal mengupdate aset: ' + (result.error || 'Unknown error'), 'error');
        }
      } else {
        // Create new asset
        const result = await api.createAsset(assetData);
        
        if (result.success && result.data) {
          const newAsset: Asset = {
            ...initialFormData,
            ...assetData,
            id: result.data.id,
            tanggalInput: new Date().toISOString(),
          };
          setAssets(prevAssets => [...prevAssets, newAsset]);
          handleCancelSave();
          showToast('Aset baru berhasil ditambahkan', 'success');
        } else {
          showToast('Gagal menyimpan aset: ' + (result.error || 'Unknown error'), 'error');
        }
      }
    } catch (error: any) {
      console.error('Error saving asset:', error);
  showToast('Terjadi kesalahan saat menyimpan: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setIsSavingAsset(false);
    }
  }, [editingAsset, handleCancelSave, initialFormData, isSavingAsset]);

  const handleDuplicateAsset = useCallback(async (baseAsset: Asset, entries: any[]) => {
    try {
      const createdAssets: Asset[] = [];
      
      for (const entry of entries) {
        const assetData: Omit<Asset, 'id' | 'tanggalInput'> = {
          ...baseAsset,
          ruangan: entry.location,
          jumlahBarang: entry.quantity,
        };
        
        const result = await api.createAsset(assetData);
        
        if (result.success && result.data) {
          const newAsset: Asset = {
            ...assetData,
            id: result.data.id,
            tanggalInput: new Date().toISOString(),
          } as Asset;
          createdAssets.push(newAsset);
        } else {
          throw new Error(result.error || 'Gagal membuat aset');
        }
      }
      
      setAssets(prevAssets => [...prevAssets, ...createdAssets]);
  showToast(`Berhasil membuat ${createdAssets.length} aset di lokasi berbeda`, 'success');
      handleCancelSave();
    } catch (error: any) {
  showToast('Gagal duplikasi aset: ' + (error.message || 'Unknown error'), 'error');
    }
  }, [handleCancelSave]);

  const handleDeleteAsset = useCallback(async (assetId: string) => {
    // Viewer tidak boleh menghapus aset
    if (currentUser?.role === 'viewer') {
  showToast('Viewer tidak memiliki akses untuk menghapus aset.', 'error');
      return;
    }
    
    // Editor tidak boleh menghapus aset (hanya admin)
    if (currentUser?.role === 'editor') {
  showToast('Hanya Admin yang dapat menghapus aset.', 'error');
      return;
    }
    
    // Prevent double delete
    if (isDeletingAsset) {
      return;
    }
    
    // Find the asset to check permissions
    const assetToDelete = assets.find(a => a.id === assetId);
    const assetName = assetToDelete?.namaBarang || 'aset ini';
    
    showConfirm(
      'Konfirmasi Penghapusan Aset',
      `Apakah Anda yakin ingin menghapus "${assetName}"? Tindakan ini tidak dapat dibatalkan dan semua data terkait akan dihapus permanen.`,
      async () => {
        setIsDeletingAsset(true);
        
        try {
          const result = await api.deleteAsset(assetId);
          
          if (result.success) {
            setAssets(prevAssets => prevAssets.filter(a => a.id !== assetId));
            showToast('Aset berhasil dihapus', 'success');
          } else {
            showToast('Gagal menghapus aset: ' + (result.error || 'Unknown error'), 'error');
          }
        } catch (error: any) {
          console.error('Error deleting asset:', error);
          showToast('Terjadi kesalahan saat menghapus: ' + (error.message || 'Unknown error'), 'error');
        } finally {
          setIsDeletingAsset(false);
        }
        
        closeConfirm();
      },
      'danger'
    );
  }, [assets, currentUser, isDeletingAsset]);
  
  const handleViewAssetDetail = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    setCurrentPage('assetDetail');
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedAsset(null);
    setCurrentPage('inventory');
  }, []);

  const filteredAssets = useMemo(() => {
    return filteredAssetsByRole.filter(asset => 
      asset.namaBarang.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredAssetsByRole, searchTerm]);

  const stats = useMemo(() => {
    const isTanah = (a: Asset) => (a.jenisInventaris || '').toLowerCase().includes('tanah');
    const isBangunan = (a: Asset) => (a.jenisInventaris || '').toLowerCase().includes('bangunan');
    const barangOnly = filteredAssetsByRole.filter(a => !isTanah(a) && !isBangunan(a));
    return {
      // Total Inventaris Barang = jumlahBarang hanya untuk aset jenis barang
      totalInventory: barangOnly.reduce((sum, a) => sum + (a.jumlahBarang || 0), 0),
      totalTanah: filteredAssetsByRole.filter(a => (a.jenisInventaris || '').toLowerCase() === 'tanah').length,
      totalBangunan: filteredAssetsByRole.filter(a => (a.jenisInventaris || '').toLowerCase() === 'bangunan').length,
    };
  }, [filteredAssetsByRole]);

  const yearlyInventoryData = useMemo(() => {
    const isTanah = (a: Asset) => (a.jenisInventaris || '').toLowerCase().includes('tanah');
    const isBangunan = (a: Asset) => (a.jenisInventaris || '').toLowerCase().includes('bangunan');
    
    const countsByYear: { [key: string]: { barang: number; tanah: number; bangunan: number } } = {};
    
    filteredAssetsByRole.forEach(asset => {
      const year = asset.tahunPembuatan;
      if (year && !isNaN(parseInt(year, 10))) {
        if (!countsByYear[year]) {
          countsByYear[year] = { barang: 0, tanah: 0, bangunan: 0 };
        }
        
        if (isTanah(asset)) {
          countsByYear[year].tanah += 1;
        } else if (isBangunan(asset)) {
          countsByYear[year].bangunan += 1;
        } else {
          countsByYear[year].barang += (asset.jumlahBarang || 0);
        }
      }
    });

    return Object.entries(countsByYear)
      .map(([year, counts]) => ({ 
        year, 
        barang: counts.barang,
        tanah: counts.tanah,
        bangunan: counts.bangunan
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [filteredAssetsByRole]);
  
  let pageTitle = '';
  switch (currentPage) {
    case 'dashboard':
      pageTitle = 'Dashboard';
      break;
    case 'inventory':
      pageTitle = 'Daftar Inventaris';
      break;
    case 'assetDetail':
      pageTitle = 'Detail Inventaris';
      break;
    case 'assetForm':
      pageTitle = editingAsset ? 'Edit Inventaris' : 'Tambah Inventaris Baru';
      break;
    case 'reports':
      pageTitle = 'Laporan';
      break;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={stats} 
            yearlyInventoryData={yearlyInventoryData} 
            assets={filteredAssetsByRole}
            onViewAllAssets={() => setCurrentPage('inventory')}
          />
        );
      case 'inventory':
        return (
          <AssetListPage
            filteredAssets={filteredAssets}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onEditAsset={handleEditAsset}
            onDeleteAsset={handleDeleteAsset}
            onViewDetail={handleViewAssetDetail}
            onAddAsset={handleAddNewAsset}
            allAssets={filteredAssetsByRole}
            currentUserRole={currentUser?.role}
            currentUser={currentUser}
          />
        );
      case 'assetForm':
        return (
            <AssetFormPage 
                onSave={handleSaveAsset}
                onCancel={handleCancelSave}
                asset={editingAsset}
                formType={selectedFormType}
                onDuplicateRequest={handleDuplicateAsset}
                currentUser={currentUser}
                dynamicUnits={dynamicUnits}
            />
        );
      case 'assetDetail':
        // Check if editor can edit this specific asset
        const canEditAsset = currentUser?.role === 'admin' || 
          (currentUser?.role === 'editor' && 
           currentUser.allowedUnits && 
           currentUser.allowedUnits.length > 0 &&
           selectedAsset &&
           currentUser.allowedUnits.includes(selectedAsset.unit));
        
        return selectedAsset ? (
      <AssetDetailPage
                asset={selectedAsset}
                onBack={handleBackToList}
        onEdit={handleEditAsset}
        canEdit={canEditAsset}
            />
        ) : null;
      case 'reports':
        return (
          <ReportPage 
            assets={filteredAssetsByRole}
            isLoading={isLoadingAssets}
            dynamicUnits={dynamicUnits}
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            onLogout={handleLogout} 
            currentUser={currentUser}
            onUnitsChange={(units) => setDynamicUnits(units)}
          />
        );
      default:
        return null;
    }
  };


  // Print mode: after auth & assets loaded, show print component without header
  if (isAuthenticated && printAssetId) {
    // Wait for assets to load - only show loader if still loading
    if (isLoadingAssets) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <div className="text-sm text-gray-600">Memuat data aset…</div>
          </div>
        </div>
      );
    }
    
    const assetToPrint = assets.find(a => a.id === printAssetId);
    if (assetToPrint) {
      return <AssetPrintPage asset={assetToPrint} />;
    }
    
    // Asset not found after loading completed
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Aset tidak ditemukan</div>
          <div className="text-sm text-gray-600 mb-4">ID: {printAssetId}</div>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Report print mode
  if (isAuthenticated && printReportType) {
    // Wait for assets to load
    if (isLoadingAssets) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <div className="text-sm text-gray-600">Memuat data untuk laporan…</div>
          </div>
        </div>
      );
    }
    
    const selected = printIds && printIds.length > 0
      ? assets.filter(a => printIds.includes(a.id))
      : assets;

    switch (printReportType) {
      case 'tableAll':
        return <ReportPrintTableAll assets={selected} />;
      case 'detailAll':
        return <ReportPrintDetailAll assets={selected} />;
      case 'tableBarang':
        return <ReportPrintTableBarang assets={selected} />;
      case 'tableTanah':
        return <ReportPrintTableTanah assets={selected} />;
      case 'tableBangunan':
        return <ReportPrintTableBangunan assets={selected} />;
      case 'kir':
        return <ReportPrintKIR assets={selected} />;
    }
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    // Avoid flashing Login while we're still checking existing session
    if (!isAuthResolved) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <div className="text-sm text-gray-600">Memeriksa sesi…</div>
          </div>
        </div>
      );
    }
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen text-gray-800 bg-gray-100 transition-colors duration-300 overflow-hidden">
      <div className="flex flex-col h-full">
        <Header 
          className="print:hidden"
          title={pageTitle} 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-y-auto min-w-0">
          {renderContent()}
        </div>
      </div>
      
      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isSavingAsset || isDeletingAsset} 
        message={isSavingAsset ? 'Menyimpan data...' : isDeletingAsset ? 'Menghapus data...' : 'Memproses...'}
  />
      
      {/* Toast Notification (internal UI disabled in external mode) */}
      {!externalMode && toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Confirmation Dialog (internal UI disabled in external mode) */}
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
    </div>
  );
};

export default App;
