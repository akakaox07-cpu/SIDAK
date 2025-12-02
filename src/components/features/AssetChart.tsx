import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Asset, AssetStatus } from '@/types';

interface AssetChartProps {
  data: Asset[];
}

// FIX: Corrected COLORS keys to match AssetStatus enum values.
const COLORS: Record<AssetStatus, string> = {
    [AssetStatus.Baik]: '#10B981', // Emerald 500
    [AssetStatus.RusakRingan]: '#F59E0B', // Amber 500
    [AssetStatus.RusakBerat]: '#EF4444', // Red 500
};

const AssetChart: React.FC<AssetChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    // FIX: Use 'keadaanBarang' instead of 'status' to correctly count assets.
    const statusCounts = data.reduce((acc, asset) => {
      acc[asset.keadaanBarang] = (acc[asset.keadaanBarang] || 0) + 1;
      return acc;
    }, {} as Record<AssetStatus, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name as AssetStatus,
      value,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No data to display</div>
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderColor: '#e5e7eb',
                        borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#1f2937' }} 
                    itemStyle={{ color: '#374151' }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    </div>
  );
};

export default AssetChart;