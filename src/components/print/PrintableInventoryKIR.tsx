import React from 'react';
import styled from 'styled-components';

// Align with existing InventoryList item shape (approximation); adjust if actual type differs
export interface KIRInventoryItem {
  id: string;
  name: string; // Nama Barang / Jenis
  brand?: string; // Merk/Model
  serialNumber?: string; // No. Seri Pabrik
  size?: string; // Ukuran
  material?: string; // Bahan
  purchaseYear?: string | number; // Tahun Pembuatan / Pembelian
  code: string; // No. Kode Barang
  quantity: number; // Jumlah Barang
  purchasePrice?: number; // Harga Beli
  acquisition?: string; // Perolehan text
  status?: string; // Baik | Kurang Baik | Rusak Berat | Rusak Ringan
}

interface Signatory {
  name: string;
  nip?: string;
  jabatan: string;
}

interface Signatories {
  pengurus: Signatory;
  mengetahui: Signatory;
  kepala?: Signatory;
}

interface PrintableInventoryKIRProps {
  data: KIRInventoryItem[];
  signatories: Signatories;
  location: string; // Selected ruangan
  unitName: string; // Optional unit override
  canViewPrice: boolean;
  priceColumnOption: 'harga' | 'perolehan';
}

// Styled wrappers to isolate print styling without tailwind dependency
const Wrapper = styled.div`
  color: #000;
  font-size: 11px;
  font-family: 'Arial', sans-serif;
  line-height: 1.25;

  h1, h2 { margin: 0; }
`;

const Header = styled.header`
  text-align: center;
  font-weight: bold;
  margin-bottom: 8px;
`;

const MetaSection = styled.section`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 16px;
`;

const MetaTable = styled.table`
  td { padding: 0 2px 2px 0; }
`;

const ModelInfo = styled.div`
  font-size: 11px;
  text-align: right;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #000;
  th, td {
    border: 1px solid #000;
    padding: 3px 4px;
    vertical-align: middle;
    text-align: center;
  }
  th { font-weight: 600; }
`;

const SignatoryGrid = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 26px;
`;

const SignatoryBlock = styled.div<{ center?: boolean; padTop?: boolean }>`
  width: 33%;
  text-align: center;
  padding-top: ${({ padTop }) => padTop ? '18px' : '0'};
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 11px;
`;

const EmptySpace = styled.div`
  height: 64px;
`;

const Underline = styled.p`
  text-decoration: underline;
  margin: 0;
