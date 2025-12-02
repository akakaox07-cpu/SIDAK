import React, { useMemo, useState } from 'react';
import { Asset } from '@/types';
// PDF generation removed in favor of native print pages

interface ReportPageProps {
  assets: Asset[];
  isLoading?: boolean;
  dynamicUnits?: string[];
}

type JenisFilter = 'all' | 'barang' | 'tanah' | 'bangunan';

const ReportPage: React.FC<ReportPageProps> = ({ assets, isLoading, dynamicUnits = [] }) => {
  const [search, setSearch] = useState('');
  const [jenis, setJenis] = useState<JenisFilter>('all');
  const [unit, setUnit] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return assets.filter(a => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || [a.noKodeBarang, a.namaBarang, a.unit, a.jenisInventaris, a.ruangan || '', a.sumberPerolehan || '']
        .join(' ') 
        .toLowerCase()
        .includes(q);

      const jenisLower = (a.jenisInventaris || '').toLowerCase();
      const matchesJenis = jenis === 'all' ||
        (jenis === 'barang' && !(jenisLower.includes('tanah') || jenisLower.includes('bangunan')))
        || (jenis === 'tanah' && jenisLower.includes('tanah'))
        || (jenis === 'bangunan' && jenisLower.includes('bangunan'));

      const matchesUnit = unit === 'all' || a.unit === unit;

      const t = a.tanggalInput ? new Date(a.tanggalInput) : null;
      const matchesDateFrom = !dateFrom || (t && t >= new Date(dateFrom));
      const matchesDateTo = !dateTo || (t && t <= new Date(dateTo + 'T23:59:59'));

      return matchesSearch && matchesJenis && matchesUnit && matchesDateFrom && matchesDateTo;
    });
  }, [assets, search, jenis, unit, dateFrom, dateTo]);

  const allSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getExportData = () => {
    const map = new Map(assets.map(a => [a.id, a] as const));
    const chosen = selected.size > 0 ? Array.from(selected).map(id => map.get(id)!).filter(Boolean) : filtered;
    return chosen;
  };

  const openPrint = (type: 'tableAll' | 'detailAll' | 'tableBarang' | 'tableTanah' | 'tableBangunan' | 'kir', ids?: string[]) => {
    const url = new URL(window.location.href);
    url.searchParams.set('printReport', type);
    if (ids && ids.length > 0) url.searchParams.set('ids', ids.join(',')); else url.searchParams.delete('ids');
    window.open(url.toString(), '_blank');
  };

  const exportCsv = () => {
    const data = getExportData();
    if (data.length === 0) return alert('Tidak ada data untuk diekspor');
    const header = [
      'id','noKodeBarang','namaBarang','jenisInventaris','sumberPerolehan','keadaanBarang','unit','ruangan','tahunPembuatan','jumlahBarang','hargaBeli','tanggalInput',
      // Land-specific fields
      'statusTanah','statusBarang','tglBuku','noBAST','tglBAST','idPenerimaan','statusAset','keterangan'
    ];
    const rows = data.map(a => [
      a.id,
      (a as any).noKodeBarang || (a as any).kodeBarang || (a as any).kodeTanah || '',
      a.namaBarang,
      a.jenisInventaris,
      (a as any).sumberPerolehan || (a as any).asalUsul || '',
      (a as any).keadaanBarang || (a as any).kondisi || '',
      a.unit,
      a.ruangan || '',
      a.tahunPembuatan || '',
      a.jumlahBarang ?? '',
      a.hargaBeli ?? '',
      a.tanggalInput,
      // Land-specific values
      (a as any).statusTanah || '',
      (a as any).statusBarang || '',
      (a as any).tglBuku || '',
      (a as any).noBAST || '',
      (a as any).tglBAST || '',
      (a as any).idPenerimaan || '',
      (a as any).statusAset || '',
      a.keterangan || '',
    ]);

    const csv = [header, ...rows].map(r => r.map(x => {
      const s = String(x ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Laporan_Inventaris.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintTableAll = () => {
    const chosen = getExportData();
    if (chosen.length === 0) return alert('Tidak ada data untuk dicetak');
    openPrint('tableAll', chosen.map(a => a.id));
  };

  const handlePrintDetailAll = () => {
    const chosen = getExportData();
    if (chosen.length === 0) return alert('Tidak ada data untuk dicetak');
    openPrint('detailAll', chosen.map(a => a.id));
  };

  const handlePrintTableBarang = () => {
    const chosen = getExportData().filter(a => {
      const jenis = (a.jenisInventaris || '').toLowerCase();
      return !(jenis.includes('tanah') || jenis.includes('bangunan'));
    });
    if (chosen.length === 0) return alert('Tidak ada data Barang untuk dicetak');
    openPrint('tableBarang', chosen.map(a => a.id));
  };

  const handlePrintTableTanah = () => {
    const chosen = getExportData().filter(a => (a.jenisInventaris || '').toLowerCase().includes('tanah'));
    if (chosen.length === 0) return alert('Tidak ada data Tanah untuk dicetak');
    openPrint('tableTanah', chosen.map(a => a.id));
  };

  const handlePrintTableBangunan = () => {
    const chosen = getExportData().filter(a => (a.jenisInventaris || '').toLowerCase().includes('bangunan'));
    if (chosen.length === 0) return alert('Tidak ada data Bangunan untuk dicetak');
    openPrint('tableBangunan', chosen.map(a => a.id));
  };

  const handlePrintKIR = () => {
    const chosen = getExportData().filter(a => {
      const jenis = (a.jenisInventaris || '').toLowerCase();
      return !(jenis.includes('tanah') || jenis.includes('bangunan'));
    });
    if (chosen.length === 0) return alert('Tidak ada data Barang untuk dicetak KIR');
    openPrint('kir', chosen.map(a => a.id));
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Laporan Inventaris</h2>
          <p className="text-sm text-gray-500">Filter data kemudian ekspor ke PDF (ringkas / detail) atau CSV.</p>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Pencarian</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full px-4 py-2.5 border rounded-md" placeholder="Cari nama, kode, ruangan..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Jenis</label>
            <select value={jenis} onChange={e=>setJenis(e.target.value as JenisFilter)} className="w-full px-4 py-2.5 border rounded-md">
              <option value="all">Semua</option>
              <option value="barang">Barang</option>
              <option value="tanah">Tanah</option>
              <option value="bangunan">Bangunan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
            <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full px-4 py-2.5 border rounded-md">
              <option value="all">Semua</option>
              {dynamicUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dari Tanggal</label>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="w-full px-3 py-2.5 border rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sampai</label>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="w-full px-3 py-2.5 border rounded-md" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 sm:px-6 pb-4 flex flex-wrap gap-2">
          <button onClick={handlePrintTableAll} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Cetak Tabel (Semua)</button>
          <button onClick={handlePrintDetailAll} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md">Cetak Detail (Per Aset)</button>
          <button onClick={handlePrintTableBarang} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md">Cetak Tabel Barang</button>
          <button onClick={handlePrintKIR} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">Cetak KIR Barang</button>
          <button onClick={handlePrintTableTanah} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md">Cetak Tabel Tanah</button>
          <button onClick={handlePrintTableBangunan} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md">Cetak Tabel Bangunan</button>
          <button onClick={exportCsv} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Export CSV</button>
        </div>

        {/* Table */}
        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">No. Kode</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Nama</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Jenis</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Unit</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Ruangan</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Tanggal Input</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">Tidak ada data</td></tr>
                ) : (
                  filtered.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2"><input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleOne(a.id)} /></td>
                      <td className="px-3 py-2 text-sm">{(a as any).noKodeBarang || (a as any).kodeBarang || (a as any).kodeTanah || ''}</td>
                      <td className="px-3 py-2 text-sm">{a.namaBarang}</td>
                      <td className="px-3 py-2 text-sm">{a.jenisInventaris}</td>
                      <td className="px-3 py-2 text-sm">{a.unit}</td>
                      <td className="px-3 py-2 text-sm">{a.ruangan || '-'}</td>
                      <td className="px-3 py-2 text-sm">{a.tanggalInput ? new Date(a.tanggalInput).toLocaleDateString('id-ID') : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
