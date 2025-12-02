import React from 'react';
import { AssetStatus } from '@/types';

interface ItemFormData {
  code: string;
  brand: string;
  serialNumber: string;
  size: string;
  material: string;
  purchaseYear: string;
  quantity: number;
  purchasePrice: number;
  acquisition: string;
  status: AssetStatus;
  location: string;
}

interface ItemFormProps {
  data: ItemFormData;
  onChange: (data: ItemFormData) => void;
  jenisInventaris: string;
  onJenisChange: (value: string) => void;
  ruanganOptions?: string[];
  brandOptions?: string[];
  currentUnit?: string;
  allAssets?: any[];
}

const statusOptions = [AssetStatus.Baik, AssetStatus.RusakRingan, AssetStatus.RusakBerat];

const STATIC_JENIS_OPTIONS = [
  'Elektronik',
  'Perabot',
  'Kendaraan',
  'Alat Tulis',
  'Alat Kebersihan',
  'Alat Dapur',
  'Alat Kesehatan',
  'Alat Olahraga',
  'Alat Musik',
  'Alat Listrik',
  'Alat Pendingin',
  'Alat Komunikasi',
  'Alat Pengolah Data',
  'Alat Bantu',
  'Lainnya',
];

const STATIC_SUMBER_OPTIONS = [
  'Pembelian',
  'Hibah',
  'Bantuan Pemerintah',
  'Bantuan Swasta',
  'Sumbangan',
  'Wakaf',
  'Dana BOS',
  'Dana Desa',
  'APBD',
  'APBN',
  'Swadaya Masyarakat',
  'Lainnya',
];

const STATIC_BAHAN_OPTIONS = [
  'Kayu',
  'Logam',
  'Besi',
  'Aluminium',
  'Plastik',
  'Kaca',
  'Karet',
  'Kulit',
  'Kain',
  'Kertas',
  'Beton',
  'Keramik',
  'Serat',
  'Campuran',
  'Lainnya',
];

const STATIC_UKURAN_SATUAN = [
  'cm',
  'meter',
  'inch',
  'mm',
  'kg',
  'gram',
  'liter',
  'ml',
  'unit',
  'set',
  'buah',
];

