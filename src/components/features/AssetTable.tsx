import React, { useState } from 'react';
import { Asset, AssetStatus } from '@/types';
import { EditIcon, DeleteIcon } from '@/components/ui';
import { Package, Home, MapPin } from 'lucide-react';

interface AssetTableProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
  onView: (asset: Asset) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

type SortField = 'noKodeBarang' | 'namaBarang' | 'jenisInventaris' | 'sumberPerolehan' | 'keadaanBarang' | 'unit' | null;

const statusColorMap: Record<AssetStatus, string> = {
  [AssetStatus.Baik]: 'bg-green-100 text-green-800',
  [AssetStatus.RusakRingan]: 'bg-yellow-100 text-yellow-800',
  [AssetStatus.RusakBerat]: 'bg-red-100 text-red-800',
};

const getAssetIcon = (jenisInventaris: string) => {
  const jenis = jenisInventaris?.toLowerCase() || '';
  if (jenis.includes('tanah')) return <MapPin size={16} className="text-amber-600" />;
  if (jenis.includes('bangunan')) return <Home size={16} className="text-green-600" />;
  return <Package size={16} className="text-blue-600" />;
};

const SortIcon: React.FC<{ direction?: 'asc' | 'desc' | null }> = ({ direction }) => (
  <svg className="w-4 h-4 inline-block ml-1" fill="currentColor" viewBox="0 0 20 20">
    {direction === 'asc' ? (
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
    ) : direction === 'desc' ? (
      <path fillRule="evenodd" d="M3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" clipRule="evenodd" />
    ) : (
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" opacity={0.3} />
    )}
  </svg>
);

const AssetTable: React.FC<AssetTableProps> = ({ assets, onEdit, onDelete, onView, canEdit = true, canDelete = true }) => {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (assets.length === 0) {
    return <div className="text-center py-10 text-gray-500">No assets found.</div>
  }

  const getCode = (a: Asset) => (a.noKodeBarang as any) || (a as any).kodeBarang || (a as any).kodeTanah || '';
  const getSource = (a: Asset) => (a as any).sumberPerolehan || (a as any).asalUsul || '';
  const getCondition = (a: Asset) => (a as any).keadaanBarang || (a as any).kondisi || '';

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAssets = [...assets].sort((a, b) => {
    if (!sortField) return 0;
    const pick = (x: Asset) => {
      switch (sortField) {
        case 'noKodeBarang': return String(getCode(x)).toLowerCase();
        case 'sumberPerolehan': return String(getSource(x)).toLowerCase();
        case 'keadaanBarang': return String(getCondition(x)).toLowerCase();
        default: return String((x as any)[sortField]).toLowerCase();
      }
    };
    const aVal = pick(a);
    const bVal = pick(b);
    
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-600">
          <tr>
            <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('noKodeBarang')}>
              <div className="flex items-center justify-between">
                <span>No. Kode Barang</span>
                <SortIcon direction={sortField === 'noKodeBarang' ? sortDirection : null} />
              </div>
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('namaBarang')}>
              <div className="flex items-center justify-between">
                <span>Nama Barang</span>
                <SortIcon direction={sortField === 'namaBarang' ? sortDirection : null} />
              </div>
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('jenisInventaris')}>
              <div className="flex items-center justify-between">
                <span>Jenis Inventaris</span>
                <SortIcon direction={sortField === 'jenisInventaris' ? sortDirection : null} />
              </div>
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('sumberPerolehan')}>
              <div className="flex items-center justify-between">
                <span>Sumber Perolehan</span>
                <SortIcon direction={sortField === 'sumberPerolehan' ? sortDirection : null} />
              </div>
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('keadaanBarang')}>
              <div className="flex items-center justify-between">
                <span>Keadaan Barang</span>
                <SortIcon direction={sortField === 'keadaanBarang' ? sortDirection : null} />
              </div>
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('unit')}>
              <div className="flex items-center justify-between">
                <span>Unit</span>
                <SortIcon direction={sortField === 'unit' ? sortDirection : null} />
              </div>
            </th>
            <th scope="col" className="relative px-3 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedAssets.map((asset) => (
            <tr key={asset.id} onClick={() => onView(asset)} className="hover:bg-gray-50 transition-colors cursor-pointer">
              <td className="px-3 py-4 text-sm font-medium text-gray-900">{getCode(asset)}</td>
              <td className="px-3 py-4 text-sm text-gray-500">{asset.namaBarang}</td>
              <td className="px-3 py-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  {getAssetIcon(asset.jenisInventaris)}
                  <span>{asset.jenisInventaris}</span>
                </div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-500">{getSource(asset)}</td>
              <td className="px-3 py-4">
                {getCondition(asset) && statusColorMap[getCondition(asset) as AssetStatus] ? (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[getCondition(asset) as AssetStatus]}`}>
                    {getCondition(asset)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-700">{getCondition(asset) || '-'}</span>
                )}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500">{asset.unit}</td>
              <td className="px-3 py-4 text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-4">
                  {canEdit && (
                    <button onClick={(e) => handleActionClick(e, () => onEdit(asset))} className="text-blue-600 hover:text-blue-900 transition-colors">
                      <EditIcon />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={(e) => handleActionClick(e, () => onDelete(asset.id))} className="text-red-600 hover:text-red-900 transition-colors">
                      <DeleteIcon />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetTable;