import React, { useState } from 'react';
import { Asset } from '@/types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  filteredAssets: Asset[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void | Promise<void>;
  onViewDetail: (asset: Asset) => void;
  onAddAsset: (formType?: 'item' | 'building' | 'land') => void;
  allAssets: Asset[];
  currentUserRole?: string | null;
  currentUser?: { username: string; role: string; allowedUnits?: string[]; email?: string } | null;
}

const MAX_ROWS = 200; // safety cap per section to avoid UI lag with huge datasets

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc' | null;
};

const AssetListPage: React.FC<Props> = ({
  filteredAssets,
  searchTerm,
  setSearchTerm,
  onEditAsset,
  onDeleteAsset,
  onViewDetail,
  onAddAsset,
  currentUser,
}) => {
  // Row limits to prevent rendering thousands of rows at once (causes lag/crash on low devices)
  const [showAllBarang, setShowAllBarang] = useState(false);
  const [showAllTanah, setShowAllTanah] = useState(false);
  const [showAllBangunan, setShowAllBangunan] = useState(false);
  
  // Sorting states for each table
  const [sortBarang, setSortBarang] = useState<SortConfig>({ key: '', direction: null });
  const [sortTanah, setSortTanah] = useState<SortConfig>({ key: '', direction: null });
  const [sortBangunan, setSortBangunan] = useState<SortConfig>({ key: '', direction: null });
  
  // Pisahkan assets berdasarkan jenis
  const barangAssets = filteredAssets.filter(a => {
    const jenis = (a.jenisInventaris || '').toLowerCase();
    return !(jenis.includes('tanah') || jenis.includes('bangunan'));
  });

  const tanahAssets = filteredAssets.filter(a => 
    (a.jenisInventaris || '').toLowerCase().includes('tanah')
  );

  const bangunanAssets = filteredAssets.filter(a => 
    (a.jenisInventaris || '').toLowerCase().includes('bangunan')
  );

  // Sorting functions
  const handleSort = (key: string, type: 'barang' | 'tanah' | 'bangunan') => {
    const currentSort = type === 'barang' ? sortBarang : type === 'tanah' ? sortTanah : sortBangunan;
    const setSortFunc = type === 'barang' ? setSortBarang : type === 'tanah' ? setSortTanah : setSortBangunan;
    
    let newDirection: 'asc' | 'desc' | null = 'asc';
    if (currentSort.key === key) {
      if (currentSort.direction === 'asc') newDirection = 'desc';
      else if (currentSort.direction === 'desc') newDirection = null;
    }
    setSortFunc({ key, direction: newDirection });
  };

  const sortAssets = (assets: Asset[], sortConfig: SortConfig) => {
    if (!sortConfig.direction) return assets;
    
    return [...assets].sort((a, b) => {
      const aVal = String((a as any)[sortConfig.key] || '').toLowerCase();
      const bVal = String((b as any)[sortConfig.key] || '').toLowerCase();
      
      const comparison = aVal.localeCompare(bVal, 'id', { numeric: true });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  const SortIcon: React.FC<{ active: boolean; direction: 'asc' | 'desc' | null }> = ({ active, direction }) => {
    if (!active || direction === null) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  // Apply sorting
  const sortedBarangAssets = sortAssets(barangAssets, sortBarang);
  const sortedTanahAssets = sortAssets(tanahAssets, sortTanah);
  const sortedBangunanAssets = sortAssets(bangunanAssets, sortBangunan);

  const renderActions = (a: Asset) => {
    const canEdit = currentUser?.role === 'admin' || 
      (currentUser?.role === 'editor' && currentUser.allowedUnits?.includes(a.unit));
    const canDelete = currentUser?.role === 'admin';
    
    return (
      <div className="flex gap-2 justify-end">
        <button onClick={() => onViewDetail(a)} className="px-2 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50">Detail</button>
        {canEdit && (
          <button onClick={() => onEditAsset(a)} className="px-2 py-1 text-xs rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50">Edit</button>
        )}
        {canDelete && (
          <button onClick={() => onDeleteAsset(a.id)} className="px-2 py-1 text-xs rounded-md border border-red-300 text-red-700 hover:bg-red-50">Hapus</button>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header & Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-blue-600 text-white">
          <div className="text-sm font-semibold">Daftar Inventaris</div>
        </div>

        <div className="p-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama barang, tanah, atau bangunan..."
            className="w-full sm:w-80 px-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Section Barang */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 bg-emerald-600 text-white flex items-center justify-between">
          <h2 className="text-sm font-semibold">Inventaris Barang</h2>
          <div className="flex items-center gap-2">
            {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
              <button
                onClick={() => onAddAsset('item')}
                className="px-3 py-1 text-xs rounded-md bg-white/20 hover:bg-white/30 font-medium"
              >+ Tambah Barang</button>
            )}
            <span className="text-xs bg-white/20 px-2 py-1 rounded">{barangAssets.length} item</span>
            {barangAssets.length > MAX_ROWS && (
              <button
                type="button"
                onClick={() => setShowAllBarang(v => !v)}
                className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                {showAllBarang ? 'Tampilkan sedikit' : `Tampilkan semua (${barangAssets.length})`}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('noKodeBarang', 'barang')}>
                  <div className="flex items-center gap-1">
                    <span>No. Kode</span>
                    <SortIcon active={sortBarang.key === 'noKodeBarang'} direction={sortBarang.key === 'noKodeBarang' ? sortBarang.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('namaBarang', 'barang')}>
                  <div className="flex items-center gap-1">
                    <span>Nama Barang</span>
                    <SortIcon active={sortBarang.key === 'namaBarang'} direction={sortBarang.key === 'namaBarang' ? sortBarang.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('merkModel', 'barang')}>
                  <div className="flex items-center gap-1">
                    <span>Merk/Model</span>
                    <SortIcon active={sortBarang.key === 'merkModel'} direction={sortBarang.key === 'merkModel' ? sortBarang.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('tahunPembuatan', 'barang')}>
                  <div className="flex items-center gap-1">
                    <span>Tahun</span>
                    <SortIcon active={sortBarang.key === 'tahunPembuatan'} direction={sortBarang.key === 'tahunPembuatan' ? sortBarang.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('jumlahBarang', 'barang')}>
                  <div className="flex items-center gap-1">
                    <span>Jumlah</span>
                    <SortIcon active={sortBarang.key === 'jumlahBarang'} direction={sortBarang.key === 'jumlahBarang' ? sortBarang.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('keadaanBarang', 'barang')}>
                  <div className="flex items-center gap-1">
                    <span>Keadaan</span>
                    <SortIcon active={sortBarang.key === 'keadaanBarang'} direction={sortBarang.key === 'keadaanBarang' ? sortBarang.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('unit', 'barang')}>
                  <div className="flex items-center gap-1">
                    <span>Unit</span>
                    <SortIcon active={sortBarang.key === 'unit'} direction={sortBarang.key === 'unit' ? sortBarang.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('ruangan', 'barang')}>
                  <div className="flex items-center gap-1">
                    <span>Ruangan</span>
                    <SortIcon active={sortBarang.key === 'ruangan'} direction={sortBarang.key === 'ruangan' ? sortBarang.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(showAllBarang ? sortedBarangAssets : sortedBarangAssets.slice(0, MAX_ROWS)).map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{a.noKodeBarang || '-'}</td>
                  <td className="px-4 py-2">{a.namaBarang}</td>
                  <td className="px-4 py-2">{a.merkModel || '-'}</td>
                  <td className="px-4 py-2">{a.tahunPembuatan || '-'}</td>
                  <td className="px-4 py-2">{a.jumlahBarang ?? '-'}</td>
                  <td className="px-4 py-2">{a.keadaanBarang || '-'}</td>
                  <td className="px-4 py-2">{a.unit}</td>
                  <td className="px-4 py-2">{a.ruangan || '-'}</td>
                  <td className="px-4 py-2 text-right">{renderActions(a)}</td>
                </tr>
              ))}
              {barangAssets.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-500">Tidak ada data barang</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Tanah */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 bg-amber-600 text-white flex items-center justify-between">
          <h2 className="text-sm font-semibold">Inventaris Tanah</h2>
          <div className="flex items-center gap-2">
            {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
              <button
                onClick={() => onAddAsset('land')}
                className="px-3 py-1 text-xs rounded-md bg-white/20 hover:bg-white/30 font-medium"
              >+ Tambah Tanah</button>
            )}
            <span className="text-xs bg-white/20 px-2 py-1 rounded">{tanahAssets.length} item</span>
            {tanahAssets.length > MAX_ROWS && (
              <button
                type="button"
                onClick={() => setShowAllTanah(v => !v)}
                className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                {showAllTanah ? 'Tampilkan sedikit' : `Tampilkan semua (${tanahAssets.length})`}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('kodeBarang', 'tanah')}>
                  <div className="flex items-center gap-1">
                    <span>Kode</span>
                    <SortIcon active={sortTanah.key === 'kodeBarang'} direction={sortTanah.key === 'kodeBarang' ? sortTanah.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('namaBarang', 'tanah')}>
                  <div className="flex items-center gap-1">
                    <span>Nama</span>
                    <SortIcon active={sortTanah.key === 'namaBarang'} direction={sortTanah.key === 'namaBarang' ? sortTanah.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('alamat', 'tanah')}>
                  <div className="flex items-center gap-1">
                    <span>Alamat</span>
                    <SortIcon active={sortTanah.key === 'alamat'} direction={sortTanah.key === 'alamat' ? sortTanah.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('luasTanah', 'tanah')}>
                  <div className="flex items-center gap-1">
                    <span>Luas (m²)</span>
                    <SortIcon active={sortTanah.key === 'luasTanah'} direction={sortTanah.key === 'luasTanah' ? sortTanah.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('tahunPerolehan', 'tanah')}>
                  <div className="flex items-center gap-1">
                    <span>Tahun Perolehan</span>
                    <SortIcon active={sortTanah.key === 'tahunPerolehan'} direction={sortTanah.key === 'tahunPerolehan' ? sortTanah.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('statusHakTanah', 'tanah')}>
                  <div className="flex items-center gap-1">
                    <span>Status Hak</span>
                    <SortIcon active={sortTanah.key === 'statusHakTanah'} direction={sortTanah.key === 'statusHakTanah' ? sortTanah.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('unit', 'tanah')}>
                  <div className="flex items-center gap-1">
                    <span>Unit</span>
                    <SortIcon active={sortTanah.key === 'unit'} direction={sortTanah.key === 'unit' ? sortTanah.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(showAllTanah ? sortedTanahAssets : sortedTanahAssets.slice(0, MAX_ROWS)).map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{a.kodeBarang || a.noKodeBarang || '-'}</td>
                  <td className="px-4 py-2">{a.namaBarang}</td>
                  <td className="px-4 py-2">{a.alamat || '-'}</td>
                  <td className="px-4 py-2">{a.luasTanah ?? '-'}</td>
                  <td className="px-4 py-2">{a.tahunPerolehan ?? '-'}</td>
                  <td className="px-4 py-2">{a.statusHakTanah || '-'}</td>
                  <td className="px-4 py-2">{a.unit}</td>
                  <td className="px-4 py-2 text-right">{renderActions(a)}</td>
                </tr>
              ))}
              {tanahAssets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">Tidak ada data tanah</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Bangunan */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-3 bg-teal-600 text-white flex items-center justify-between">
          <h2 className="text-sm font-semibold">Inventaris Bangunan</h2>
          <div className="flex items-center gap-2">
            {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
              <button
                onClick={() => onAddAsset('building')}
                className="px-3 py-1 text-xs rounded-md bg-white/20 hover:bg-white/30 font-medium"
              >+ Tambah Bangunan</button>
            )}
            <span className="text-xs bg-white/20 px-2 py-1 rounded">{bangunanAssets.length} item</span>
            {bangunanAssets.length > MAX_ROWS && (
              <button
                type="button"
                onClick={() => setShowAllBangunan(v => !v)}
                className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                {showAllBangunan ? 'Tampilkan sedikit' : `Tampilkan semua (${bangunanAssets.length})`}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('kodeBarang', 'bangunan')}>
                  <div className="flex items-center gap-1">
                    <span>Kode</span>
                    <SortIcon active={sortBangunan.key === 'kodeBarang'} direction={sortBangunan.key === 'kodeBarang' ? sortBangunan.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('namaBarang', 'bangunan')}>
                  <div className="flex items-center gap-1">
                    <span>Nama</span>
                    <SortIcon active={sortBangunan.key === 'namaBarang'} direction={sortBangunan.key === 'namaBarang' ? sortBangunan.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('alamat', 'bangunan')}>
                  <div className="flex items-center gap-1">
                    <span>Alamat</span>
                    <SortIcon active={sortBangunan.key === 'alamat'} direction={sortBangunan.key === 'alamat' ? sortBangunan.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('luasBangunan', 'bangunan')}>
                  <div className="flex items-center gap-1">
                    <span>Luas Bangunan (m²)</span>
                    <SortIcon active={sortBangunan.key === 'luasBangunan'} direction={sortBangunan.key === 'luasBangunan' ? sortBangunan.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('kondisi', 'bangunan')}>
                  <div className="flex items-center gap-1">
                    <span>Kondisi</span>
                    <SortIcon active={sortBangunan.key === 'kondisi'} direction={sortBangunan.key === 'kondisi' ? sortBangunan.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('bertingkat', 'bangunan')}>
                  <div className="flex items-center gap-1">
                    <span>Bertingkat</span>
                    <SortIcon active={sortBangunan.key === 'bertingkat'} direction={sortBangunan.key === 'bertingkat' ? sortBangunan.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100 transition-colors select-none" onClick={() => handleSort('unit', 'bangunan')}>
                  <div className="flex items-center gap-1">
                    <span>Unit</span>
                    <SortIcon active={sortBangunan.key === 'unit'} direction={sortBangunan.key === 'unit' ? sortBangunan.direction : null} />
                  </div>
                </th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(showAllBangunan ? sortedBangunanAssets : sortedBangunanAssets.slice(0, MAX_ROWS)).map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{a.kodeBarang || a.noKodeBarang || '-'}</td>
                  <td className="px-4 py-2">{a.namaBarang}</td>
                  <td className="px-4 py-2">{a.alamat || '-'}</td>
                  <td className="px-4 py-2">{a.luasBangunan ?? '-'}</td>
                  <td className="px-4 py-2">{a.kondisi || '-'}</td>
                  <td className="px-4 py-2">{a.bertingkat || '-'}</td>
                  <td className="px-4 py-2">{a.unit}</td>
                  <td className="px-4 py-2 text-right">{renderActions(a)}</td>
                </tr>
              ))}
              {bangunanAssets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">Tidak ada data bangunan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssetListPage;
