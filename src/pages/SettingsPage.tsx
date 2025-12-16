import React, { useState, useEffect } from 'react';
import { sendNotification, requestExternalConfirmation, isExternalMode } from '@/lib/notificationBridge';
import { getUsers, createUser, updateUser, deleteUser, getMasterData, User as ApiUser } from '@/services/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  allowedUnits?: string[];
  createdAt?: string;
}

interface Category {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface SourceOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface UnitOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface SettingsPageProps {
  onLogout: () => void;
  currentUser?: { username: string; role: string; allowedUnits?: string[]; email?: string } | null;
  onUnitsChange?: (units: string[]) => void;
}

// ==================== HELPER COMPONENTS ====================

// Toast Notification Component
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in-right z-[9999]`}>
      <span className="text-xl font-bold">{icon}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 hover:bg-white/20 rounded p-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// Section Header Component
const SectionHeader: React.FC<{ title: string; description?: string; icon?: React.ReactNode; action?: React.ReactNode }> = ({ title, description, icon, action }) => (
  <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-200">
    <div className="flex items-start gap-4">
      {icon && <div className="text-blue-600 mt-1">{icon}</div>}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-600 mt-1 max-w-2xl">{description}</p>}
      </div>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

// Empty State Component
const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }> = ({ icon, title, description, action }) => (
  <div className="text-center py-16 px-4">
    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4 text-gray-400">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    {action && <div>{action}</div>}
  </div>
);

// Loading Skeleton Component
const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
    ))}
  </div>
);

// Confirmation Dialog Component
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

  const colorClass = type === 'danger' ? 'bg-red-600 hover:bg-red-700' : type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className={`${type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'} px-6 py-5 rounded-t-2xl border-b-2 ${type === 'danger' ? 'border-red-200' : type === 'warning' ? 'border-yellow-200' : 'border-blue-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`${type === 'danger' ? 'bg-red-100 text-red-600' : type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'} p-3 rounded-full`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-gray-700 font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 text-white font-semibold ${colorClass} rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${type === 'danger' ? 'focus:ring-red-500' : type === 'warning' ? 'focus:ring-yellow-500' : 'focus:ring-blue-500'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout, currentUser, onUnitsChange }) => {
  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';
  const isEditor = currentUser?.role === 'editor';

  // Toast & Confirmation Dialog States
  const externalMode = isExternalMode();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', context?: Record<string, any>) => {
    sendNotification(message, type, context);
    if (!externalMode) setToast({ message, type });
  };

  const showConfirm = async (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
    const externalResult = await requestExternalConfirmation({ id: '', title, message, type });
    if (externalResult === true) { onConfirm(); return; }
    if (externalResult === false) { return; }
    if (!externalMode) setConfirmDialog({ isOpen: true, title, message, onConfirm, type });
  };

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  // --- HEADER & DESKRIPSI PROFESIONAL ---
  const renderHeader = () => (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Pengaturan Sistem</h1>
      <p className="text-gray-600 text-base max-w-2xl">
        Kelola seluruh data master, pengguna, dan preferensi aplikasi Anda di halaman ini. Pastikan setiap perubahan yang dilakukan telah sesuai dengan kebijakan organisasi. Semua data yang diubah akan langsung diterapkan ke sistem dan dapat mempengaruhi akses serta tampilan aplikasi.
      </p>
    </div>
  );

  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'units' | 'users' | 'account'>('general');
  const [organizationName, setOrganizationName] = useState('Kelurahan/Kantor');
  const [address, setAddress] = useState('Jl. Pemerintahan No. 123');
  const [phone, setPhone] = useState('021-12345678');
  const [email, setEmail] = useState('admin@kelurahan.go.id');

  // Units management - sinkronisasi dengan unitOptions dari constants
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOption | null>(null);
  const [unitForm, setUnitForm] = useState({ name: '' });

  // Load units from backend (Master_Units sheet)
  useEffect(() => {
    const loadUnits = async () => {
      try {
        const result = await getMasterData('units');
        if (result.success && result.data) {
          const loadedUnits = result.data.map((item: any) => ({
            id: item.id || item.name,
            name: item.name,
            isActive: item.isActive !== false
          }));
          setUnits(loadedUnits);
        }
      } catch (error) {
        console.error('Failed to load units:', error);
        // Fallback to empty if backend fails
        setUnits([]);
      }
    };
    loadUnits();
  }, []);