`;

const PrintableInventoryKIR: React.FC<PrintableInventoryKIRProps> = ({
  data,
  signatories,
  location,
  unitName,
  canViewPrice,
  priceColumnOption,
}) => {
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(price);
  };

  const displayLocation = location === 'Semua Ruangan' ? '-' : location;
  const subHeader = unitName && unitName.toUpperCase() !== 'KELURAHAN BABAKAN'
    ? `${unitName.toUpperCase()} KELURAHAN BABAKAN KECAMATAN LEGOK`
    : 'KELURAHAN BABAKAN KECAMATAN LEGOK';

  return (
    <Wrapper>
      <Header>
        <h1 style={{ fontSize: '13px' }}>KARTU INVENTARIS RUANGAN (KIR)</h1>
        <h2 style={{ fontSize: '12px', marginTop: '2px' }}>{subHeader}</h2>
      </Header>

      <MetaSection>
        <MetaTable>
          <tbody>
            <tr><td>PROVINSI</td><td>: BANTEN</td></tr>
            <tr><td>KABUPATEN</td><td>: TANGERANG</td></tr>
            <tr><td>UNIT</td><td>: PEMERINTAH DAERAH</td></tr>
            <tr><td>SATUAN KERJA</td><td>: KECAMATAN LEGOK</td></tr>
            <tr><td>RUANGAN</td><td>: {String(displayLocation).toUpperCase()}</td></tr>
          </tbody>
        </MetaTable>
        <ModelInfo>
          <p style={{ margin: 0 }}>Model INV. 6</p>
          <p style={{ margin: 0 }}>Nomor Kode Lokasi</p>
        </ModelInfo>
      </MetaSection>

      <Table>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: '3%' }}>NO</th>
            <th rowSpan={2} style={{ width: '25%' }}>Nama Barang / Jenis</th>
            <th rowSpan={2}>Merk/Model</th>
            <th rowSpan={2}>No. Seri Pabrik</th>
            <th rowSpan={2}>Ukuran</th>
            <th rowSpan={2}>Bahan</th>
            <th rowSpan={2} style={{ width: '7%' }}>Tahun Pembuatan / Pembelian</th>
            <th rowSpan={2} style={{ width: '8%' }}>No. Kode Barang</th>
            <th rowSpan={2} style={{ width: '5%' }}>Jumlah Barang</th>
            {canViewPrice && (
              <th rowSpan={2} style={{ width: '10%' }}>
                {priceColumnOption === 'harga' ? 'Harga Beli / Perolehan' : 'Perolehan'}
              </th>
            )}
            <th colSpan={3}>Keadaan Barang</th>
          </tr>
          <tr>
            <th style={{ width: '5%' }}>Baik</th>
            <th style={{ width: '5%' }}>Kurang Baik</th>
            <th style={{ width: '5%' }}>Rusak Berat</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id}>
              <td style={{ textAlign: 'center' }}>{index + 1}</td>
              <td>{item.name}</td>
              <td>{item.brand || '-'}</td>
              <td>{item.serialNumber || '-'}</td>
              <td>{item.size || '-'}</td>
              <td>{item.material || '-'}</td>
              <td style={{ textAlign: 'center' }}>{item.purchaseYear || '-'}</td>
              <td>{item.code}</td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              {canViewPrice && (
                <td style={{ textAlign: priceColumnOption === 'harga' ? 'right' : 'center' }}>
                  {priceColumnOption === 'harga' ? formatPrice(item.purchasePrice) : (item.acquisition || '-')}
                </td>
              )}
              <td style={{ textAlign: 'center' }}>{item.status === 'Baik' ? '✓' : ''}</td>
              <td style={{ textAlign: 'center' }}>{item.status === 'Kurang Baik' || item.status === 'Rusak Ringan' ? '✓' : ''}</td>
              <td style={{ textAlign: 'center' }}>{item.status === 'Rusak Berat' ? '✓' : ''}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={canViewPrice ? 13 : 12} style={{ textAlign: 'center', padding: '14px 4px' }}>
                Tidak ada data untuk ditampilkan.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <SignatoryGrid>
        <SignatoryBlock>
          <p style={{ margin: '0 0 4px' }}>&nbsp;</p>
          <p style={{ margin: '0 0 2px' }}>{signatories.pengurus.jabatan}</p>
          <EmptySpace />
          <Underline>({signatories.pengurus.name || '.....................................'})</Underline>
          {signatories.pengurus.nip && <p style={{ margin: 0 }}>NIP. {signatories.pengurus.nip}</p>}
        </SignatoryBlock>

        <SignatoryBlock padTop>
          <p style={{ margin: '0 0 2px' }}>Mengetahui,</p>
          <p style={{ margin: '0 0 2px' }}>{signatories.mengetahui.jabatan}</p>
          <EmptySpace />
          <Underline>({signatories.mengetahui.name || '.....................................'})</Underline>
          {signatories.mengetahui.nip && <p style={{ margin: 0 }}>NIP. {signatories.mengetahui.nip}</p>}
        </SignatoryBlock>

        <SignatoryBlock>
          {signatories.kepala && (
            <>
              <p style={{ margin: '0 0 2px' }}>Babakan, {printDate}</p>
              <p style={{ margin: '0 0 2px' }}>{signatories.kepala.jabatan}</p>
              <EmptySpace />
              <Underline>({signatories.kepala.name || '.....................................'})</Underline>
              {signatories.kepala.nip && <p style={{ margin: 0 }}>NIP. {signatories.kepala.nip}</p>}
            </>
          )}
        </SignatoryBlock>
      </SignatoryGrid>
    </Wrapper>
  );
};

export default PrintableInventoryKIR;
