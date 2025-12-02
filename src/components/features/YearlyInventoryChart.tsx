import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface YearlyData {
  year: string;
  barang: number;
  tanah: number;
  bangunan: number;
}

interface YearlyInventoryChartProps {
  data: YearlyData[];
}

const YearlyInventoryChart: React.FC<YearlyInventoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No inventory data available for the chart.</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%' }} className="w-full min-h-[240px]">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="currentColor" />
          <XAxis dataKey="year" stroke="currentColor" style={{ fontSize: '12px' }} />
          <YAxis allowDecimals={false} stroke="currentColor" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: '#e5e7eb',
              borderRadius: '0.5rem',
              color: '#1f2937',
              fontSize: '12px',
            }}
            labelStyle={{ fontWeight: 'bold' }}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line 
            type="monotone" 
            dataKey="barang" 
            name="Barang" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="tanah" 
            name="Tanah" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="bangunan" 
            name="Bangunan" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YearlyInventoryChart;