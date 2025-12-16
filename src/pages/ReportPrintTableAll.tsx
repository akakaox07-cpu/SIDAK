import React, { useMemo } from 'react';
import { Asset } from '@/types';
import { PrintLayout } from '@/components/print';

interface Props { assets: Asset[] }

const ReportPrintTableAll: React.FC<Props> = ({ assets }) => {
  const rows = useMemo(() => {
    return assets.slice().sort((a, b) => {
      const ta = Date.parse(a.tanggalInput || '');
      const tb = Date.parse(b.tanggalInput || '');
      return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
    });
  }, [assets]);

  return (
    <PrintLayout title="Laporan Inventaris (Tabel)">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-2 text-left">No</th>
              <th className="border px-2 py-2 text-left">No. Kode</th>
              <th className="border px-2 py-2 text-left">Nama</th>
              <th className="border px-2 py-2 text-left">Jenis</th>
              <th className="border px-2 py-2 text-left">Unit</th>
              <th className="border px-2 py-2 text-left">Ruangan</th>
              <th className="border px-2 py-2 text-left">Tanggal Input</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, idx) => (
              <tr key={a.id}>
                <td className="border px-2 py-2">{idx + 1}</td>
                <td className="border px-2 py-2">{(a as any).noKodeBarang || (a as any).kodeBarang || (a as any).kodeTanah || ''}</td>
                <td className="border px-2 py-2">{a.namaBarang}</td>
                <td className="border px-2 py-2">{a.jenisInventaris}</td>
                <td className="border px-2 py-2">{a.unit}</td>
                <td className="border px-2 py-2">{a.ruangan || '-'}</td>
                <td className="border px-2 py-2">{a.tanggalInput ? new Date(a.tanggalInput).toLocaleDateString('id-ID') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PrintLayout>
  );
};

export default ReportPrintTableAll;