  // Notify parent when units change
  useEffect(() => {
    if (units.length > 0 && onUnitsChange) {
      const activeUnitNames = units.filter(u => u.isActive).map(u => u.name);
      onUnitsChange(activeUnitNames);
    }
  }, [units, onUnitsChange]);

  // Users management
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'viewer' as User['role'],
    allowedUnits: [] as string[]
  });
  const [isSavingUser, setIsSavingUser] = useState(false); // New: Loading state
  const [isSavingUnit, setIsSavingUnit] = useState(false); // New: Loading state
  const [isSavingCategory, setIsSavingCategory] = useState(false); // New: Loading state
  const [isSavingSource, setIsSavingSource] = useState(false); // New: Loading state

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load users from backend
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('sidak_token');
      if (!token) {
        showToast('Token tidak ditemukan. Silakan login ulang.', 'error');
        return;
      }

      const result = await getUsers(token);
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        console.error('Gagal load users:', result.error);
        if (result.error?.includes('Akses ditolak')) {
          showToast('Akses ditolak. Hanya admin yang dapat mengelola pengguna.', 'error');
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Terjadi kesalahan saat memuat data pengguna', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };


  // Categories management
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Elektronik', code: 'ELK', isActive: true },
    { id: '2', name: 'Perabot', code: 'PRB', isActive: true },
    { id: '3', name: 'Kendaraan', code: 'KDR', isActive: true },
    { id: '4', name: 'Alat Tulis', code: 'ALT', isActive: true },
    { id: '5', name: 'Alat Kebersihan', code: 'ALB', isActive: true },
    { id: '6', name: 'Alat Dapur', code: 'ADP', isActive: true },
    { id: '7', name: 'Alat Kesehatan', code: 'AKS', isActive: true },
    { id: '8', name: 'Alat Olahraga', code: 'AOR', isActive: true },
    { id: '9', name: 'Alat Musik', code: 'AMS', isActive: true },
    { id: '10', name: 'Alat Listrik', code: 'ALS', isActive: true },
    { id: '11', name: 'Alat Pendingin', code: 'APD', isActive: true },
    { id: '12', name: 'Alat Komunikasi', code: 'AKM', isActive: true },
    { id: '13', name: 'Alat Pengolah Data', code: 'APD2', isActive: true },
    { id: '14', name: 'Alat Bantu', code: 'ABT', isActive: true },
    { id: '15', name: 'Lainnya', code: 'LNN', isActive: true },
  ]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '' });

  // Source options management
  const [sourceOptions, setSourceOptions] = useState<SourceOption[]>([
    { id: '1', name: 'Pembelian', isActive: true },
    { id: '2', name: 'Hibah', isActive: true },
    { id: '3', name: 'Bantuan Pemerintah', isActive: true },
    { id: '4', name: 'Bantuan Swasta', isActive: true },
    { id: '5', name: 'Sumbangan', isActive: true },
    { id: '6', name: 'Wakaf', isActive: true },
    { id: '7', name: 'Dana BOS', isActive: true },
    { id: '8', name: 'Dana Desa', isActive: true },
    { id: '9', name: 'APBD', isActive: true },
    { id: '10', name: 'APBN', isActive: true },
    { id: '11', name: 'Swadaya Masyarakat', isActive: true },
    { id: '12', name: 'Lainnya', isActive: true },
  ]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState<SourceOption | null>(null);
  const [sourceForm, setSourceForm] = useState({ name: '' });
  
  const handleSaveGeneral = () => {
    // TODO: Implement save to backend
    showToast('Pengaturan umum berhasil disimpan!', 'success');
  };

  const handleExportData = () => {
    showToast('Fitur export data dalam pengembangan', 'info');
  };

  const handleImportData = () => {
    showToast('Fitur import data dalam pengembangan', 'info');
  };

  // Unit management functions
  const handleAddUnit = () => {
    setEditingUnit(null);
    setUnitForm({ name: '' });
    setShowUnitModal(true);
  };

  const handleEditUnit = (unit: UnitOption) => {
    setEditingUnit(unit);
    setUnitForm({ name: unit.name });
    setShowUnitModal(true);
  };

  const handleSaveUnit = () => {
    if (!unitForm.name.trim()) {
      showToast('Nama unit wajib diisi', 'error');
      return;
    }

    if (editingUnit) {
      const updatedUnits = units.map(u => u.id === editingUnit.id
        ? { ...u, name: unitForm.name }
        : u
      );
      setUnits(updatedUnits);
      console.log('Updated units:', updatedUnits.filter(u => u.isActive).map(u => u.name));
      showToast('Unit berhasil diperbarui', 'success');
    } else {
      const newUnit: UnitOption = {
        id: Date.now().toString(),
        name: unitForm.name,
        isActive: true,
      };
      const updatedUnits = [...units, newUnit];
      setUnits(updatedUnits);
      console.log('Updated units:', updatedUnits.filter(u => u.isActive).map(u => u.name));
      showToast('Unit berhasil ditambahkan', 'success');
    }
    setShowUnitModal(false);
  };

  const handleDeleteUnit = (id: string) => {
    showConfirm(
      'Konfirmasi Penghapusan',
      'Apakah Anda yakin ingin menghapus unit ini? Data yang sudah terkait dengan unit ini mungkin terpengaruh.',
      () => {
        const updatedUnits = units.filter(u => u.id !== id);
        setUnits(updatedUnits);
        console.log('Updated units:', updatedUnits.filter(u => u.isActive).map(u => u.name));
        showToast('Unit berhasil dihapus', 'success');
        closeConfirm();
      },
      'danger'
    );
  };

  const handleToggleUnitStatus = (id: string) => {
    const updatedUnits = units.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u);
    setUnits(updatedUnits);
    console.log('Active units:', updatedUnits.filter(u => u.isActive).map(u => u.name));
  };

  // User management functions
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({ username: '', email: '', password: '', role: 'viewer', allowedUnits: [] });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ 
      username: user.username, 
      email: user.email, 
      password: '', 
      role: user.role,
      allowedUnits: user.allowedUnits || []
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.username.trim() || !userForm.email.trim()) {
      showToast('Username dan email wajib diisi', 'error');
      return;
    }
    
    if (!editingUser && !userForm.password) {
      showToast('Password wajib diisi untuk user baru', 'error');
      return;
    }

    const token = localStorage.getItem('sidak_token');
    if (!token) {
      showToast('Token tidak ditemukan. Silakan login ulang.', 'error');
      return;
    }

    // Prevent double submit
    if (isSavingUser) {
      return;
    }

    setIsSavingUser(true);

    try {
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          username: userForm.username,
          email: userForm.email,
          role: userForm.role,
          allowedUnits: userForm.allowedUnits,
        };
        
        if (userForm.password) {
          updateData.password = userForm.password;
        }

        const result = await updateUser(token, editingUser.id, updateData);
        
        if (result.success) {
          showToast('Data pengguna berhasil diperbarui', 'success');
          setShowUserModal(false);
          loadUsers();
        } else {
          showToast(result.error || 'Gagal memperbarui data pengguna', 'error');
        }
      } else {
        // Create new user
        const result = await createUser(token, {
          username: userForm.username,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
          allowedUnits: userForm.allowedUnits,
        });

        if (result.success) {
          showToast('Pengguna baru berhasil ditambahkan', 'success');
          setShowUserModal(false);
          loadUsers();
        } else {
          showToast(result.error || 'Gagal menambahkan pengguna', 'error');
        }
      }
    } catch (error) {
      console.error('Save user error:', error);
      showToast('Terjadi kesalahan saat menyimpan data pengguna', 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const token = localStorage.getItem('sidak_token');
    if (!token) {
      showToast('Token tidak ditemukan. Silakan login ulang.', 'error');
      return;
    }

    showConfirm(
      'Konfirmasi Penghapusan Pengguna',
      'Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          const result = await deleteUser(token, id);
          
          if (result.success) {
            showToast('Pengguna berhasil dihapus', 'success');
            loadUsers();
          } else {
            showToast(result.error || 'Gagal menghapus pengguna', 'error');
          }
        } catch (error) {
          console.error('Delete user error:', error);
          showToast('Terjadi kesalahan saat menghapus pengguna', 'error');
        }
        closeConfirm();
      },
      'danger'
    );
  };

  const handleToggleUserStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  // Category management functions
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', code: '' });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, code: category.code });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = () => {
    if (!categoryForm.name?.trim() || !categoryForm.code?.trim()) {
      showToast('Nama dan kode kategori wajib diisi', 'error');
      return;
    }

    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id
        ? { ...c, name: categoryForm.name, code: categoryForm.code.toUpperCase() }
        : c
      ));
      showToast('Data kategori berhasil diperbarui', 'success');
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: categoryForm.name,
        code: categoryForm.code.toUpperCase(),
        isActive: true,
      };
      setCategories([...categories, newCategory]);
      showToast('Kategori baru berhasil ditambahkan', 'success');
    }
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (id: string) => {
    showConfirm(
      'Konfirmasi Penghapusan Kategori',
      'Apakah Anda yakin ingin menghapus kategori ini? Data aset yang menggunakan kategori ini mungkin terpengaruh.',
      () => {
        setCategories(categories.filter(c => c.id !== id));
        showToast('Kategori berhasil dihapus', 'success');
        closeConfirm();
      },
      'danger'
    );
  };

  const handleToggleCategoryStatus = (id: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  // Source management functions
  const handleAddSource = () => {
    setEditingSource(null);
    setSourceForm({ name: '' });
    setShowSourceModal(true);
  };

  const handleEditSource = (source: SourceOption) => {
    setEditingSource(source);
    setSourceForm({ name: source.name });
    setShowSourceModal(true);
  };

  const handleSaveSource = () => {
    if (!sourceForm.name?.trim()) {
      showToast('Nama sumber perolehan wajib diisi', 'error');
      return;
    }

    if (editingSource) {
      setSourceOptions(sourceOptions.map(s => s.id === editingSource.id
        ? { ...s, name: sourceForm.name }
        : s
      ));
      showToast('Data sumber perolehan berhasil diperbarui', 'success');
    } else {
      const newSource: SourceOption = {
        id: Date.now().toString(),
        name: sourceForm.name,
        isActive: true,
      };
      setSourceOptions([...sourceOptions, newSource]);
      showToast('Sumber perolehan baru berhasil ditambahkan', 'success');
    }
    setShowSourceModal(false);
  };

  const handleDeleteSource = (id: string) => {
    showConfirm(
      'Konfirmasi Penghapusan Sumber Perolehan',
      'Apakah Anda yakin ingin menghapus sumber perolehan ini? Data aset yang menggunakan sumber ini mungkin terpengaruh.',
      () => {
        setSourceOptions(sourceOptions.filter(s => s.id !== id));
        showToast('Sumber perolehan berhasil dihapus', 'success');
        closeConfirm();
      },
      'danger'
    );
  };

  const handleToggleSourceStatus = (id: string) => {
    setSourceOptions(sourceOptions.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  // Handle change password
  const handleChangePassword = async () => {
    // Validation
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast('Semua field password wajib diisi', 'error');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Password baru dan konfirmasi password tidak cocok', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('sidak_token');
      if (!token) {
        showToast('Token tidak ditemukan. Silakan login ulang.', 'error');
        setIsChangingPassword(false);
        return;
      }

      // Use the new changeOwnPassword API
      const { changeOwnPassword } = await import('@/services/api');
      const result = await changeOwnPassword(token, passwordForm.oldPassword, passwordForm.newPassword);

      if (result.success) {
        showToast('Password berhasil diubah! Silakan login ulang.', 'success');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        // Small delay before logout to let user see the success message
        setTimeout(() => {
          onLogout();
        }, 1500);
      } else {
        showToast('Gagal mengubah password: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Change password error:', error);
      showToast('Gagal mengubah password. Silakan coba lagi.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Header dan deskripsi profesional */}
        {renderHeader()}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Tabs */}

          <div className="border-b border-gray-200 bg-gray-50 rounded-t-xl px-2">
            <nav className="flex -mb-px overflow-x-auto gap-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-6 py-4 text-base font-semibold border-b-4 transition-colors whitespace-nowrap rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === 'general'
                    ? 'border-blue-600 text-blue-700 bg-white shadow'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Data Umum</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-4 text-base font-semibold border-b-4 transition-colors whitespace-nowrap rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === 'categories'
                    ? 'border-blue-600 text-blue-700 bg-white shadow'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Data Kategori</span>
                </div>
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('units')}
                  className={`px-6 py-4 text-base font-semibold border-b-4 transition-colors whitespace-nowrap rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    activeTab === 'units'
                      ? 'border-blue-600 text-blue-700 bg-white shadow'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Manajemen Unit</span>
                  </div>
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-6 py-4 text-base font-semibold border-b-4 transition-colors whitespace-nowrap rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    activeTab === 'users'
                      ? 'border-blue-600 text-blue-700 bg-white shadow'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Pengguna</span>
                  </div>
                </button>
              )}
              <button
                onClick={() => setActiveTab('account')}
                className={`px-6 py-4 text-base font-semibold border-b-4 transition-colors whitespace-nowrap rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === 'account'
                    ? 'border-blue-600 text-blue-700 bg-white shadow'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profil Akun</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-8">
                {/* Informasi Organisasi Section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <SectionHeader
                    title="Informasi Organisasi"
                    description="Data identitas dan kontak organisasi yang akan ditampilkan dalam laporan dan dokumen"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    }
                  />
                  <div className="p-6">
                    {!isAdmin && (
                      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-blue-900">Akses Terbatas</p>
                            <p className="text-sm text-blue-700 mt-1">Hanya pengguna dengan role Admin yang dapat mengubah informasi organisasi</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nama Organisasi / Instansi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Contoh: Kelurahan Sukamaju"
                          disabled={!isAdmin}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="email@organisasi.id"
                          disabled={!isAdmin}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Alamat
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Jl. Contoh No. 123"
                          disabled={!isAdmin}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Telepon
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="021-12345678"
                          disabled={!isAdmin}
                        />
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                        <button
                          onClick={handleSaveGeneral}
                          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Simpan Perubahan
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data & Backup Section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <SectionHeader
                    title="Data & Backup"
                    description="Kelola data inventaris dengan export dan import file Excel"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    }
                  />
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base">Export Data</h3>
                            <p className="text-sm text-gray-600 mt-1">Download semua data inventaris dalam format Excel</p>
                          </div>
                        </div>
                        <button
                          onClick={handleExportData}
                          className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base">Import Data</h3>
                            <p className="text-sm text-gray-600 mt-1">Upload data inventaris dari file Excel</p>
                          </div>
                        </div>
                        <button
                          onClick={handleImportData}
                          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Import
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Kelola Kategori Barang</h2>
                    {isAdmin && (
                      <button
                        onClick={handleAddCategory}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Kategori
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kategori</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          {isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categories.map((category) => (
                          <tr key={category.id} className={!category.isActive ? 'bg-gray-50' : ''}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{category.code}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => isAdmin && handleToggleCategoryStatus(category.id)}
                                disabled={!isAdmin}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  category.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                } ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                              >
                                {category.isActive ? 'Aktif' : 'Nonaktif'}
                              </button>
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditCategory(category)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Sumber Perolehan</h2>
                    {isAdmin && (
                      <button
                        onClick={handleAddSource}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Sumber
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Sumber</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          {isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sourceOptions.map((source) => (
                          <tr key={source.id} className={!source.isActive ? 'bg-gray-50' : ''}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{source.name}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => isAdmin && handleToggleSourceStatus(source.id)}
                                disabled={!isAdmin}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  source.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                } ${isAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                              >
                                {source.isActive ? 'Aktif' : 'Nonaktif'}
                              </button>
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditSource(source)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSource(source.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'units' && isAdmin && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Kelola Unit</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Unit yang aktif akan tersedia di form tambah/edit aset
                      </p>
                    </div>
                    <button
                      onClick={handleAddUnit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah Unit
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Unit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {units.map((unit) => (
                          <tr key={unit.id} className={!unit.isActive ? 'bg-gray-50' : ''}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{unit.name}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleUnitStatus(unit.id)}
                                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${
                                  unit.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {unit.isActive ? 'Aktif' : 'Nonaktif'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditUnit(unit)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteUnit(unit.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Info Card */}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 text-sm">Informasi Unit</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Total unit aktif: <strong>{units.filter(u => u.isActive).length}</strong>
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Unit yang ditandai "Aktif" akan tersedia sebagai pilihan di form tambah/edit aset.
                          Unit yang dinonaktifkan tidak akan muncul di dropdown tetapi data aset yang sudah ada tetap tersimpan.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && isAdmin && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Kelola User</h2>
                    <button
                      onClick={handleAddUser}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah User
                    </button>
                  </div>
                  
                  {loadingUsers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Memuat daftar user...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akses Unit</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                Tidak ada user. Klik "Tambah User" untuk membuat user baru.
                              </td>
                            </tr>
                          ) : (
                            users.map((user) => (
                              <tr key={user.id} className={!user.isActive ? 'bg-gray-50' : ''}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.username}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {(user.role === 'editor' || user.role === 'viewer') && user.allowedUnits && user.allowedUnits.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {user.allowedUnits.map((unit, idx) => (
                                        <span key={idx} className={`inline-block px-2 py-0.5 text-xs rounded ${
                                          user.role === 'editor' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                          {unit}
                                        </span>
                                      ))}
                                    </div>
                                  ) : user.role === 'admin' ? (
                                    <span className="text-xs text-gray-500 italic">Semua unit</span>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Aktif
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditUser(user)}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Edit"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Hapus"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Akun</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{currentUser?.username || 'User'}</h3>
                        <p className="text-sm text-gray-600 mb-1">{currentUser?.email || email}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          currentUser?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          currentUser?.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {currentUser?.role || 'viewer'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Ubah Password</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Ubah password akun Anda sendiri. Untuk keamanan, Anda akan diminta login ulang setelah mengubah password.
                  </p>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Lama
                      </label>
                      <input
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Masukkan password lama"
                        disabled={isChangingPassword}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Masukkan password baru (min. 6 karakter)"
                        disabled={isChangingPassword}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Konfirmasi password baru"
                        disabled={isChangingPassword}
                      />
                    </div>
                    <button 
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword ? 'Mengubah Password...' : 'Ubah Password'}
                    </button>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h2 className="text-lg font-semibold text-red-600 mb-4">Zona Berbahaya</h2>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-3">
                      Keluar dari akun Anda. Anda perlu login kembali untuk mengakses aplikasi.
                    </p>
                    <button
                      onClick={onLogout}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{editingUser ? 'Edit User' : 'Tambah User'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && '(Kosongkan jika tidak ingin mengubah)'}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah' : 'Masukkan password'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as User['role'], allowedUnits: [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {/* Unit access for editors and viewers */}
              {(userForm.role === 'editor' || userForm.role === 'viewer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {userForm.role === 'editor' ? 'Unit yang Boleh Diedit' : 'Unit yang Boleh Dilihat'}
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                    {units.filter(u => u.isActive).map((unit) => (
                      <label key={unit.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={userForm.allowedUnits.includes(unit.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserForm({ 
                                ...userForm, 
                                allowedUnits: [...userForm.allowedUnits, unit.name] 
                              });
                            } else {
                              setUserForm({ 
                                ...userForm, 
                                allowedUnits: userForm.allowedUnits.filter(u => u !== unit.name) 
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{unit.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {userForm.role === 'editor' 
                      ? 'Pilih unit mana saja yang boleh diedit oleh editor ini'
                      : 'Pilih unit mana saja yang boleh dilihat oleh viewer ini'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                disabled={isSavingUser}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleSaveUser}
                disabled={isSavingUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingUser && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isSavingUser ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Alat Kantor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode (3 huruf)</label>
                <input
                  type="text"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase().slice(0, 5) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: AKT"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCategory}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{editingSource ? 'Edit Sumber Perolehan' : 'Tambah Sumber Perolehan'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sumber</label>
                <input
                  type="text"
                  value={sourceForm.name}
                  onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Dana Daerah"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSourceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveSource}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{editingUnit ? 'Edit Unit' : 'Tambah Unit'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Unit</label>
                <input
                  type="text"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Sekretariat"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUnitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveUnit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification (disabled in external mode) */}
      {!externalMode && toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
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
    </div>
  );
};

export default SettingsPage;
