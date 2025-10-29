
export type DataValue = string | number | null | undefined;

export interface DataRecord {
  [key: string]: DataValue;
}

export interface ColumnStats {
  column: string;
  count: number;
  missing: number;
  mean?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  unique?: number;
  isNumeric: boolean;
}

export interface CorrelationMatrix {
  columns: string[];
  matrix: (number | null)[][];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
}
