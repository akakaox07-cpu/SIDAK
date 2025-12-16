import React, { useState } from 'react';
import { Asset } from '@/types';

interface DuplicateEntry {
  id: string;
  location: string;
  quantity: number;
}

interface Props {
  asset: Asset;
  onDuplicate: (entries: DuplicateEntry[]) => void;
  onCancel: () => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DuplicateAssetModal: React.FC<Props> = ({ asset, onDuplicate, onCancel, onNotify }) => {
  const totalQty = asset.jumlahBarang || 1;
  const [entries, setEntries] = useState<DuplicateEntry[]>([
    { id: '1', location: asset.ruangan || '', quantity: totalQty }
  ]);

  const addEntry = () => {
    setEntries([...entries, { id: Date.now().toString(), location: '', quantity: 1 }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: 'location' | 'quantity', value: string | number) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const totalAllocated = entries.reduce((sum, e) => sum + (Number(e.quantity) || 0), 0);
  const remaining = totalQty - totalAllocated;

  const handleSubmit = () => {
    if (totalAllocated !== totalQty) {
      onNotify?.(`Total jumlah harus sama dengan ${totalQty}. Sisa: ${remaining}`, 'error');
      return;
    }
    if (entries.some(e => !e.location.trim())) {
      onNotify?.('Semua lokasi harus diisi', 'error');
      return;
    }
    onDuplicate(entries);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Bagi Aset ke Beberapa Lokasi</h2>
            <p className="text-sm opacity-90">{asset.namaBarang} - Total: {totalQty} unit</p>
          </div>
          <button onClick={onCancel} className="text-white hover:bg-blue-700 rounded p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Total yang harus dialokasikan:</span>
              <span className="font-bold text-blue-600">{totalQty} unit</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-700">Sudah dialokasikan:</span>
              <span className={`font-bold ${totalAllocated === totalQty ? 'text-green-600' : 'text-orange-600'}`}>
                {totalAllocated} unit
              </span>
            </div>
            {remaining !== 0 && (
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-700">Sisa:</span>
                <span className="font-bold text-red-600">{remaining} unit</span>
              </div>
            )}
          </div>

          {entries.map((entry, index) => (
            <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Lokasi {index + 1}</span>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lokasi/Ruangan</label>
                  <input
                    type="text"
                    value={entry.location}
                    onChange={(e) => updateEntry(entry.id, 'location', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Contoh: Ruang Rapat"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah</label>
                  <input
                    type="number"
                    value={entry.quantity}
                    onChange={(e) => updateEntry(entry.id, 'quantity', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-sm"
                    min={1}
                    max={totalQty}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addEntry}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            + Tambah Lokasi
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={totalAllocated !== totalQty}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Buat {entries.length} Aset
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateAssetModal;
