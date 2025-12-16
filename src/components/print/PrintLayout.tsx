import React, { useState } from 'react';
import { PrintIcon, SettingsIcon } from '@/components/ui';

interface PrintLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Consistent printable container matching AssetPrintPage style.
 * - Gray background with white A4 page
 * - Top-right toolbar with signature settings and print button
 * - Signature section at bottom with two columns
 */
export const PrintLayout: React.FC<PrintLayoutProps> = ({ title, subtitle, children }) => {
  const [showTools, setShowTools] = useState(true);
  const [signLeft, setSignLeft] = useState<{ jabatan: string; nama: string; nip: string }>({ jabatan: '', nama: '', nip: '' });
  const [signRight, setSignRight] = useState<{ jabatan: string; nama: string; nip: string }>({ jabatan: '', nama: '', nip: '' });

  const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const lokasi = 'Babakan';

  return (
    <div className="min-h-screen bg-gray-300 p-8 print:p-0">
      {/* Top-right controls: signature tools + print button */}
      <div className="fixed top-6 right-6 z-50 print:hidden">
        <div className="flex flex-col items-end">
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border shadow hover:bg-gray-50"
              onClick={() => setShowTools(s => !s)}
              aria-expanded={showTools}
            >
              <SettingsIcon />
              <span className="text-sm font-medium">Pengaturan Tanda Tangan</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border shadow bg-white hover:bg-gray-50 text-gray-800"
              title="Cetak (Ctrl+P)"
              aria-label="Cetak"
            >
              <PrintIcon />
              <span className="text-sm font-medium">Cetak</span>
            </button>
          </div>
          {showTools && (
            <div className="mt-2 w-[min(92vw,380px)] bg-white border rounded-xl shadow-lg p-3 space-y-3">
              <div className="text-xs text-gray-600">Isi jabatan di bawah label, lalu nama dan NIP (opsional). Perubahan terlihat langsung pada halaman A4.</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700">Kiri (Penanggung Jawab)</div>
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Jabatan"
                    value={signLeft.jabatan}
                    onChange={(e) => setSignLeft(s => ({ ...s, jabatan: e.target.value }))}
                  />
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Nama"
                    value={signLeft.nama}
                    onChange={(e) => setSignLeft(s => ({ ...s, nama: e.target.value }))}
                  />
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="NIP (opsional)"
                    value={signLeft.nip}
                    onChange={(e) => setSignLeft(s => ({ ...s, nip: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700">Kanan (Mengetahui)</div>
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Jabatan"
                    value={signRight.jabatan}
                    onChange={(e) => setSignRight(s => ({ ...s, jabatan: e.target.value }))}
                  />
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Nama"
                    value={signRight.nama}
                    onChange={(e) => setSignRight(s => ({ ...s, nama: e.target.value }))}
                  />
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="NIP (opsional)"
                    value={signRight.nip}
                    onChange={(e) => setSignRight(s => ({ ...s, nip: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* A4 Page */}
      <div className="mx-auto bg-white w-[210mm] min-h-[297mm] shadow-lg rounded-lg p-12 box-border print:shadow-none print:rounded-none print:p-6">
        {/* Header */}
        <h1 className="text-center text-xl font-semibold mb-4 print:mb-2">{title}</h1>
        {subtitle && <div className="text-center text-sm text-gray-600 mb-2">{subtitle}</div>}
        <div className="text-center text-xs text-gray-600 mb-6 print:mb-3">Dicetak: {tanggalCetak}</div>
        
        {/* Content */}
        <div className="mb-8">
          {children}
        </div>

        {/* Signature Section */}
        <table className="w-full text-sm mt-8 print:mt-4">
          <tbody>
            <tr>
              <td className="w-1/2 text-center"></td>
              <td className="w-1/2 text-center">{lokasi}, {tanggalCetak}</td>
            </tr>
            <tr className="font-semibold">
              <td className="text-center">Penanggung Jawab</td>
              <td className="text-center">Mengetahui</td>
            </tr>
            {/* Jabatan tepat di bawah label */}
            <tr>
              <td className="text-center text-gray-700 min-h-[18px]">{signLeft.jabatan || ' '}</td>
              <td className="text-center text-gray-700 min-h-[18px]">{signRight.jabatan || ' '}</td>
            </tr>
            {/* Area tanda tangan (spacer) */}
            <tr>
              <td className="h-[100px] print:h-[90px]"></td>
              <td className="h-[100px] print:h-[90px]"></td>
            </tr>
            {/* Nama lalu garis, kemudian NIP */}
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
                {signLeft.nip ? (
                  <div className="text-xs text-gray-700 leading-tight mt-1">NIP: {signLeft.nip}</div>
                ) : <div className="text-xs leading-tight">&nbsp;</div>}
              </td>
              <td className="text-center align-top">
                {signRight.nip ? (
                  <div className="text-xs text-gray-700 leading-tight mt-1">NIP: {signRight.nip}</div>
                ) : <div className="text-xs leading-tight">&nbsp;</div>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintLayout;
