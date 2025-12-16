import React, { useState, useEffect, useMemo } from 'react';
import PrintableInventoryKIR, { KIRInventoryItem } from '@/components/print/PrintableInventoryKIR';
import { Asset } from '@/types';
import { PrintIcon, SettingsIcon } from '@/components/ui/icons';

interface ReportPrintKIRProps {
  assets: Asset[];
}

const ReportPrintKIR: React.FC<ReportPrintKIRProps> = ({ assets }) => {
  // Extract unique units from assets
  const unitOptions = useMemo(() => {
    const uniqueUnits = [...new Set(assets.map(a => a.unit).filter(Boolean))];
    return uniqueUnits.sort();
  }, [assets]);
  const [leftSigner, setLeftSigner] = useState('');
  const [leftNIP, setLeftNIP] = useState('');
  const [leftJabatan, setLeftJabatan] = useState('');
  
  const [middleSigner, setMiddleSigner] = useState('');
  const [middleNIP, setMiddleNIP] = useState('');
  const [middleJabatan, setMiddleJabatan] = useState('');
  
  const [rightSigner, setRightSigner] = useState('');
  const [rightNIP, setRightNIP] = useState('');
  const [rightJabatan, setRightJabatan] = useState('');
  
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedRuangan, setSelectedRuangan] = useState('Semua Ruangan');
  const [canViewPrice, setCanViewPrice] = useState(true);
  const [priceColumnOption, setPriceColumnOption] = useState<'harga' | 'perolehan'>('harga');

  // Set default unit from unitOptions when available
  useEffect(() => {
    if (unitOptions.length > 0 && !selectedUnit) {
      setSelectedUnit(unitOptions[0]);
    }
  }, [unitOptions, selectedUnit]);

  // Convert assets to KIR format - filter hanya barang inventaris
  const barangAssets = assets.filter(a => {
    const jenis = (a.jenisInventaris || '').toLowerCase();
    return !(jenis.includes('tanah') || jenis.includes('bangunan'));
  });

  // Filter by ruangan if selected
  const filteredAssets = selectedRuangan === 'Semua Ruangan' 
    ? barangAssets 
    : barangAssets.filter(a => a.ruangan === selectedRuangan);

  const kirData: KIRInventoryItem[] = filteredAssets.map(asset => ({
    id: asset.id,
    name: asset.namaBarang,
    brand: asset.merkModel,
    serialNumber: asset.noSeriPabrik,
    size: asset.ukuran,
    material: asset.bahan,
    purchaseYear: asset.tahunPembuatan,
    code: asset.noKodeBarang || asset.kodeBarang || '-',
    quantity: asset.jumlahBarang || 1,
    purchasePrice: asset.hargaBeli,
    acquisition: asset.sumberPerolehan,
    status: asset.keadaanBarang || 'Baik',
  }));

  const signatories = {
    pengurus: {
      name: leftSigner,
      nip: leftNIP,
      jabatan: leftJabatan,
    },
    mengetahui: {
      name: middleSigner,
      nip: middleNIP,
      jabatan: middleJabatan,
    },
    kepala: {
      name: rightSigner,
      nip: rightNIP,
      jabatan: rightJabatan,
    },
  };

  const handlePrint = () => {
    window.print();
  };

  // Get unique ruangan list
  const ruanganList = ['Semua Ruangan', ...new Set(barangAssets.map(a => a.ruangan).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-300 print:p-0 print:bg-white">
      {/* Layout dengan Sidebar Kanan */}
      <div className="flex gap-4 p-4 print:p-0 print:block">
        {/* A4 Print Area - Kiri - Landscape */}
        <div className="flex-1 print:flex-none print:mx-auto">
          <div className="bg-white w-full max-w-[297mm] min-h-[210mm] mx-auto shadow-xl print:shadow-none print:max-w-none p-8">
            <PrintableInventoryKIR
              data={kirData}
              signatories={signatories}
              location={selectedRuangan}
              unitName={selectedUnit}
              canViewPrice={canViewPrice}
              priceColumnOption={priceColumnOption}
            />
          </div>
        </div>
        {/* Settings Sidebar - Kanan - Hidden saat print */}
        <div className="print:hidden w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-lg p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon />
              <h2 className="text-base font-semibold">Pengaturan Cetak KIR</h2>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="w-full mb-4 p-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <PrintIcon />
              <span>Print</span>
            </button>

            {/* Unit & Ruangan */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                >
                  {unitOptions.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ruangan</label>
                <select
                  value={selectedRuangan}
                  onChange={(e) => setSelectedRuangan(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                >
                  {ruanganList.map(ruangan => (
                    <option key={ruangan} value={ruangan}>{ruangan}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Opsi Harga */}
            <div className="border-t pt-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="showPrice"
                  checked={canViewPrice}
                  onChange={(e) => setCanViewPrice(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="showPrice" className="text-xs font-medium text-gray-700">
                  Tampilkan Kolom Harga/Perolehan
                </label>
              </div>
              {canViewPrice && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Kolom</label>
                  <select
                    value={priceColumnOption}
                    onChange={(e) => setPriceColumnOption(e.target.value as 'harga' | 'perolehan')}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="harga">Harga Beli/Perolehan (Rp)</option>
                    <option value="perolehan">Sumber Perolehan (Text)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Penandatangan */}
            <div className="border-t pt-3">
              <h3 className="text-xs font-semibold mb-3">Penandatangan</h3>
              {/* Left Signer */}
              <div className="space-y-2 mb-3">
                <label className="block text-xs font-medium text-gray-600">Pengurus Barang</label>
                <input
                  type="text"
                  value={leftJabatan}
                  onChange={(e) => setLeftJabatan(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="Jabatan"
                />
                <input
                  type="text"
                  value={leftSigner}
                  onChange={(e) => setLeftSigner(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="Nama"
                />
                <input
                  type="text"
                  value={leftNIP}
                  onChange={(e) => setLeftNIP(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="NIP (opsional)"
                />
              </div>
              {/* Middle Signer */}
              <div className="space-y-2 mb-3">
                <label className="block text-xs font-medium text-gray-600">Mengetahui</label>
                <input
                  type="text"
                  value={middleJabatan}
                  onChange={(e) => setMiddleJabatan(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="Jabatan"
                />
                <input
                  type="text"
                  value={middleSigner}
                  onChange={(e) => setMiddleSigner(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="Nama"
                />
                <input
                  type="text"
                  value={middleNIP}
                  onChange={(e) => setMiddleNIP(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="NIP (opsional)"
                />
              </div>
              {/* Right Signer */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">Penanggung Jawab Ruangan</label>
                <input
                  type="text"
                  value={rightJabatan}
                  onChange={(e) => setRightJabatan(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="Jabatan"
                />
                <input
                  type="text"
                  value={rightSigner}
                  onChange={(e) => setRightSigner(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="Nama"
                />
                <input
                  type="text"
                  value={rightNIP}
                  onChange={(e) => setRightNIP(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="NIP (opsional)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPrintKIR;
