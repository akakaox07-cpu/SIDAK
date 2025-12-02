import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Asset } from '@/types';
import QRCode from 'qrcode';

// Build the PDF document with consistent content for both download and print
const buildInventoryPdf = (assets: Asset[]) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Daftar Inventaris Barang', 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  const dateStr = `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`;
  doc.text(dateStr, 14, 30);

  // Columns include Sumber Perolehan to match list view
  const tableColumn = [
    'No. Kode Barang',
    'Nama Barang',
    'Jenis Inventaris',
    'Sumber Perolehan',
    'Keadaan Barang',
    'Unit',
    'Ruangan',
  ];
  const tableRows: (string | number)[][] = [];

  assets.forEach((asset) => {
    tableRows.push([
      asset.noKodeBarang,
      asset.namaBarang,
      asset.jenisInventaris,
      asset.sumberPerolehan || '-',
      asset.keadaanBarang,
      asset.unit,
      asset.ruangan,
    ]);
  });

  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [109, 40, 217] }, // purple tone
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
  });

  // Add signature footer beneath the table
  addSignatureFooter(doc, ((doc as any).lastAutoTable?.finalY || 35) + 10);

  return doc;
};

// Download the PDF
export const generateInventoryPdf = (assets: Asset[]) => {
  const doc = buildInventoryPdf(assets);
  doc.save('Daftar_Inventaris.pdf');
};

// Get a blob url for printing
export const getInventoryPdfBlobUrl = (assets: Asset[]) => {
  const doc = buildInventoryPdf(assets);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

// Open the generated PDF in a new window and trigger print => print output matches download PDF
export const printInventoryPdf = (assets: Asset[]) => {
  const url = getInventoryPdfBlobUrl(assets);
  const win = window.open(url);
  if (win) {
    // Allow a tick for the document to load then trigger print
    win.onload = () => {
      win.focus();
      win.print();
    };
  }
};

// Generate a detailed PDF with one asset per page, showing key fields
export const generateDetailedInventoryPdf = async (assets: Asset[]) => {
  const doc = new jsPDF();

  for (let idx = 0; idx < assets.length; idx++) {
    const asset = assets[idx];
    if (idx > 0) doc.addPage();
    let cursorY = 20;
    const addField = (label: string, value?: string | number) => {
      const v = (value === undefined || value === null || value === '') ? '-' : String(value);
      doc.setFontSize(11);
      doc.text(`${label}: ${v}`, 14, cursorY);
      cursorY += 8;
    };
    // Title
    doc.setFontSize(16);
    doc.text('Laporan Detail Inventaris', 14, cursorY);
    // QR Code in top-right
    try {
      const qrText = `ASSET|ID:${asset.id}|NAMA:${asset.namaBarang}`;
      const qrData = await QRCode.toDataURL(qrText, { margin: 0, scale: 4 });
      doc.addImage(qrData, 'PNG', 170, 14, 24, 24);
    } catch {}
    cursorY += 10;

    // Basic info
    addField('No. Kode Barang', asset.noKodeBarang);
    addField('Nama Barang', asset.namaBarang);
    addField('Jenis Inventaris', asset.jenisInventaris);
    addField('Sumber Perolehan', asset.sumberPerolehan || '-');
    addField('Keadaan Barang', asset.keadaanBarang || '-');
    addField('Unit', asset.unit);
    addField('Ruangan', asset.ruangan || '-');
    addField('Tahun Pembuatan', asset.tahunPembuatan || '-');
    addField('Jumlah', asset.jumlahBarang ?? '-');
    addField('Harga Beli', asset.hargaBeli ?? '-');
    addField('Tanggal Input', asset.tanggalInput ? new Date(asset.tanggalInput).toLocaleString('id-ID') : '-');

    // Tanah specific
    if (asset.jenisInventaris?.toLowerCase() === 'tanah') {
      cursorY += 4;
      doc.setFontSize(13);
      doc.text('Detail Tanah', 14, cursorY);
      cursorY += 8;
      addField('Luas Tanah', asset.luasTanah ?? '-');
      addField('Alamat', asset.alamat || '-');
      addField('Koordinat', asset.latitude && asset.longitude ? `${asset.latitude}, ${asset.longitude}` : '-');
      addField('Status Hak', asset.statusHakTanah || '-');
      addField('No. Sertifikat', asset.nomorSertifikat || '-');
    }

    // Bangunan specific
    if (asset.jenisInventaris?.toLowerCase() === 'bangunan') {
      cursorY += 4;
      doc.setFontSize(13);
      doc.text('Detail Bangunan', 14, cursorY);
      cursorY += 8;
      addField('Luas Bangunan', asset.luasBangunan ?? '-');
      addField('Kondisi', asset.kondisi || '-');
      addField('Bertingkat', asset.bertingkat || '-');
      addField('Beton', asset.beton || '-');
      addField('Status Tanah', asset.statusTanah || '-');
    }

    // Keterangan
    cursorY += 4;
    doc.setFontSize(13);
    doc.text('Keterangan', 14, cursorY);
    cursorY += 8;
    doc.setFontSize(11);
    const text = asset.keterangan || '-';
    const split = doc.splitTextToSize(text, 180);
    doc.text(split, 14, cursorY);
  }

  doc.save('Laporan_Detail_Inventaris.pdf');
};

// Helpers for type-specific layouts
const drawSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFontSize(13);
  doc.text(title, 14, y);
  return y + 8;
};

const drawField = (doc: jsPDF, label: string, value: any, y: number) => {
  const v = (value === undefined || value === null || value === '') ? '-' : String(value);
  doc.setFontSize(11);
  doc.text(`${label}: ${v}`, 14, y);
  return y + 7;
};

async function tryDrawImageFromUrl(doc: jsPDF, url?: string, x = 150, y = 20, w = 45, h = 34) {
  if (!url) return;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    const reader = new FileReader();
    const base64: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    doc.addImage(base64, 'JPEG', x, y, w, h, undefined, 'FAST');
  } catch (e) {
    // Fallback: show URL as text
    doc.setFontSize(8);
    doc.text(`Foto: ${url}`, 150, y + h + 5, { maxWidth: 50 });
  }
}

// Type-specific generators (all form fields)
export const generateBarangDetailPdf = async (assets: Asset[]) => {
  const doc = new jsPDF();
  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    if (i > 0) doc.addPage();
    let y = 16;
    doc.setFontSize(16);
    doc.text('Laporan Detail Barang', 14, y);
    // QR top-right
    try {
      const qrText = `BARANG|ID:${a.id}|KODE:${a.noKodeBarang}`;
      const qrData = await QRCode.toDataURL(qrText, { margin: 0, scale: 4 });
      doc.addImage(qrData, 'PNG', 170, 12, 24, 24);
    } catch {}
    await tryDrawImageFromUrl(doc, a.photos && a.photos[0]);
    y += 10;

    y = drawSectionTitle(doc, 'Informasi Dasar', y);
    y = drawField(doc, 'Nama Barang', a.namaBarang, y);
    y = drawField(doc, 'No. Kode Barang', a.noKodeBarang, y);
    y = drawField(doc, 'Jenis', a.jenisInventaris, y);
    y = drawField(doc, 'Unit', a.unit, y);
    y = drawField(doc, 'Lokasi/Ruangan', a.ruangan, y);
    y = drawField(doc, 'Tanggal Input', a.tanggalInput ? new Date(a.tanggalInput).toLocaleString('id-ID') : '-', y);

    y = drawSectionTitle(doc, 'Spesifikasi', y + 2);
    y = drawField(doc, 'Merk/Model', a.merkModel, y);
    y = drawField(doc, 'No. Seri Pabrik', a.noSeriPabrik, y);
    y = drawField(doc, 'Ukuran', a.ukuran, y);
    y = drawField(doc, 'Bahan', a.bahan, y);

    y = drawSectionTitle(doc, 'Perolehan', y + 2);
    y = drawField(doc, 'Tahun Perolehan', a.tahunPembuatan, y);
    y = drawField(doc, 'Jumlah Barang', a.jumlahBarang, y);
    y = drawField(doc, 'Harga Beli', a.hargaBeli, y);
    y = drawField(doc, 'Sumber Perolehan', a.sumberPerolehan, y);
    y = drawField(doc, 'Keadaan Barang', a.keadaanBarang, y);

    y = drawSectionTitle(doc, 'Keterangan', y + 2);
    doc.setFontSize(11);
    const split = doc.splitTextToSize(a.keterangan || '-', 180);
    doc.text(split, 14, y);
  }
  doc.save('Laporan_Detail_Barang.pdf');
};

