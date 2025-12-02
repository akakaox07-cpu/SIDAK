export enum AssetStatus {
  Baik = 'Baik',
  RusakRingan = 'Rusak Ringan',
  RusakBerat = 'Rusak Berat',
}

// Unit is now dynamic - loaded from Master_Units sheet
export type Unit = string;

export interface Asset {
  id: string;
  jenisInventaris: string;
  noKodeBarang: string;
  namaBarang: string;
  
  // Common fields (all asset types)
  unit: Unit;
  keterangan?: string;
  photos?: string[]; // Array of base64 data URLs
  tanggalInput: string; // ISO date string
  kondisi?: string;
  statusTanah?: string;
  
  // Barang (Item) fields
  merkModel?: string;
  noSeriPabrik?: string;
  ukuran?: string;
  bahan?: string;
  tahunPembuatan?: string; // YYYY
  jumlahBarang?: number;
  hargaBeli?: number;
  sumberPerolehan?: string;
  keadaanBarang?: AssetStatus;
  ruangan?: string;
  
  // Tanah (Land) fields
  kodeBarang?: string;
  register?: string;
  luasTanah?: number;
  tahunPerolehan?: number;
  alamat?: string;
  letakAlamat?: string; // Alias for alamat
  hak?: string; // Alias for statusHakTanah
  statusHakTanah?: string;
  sertifikatTanggal?: string; // Alias for tanggalSertifikat
  tanggalSertifikat?: string;
  sertifikatNomor?: string; // Alias for nomorSertifikat
  nomorSertifikat?: string;
  penggunaan?: string;
  asalUsul?: string;
  statusBarang?: string;
  tglBuku?: string;
  noBAST?: string;
  tglBAST?: string;
  idPenerimaan?: string;
  statusAset?: string;
  harga?: number;
  latitude?: string;
  longitude?: string;
  
  // Bangunan (Building) fields
  nup?: string;
  kondisiBangunan?: string; // Alias for kondisi
  bertingkat?: string;
  beton?: string;
  luasBangunan?: number;
  tanggalDokumen?: string;
  dokumenTanggal?: string; // Alias for tanggalDokumen
  nomorDokumen?: string;
  dokumenNomor?: string; // Alias for nomorDokumen
  kodeTanah?: string;
}
