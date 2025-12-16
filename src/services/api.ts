/**
 * API Service untuk koneksi ke Google Apps Script backend
 */

const API_URL = (import.meta.env.DEV && import.meta.env.VITE_USE_DEV_PROXY === 'true')
  ? '/gas'
  : (import.meta.env.VITE_API_URL || '');

async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (e) {
    const text = await response.text().catch(() => '');
    const snippet = (text || '').slice(0, 200);
    const err = new Error(
      response.ok
        ? `Non-JSON response from server: ${snippet}`
        : `HTTP ${response.status}: ${snippet}`
    );
    // Attach raw for downstream checks
    (err as any).raw = text;
    throw err;
  }
}

async function postPlain(payload: any): Promise<any> {
  if (!API_URL) {
    throw new Error(apiNotConfigured().error);
  }
  const response = await fetch(API_URL, {
    method: 'POST',
    // Use text/plain to avoid CORS preflight with Apps Script
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
  return parseJsonSafe(response);
}

function apiNotConfigured(): { success: false; error: string } {
  return {
    success: false as const,
    error:
      'API belum dikonfigurasi. Set VITE_API_URL di file .env ke URL Web App Google Apps Script Anda.',
  };
}

function normalizeNetworkError(error: any, fallback: string): { success: false; error: string } {
  const msg = String(error?.message || error || '');
  const raw: string = String((error as any)?.raw || '');
  // Common Apps Script auth page markers when access is not public
  if (raw.includes('Authorization is required') || raw.includes('Login Required')) {
    return {
      success: false,
      error:
        'Web App membutuhkan login. Pastikan deployment diset: Execute as: Me, Who has access: Anyone (anonymous). Lalu gunakan URL itu di .env VITE_API_URL.',
    };
  }
  // Network layer/type error
  if (msg.includes('Failed to fetch') || msg.toLowerCase().includes('network')) {
    return { success: false, error: 'Gagal terhubung ke server. Periksa koneksi internet atau URL API.' };
  }
  return { success: false, error: fallback };
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    username: string;
    role: string;
    email: string;
    allowedUnits?: string[];
  };
  error?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Asset {
  id: string;
  [key: string]: any;
}

/**
 * Get stored token from localStorage
 */
function getToken(): string | null {
  return localStorage.getItem('sidak_token');
}

/**
 * Save token to localStorage
 */
function saveToken(token: string): void {
  localStorage.setItem('sidak_token', token);
}

/**
 * Remove token from localStorage
 */
export function clearToken(): void {
  localStorage.removeItem('sidak_token');
  localStorage.removeItem('sidak_user');
}

/**
 * Login user
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    if (!API_URL) {
      return { success: false, error: apiNotConfigured().error };
    }
    const data = await postPlain({ action: 'login', username, password });

    if (data.success && data.token) {
      saveToken(data.token);
      if (data.user) {
        localStorage.setItem('sidak_user', JSON.stringify(data.user));
      }
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    return normalizeNetworkError(error, 'Login gagal. Coba lagi nanti.');
  }
}

/**
 * Check if user is authenticated
 */
export async function checkAuth(): Promise<boolean> {
  const token = getToken();

  if (!token) {
    return false;
  }

  try {
    if (!API_URL) return false;
    // Prefer POST to avoid relying on query via proxy
    const data = await postPlain({ action: 'checkAuth', token });

    if (!data.success) {
      clearToken();
      return false;
    }
    // Refresh local user info if provided by backend
    if (data.username) {
      const user = {
        username: data.username as string,
        role: (data.role as string) || (JSON.parse(localStorage.getItem('sidak_user') || '{}').role || ''),
        email: (data.email as string) || (JSON.parse(localStorage.getItem('sidak_user') || '{}').email || ''),
      };
      localStorage.setItem('sidak_user', JSON.stringify(user));
    }
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

/**
 * Get all assets
 */
export async function getAssets(): Promise<ApiResponse<Asset[]>> {
  const token = getToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    if (!API_URL) return apiNotConfigured();
    const data = await postPlain({ action: 'getAssets', token });

    if (data.success) {
      return { success: true, data: data.assets };
    }

    return { success: false, error: data.error };
  } catch (error) {
    console.error('Get assets error:', error);
    return normalizeNetworkError(error, 'Gagal mengambil data aset.');
  }
}

/**
 * Get single asset by ID
 */
export async function getAsset(id: string): Promise<ApiResponse<Asset>> {
  const token = getToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    if (!API_URL) return apiNotConfigured();
    const data = await postPlain({ action: 'getAsset', id, token });

    if (data.success) {
      return { success: true, data: data.asset };
    }

    return { success: false, error: data.error };
  } catch (error) {
    console.error('Get asset error:', error);
    return normalizeNetworkError(error, 'Gagal mengambil data aset.');
  }
}

/**
 * Create new asset
 */
export async function createAsset(asset: Partial<Asset>): Promise<ApiResponse<{ id: string }>> {
  const token = getToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    if (!API_URL) return apiNotConfigured();
    const data = await postPlain({ action: 'createAsset', token, asset });

    if (data.success) {
      return { success: true, data: { id: data.id } };
    }

    return { success: false, error: data.error };
  } catch (error) {
    console.error('Create asset error:', error);
    return normalizeNetworkError(error, 'Gagal menyimpan aset.');
  }
}

/**
 * Update existing asset
 */
export async function updateAsset(id: string, asset: Partial<Asset>): Promise<ApiResponse<void>> {
  const token = getToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    if (!API_URL) return apiNotConfigured();
    const data = await postPlain({ action: 'updateAsset', token, id, asset });

    if (data.success) {
      return { success: true };
    }

    return { success: false, error: data.error };
  } catch (error) {
    console.error('Update asset error:', error);
    return normalizeNetworkError(error, 'Gagal mengupdate aset.');
  }
}