export const generateTanahDetailPdf = async (assets: Asset[]) => {
  const doc = new jsPDF();
  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    if (i > 0) doc.addPage();
    let y = 16;
    doc.setFontSize(16);
    doc.text('Laporan Detail Tanah', 14, y);
    try {
      const qrText = `TANAH|ID:${a.id}|KODE:${a.kodeBarang || a.noKodeBarang}`;
      const qrData = await QRCode.toDataURL(qrText, { margin: 0, scale: 4 });
      doc.addImage(qrData, 'PNG', 170, 12, 24, 24);
    } catch {}
    await tryDrawImageFromUrl(doc, a.photos && a.photos[0]);
    y += 10;

    y = drawSectionTitle(doc, 'Informasi Dasar', y);
    y = drawField(doc, 'Nama', a.namaBarang, y);
    y = drawField(doc, 'Kode Barang', a.kodeBarang || a.noKodeBarang, y);
    y = drawField(doc, 'Register', a.register, y);
    y = drawField(doc, 'Unit', a.unit, y);
    y = drawField(doc, 'Alamat', a.alamat, y);
    y = drawField(doc, 'Koordinat', a.latitude && a.longitude ? `${a.latitude}, ${a.longitude}` : '-', y);
    y = drawField(doc, 'Tanggal Input', a.tanggalInput ? new Date(a.tanggalInput).toLocaleString('id-ID') : '-', y);

    y = drawSectionTitle(doc, 'Spesifikasi', y + 2);
    y = drawField(doc, 'Luas Tanah (m²)', a.luasTanah, y);
    y = drawField(doc, 'Tahun Perolehan', a.tahunPerolehan, y);
    y = drawField(doc, 'Status Hak Tanah', a.statusHakTanah, y);
    y = drawField(doc, 'Tanggal Sertifikat', a.tanggalSertifikat, y);
    y = drawField(doc, 'Nomor Sertifikat', a.nomorSertifikat, y);
    y = drawField(doc, 'Penggunaan', a.penggunaan, y);

    y = drawSectionTitle(doc, 'Perolehan', y + 2);
    y = drawField(doc, 'Asal Usul', a.asalUsul, y);
    y = drawField(doc, 'Harga (Rp)', a.harga, y);

    y = drawSectionTitle(doc, 'Keterangan', y + 2);
    doc.setFontSize(11);
    const split = doc.splitTextToSize(a.keterangan || '-', 180);
    doc.text(split, 14, y);
  }
  doc.save('Laporan_Detail_Tanah.pdf');
};

export const generateBangunanDetailPdf = async (assets: Asset[]) => {
  const doc = new jsPDF();
  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    if (i > 0) doc.addPage();
    let y = 16;
    doc.setFontSize(16);
    doc.text('Laporan Detail Bangunan', 14, y);
    try {
      const qrText = `BANGUNAN|ID:${a.id}|KODE:${a.kodeBarang || a.noKodeBarang}`;
      const qrData = await QRCode.toDataURL(qrText, { margin: 0, scale: 4 });
      doc.addImage(qrData, 'PNG', 170, 12, 24, 24);
    } catch {}
    await tryDrawImageFromUrl(doc, a.photos && a.photos[0]);
    y += 10;

    y = drawSectionTitle(doc, 'Informasi Dasar', y);
    y = drawField(doc, 'Nama', a.namaBarang, y);
    y = drawField(doc, 'Kode Barang', a.kodeBarang || a.noKodeBarang, y);
    y = drawField(doc, 'Register', a.register, y);
    y = drawField(doc, 'Unit', a.unit, y);
    y = drawField(doc, 'Alamat', a.alamat, y);
    y = drawField(doc, 'Koordinat', a.latitude && a.longitude ? `${a.latitude}, ${a.longitude}` : '-', y);
    y = drawField(doc, 'Tanggal Input', a.tanggalInput ? new Date(a.tanggalInput).toLocaleString('id-ID') : '-', y);

    y = drawSectionTitle(doc, 'Spesifikasi', y + 2);
    y = drawField(doc, 'Kondisi', a.kondisi, y);
    y = drawField(doc, 'Bertingkat', a.bertingkat, y);
    y = drawField(doc, 'Beton', a.beton, y);
    y = drawField(doc, 'Luas Bangunan (m²)', a.luasBangunan, y);
    y = drawField(doc, 'Luas Tanah (m²)', a.luasTanah, y);
    y = drawField(doc, 'Status Tanah', a.statusTanah, y);
    y = drawField(doc, 'Kode Tanah', a.kodeTanah, y);
    y = drawField(doc, 'Tanggal Dokumen', a.tanggalDokumen, y);
    y = drawField(doc, 'Nomor Dokumen', a.nomorDokumen, y);

    y = drawSectionTitle(doc, 'Perolehan', y + 2);
    y = drawField(doc, 'Asal Usul', a.asalUsul, y);
    y = drawField(doc, 'Harga (Rp)', a.harga, y);

    y = drawSectionTitle(doc, 'Keterangan', y + 2);
    doc.setFontSize(11);
    const split = doc.splitTextToSize(a.keterangan || '-', 180);
    doc.text(split, 14, y);
  }
  doc.save('Laporan_Detail_Bangunan.pdf');
};

