import React, { useMemo } from 'react';
import { Asset } from '@/types';
import { PrintIcon, SettingsIcon } from '@/components/ui';

interface Props { assets: Asset[] }

const ReportPrintTableBangunan: React.FC<Props> = ({ assets }) => {
  const [showTools, setShowTools] = React.useState(true);
  const [signLeft, setSignLeft] = React.useState<{ jabatan: string; nama: string; nip: string }>({ jabatan: '', nama: '', nip: '' });
  const [signRight, setSignRight] = React.useState<{ jabatan: string; nama: string; nip: string }>({ jabatan: '', nama: '', nip: '' });

  const [selectedUnit, setSelectedUnit] = React.useState<string>('Semua Unit');
  const units = React.useMemo(() => {
    const filtered = assets.filter(a => (a.jenisInventaris || '').toLowerCase().includes('bangunan'));
    const uniqueUnits = Array.from(new Set(filtered.map(a => a.unit).filter(Boolean)));
    return ['Semua Unit', ...uniqueUnits];
  }, [assets]);
  const rows = useMemo(() => {
    let filtered = assets.filter(a => (a.jenisInventaris || '').toLowerCase().includes('bangunan'));
    if (selectedUnit !== 'Semua Unit') {
      filtered = filtered.filter(a => a.unit === selectedUnit);
    }
    return filtered;
  }, [assets, selectedUnit]);

  const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const lokasi = 'Babakan';

  return (
    <div className="min-h-screen bg-gray-300 p-8 print:p-0">
      {/* Top-right controls */}
      <div className="fixed top-6 right-6 z-50 print:hidden">
        <div className="flex flex-col items-end">
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border shadow hover:bg-gray-50"
              onClick={() => setShowTools(s => !s)}
            >
              <SettingsIcon />
              <span className="text-sm font-medium">Pengaturan Tanda Tangan</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border shadow bg-white hover:bg-gray-50"
            >
              <PrintIcon />
              <span className="text-sm font-medium">Cetak</span>
            </button>
          </div>
          {showTools && (
            <div className="mt-2 w-[min(92vw,380px)] bg-white border rounded-xl shadow-lg p-3 space-y-3">
              <div className="mb-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Sortir Unit</label>
                <select
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={selectedUnit}
                  onChange={e => setSelectedUnit(e.target.value)}
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-600">Isi jabatan di bawah label, lalu nama dan NIP (opsional).</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700">Kiri (Penanggung Jawab)</div>
                  <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Jabatan" value={signLeft.jabatan} onChange={(e) => setSignLeft(s => ({ ...s, jabatan: e.target.value }))} />
                  <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Nama" value={signLeft.nama} onChange={(e) => setSignLeft(s => ({ ...s, nama: e.target.value }))} />
                  <input className="w-full border rounded px-2 py-1 text-sm" placeholder="NIP (opsional)" value={signLeft.nip} onChange={(e) => setSignLeft(s => ({ ...s, nip: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700">Kanan (Mengetahui)</div>
                  <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Jabatan" value={signRight.jabatan} onChange={(e) => setSignRight(s => ({ ...s, jabatan: e.target.value }))} />
                  <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Nama" value={signRight.nama} onChange={(e) => setSignRight(s => ({ ...s, nama: e.target.value }))} />
                  <input className="w-full border rounded px-2 py-1 text-sm" placeholder="NIP (opsional)" value={signRight.nip} onChange={(e) => setSignRight(s => ({ ...s, nip: e.target.value }))} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* A4 Landscape Page */}
      <div className="mx-auto bg-white w-[297mm] min-h-[210mm] shadow-lg rounded-lg p-8 box-border print:shadow-none print:rounded-none print:p-4">
  <h1 className="text-center text-lg font-semibold mb-1">Laporan Tabel Aset Bangunan</h1>
  <div className="text-center text-sm font-medium mb-1">{rows[0]?.unit || ''}</div>
  <div className="text-center text-xs text-gray-600 mb-4">Dicetak: {tanggalCetak}</div>
        
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-[10px] border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-2 py-2">No</th>
                <th className="border border-gray-400 px-2 py-2">Kode</th>
                <th className="border border-gray-400 px-2 py-2">Register</th>
                <th className="border border-gray-400 px-2 py-2">Nama Bangunan</th>
                <th className="border border-gray-400 px-2 py-2">Kondisi</th>
                <th className="border border-gray-400 px-2 py-2">Bertingkat</th>
                <th className="border border-gray-400 px-2 py-2">Beton</th>
                <th className="border border-gray-400 px-2 py-2">Luas Bangunan (m²)</th>
                <th className="border border-gray-400 px-2 py-2">Alamat</th>
                <th className="border border-gray-400 px-2 py-2">Tahun</th>
                <th className="border border-gray-400 px-2 py-2">Tgl. Dokumen</th>
                <th className="border border-gray-400 px-2 py-2">No. Dokumen</th>
                <th className="border border-gray-400 px-2 py-2">Asal Usul</th>
                <th className="border border-gray-400 px-2 py-2">Harga (Rp)</th>
                <th className="border border-gray-400 px-2 py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, idx) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="border border-gray-400 px-2 py-1 text-center">{idx + 1}</td>
                  <td className="border border-gray-400 px-2 py-1">{a.kodeBarang || a.noKodeBarang || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1">{a.register || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1">{a.namaBarang}</td>
                  <td className="border border-gray-400 px-2 py-1">{a.kondisi || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{a.bertingkat || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{a.beton || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1 text-right">{a.luasBangunan ? a.luasBangunan.toLocaleString('id-ID') : '-'}</td>
                  <td className="border border-gray-400 px-2 py-1">{a.alamat || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{a.tahunPerolehan || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{a.tanggalDokumen || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1">{a.nomorDokumen || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1">{a.asalUsul || '-'}</td>
                  <td className="border border-gray-400 px-2 py-1 text-right">{a.harga ? a.harga.toLocaleString('id-ID') : '-'}</td>
                  <td className="border border-gray-400 px-2 py-1">{a.keterangan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature Section */}
        <table className="w-full text-sm mt-6">
          <tbody>
            <tr>
              <td className="w-1/2 text-center"></td>
              <td className="w-1/2 text-center">{lokasi}, {tanggalCetak}</td>
            </tr>
            <tr className="font-semibold">
              <td className="text-center">Penanggung Jawab</td>
              <td className="text-center">Mengetahui</td>
            </tr>
            <tr>
              <td className="text-center text-gray-700 min-h-[18px]">{signLeft.jabatan || ' '}</td>
              <td className="text-center text-gray-700 min-h-[18px]">{signRight.jabatan || ' '}</td>
            </tr>
            <tr>
              <td className="h-20 print:h-[70px]"></td>
              <td className="h-20 print:h-[70px]"></td>
            </tr>
            <tr>
              <td className="text-center align-top">
                <div className="font-semibold leading-tight">{signLeft.nama || ' '}</div>
              </td>
              <td className="text-center align-top">
                <div className="font-semibold leading-tight">{signRight.nama || ' '}</div>
              </td>
            </tr>
            <tr>
              <td className="text-center"><div className="mx-auto w-2/3 border-b border-black" /></td>
              <td className="text-center"><div className="mx-auto w-2/3 border-b border-black" /></td>
            </tr>
            <tr>
              <td className="text-center align-top">
                {signLeft.nip ? <div className="text-xs text-gray-700 leading-tight mt-1">NIP: {signLeft.nip}</div> : <div className="text-xs">&nbsp;</div>}
              </td>
              <td className="text-center align-top">
                {signRight.nip ? <div className="text-xs text-gray-700 leading-tight mt-1">NIP: {signRight.nip}</div> : <div className="text-xs">&nbsp;</div>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportPrintTableBangunan;