/**
 * Delete asset
 */
export async function deleteAsset(id: string): Promise<ApiResponse<void>> {
  const token = getToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    if (!API_URL) return apiNotConfigured();
    const data = await postPlain({ action: 'deleteAsset', token, id });

    if (data.success) {
      return { success: true };
    }

    return { success: false, error: data.error };
  } catch (error) {
    console.error('Delete asset error:', error);
    return normalizeNetworkError(error, 'Gagal menghapus aset.');
  }
}

/**
 * Notify admin about forgot password request
 */
export async function notifyAdminForgotPassword(payload: { username?: string; contact?: string; message?: string }): Promise<ApiResponse<void>> {
  try {
    if (!API_URL) return apiNotConfigured();
    const data = await postPlain({ action: 'notifyAdminForgotPassword', ...payload });
    if (data.success) return { success: true };
    return { success: false, error: data.error || 'Gagal mengirim notifikasi ke admin' };
  } catch (err) {
    console.error('Notify admin error:', err);
    return normalizeNetworkError(err, 'Gagal mengirim notifikasi ke admin');
  }
}

// ============================================
// MASTER DATA API
// ============================================

interface MasterDataItem {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get master data by type (units, categories, sources)
 */
export async function getMasterData(type: 'units' | 'categories' | 'sources'): Promise<ApiResponse<MasterDataItem[]>> {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Token tidak ditemukan' };
  }

  try {
    const data = await postPlain({
      action: 'getMasterData',
      type,
      token,
    });

    if (data.items) {
      return { success: true, data: data.items };
    }
    return { success: false, error: data.error || 'Gagal mengambil master data' };
  } catch (err) {
    console.error('Get master data error:', err);
    return normalizeNetworkError(err, 'Gagal mengambil master data');
  }
}

/**
 * Create master data item
 */
