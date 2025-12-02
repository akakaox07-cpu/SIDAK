import React from 'react';
import AssetFormPage from './AssetFormPage';
import { Asset } from '@/types';

interface Props {
  onSave: (asset: Omit<Asset, 'id' | 'tanggalInput'>) => void | Promise<void>;
  onCancel: () => void;
  asset?: Asset | null;
}

const BuildingFormPage: React.FC<Props> = (props) => {
  return <AssetFormPage {...props} formType="building" />;
};

export default BuildingFormPage;