export const ItemForm: React.FC<ItemFormProps> = ({ data, onChange, jenisInventaris, onJenisChange, ruanganOptions = [], brandOptions = [], currentUnit = '', allAssets = [] }) => {
  const updateField = <K extends keyof ItemFormData>(field: K, value: ItemFormData[K]) => {
    onChange({ ...data, [field]: value });
  };

  // Autocomplete for ruangan - filter by current unit
  const [ruanganInput, setRuanganInput] = React.useState(data.location || '');
  const [showRuanganSuggestions, setShowRuanganSuggestions] = React.useState(false);
  
  // Filter ruangan by current unit - ONLY show rooms from backend data
  // NO default fallback for ANY role - if no data exists, no suggestions
  const ruanganByUnit = React.useMemo(() => {
    if (!currentUnit || !allAssets.length) {
      return []; // No suggestions if no data
    }
    
    // Get unique room names from assets with the SAME unit as currentUnit
    const assetsInUnit = allAssets.filter(a => a.unit === currentUnit && a.ruangan);
    const filtered = Array.from(new Set(assetsInUnit.map(a => a.ruangan)));
    
    // Return ONLY backend data, no defaults for any role
    return filtered;
  }, [currentUnit, allAssets]);

  const filteredRuangan = ruanganByUnit.filter(opt => opt && opt.toLowerCase().includes(ruanganInput.toLowerCase()) && opt !== ruanganInput);

  React.useEffect(() => {
    setRuanganInput(data.location || '');
  }, [data.location]);

  // Autocomplete for brand
  const [brandInput, setBrandInput] = React.useState(data.brand || '');
  const [showBrandSuggestions, setShowBrandSuggestions] = React.useState(false);
  const filteredBrand = brandOptions.filter(opt => opt && opt.toLowerCase().includes(brandInput.toLowerCase()) && opt !== brandInput);

  React.useEffect(() => {
    setBrandInput(data.brand || '');
  }, [data.brand]);

  // Ukuran handling: split into value and unit
  const [ukuranValue, setUkuranValue] = React.useState('');
  const [ukuranUnit, setUkuranUnit] = React.useState('cm');

  React.useEffect(() => {
    if (data.size) {
      // Parse existing size like "30 inch" or "4x4 cm"
      const match = data.size.match(/^(.+?)\s*([a-zA-Z]+)$/);
      if (match) {
        setUkuranValue(match[1].trim());
        setUkuranUnit(match[2].trim());
      } else {
        setUkuranValue(data.size);
        setUkuranUnit('cm');
      }
    }
  }, [data.size]);

  const handleUkuranChange = (value: string, unit: string) => {
    setUkuranValue(value);
    setUkuranUnit(unit);
    if (value.trim()) {
      updateField('size', `${value.trim()} ${unit}`);
    } else {
      updateField('size', '');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang</label>
        <input
          type="text"
          value={data.code}
          onChange={(e) => updateField('code', e.target.value)}
          className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="INV-..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
        <select
          value={jenisInventaris}
          onChange={(e) => onJenisChange(e.target.value)}
          className="w-full px-4 py-2.5 pr-12 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          style={{ backgroundPosition: 'right 0.75rem center' }}
        >
          <option value="">Pilih Jenis...</option>
          {STATIC_JENIS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Merk/Brand</label>
        <input
          type="text"
          value={brandInput}
          onChange={e => {
            setBrandInput(e.target.value);
            updateField('brand', e.target.value);
            setShowBrandSuggestions(true);
          }}
          onFocus={() => setShowBrandSuggestions(true)}
          onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 150)}
          className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
        {showBrandSuggestions && filteredBrand.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto mt-1">
            {filteredBrand.map(opt => (
              <li
                key={opt}
                className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                onMouseDown={() => {
                  setBrandInput(opt);
                  updateField('brand', opt);
                  setShowBrandSuggestions(false);
                }}
              >{opt}</li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">No. Seri</label>
        <input
          type="text"
          value={data.serialNumber}
          onChange={(e) => updateField('serialNumber', e.target.value)}
          className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={ukuranValue}
            onChange={(e) => handleUkuranChange(e.target.value, ukuranUnit)}
            className="flex-1 px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            placeholder="Contoh: 30 atau 4x4"
          />
          <select
            value={ukuranUnit}
            onChange={(e) => handleUkuranChange(ukuranValue, e.target.value)}
            className="w-32 px-3 py-2.5 pr-10 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            style={{ backgroundPosition: 'right 0.5rem center' }}
          >
            {STATIC_UKURAN_SATUAN.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bahan</label>
        <select
          value={data.material}
          onChange={(e) => updateField('material', e.target.value)}
          className="w-full px-4 py-2.5 pr-12 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          style={{ backgroundPosition: 'right 0.75rem center' }}
        >
          <option value="">Pilih Bahan...</option>
          {STATIC_BAHAN_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Perolehan</label>
        <input
          type="number"
          value={data.purchaseYear}
          onChange={(e) => updateField('purchaseYear', e.target.value)}
          className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          min="1900"
          max="2099"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
        <input
          type="number"
          value={data.quantity}
          onChange={(e) => updateField('quantity', Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          min={1}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli (Rp)</label>
        <input
          type="number"
          value={data.purchasePrice}
          onChange={(e) => updateField('purchasePrice', Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          min={0}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sumber Perolehan</label>
        <select
          value={data.acquisition}
          onChange={(e) => updateField('acquisition', e.target.value)}
          className="w-full px-4 py-2.5 pr-12 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          style={{ backgroundPosition: 'right 0.75rem center' }}
        >
          <option value="">Pilih Sumber...</option>
          {STATIC_SUMBER_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Keadaan</label>
        <select
          value={data.status}
          onChange={(e) => updateField('status', e.target.value as AssetStatus)}
          className="w-full px-4 py-2.5 pr-12 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          style={{ backgroundPosition: 'right 0.75rem center' }}
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi/Ruangan</label>
        <input
          type="text"
          value={ruanganInput}
          onChange={e => {
            setRuanganInput(e.target.value);
            updateField('location', e.target.value);
            setShowRuanganSuggestions(true);
          }}
          onFocus={() => setShowRuanganSuggestions(true)}
          onBlur={() => setTimeout(() => setShowRuanganSuggestions(false), 150)}
          className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
        {showRuanganSuggestions && filteredRuangan.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto mt-1">
            {filteredRuangan.map(opt => (
              <li
                key={opt}
                className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                onMouseDown={() => {
                  setRuanganInput(opt);
                  updateField('location', opt);
                  setShowRuanganSuggestions(false);
                }}
              >{opt}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