export async function createMasterDataItem(
  type: 'units' | 'categories' | 'sources',
  item: Partial<MasterDataItem>
): Promise<ApiResponse<{ id: string }>> {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Token tidak ditemukan' };
  }

  try {
    const data = await postPlain({
      action: 'createMasterDataItem',
      type,
      item,
      token,
    });

    if (data.success) {
      return { success: true, data: { id: data.id } };
    }
    return { success: false, error: data.error || 'Gagal membuat item' };
  } catch (err) {
    console.error('Create master data item error:', err);
    return normalizeNetworkError(err, 'Gagal membuat item');
  }
}

/**
 * Update master data item
 */
export async function updateMasterDataItem(
  type: 'units' | 'categories' | 'sources',
  id: string,
  updates: Partial<MasterDataItem>
): Promise<ApiResponse<void>> {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Token tidak ditemukan' };
  }

  try {
    const data = await postPlain({
      action: 'updateMasterDataItem',
      type,
      id,
      updates,
      token,
    });

    if (data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Gagal update item' };
  } catch (err) {
    console.error('Update master data item error:', err);
    return normalizeNetworkError(err, 'Gagal update item');
  }
}

/**
 * Delete master data item
 */
export async function deleteMasterDataItem(
  type: 'units' | 'categories' | 'sources',
  id: string
): Promise<ApiResponse<void>> {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Token tidak ditemukan' };
  }

  try {
    const data = await postPlain({
      action: 'deleteMasterDataItem',
      type,
      id,
      token,
    });

    if (data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Gagal hapus item' };
  } catch (err) {
    console.error('Delete master data item error:', err);
    return normalizeNetworkError(err, 'Gagal hapus item');
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): { username: string; role: string; email: string } | null {
  const userStr = localStorage.getItem('sidak_user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if API is configured
 */
export function isApiConfigured(): boolean {
  return !!API_URL && API_URL.startsWith('https://');
}

// ============================================
// USER MANAGEMENT (Admin Only)
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  createdAt?: string;
}

/**
 * Get all users (admin only)
 */
export async function getUsers(token: string): Promise<{ success: boolean; users?: User[]; error?: string }> {
  try {
    const data = await postPlain({
      action: 'getUsers',
      token,
    });

    if (data.success && data.users) {
      return { success: true, users: data.users };
    }
    return { success: false, error: data.error || 'Gagal mengambil daftar user' };
  } catch (err) {
    console.error('Get users error:', err);
    return normalizeNetworkError(err, 'Gagal mengambil daftar user');
  }
}

/**
 * Create new user (admin only)
 */
export async function createUser(
  token: string,
  userData: { username: string; email: string; password: string; role: string; allowedUnits?: string[] }
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const data = await postPlain({
      action: 'createUser',
      token,
      ...userData,
    });

    if (data.success) {
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error || 'Gagal membuat user' };
  } catch (err) {
    console.error('Create user error:', err);
    return normalizeNetworkError(err, 'Gagal membuat user');
  }
}

/**
 * Update user (admin only)
 */
export async function updateUser(
  token: string,
  userId: string,
  userData: { username?: string; email?: string; password?: string; role?: string; allowedUnits?: string[] }
): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await postPlain({
      action: 'updateUser',
      token,
      userId,
      ...userData,
    });

    if (data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Gagal update user' };
  } catch (err) {
    console.error('Update user error:', err);
    return normalizeNetworkError(err, 'Gagal update user');
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await postPlain({
      action: 'deleteUser',
      token,
      userId,
    });

    if (data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Gagal hapus user' };
  } catch (err) {
    console.error('Delete user error:', err);
    return normalizeNetworkError(err, 'Gagal hapus user');
  }
}

/**
 * Change own password (any authenticated user)
 */
export async function changeOwnPassword(
  token: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await postPlain({
      action: 'changeOwnPassword',
      token,
      oldPassword,
      newPassword,
    });

    if (data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Gagal mengubah password' };
  } catch (err) {
    console.error('Change password error:', err);
    return normalizeNetworkError(err, 'Gagal mengubah password');
  }
}

