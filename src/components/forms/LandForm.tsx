import React, { Component } from 'react';
import { MapPicker } from '@/components/ui';

interface LandFormData {
  kodeBarang: string;
  register: string;
  luas: number;
  tahunPerolehan: number;
  letakAlamat: string;
  hak: string;
  statusTanah: string;
  sertifikatTanggal: string;
  sertifikatNomor: string;
  penggunaan: string;
  asalUsul: string;
  statusBarang: string;
  kondisi: string;
  tglBuku: string;
  noBAST: string;
  tglBAST: string;
  idPenerimaan: string;
  statusAset: string;
  harga: number;
  latitude: string;
  longitude: string;
}

interface LandFormProps {
  data: LandFormData;
  onChange: (data: LandFormData) => void;
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

export const LandForm: React.FC<LandFormProps> = ({ data, onChange }) => {
  const updateField = <K extends keyof LandFormData>(field: K, value: LandFormData[K]) => {
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
      <NumberField 
        label="Luas (m²)" 
        value={data.luas} 
        onChange={(v) => updateField('luas', v)} 
        min={0} 
      />
      <NumberField 
        label="Tahun Perolehan" 
        value={data.tahunPerolehan} 
        onChange={(v) => updateField('tahunPerolehan', v)} 
        min={1900} 
        max={2099} 
      />
      <TextField 
        label="Letak/Alamat" 
        value={data.letakAlamat} 
        onChange={(v) => updateField('letakAlamat', v)} 
      />
      <TextField 
        label="Hak" 
        value={data.hak} 
        onChange={(v) => updateField('hak', v)} 
      />
      <TextField 
        label="Status Tanah" 
        value={data.statusTanah} 
        onChange={(v) => updateField('statusTanah', v)} 
      />
      <DateField 
        label="Tanggal Sertifikat" 
        value={data.sertifikatTanggal} 
        onChange={(v) => updateField('sertifikatTanggal', v)} 
      />
      <TextField 
        label="Nomor Sertifikat" 
        value={data.sertifikatNomor} 
        onChange={(v) => updateField('sertifikatNomor', v)} 
      />
      <TextField 
        label="Penggunaan" 
        value={data.penggunaan} 
        onChange={(v) => updateField('penggunaan', v)} 
      />
      <TextField 
        label="Asal Usul" 
        value={data.asalUsul} 
        onChange={(v) => updateField('asalUsul', v)} 
      />
      <TextField 
        label="Status Barang" 
        value={data.statusBarang} 
        onChange={(v) => updateField('statusBarang', v)} 
      />
      <TextField 
        label="Kondisi" 
        value={data.kondisi} 
        onChange={(v) => updateField('kondisi', v)} 
      />
      <DateField 
        label="Tgl. Buku" 
        value={data.tglBuku} 
        onChange={(v) => updateField('tglBuku', v)} 
      />
      <TextField 
        label="No. BAST" 
        value={data.noBAST} 
        onChange={(v) => updateField('noBAST', v)} 
      />
      <DateField 
        label="Tgl. BAST" 
        value={data.tglBAST} 
        onChange={(v) => updateField('tglBAST', v)} 
      />
      <TextField 
        label="ID Penerimaan" 
        value={data.idPenerimaan} 
        onChange={(v) => updateField('idPenerimaan', v)} 
      />
      <TextField 
        label="Status Aset" 
        value={data.statusAset} 
        onChange={(v) => updateField('statusAset', v)} 
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
