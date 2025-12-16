import React, { useEffect, useState } from 'react';
import { requestExternalConfirmation, isExternalMode, sendNotification } from '@/lib/notificationBridge';
import { DashboardIcon, ReportsIcon, SettingsIcon, LogoutIcon } from '@/components/ui';
import { Page } from '@/App';

interface HeaderProps {
  title: string;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  className?: string;
  currentUser?: { username: string; role: string; allowedUnits?: string[]; email?: string } | null;
  onLogout?: () => void;
}

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

const Header: React.FC<HeaderProps> = ({ title, currentPage, setCurrentPage, className, currentUser, onLogout }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const externalMode = isExternalMode();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = async (title: string, message: string, onConfirm: () => void) => {
    const externalResult = await requestExternalConfirmation({ id: '', title, message, type: 'warning' });
    if (externalResult === true) { onConfirm(); return; }
    if (externalResult === false) { return; }
    if (!externalMode) setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  const navItems: { label: string; page: Page; icon: React.ReactNode }[] = [
    { label: 'Dashboard', page: 'dashboard', icon: <DashboardIcon /> },
    { label: 'Daftar Inventaris', page: 'inventory', icon: <ReportsIcon /> },
    { label: 'Laporan', page: 'reports', icon: <ReportsIcon /> },
  ];

  const isActive = (page: Page) => currentPage === page;

  // Close dropdown on page change or when pressing Escape
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [currentPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    };
    const onScroll = () => setIsUserMenuOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className={`bg-blue-600 text-white shadow-lg sticky top-0 z-40 ${className}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left: Title */}
          <h1 className="text-2xl font-bold text-white">
            {title}
          </h1>

          {/* Right: Navigation and User Menu */}
          <div className="flex items-center gap-6">
            {/* Navigation Buttons - Hidden on mobile, shown on desktop */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => setCurrentPage(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isActive(item.page)
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-white hover:bg-blue-500'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-blue-500 transition-colors"
                aria-label="User menu"
              >
                <img 
                  className="h-8 w-8 rounded-full ring-2 ring-white/30" 
                  src="https://i.pravatar.cc/150?u=a042581f4e29026704d" 
                  alt="User" 
                />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="font-semibold text-sm text-gray-900">{currentUser?.username || 'User'}</p>
                    <p className="text-xs text-gray-600 capitalize">{currentUser?.role || 'Role'}</p>
                    {(currentUser?.role === 'editor' || currentUser?.role === 'viewer') && currentUser.allowedUnits && currentUser.allowedUnits.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Akses Unit:</p>
                        <div className="flex flex-wrap gap-1">
                          {currentUser.allowedUnits.map((unit, idx) => (
                            <span key={idx} className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                              currentUser.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {unit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Navigation in Dropdown */}
                  <nav className="md:hidden border-b border-gray-200 py-2">
                    {navItems.map((item) => (
                      <button
                        key={item.page}
                        onClick={() => {
                          setCurrentPage(item.page);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${
                          isActive(item.page)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </nav>

                  {/* Settings Option - Available for all roles */}
                  <button 
                    onClick={() => {
                      setCurrentPage('settings');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200"
                  >
                    <SettingsIcon />
                    <span>Pengaturan</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      showConfirm(
                        'Konfirmasi Logout',
                        'Apakah Anda yakin ingin keluar dari aplikasi? Anda perlu login kembali untuk mengakses sistem.',
                        () => {
                          onLogout?.();
                          closeConfirm();
                        }
                      );
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg m-2 transition-colors"
                  >
                    <LogoutIcon />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsUserMenuOpen(false)}
          aria-hidden="true"
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
          type="warning"
        />
      )}
    </header>
  );
};

export default Header;