// Table-style per-type exports (landscape, compact columns)
export const generateBarangTablePdf = (assets: Asset[]) => {
  const doc = new jsPDF('l'); // landscape
  doc.setFontSize(16);
  doc.text('Laporan Tabel Barang', 14, 14);
  const dateStr = `Tanggal: ${new Date().toLocaleDateString('id-ID')}`;
  doc.setFontSize(10);
  doc.text(dateStr, 14, 20);

  const head = [[
    'No', 'No. Kode', 'Nama', 'Merk/Model', 'No. Seri', 'Ukuran', 'Bahan',
    'Tahun', 'Jumlah', 'Harga', 'Sumber', 'Keadaan', 'Unit', 'Ruangan'
  ]];
  const body = assets.map((a, idx) => ([
    idx + 1,
    a.noKodeBarang || '',
    a.namaBarang || '',
    a.merkModel || '',
    a.noSeriPabrik || '',
    a.ukuran || '',
    a.bahan || '',
    a.tahunPembuatan || '',
    a.jumlahBarang ?? '',
    a.hargaBeli ?? '',
    a.sumberPerolehan || '',
    (a as any).keadaanBarang || '',
    a.unit || '',
    a.ruangan || ''
  ] as (string|number)[]));

  (doc as any).autoTable({
    head,
    body,
    startY: 26,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    theme: 'grid',
  });
  addSignatureFooter(doc, ((doc as any).lastAutoTable?.finalY || 26) + 10);
  doc.save('Laporan_Tabel_Barang.pdf');
};

export const generateTanahTablePdf = (assets: Asset[]) => {
  const doc = new jsPDF('l');
  doc.setFontSize(16);
  doc.text('Laporan Tabel Tanah', 14, 14);
  const dateStr = `Tanggal: ${new Date().toLocaleDateString('id-ID')}`;
  doc.setFontSize(10);
  doc.text(dateStr, 14, 20);

  const head = [[
    'No','Kode','Register','Nama','Unit','Alamat','Luas (m²)','Thn Perolehan',
    'Status Hak','Tgl Sertifikat','No Sertifikat','Penggunaan','Asal Usul','Harga','Koordinat'
  ]];
  const body = assets.map((a, idx) => ([
    idx + 1,
    a.kodeBarang || a.noKodeBarang || '',
    a.register || '',
    a.namaBarang || '',
    a.unit || '',
    a.alamat || '',
    a.luasTanah ?? '',
    a.tahunPerolehan ?? '',
    a.statusHakTanah || '',
    a.tanggalSertifikat || '',
    a.nomorSertifikat || '',
    a.penggunaan || '',
    a.asalUsul || '',
    a.harga ?? '',
    a.latitude && a.longitude ? `${a.latitude}, ${a.longitude}` : ''
  ] as (string|number)[]));

  (doc as any).autoTable({
    head,
    body,
    startY: 26,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129] },
    theme: 'grid',
  });
  addSignatureFooter(doc, ((doc as any).lastAutoTable?.finalY || 26) + 10);
  doc.save('Laporan_Tabel_Tanah.pdf');
};

