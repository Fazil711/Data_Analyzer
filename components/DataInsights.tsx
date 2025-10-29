import React, from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, ZAxis } from 'recharts';
import type { DataRecord, ColumnStats, CorrelationMatrix } from '../types';
import { CloseIcon, InfoIcon } from './icons';

interface DataInsightsProps {
  fileName: string;
  data: DataRecord[];
  columnStats: ColumnStats[];
  correlationMatrix: CorrelationMatrix | null;
  onReset: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg flex items-start">
        {icon && <div className="mr-4 text-indigo-400">{icon}</div>}
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg text-sm">
        <p className="font-bold text-gray-200">{`'${data.x}' vs '${data.y}'`}</p>
        <p className="text-gray-300">Correlation: <span className="font-semibold">{data.value.toFixed(3)}</span></p>
      </div>
    );
  }
  return null;
};

const CorrelationHeatmap: React.FC<{ matrixData: CorrelationMatrix }> = ({ matrixData }) => {
    const { columns, matrix } = matrixData;

    if (columns.length < 2) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Not enough numeric columns for a correlation heatmap.
        </div>
      );
    }
    
    const dataForChart = [];
    for (let i = 0; i < columns.length; i++) {
        for (let j = 0; j < columns.length; j++) {
            if (matrix[i][j] !== null) {
                dataForChart.push({ x: columns[i], y: columns[j], value: matrix[i][j] });
            }
        }
    }

    const colorScale = (value: number) => {
      if (value === null) return 'rgba(107, 114, 128, 0.2)'; // Gray for null
      const alpha = Math.abs(value);
      return value > 0 ? `rgba(74, 222, 128, ${alpha})` : `rgba(248, 113, 113, ${alpha})`; // Green for positive, Red for negative
    };

    return (
        <div style={{ width: '100%', height: Math.max(300, columns.length * 30 + 100) }}>
            <ResponsiveContainer>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20 + columns.length * 5, left: 20 + columns.length * 5 }}>
                    <XAxis 
                      dataKey="x" 
                      type="category" 
                      // Fix: The 'data' prop does not exist on XAxis. Use 'ticks' to specify axis labels.
                      ticks={columns}
                      name=""
                      interval={0}
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                      tickLine={{ stroke: '#4b5563' }}
                      axisLine={{ stroke: '#4b5563' }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      dataKey="y" 
                      type="category" 
                      // Fix: The 'data' prop does not exist on YAxis. Use 'ticks' to specify axis labels.
                      ticks={columns}
                      name=""
                      interval={0}
                      reversed={true}
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                      tickLine={{ stroke: '#4b5563' }}
                      axisLine={{ stroke: '#4b5563' }}
                    />
                    <ZAxis dataKey="value" domain={[-1, 1]} range={[0, 1000]} />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={dataForChart} shape="square">
                      {dataForChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colorScale(entry.value)} />
                      ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};


export const DataInsights: React.FC<DataInsightsProps> = ({ fileName, data, columnStats, correlationMatrix, onReset }) => {
  const totalRows = data.length;
  const totalCols = columnStats.length;

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 md:p-6 flex-grow flex flex-col">
      <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Data Insights</h2>
          <button onClick={onReset} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
              <CloseIcon />
          </button>
      </div>
      <p className="text-gray-400 mb-6">Analysis of <span className="font-semibold text-indigo-400">{fileName}</span></p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Rows" value={totalRows.toLocaleString()} />
          <StatCard title="Total Columns" value={totalCols.toLocaleString()} />
          <StatCard title="Total Cells" value={(totalRows * totalCols).toLocaleString()} />
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">
          {/* Column Statistics Table */}
          <div className="lg:w-1/2 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-3">Column Statistics</h3>
            <div className="flex-grow overflow-y-auto pr-2 bg-gray-900/50 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-800">
                        <tr>
                            <th className="p-3">Column</th>
                            <th className="p-3 text-right">Missing</th>
                            <th className="p-3 text-right">Mean</th>
                            <th className="p-3 text-right">Min / Max</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {columnStats.map(stat => (
                            <tr key={stat.column} className="hover:bg-gray-700/50">
                                <td className="p-3 font-medium text-gray-300">{stat.column}</td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={stat.missing > 0 ? 'text-amber-400' : 'text-gray-400'}>{stat.missing}</span>
                                    <div className="w-16 h-2 bg-gray-700 rounded-full">
                                      <div className="h-2 bg-amber-500 rounded-full" style={{width: `${(stat.missing / stat.count) * 100}%`}}></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-right text-gray-400">{stat.mean !== undefined ? stat.mean.toFixed(2) : 'N/A'}</td>
                                <td className="p-3 text-right text-gray-400">
                                  {stat.min !== undefined && stat.max !== undefined ? `${stat.min.toFixed(2)} / ${stat.max.toFixed(2)}` : 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
          
          {/* Correlation Heatmap */}
          <div className="lg:w-1/2 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-3">Correlation Heatmap</h3>
            <div className="flex-grow bg-gray-900/50 rounded-lg p-4">
                {correlationMatrix ? <CorrelationHeatmap matrixData={correlationMatrix} /> : <p>Calculating correlations...</p>}
            </div>
          </div>
      </div>
    </div>
  );
};