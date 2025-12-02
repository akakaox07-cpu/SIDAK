import React from 'react';
import { StatCard, TotalIcon, LandIcon, BuildingIcon, DownloadIcon } from '@/components/ui';
import { YearlyInventoryChart, RecentAssetsSlider } from '@/components/features';
import { Asset } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import kelurahanProfileImage from '@/assets/kelurahan-profile.jpg';

interface DashboardProps {
  stats: {
    totalInventory: number;
    totalTanah: number;
    totalBangunan: number;
  };
  yearlyInventoryData: { year: string; barang: number; tanah: number; bangunan: number }[];
  assets: Asset[];
  onViewAllAssets?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  stats,
  yearlyInventoryData,
  assets,
  onViewAllAssets,
}) => {
    const handleDownloadGlobalReport = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Laporan Inventaris Global', 14, 22);
    doc.setFontSize(11);
    const dateStr = `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`;
    doc.text(dateStr, 14, 30);

    // Summary Stats
    doc.setFontSize(12);
    doc.text('Ringkasan Statistik:', 14, 45);
    doc.setFontSize(10);
    doc.text(`- Total Inventaris: ${stats.totalInventory}`, 16, 52);
    doc.text(`- Total Aset Tanah: ${stats.totalTanah}`, 16, 58);
    doc.text(`- Total Aset Bangunan: ${stats.totalBangunan}`, 16, 64);
    
    // Table
    const tableColumn = ["No. Kode", "Nama Barang", "Jenis", "Tahun", "Jumlah", "Harga (Rp)", "Keadaan", "Unit", "Ruangan"];
    const tableRows: (string | number)[][] = [];

    assets.forEach(asset => {
      const assetData = [
        asset.noKodeBarang,
        asset.namaBarang,
        asset.jenisInventaris,
        asset.tahunPembuatan,
        asset.jumlahBarang,
        asset.hargaBeli.toLocaleString('id-ID'),
        asset.keadaanBarang,
        asset.unit,
        asset.ruangan,
      ];
      tableRows.push(assetData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
    });

    const today = new Date().toISOString().slice(0, 10);
    doc.save(`Laporan_Inventaris_Global_${today}.pdf`);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard Inventaris</h1>
              <p className="text-gray-500 mt-1">Ringkasan dan statistik inventaris yang up-to-date.</p>
            </div>
            <button
              onClick={handleDownloadGlobalReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <DownloadIcon />
              <span className="hidden sm:inline">Download Laporan</span>
            </button>
          </div>
        </div>
        
        {/* Main Layout: 2.5:1.5 Grid (Left Content : Right Sidebar) = 5:3 ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-6 min-h-[calc(100vh-120px)]"> {/* 120px = header+padding */}
          
          {/* LEFT SECTION (5/8 width = 62.5%) - Main Dashboard Content */}
          <div className="lg:col-span-5 flex flex-col h-full gap-6">
            {/* Recent Assets Slider with background images */}
            <div className="h-[300px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white relative">
              {/* Transparent header overlay */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/30 to-transparent text-white px-4 py-2 text-xs font-semibold flex items-center justify-between">
                <span>Aset Terbaru</span>
                <button
                  type="button"
                  onClick={onViewAllAssets}
                  className="text-[11px] sm:text-xs font-medium text-white/95 hover:text-white underline underline-offset-2"
                >
                  Lihat Semua
                </button>
              </div>
              {/* Slider fills entire card */}
              <div className="w-full h-full">
                <RecentAssetsSlider assets={assets} />
              </div>
            </div>

            {/* Stats Cards - Updated spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard title="Total Inventaris Barang" value={stats.totalInventory} icon={<TotalIcon />} />
              <StatCard title="Total Aset Tanah" value={stats.totalTanah} icon={<LandIcon />} />
              <StatCard title="Total Aset Bangunan" value={stats.totalBangunan} icon={<BuildingIcon />} />
            </div>

            {/* Grid untuk Chart dan History - Side by side, tinggi penuh */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
              {/* Yearly Inventory Chart */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full overflow-hidden">
                <div className="bg-blue-600 text-white px-6 py-4 text-sm font-semibold">Jumlah Inventaris per Tahun</div>
                <div className="p-6 flex-1 min-h-0">
                  <YearlyInventoryChart data={yearlyInventoryData} />
                </div>
              </div>

              {/* History Aset - Moved from right section */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full overflow-hidden">
                <div className="bg-blue-600 text-white px-6 py-4 text-sm font-semibold">History Aset</div>
                <div className="p-6 flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-hide">
                  <div className="space-y-4">
                    {assets.length === 0 ? (
                      <div className="text-center text-gray-400 text-xs py-4">Belum ada aktivitas</div>
                    ) : (
                      assets
                        .slice()
                        .sort((a, b) => {
                          const ta = Date.parse(a.tanggalInput || '');
                          const tb = Date.parse(b.tanggalInput || '');
                          return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
                        })
                        .slice(0, 10)
                        .map((asset, idx) => {
                          const colors = ['blue', 'green', 'yellow', 'purple', 'red', 'indigo', 'pink', 'teal'];
                          const color = colors[idx % colors.length];
                          const date = asset.tanggalInput 
                            ? new Date(asset.tanggalInput).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-';
                          return (
                            <div key={asset.id} className="flex items-start gap-2 text-xs">
                              <div className={`min-w-[4px] w-1 h-full bg-${color}-500 rounded-full mt-1`}></div>
                              <div>
                                <p className="font-semibold text-gray-700">{asset.namaBarang}</p>
                                <p className="text-gray-500 text-[10px]">{date} • {asset.unit}</p>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION (3/8 width = 37.5%) - Profile Sidebar, tinggi penuh */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-4 text-sm font-semibold">Profil Kelurahan Babakan</div>
              <div className="p-6 flex-1 flex flex-col">
                {/* Profile Image */}
                <div className="w-full h-96 bg-blue-50 rounded-xl flex items-center justify-center mb-4 border border-blue-200 overflow-hidden">
                  <img 
                    src={kelurahanProfileImage} 
                    alt="Kelurahan Babakan" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Deskripsi Lengkap */}
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Kelurahan Babakan berubah bentuk pemerintahannya dari Desa menjadi Kelurahan pada tahun 2005 sesuai dengan Perda Kabupaten Tangerang Nomor 03 Tahun 2005 dengan kode wilayah 36-03-20-1011. Letak Kelurahan Babakan secara geografis memanjang dari Barat ke Timur dengan bentangan luas wilayah ± 195,576 Ha yang dilintasi oleh dua (2) jalan provinsi yaitu Jl. Raya Curug - Parung Panjang dan Jl. Raya Legok-Karawaci. Berpenduduk ± 14.453 jiwa (Desember 2024) dan terletak rata-rata 500 mdl diatas permukaan laut dengan batas-batas wilayah sebagai berikut :
                </p>
                
                {/* Tabel Batas Wilayah */}
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Batas Wilayah</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2">Batas</th>
                        <th scope="col" className="px-3 py-2">Desa/Kelurahan</th>
                        <th scope="col" className="px-3 py-2">Kecamatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white border-b border-gray-200">
                        <td className="px-3 py-2 font-medium text-gray-900">Sebelah Utara</td>
                        <td className="px-3 py-2">Legok</td>
                        <td className="px-3 py-2">Legok</td>
                      </tr>
                      <tr className="bg-white border-b border-gray-200">
                        <td className="px-3 py-2 font-medium text-gray-900">Sebelah Barat</td>
                        <td className="px-3 py-2">Kemuning</td>
                        <td className="px-3 py-2">Legok</td>
                      </tr>
                      <tr className="bg-white border-b border-gray-200">
                        <td className="px-3 py-2 font-medium text-gray-900">Sebelah Selatan</td>
                        <td className="px-3 py-2">Jatake</td>
                        <td className="px-3 py-2">Pagedangan</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 py-2 font-medium text-gray-900">Sebelah Timur</td>
                        <td className="px-3 py-2">Cicalengka</td>
                        <td className="px-3 py-2">Pagedangan</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;