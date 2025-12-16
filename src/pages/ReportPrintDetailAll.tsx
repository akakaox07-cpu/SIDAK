import React, { useEffect, useState } from 'react';
import { Asset } from '@/types';
import QRCode from 'qrcode';
import { PrintIcon, SettingsIcon } from '@/components/ui';

interface Props { assets: Asset[] }

interface SignatureData {
  jabatan: string;
  nama: string;
  nip: string;
}

const AssetDetailCard: React.FC<{ 
  asset: Asset; 
  index: number;
  signLeft: SignatureData;
  signRight: SignatureData;
  onImageLoad: () => void;
}> = ({ asset, index, signLeft, signRight, onImageLoad }) => {
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [imageHandled, setImageHandled] = useState(false);

  useEffect(() => {
    // Generate QR Link (detail page link)
    try {
      const detailUrl = `${window.location.origin}${window.location.pathname}?assetId=${encodeURIComponent(asset.id)}`;
      QRCode.toDataURL(detailUrl, { scale: 6, margin: 1 })
        .then(setQrLink)
        .catch(() => setQrLink(null));
    } catch {
      setQrLink(null);
    }
  }, [asset.id]);

  // Compute image URL similar to AssetPrintPage
  const imageUrl = React.useMemo(() => {
    const url = asset.photos?.[0] || '';
    if (!url) return '';
    
    let fileId = '';
    try {
      const u = new URL(url, window.location.origin);
      fileId = u.searchParams.get('id') || '';
      if (!fileId) {
        const m = u.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (m) fileId = m[1];
      }
    } catch (_) {
      const m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (m) fileId = m[1];
    }
    
    return fileId 
      ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`
      : url;
  }, [asset.photos]);

  // Call onImageLoad if no image
  useEffect(() => {
    if (!imageUrl && !imageHandled) {
      setImageHandled(true);
      onImageLoad();
    }
  }, [imageUrl, imageHandled, onImageLoad]);

  const koordinat = asset.latitude && asset.longitude ? `${asset.latitude}, ${asset.longitude}` : '-';
  const jenis = asset.jenisInventaris || '-';
  const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const lokasi = 'Babakan';
  const detailUrl = `${window.location.origin}${window.location.pathname}?assetId=${encodeURIComponent(asset.id)}`;

  return (
    <div className="page-break mx-auto bg-white w-[210mm] min-h-[297mm] shadow-lg rounded-lg p-12 box-border print:shadow-none print:rounded-none print:p-6 mb-8 print:mb-0">
      <h1 className="text-center text-xl font-semibold mb-4 print:mb-2">Detail Aset {index > 0 && `(${index + 1})`}</h1>
      <div className="text-center text-xs text-gray-600 mb-6 print:mb-3">Dicetak: {tanggalCetak}</div>
      
      <div className="flex flex-row gap-6 mb-6 print:gap-3 print:mb-4">
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg relative overflow-hidden p-0 min-h-[300px] max-h-[300px] print:min-h-[260px] print:max-h-[260px]">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={asset.namaBarang} 
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onLoad={() => {
                console.log('Image loaded:', asset.namaBarang);
                if (!imageHandled) {
                  setImageHandled(true);
                  onImageLoad();
                }
              }}
              onError={(e) => {
                console.log('Image error:', asset.namaBarang);
                if (!imageHandled) {
                  setImageHandled(true);
                  onImageLoad();
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-gray-400">Tidak ada gambar</span>
            </div>
          )}
        </div>
        <div className="w-[150px] flex flex-col items-center gap-2 border rounded-lg p-3 bg-white flex-shrink-0">
          <div className="text-[11px] font-medium text-gray-600">QR Link Detail</div>
          {qrLink ? (
            <img src={qrLink} alt="QR Link Detail" className="w-28 h-28" />
          ) : (
            <div className="w-28 h-28 flex items-center justify-center text-[10px] text-gray-400">Memuat...</div>
          )}
          <div className="text-[9px] text-gray-500 text-center break-all leading-tight">{detailUrl}</div>
        </div>
      </div>

      <div className="border rounded-lg p-5 bg-gray-50 mb-6 print:p-3 print:mb-4">
        <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
          <div className="font-semibold">Nama</div><div>{asset.namaBarang}</div>
          <div className="font-semibold">Jenis</div><div>{jenis}</div>
          <div className="font-semibold">Unit</div><div>{asset.unit}</div>
          <div className="font-semibold">Kode Barang</div><div>{asset.noKodeBarang || asset.kodeBarang || '-'}</div>
          <div className="font-semibold">Tahun</div><div>{asset.tahunPembuatan || asset.tahunPerolehan || '-'}</div>
          <div className="font-semibold">Jumlah</div><div>{asset.jumlahBarang ?? '-'}</div>
          <div className="font-semibold">Harga Beli</div><div>{asset.hargaBeli ?? asset.harga ?? '-'}</div>
          <div className="font-semibold">Keadaan</div><div>{asset.keadaanBarang || asset.kondisi || '-'}</div>
          <div className="font-semibold">Lokasi/Ruangan</div><div>{asset.ruangan || asset.alamat || '-'}</div>
          <div className="font-semibold">Koordinat</div><div>{koordinat}</div>
          {asset.statusHakTanah && <><div className="font-semibold">Status Hak</div><div>{asset.statusHakTanah}</div></>}
          {asset.statusTanah && <><div className="font-semibold">Status Tanah</div><div>{asset.statusTanah}</div></>}
          {asset.statusBarang && <><div className="font-semibold">Status Barang</div><div>{asset.statusBarang}</div></>}
          {asset.nomorSertifikat && <><div className="font-semibold">No. Sertifikat</div><div>{asset.nomorSertifikat}</div></>}
          {asset.luasTanah && <><div className="font-semibold">Luas Tanah</div><div>{asset.luasTanah} m²</div></>}
          {asset.luasBangunan && <><div className="font-semibold">Luas Bangunan</div><div>{asset.luasBangunan} m²</div></>}
          {asset.bertingkat && <><div className="font-semibold">Bertingkat</div><div>{asset.bertingkat}</div></>}
          {asset.beton && <><div className="font-semibold">Beton</div><div>{asset.beton}</div></>}
          {asset.merkModel && <><div className="font-semibold">Merk/Model</div><div>{asset.merkModel}</div></>}
          {asset.tglBuku && <><div className="font-semibold">Tgl. Buku</div><div>{asset.tglBuku}</div></>}
          {asset.noBAST && <><div className="font-semibold">No. BAST</div><div>{asset.noBAST}</div></>}
          {asset.tglBAST && <><div className="font-semibold">Tgl. BAST</div><div>{asset.tglBAST}</div></>}
          {asset.idPenerimaan && <><div className="font-semibold">ID Penerimaan</div><div>{asset.idPenerimaan}</div></>}
          {asset.statusAset && <><div className="font-semibold">Status Aset</div><div>{asset.statusAset}</div></>}
        </div>
        <div className="mt-4 text-sm">
          <strong>Keterangan:</strong>
          <div className="mt-1 whitespace-pre-wrap leading-snug">{asset.keterangan || '-'}</div>
        </div>
      </div>

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
          <tr>
            <td className="text-center text-gray-700 min-h-[18px]">{signLeft.jabatan || ' '}</td>
            <td className="text-center text-gray-700 min-h-[18px]">{signRight.jabatan || ' '}</td>
          </tr>
          <tr>
            <td className="h-[100px] print:h-[90px]"></td>
            <td className="h-[100px] print:h-[90px]"></td>
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
  );
};

const ReportPrintDetailAll: React.FC<Props> = ({ assets }) => {
  const [showTools, setShowTools] = useState(true);
  const [signLeft, setSignLeft] = useState<SignatureData>({ jabatan: '', nama: '', nip: '' });
  const [signRight, setSignRight] = useState<SignatureData>({ jabatan: '', nama: '', nip: '' });
  const [loadedImages, setLoadedImages] = useState(0);
  const [readyToPrint, setReadyToPrint] = useState(false);

  const handleImageLoad = () => {
    setLoadedImages(prev => prev + 1);
  };

  useEffect(() => {
    // Ready when all images are attempted (loaded or errored)
    if (loadedImages >= assets.length) {
      setReadyToPrint(true);
    }
  }, [loadedImages, assets.length]);

  // Auto ready after timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!readyToPrint) {
        console.log('Timeout reached, forcing ready state');
        setReadyToPrint(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [readyToPrint]);

  // Auto ready if no images
  useEffect(() => {
    const hasImages = assets.some(a => a.photos?.[0]);
    if (!hasImages) {
      setReadyToPrint(true);
    }
  }, [assets]);

  return (
    <div className="min-h-screen bg-gray-300 p-8 print:p-0 print:bg-white">
      {/* Top-right controls */}
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
              disabled={!readyToPrint}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow bg-white hover:bg-gray-50 ${
                readyToPrint ? 'text-gray-800' : 'opacity-60 cursor-not-allowed'
              }`}
              title="Cetak (Ctrl+P)"
              aria-label="Cetak"
            >
              <PrintIcon />
              <span className="text-sm font-medium">Cetak</span>
            </button>
          </div>
          {showTools && (
            <div className="mt-2 w-[min(92vw,380px)] bg-white border rounded-xl shadow-lg p-3 space-y-3">
              <div className="text-xs text-gray-600">Isi jabatan, nama, dan NIP untuk semua halaman. Tanda tangan akan muncul di setiap aset.</div>
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

      {/* Loading overlay */}
      {!readyToPrint && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 print:hidden">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-sm text-gray-600">Memuat halaman cetak... ({loadedImages}/{assets.length})</div>
          </div>
        </div>
      )}

      {/* Print each asset on separate page */}
      {assets.map((asset, idx) => (
        <AssetDetailCard 
          key={asset.id} 
          asset={asset} 
          index={idx}
          signLeft={signLeft}
          signRight={signRight}
          onImageLoad={handleImageLoad}
        />
      ))}

      <style>{`
        @media print {
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .page-break:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportPrintDetailAll;
