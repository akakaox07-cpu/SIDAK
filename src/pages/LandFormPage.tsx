import React from 'react';
import AssetFormPage from './AssetFormPage';
import { Asset } from '@/types';

interface Props {
  onSave: (asset: Omit<Asset, 'id' | 'tanggalInput'>) => void | Promise<void>;
  onCancel: () => void;
  asset?: Asset | null;
}

const LandFormPage: React.FC<Props> = (props) => {
  return <AssetFormPage {...props} formType="land" />;
};

export default LandFormPage;
