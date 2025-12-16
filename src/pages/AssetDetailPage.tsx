import React, { useEffect, useMemo, useState } from 'react';
import { Asset } from '@/types';
import { MapViewer } from '@/components/ui';
import QRCode from 'qrcode';
import { formatDate } from '@/lib';
import { Maximize2, Minimize2 } from 'lucide-react';

interface Props {
  asset: Asset;
  onBack: () => void;
  onEdit: (asset: Asset) => void;
  canEdit?: boolean;
}

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-3 py-2 border-b last:border-b-0">
    <div className="text-gray-500 text-sm">{label}</div>
    <div className="col-span-2 text-sm">{value ?? '-'}</div>
  </div>
);

const AssetDetailPage: React.FC<Props> = ({ asset, onBack, onEdit, canEdit }) => {
  const [qrInfoUrl, setQrInfoUrl] = useState<string | null>(null);
  const [qrLinkUrl, setQrLinkUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [fillMode, setFillMode] = useState<'cover' | 'contain'>('cover'); // cover = zoom/fill area
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(asset.photos?.[0]);
  const [imageAttemptIdx, setImageAttemptIdx] = useState(0);

  // Compute alternative Google Drive URL variants for resilient loading
  const imageUrlVariants = useMemo(() => {
    const url = asset.photos?.[0] || '';
    const variants: string[] = [];
    if (!url) return variants;
    // Try to extract fileId from common patterns
    let fileId = '';
    try {
      const u = new URL(url, window.location.origin);
      fileId = u.searchParams.get('id') || '';
      if (!fileId) {
        // Try path /d/{id}
        const m = u.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (m) fileId = m[1];
      }
    } catch (_) {
      // Fallback simple parse for id=
      const m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (m) fileId = m[1];
    }
    
    if (fileId) {
      // Thumbnail URLs first (no CORS issues, designed for embedding)
      // Use medium-high resolution for detail view to avoid heavy memory usage
      variants.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`);
      variants.push(`https://lh3.googleusercontent.com/d/${fileId}=w1200`);
      // Direct content URLs (may have CORS in some browsers)
      variants.push(`https://drive.google.com/uc?id=${fileId}`);
      variants.push(`https://drive.google.com/uc?export=view&id=${fileId}`);
    }
    // Original URL as last fallback
    variants.push(url);
    // De-duplicate
    return Array.from(new Set(variants));
  }, [asset.photos]);

  // Reset image state when asset changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    setImageAttemptIdx(0);
    setCurrentImageUrl(imageUrlVariants[0]);
  }, [asset.id, imageUrlVariants]);

  const detailUrl = useMemo(() => {
    try {
      const { origin, pathname } = window.location;
      return `${origin}${pathname}?assetId=${encodeURIComponent(asset.id)}`;
    } catch {
      return `?assetId=${encodeURIComponent(asset.id)}`;
    }
  }, [asset.id]);

  useEffect(() => {
    // Enhanced QR Info with more details
    const qrData = [
      `ID: ${asset.id}`,
      `NAMA: ${asset.namaBarang}`,
      `JENIS: ${asset.jenisInventaris}`,
      `KODE: ${asset.noKodeBarang || asset.kodeBarang || '-'}`,
      `UNIT: ${asset.unit}`,
    ];
    
    // Add specific fields based on asset type
    if (asset.jenisInventaris?.toLowerCase() === 'tanah') {
      if (asset.luasTanah) qrData.push(`LUAS: ${asset.luasTanah} m²`);
      if (asset.alamat) qrData.push(`ALAMAT: ${asset.alamat}`);
      if (asset.statusHakTanah) qrData.push(`HAK: ${asset.statusHakTanah}`);
      if (asset.nomorSertifikat) qrData.push(`SERTIFIKAT: ${asset.nomorSertifikat}`);
    } else if (asset.jenisInventaris?.toLowerCase() === 'bangunan') {
      if (asset.luasBangunan) qrData.push(`LUAS BANGUNAN: ${asset.luasBangunan} m²`);
      if (asset.alamat) qrData.push(`ALAMAT: ${asset.alamat}`);
      if (asset.kondisi) qrData.push(`KONDISI: ${asset.kondisi}`);
      if (asset.bertingkat) qrData.push(`TINGKAT: ${asset.bertingkat}`);
    } else {
      // Item/Barang
      if (asset.merkModel) qrData.push(`MERK: ${asset.merkModel}`);
      if (asset.noSeriPabrik) qrData.push(`NO.SERI: ${asset.noSeriPabrik}`);
      if (asset.ruangan) qrData.push(`RUANGAN: ${asset.ruangan}`);
      if (asset.keadaanBarang) qrData.push(`KONDISI: ${asset.keadaanBarang}`);
    }
    
    const text = qrData.join('|');
    QRCode.toDataURL(text, { scale: 6, margin: 1 })
      .then(setQrInfoUrl)
      .catch(() => setQrInfoUrl(null));
  }, [asset]);

  useEffect(() => {
    QRCode.toDataURL(detailUrl, { scale: 6, margin: 1 })
      .then(setQrLinkUrl)
      .catch(() => setQrLinkUrl(null));
  }, [detailUrl]);

  const downloadQrWithLabel = async (qrDataUrl: string | null, label: string, filename: string) => {
    if (!qrDataUrl) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      const padding = 20;
      const labelHeight = 60;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2 + labelHeight;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      const lines = label.split('\n');
      lines.forEach((line, idx) => ctx.fillText(line, canvas.width / 2, img.height + padding + 20 + idx * 18));
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    };
    img.src = qrDataUrl;
  };

  const downloadLinkQr = async () => {
    try {
      const data = qrLinkUrl || await QRCode.toDataURL(detailUrl, { scale: 6, margin: 1 });
      if (!qrLinkUrl) setQrLinkUrl(data);
      const label = asset.merkModel ? `${asset.namaBarang}\n${asset.merkModel}` : asset.namaBarang;
      await downloadQrWithLabel(data, label, `QR-Link-${asset.namaBarang}.png`);
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white text-sm font-semibold">
          <span>Detail Inventaris</span>
          <div className="flex gap-2">
            {canEdit && (
              <button onClick={() => onEdit(asset)} className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20">Edit</button>
            )}
            <button onClick={onBack} className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20">Kembali</button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Image */}
          <div className="md:col-span-3">
            <div className="relative w-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '500px', maxHeight: '600px' }}>
              {/* Toggle fill mode (Isi area vs Pas sesuai) */}
              {currentImageUrl && !imageError && (
                <button
                  type="button"
                  onClick={() => setFillMode(m => (m === 'cover' ? 'contain' : 'cover'))}
                  className="absolute top-2 right-2 z-20 p-2 rounded-md bg-white/90 border shadow hover:bg-white"
                  title={fillMode === 'cover' ? 'Pas sesuai' : 'Isi area'}
                  aria-label={fillMode === 'cover' ? 'Pas sesuai' : 'Isi area'}
                >
                  {fillMode === 'cover' ? (
                    <Minimize2 className="w-4 h-4 text-gray-700" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-gray-700" />
                  )}
                </button>
              )}
              {currentImageUrl && !imageError ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                      <div className="text-sm text-gray-400 animate-pulse">Memuat gambar...</div>
                    </div>
                  )}
                  <img
                    src={currentImageUrl}
                    alt={asset.namaBarang}
                    className={`absolute inset-0 w-full h-full ${fillMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const nextIdx = imageAttemptIdx + 1;
                      if (nextIdx < imageUrlVariants.length) {
                        setImageAttemptIdx(nextIdx);
                        setCurrentImageUrl(imageUrlVariants[nextIdx]);
                        setImageLoading(true);
                      } else {
                        setImageError(true);
                        setImageLoading(false);
                      }
                    }}
                    onLoad={() => {
                      setImageError(false);
                      setImageLoading(false);
                    }}
                  />
                </>
              ) : imageError ? (
                <div className="text-center">
                  <span className="text-sm text-red-500">Gagal memuat gambar</span>
                  <p className="text-xs text-gray-400 mt-2 break-all px-4">{asset.photos?.[0]}</p>
                  <div className="mt-2">
                    <a href={asset.photos?.[0]} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline hover:text-blue-800">
                      Buka gambar di tab baru
                    </a>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Tidak ada gambar</span>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={downloadLinkQr}
                className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >Unduh QR Link Detail</button>
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('printAssetId', asset.id);
                  window.open(url.toString(), '_blank');
                }}
                className="px-3 py-2 text-xs rounded-lg border bg-white hover:bg-gray-100 transition-colors"
              >Cetak A4</button>
            </div>

            {/* Alamat (untuk Tanah dan Bangunan) */}
            {(asset.jenisInventaris?.toLowerCase() === 'tanah' || asset.jenisInventaris?.toLowerCase() === 'bangunan') && asset.alamat && (
              <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                <div className="text-xs font-medium text-gray-600 mb-2">📍 Alamat Lokasi</div>
                <div className="text-sm text-gray-800">{asset.alamat}</div>
                {asset.latitude && asset.longitude && (
                  <div className="text-xs text-gray-500 mt-1">
                    Koordinat: {asset.latitude}, {asset.longitude}
                  </div>
                )}
              </div>
            )}

            {/* Map for Land and Building */}
            {(asset.jenisInventaris?.toLowerCase() === 'tanah' || asset.jenisInventaris?.toLowerCase() === 'bangunan') && asset.latitude && asset.longitude && (
              <div className="mt-4">
                <MapViewer
                  latitude={parseFloat(asset.latitude)}
                  longitude={parseFloat(asset.longitude)}
                  address={asset.alamat}
                />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:col-span-2">
            {/* QR Info Aset */}
            <div className="mb-4 w-full p-4 border rounded-lg bg-gray-50 flex flex-col items-center gap-2">
              <div className="text-xs font-medium text-gray-600">QR Info Aset</div>
              {qrInfoUrl ? (
                <img src={qrInfoUrl} alt="QR Info Aset" className="w-32 h-32" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-[10px] text-gray-400">QR tidak tersedia</div>
              )}
              <div className="text-xs text-center text-gray-600 mt-1 px-2">
                <div className="font-medium">{asset.namaBarang}</div>
                {asset.merkModel && <div className="text-gray-500">{asset.merkModel}</div>}
                <div className="text-gray-500 mt-1">ID: {asset.id}</div>
                {asset.jenisInventaris && <div className="text-blue-600 mt-1">{asset.jenisInventaris}</div>}
              </div>
              <button
                onClick={() => {
                  const label = asset.merkModel ? `${asset.namaBarang}\n${asset.merkModel}` : asset.namaBarang;
                  downloadQrWithLabel(qrInfoUrl, label, `QR-Info-${asset.namaBarang}.png`);
                }}
                className="px-3 py-1.5 text-xs rounded bg-white border hover:bg-gray-100"
              >Unduh QR Info</button>
            </div>

            <div className="text-lg font-semibold mb-1">{asset.namaBarang}</div>
            <div className="text-sm text-gray-500 mb-4">{asset.jenisInventaris} • {asset.unit}</div>

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4">
                <Row label="Kode Barang" value={asset.noKodeBarang || asset.kodeBarang} />
                <Row label="Tahun" value={asset.tahunPembuatan || asset.tahunPerolehan} />
                
                {/* Jumlah only for Barang (not Tanah/Bangunan) */}
                {asset.jenisInventaris?.toLowerCase() !== 'tanah' && asset.jenisInventaris?.toLowerCase() !== 'bangunan' && (
                  <>
                    <Row label="Jumlah" value={asset.jumlahBarang} />
                    <Row label="Merk/Model" value={asset.merkModel} />
                    <Row label="No. Seri Pabrik" value={asset.noSeriPabrik} />
                    <Row label="Ukuran" value={asset.ukuran} />
                    <Row label="Bahan" value={asset.bahan} />
                    <Row label="Sumber Perolehan" value={asset.sumberPerolehan} />
                  </>
                )}
                
                <Row label="Harga Beli" value={asset.hargaBeli || asset.harga ? `Rp ${(asset.hargaBeli || asset.harga)?.toLocaleString('id-ID')}` : undefined} />
                <Row label="Keadaan" value={asset.keadaanBarang} />
                <Row label="Lokasi/Ruangan" value={asset.ruangan || asset.alamat} />
                {asset.keterangan && <Row label="Keterangan" value={asset.keterangan} />}

                {/* Land specific */}
                {asset.jenisInventaris?.toLowerCase() === 'tanah' && (
                  <>
                    <Row label="Register" value={asset.register} />
                    <Row label="Luas Tanah" value={asset.luasTanah ? `${asset.luasTanah} m²` : undefined} />
                    <Row label="Alamat" value={asset.alamat} />
                    <Row label="Status Hak Tanah" value={asset.statusHakTanah} />
                    <Row label="Status Tanah" value={asset.statusTanah} />
                    <Row label="Tanggal Sertifikat" value={formatDate(asset.tanggalSertifikat)} />
                    <Row label="No. Sertifikat" value={asset.nomorSertifikat} />
                    <Row label="Penggunaan" value={asset.penggunaan} />
                    <Row label="Asal Usul" value={asset.asalUsul} />
                    <Row label="Kondisi" value={asset.kondisi} />
                    <Row label="Status Barang" value={asset.statusBarang} />
                    <Row label="Tgl. Buku" value={formatDate(asset.tglBuku)} />
                    <Row label="No. BAST" value={asset.noBAST} />
                    <Row label="Tgl. BAST" value={formatDate(asset.tglBAST)} />
                    <Row label="ID Penerimaan" value={asset.idPenerimaan} />
                    <Row label="Status Aset" value={asset.statusAset} />
                    <Row label="Harga" value={asset.harga ? `Rp ${asset.harga.toLocaleString('id-ID')}` : undefined} />
                  </>
                )}

                {/* Building specific */}
                {asset.jenisInventaris?.toLowerCase() === 'bangunan' && (
                  <>
                    <Row label="Register" value={asset.register} />
                    <Row label="Kondisi" value={asset.kondisi} />
                    <Row label="Bertingkat" value={asset.bertingkat} />
                    <Row label="Beton" value={asset.beton} />
                    <Row label="Luas Bangunan" value={asset.luasBangunan ? `${asset.luasBangunan} m²` : undefined} />
                    <Row label="Alamat" value={asset.alamat} />
                    <Row label="Tanggal Dokumen" value={formatDate(asset.tanggalDokumen)} />
                    <Row label="No. Dokumen" value={asset.nomorDokumen} />
                    <Row label="Luas Tanah" value={asset.luasTanah ? `${asset.luasTanah} m²` : undefined} />
                    <Row label="Status Tanah" value={asset.statusTanah} />
                    <Row label="Kode Tanah" value={asset.kodeTanah} />
                    <Row label="Asal Usul" value={asset.asalUsul} />
                    <Row label="Harga" value={asset.harga ? `Rp ${asset.harga.toLocaleString('id-ID')}` : undefined} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetailPage;
