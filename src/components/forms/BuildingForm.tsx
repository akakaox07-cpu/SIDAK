import React, { Component } from 'react';
import { MapPicker } from '@/components/ui';

interface BuildingFormData {
  kodeBarang: string;
  register: string;
  kondisiBangunan: string;
  bertingkat: string;
  beton: string;
  luasBangunan: number;
  letakAlamat: string;
  tahunPerolehan: string;
  dokumenTanggal: string;
  dokumenNomor: string;
  luasTanah: number;
  statusTanah: string;
  kodeTanah: string;
  asalUsul: string;
  harga: number;
  latitude: string;
  longitude: string;
}

interface BuildingFormProps {
  data: BuildingFormData;
  onChange: (data: BuildingFormData) => void;
}

// Helper input components
const TextField = ({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const NumberField = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
  min?: number; 
  max?: number;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const DateField = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// Error boundary for MapPicker
type MapBoundaryProps = { children: React.ReactNode };
type MapBoundaryState = { hasError: boolean };

class MapErrorBoundary extends Component<MapBoundaryProps, MapBoundaryState> {
  public props!: MapBoundaryProps;
  public state!: MapBoundaryState;
  
  constructor(props: MapBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }
  
  componentDidCatch(error: any) { 
    console.error('Map component error:', error); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-lg border bg-amber-50 text-amber-800 text-sm">
          Peta tidak dapat dimuat. Anda tetap bisa mengisi koordinat secara manual di bawah.
        </div>
      );
    }
    return this.props.children as any;
  }
}

export const BuildingForm: React.FC<BuildingFormProps> = ({ data, onChange }) => {
  const updateField = <K extends keyof BuildingFormData>(field: K, value: BuildingFormData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField 
        label="Kode Barang" 
        value={data.kodeBarang} 
        onChange={(v) => updateField('kodeBarang', v)} 
      />
      <TextField 
        label="Register" 
        value={data.register} 
        onChange={(v) => updateField('register', v)} 
      />
      <TextField 
        label="Kondisi Bangunan" 
        value={data.kondisiBangunan} 
        onChange={(v) => updateField('kondisiBangunan', v)} 
      />
      <TextField 
        label="Bertingkat" 
        value={data.bertingkat} 
        onChange={(v) => updateField('bertingkat', v)} 
        placeholder="Ya/Tidak / jumlah lantai" 
      />
      <TextField 
        label="Beton" 
        value={data.beton} 
        onChange={(v) => updateField('beton', v)} 
        placeholder="Ya/Tidak / bahan utama" 
      />
      <NumberField 
        label="Luas Bangunan (m²)" 
        value={data.luasBangunan} 
        onChange={(v) => updateField('luasBangunan', v)} 
        min={0} 
      />
      <TextField 
        label="Letak/Alamat" 
        value={data.letakAlamat} 
        onChange={(v) => updateField('letakAlamat', v)} 
      />
      <TextField 
        label="Tahun Perolehan" 
        value={data.tahunPerolehan} 
        onChange={(v) => updateField('tahunPerolehan', v)} 
        placeholder="YYYY" 
      />
      <DateField 
        label="Tanggal Dokumen" 
        value={data.dokumenTanggal} 
        onChange={(v) => updateField('dokumenTanggal', v)} 
      />
      <TextField 
        label="Nomor Dokumen" 
        value={data.dokumenNomor} 
        onChange={(v) => updateField('dokumenNomor', v)} 
      />
      <NumberField 
        label="Luas Tanah (m²)" 
        value={data.luasTanah} 
        onChange={(v) => updateField('luasTanah', v)} 
        min={0} 
      />
      <TextField 
        label="Status Tanah" 
        value={data.statusTanah} 
        onChange={(v) => updateField('statusTanah', v)} 
      />
      <TextField 
        label="Kode Tanah" 
        value={data.kodeTanah} 
        onChange={(v) => updateField('kodeTanah', v)} 
      />
      <TextField 
        label="Asal Usul" 
        value={data.asalUsul} 
        onChange={(v) => updateField('asalUsul', v)} 
      />
      <NumberField 
        label="Harga (Rp)" 
        value={data.harga} 
        onChange={(v) => updateField('harga', v)} 
        min={0} 
      />
      
      {/* Map Picker for Location */}
      <div className="md:col-span-2">
        <MapErrorBoundary>
          <MapPicker
            latitude={data.latitude}
            longitude={data.longitude}
            onLocationChange={(lat, lng) => {
              onChange({ ...data, latitude: lat, longitude: lng });
            }}
          />
        </MapErrorBoundary>
      </div>
    </div>
  );
};