export const generateBangunanTablePdf = (assets: Asset[]) => {
  const doc = new jsPDF('l');
  doc.setFontSize(16);
  doc.text('Laporan Tabel Bangunan', 14, 14);
  const dateStr = `Tanggal: ${new Date().toLocaleDateString('id-ID')}`;
  doc.setFontSize(10);
  doc.text(dateStr, 14, 20);

  const head = [[
    'No','Kode','Register','Nama','Unit','Alamat','Kondisi','Bertingkat','Beton',
    'Luas Bangunan','Luas Tanah','Status Tanah','Kode Tanah','Tgl Dokumen','No Dokumen','Asal Usul','Harga','Koordinat'
  ]];
  const body = assets.map((a, idx) => ([
    idx + 1,
    a.kodeBarang || a.noKodeBarang || '',
    a.register || '',
    a.namaBarang || '',
    a.unit || '',
    a.alamat || '',
    a.kondisi || '',
    a.bertingkat || '',
    a.beton || '',
    a.luasBangunan ?? '',
    a.luasTanah ?? '',
    a.statusTanah || '',
    a.kodeTanah || '',
    a.tanggalDokumen || '',
    a.nomorDokumen || '',
    a.asalUsul || '',
    a.harga ?? '',
    a.latitude && a.longitude ? `${a.latitude}, ${a.longitude}` : ''
  ] as (string|number)[]));

  (doc as any).autoTable({
    head,
    body,
    startY: 26,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [20, 184, 166] },
    theme: 'grid',
  });
  addSignatureFooter(doc, ((doc as any).lastAutoTable?.finalY || 26) + 10);
  doc.save('Laporan_Tabel_Bangunan.pdf');
};

// Common footer: two-column signature grid (A/B) with small spacing on first rows
function addSignatureFooter(doc: jsPDF, yStart: number) {
  const pageH = (doc as any).internal.pageSize.getHeight();
  const minHeight = 42; // estimated height needed
  let y = yStart;
  if (y + minHeight > pageH - 10) {
    doc.addPage();
    y = 20;
  }

  const date = new Date();
  const tanggal = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); // contoh: "11 Desember 2025"

  const head: any[] = [];
  const body = [
    // a1 empty, b1 Babakan, dd-MM-yyyy
  ['', `Babakan, ${tanggal}`],
    // a2 Penanggung Jawab, b2 Mengetahui
    ['Penanggung Jawab', 'Mengetahui'],
    // a3 & b3 signature area (tall row)
    [' ', ' '],
    // a4 & b4 underline (we draw lines in didDrawCell)
    [' ', ' '],
  ];

  (doc as any).autoTable({
    head,
    body,
    startY: y,
    theme: 'plain',
  styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto' } },
    tableWidth: 'auto',
    didParseCell: (data: any) => {
      // Small height for first two rows (lebih rapat)
      if (data.section === 'body' && (data.row.index === 0 || data.row.index === 1)) {
        data.cell.styles.minCellHeight = 4;
      }
      // Larger height for signature area row (row 2)
      if (data.section === 'body' && data.row.index === 2) {
        data.cell.styles.minCellHeight = 20;
      }
      // Center align: tanggal (row 0, kolom B) dan label (row >=1)
      if (data.section === 'body') {
        if (data.row.index >= 1) {
          data.cell.styles.halign = 'center';
        } else if (data.row.index === 0 && data.column.index === 1) {
          data.cell.styles.halign = 'center';
        }
      }
    },
    didDrawCell: (data: any) => {
      // Draw underline on the 4th row (index 3)
      if (data.section === 'body' && data.row.index === 3) {
        const { doc: d, cell } = data;
        const yLine = cell.y + cell.height / 2;
        d.setDrawColor(0);
        d.setLineWidth(0.3);
        // Samakan panjang garis antara kolom A dan B: gunakan 60% dari lebar kolom yang lebih kecil
        const colW0 = data.table?.columns?.[0]?.width ?? cell.width;
        const colW1 = data.table?.columns?.[1]?.width ?? cell.width;
        const baseLineW = Math.min(colW0, colW1) * 0.6;
        const x1 = cell.x + (cell.width - baseLineW) / 2;
        d.line(x1, yLine, x1 + baseLineW, yLine);
      }
    },
  });
}
