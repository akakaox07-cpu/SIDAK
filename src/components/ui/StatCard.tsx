
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  // Guard against NaN and undefined: ensure displayValue is always string or valid number
  let displayValue: string | number = '-';
  
  if (typeof value === 'number' && Number.isFinite(value)) {
    displayValue = value.toLocaleString('id-ID');
  } else if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    displayValue = Number.isFinite(parsed) ? parsed.toLocaleString('id-ID') : value;
  } else if (value !== null && value !== undefined && !Number.isNaN(value)) {
    displayValue = String(value);
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{displayValue}</p>
      </div>
      <div className="bg-blue-600 text-white rounded-full p-3">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;