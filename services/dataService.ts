
import type { DataRecord, ColumnStats, CorrelationMatrix } from '../types';

function getNumericValues(data: DataRecord[], column: string): number[] {
  return data.map(row => row[column]).filter(val => typeof val === 'number' && isFinite(val)) as number[];
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, val) => acc + val, 0) / values.length;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function calculatePearsonCorrelation(x: number[], y: number[], meanX: number, meanY: number): number | null {
  const n = x.length;
  if (n !== y.length || n === 0) return null;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX) * Math.sqrt(sumSqY);
  if (denominator === 0) return null; // Avoid division by zero if one variable is constant

  return numerator / denominator;
}

export function processDataForInsights(data: DataRecord[]): { stats: ColumnStats[], matrix: CorrelationMatrix } {
  if (data.length === 0) {
    return { stats: [], matrix: { columns: [], matrix: [] } };
  }

  const headers = Object.keys(data[0]);
  const stats: ColumnStats[] = headers.map(header => {
    const allValues = data.map(row => row[header]);
    const numericValues = getNumericValues(data, header);
    
    const isNumeric = numericValues.length > 0 && (numericValues.length / allValues.filter(v => v !== null).length > 0.8); // Heuristic: if >80% of non-null are numeric
    const columnStat: ColumnStats = {
      column: header,
      count: data.length,
      missing: allValues.filter(val => val === null || val === undefined).length,
      isNumeric,
    };

    if (isNumeric && numericValues.length > 0) {
      const mean = calculateMean(numericValues);
      columnStat.mean = mean;
      columnStat.stdDev = calculateStdDev(numericValues, mean);
      columnStat.min = Math.min(...numericValues);
      columnStat.max = Math.max(...numericValues);
    } else {
      const uniqueValues = new Set(allValues.filter(v => v !== null));
      columnStat.unique = uniqueValues.size;
    }
    
    return columnStat;
  });

  const numericColumns = stats.filter(s => s.isNumeric).map(s => s.column);
  const matrix: (number | null)[][] = Array(numericColumns.length).fill(null).map(() => Array(numericColumns.length).fill(null));
  
  const numericDataCache: { [key: string]: { values: number[], mean: number } } = {};

  numericColumns.forEach(col => {
      const values = getNumericValues(data, col);
      numericDataCache[col] = { values, mean: calculateMean(values) };
  });

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i; j < numericColumns.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
        continue;
      }
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      
      const col1Data = numericDataCache[col1];
      const col2Data = numericDataCache[col2];

      // Align data by finding common non-null indices
      const alignedX: number[] = [];
      const alignedY: number[] = [];
      for(let k = 0; k < data.length; k++) {
        const val1 = data[k][col1];
        const val2 = data[k][col2];
        if (typeof val1 === 'number' && isFinite(val1) && typeof val2 === 'number' && isFinite(val2)) {
          alignedX.push(val1);
          alignedY.push(val2);
        }
      }

      const meanX = alignedX.length > 0 ? calculateMean(alignedX) : 0;
      const meanY = alignedY.length > 0 ? calculateMean(alignedY) : 0;

      const correlation = calculatePearsonCorrelation(alignedX, alignedY, meanX, meanY);
      matrix[i][j] = correlation;
      matrix[j][i] = correlation;
    }
  }

  const correlationMatrix: CorrelationMatrix = {
    columns: numericColumns,
    matrix
  };
  
  return { stats, matrix: correlationMatrix };
}
