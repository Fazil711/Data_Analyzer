
import React, { useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3-dsv';
import { FileUpload } from './components/FileUpload';
import { DataInsights } from './components/DataInsights';
import { QaSection } from './components/QaSection';
import { Header } from './components/Header';
import { Welcome } from './components/Welcome';
import { Spinner } from './components/Spinner';
import type { DataRecord, ColumnStats, CorrelationMatrix, ChatMessage } from './types';
import { processDataForInsights } from './services/dataService';
import { askQuestionAboutData } from './services/geminiService';

export default function App() {
  const [data, setData] = useState<DataRecord[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [columnStats, setColumnStats] = useState<ColumnStats[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationMatrix | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);

  const handleFileUpload = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);
    setData([]);
    setFileName('');
    setColumnStats([]);
    setCorrelationMatrix(null);
    setChatHistory([]);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvString = event.target?.result as string;
        if (!csvString) {
          throw new Error("File is empty or could not be read.");
        }
        const parsedData = d3.csvParse(csvString);
        
        // Convert empty strings to null and numeric strings to numbers
        const cleanedData: DataRecord[] = parsedData.map(row => {
          const newRow: DataRecord = {};
          for (const key in row) {
            const value = row[key];
            if (value === "") {
              newRow[key] = null;
            } else if (value && !isNaN(Number(value))) {
              newRow[key] = Number(value);
            } else {
              newRow[key] = value;
            }
          }
          return newRow;
        });

        if (cleanedData.length === 0) {
          throw new Error("CSV file contains no data rows.");
        }
        
        setData(cleanedData as DataRecord[]);
        setFileName(file.name);

        const { stats, matrix } = processDataForInsights(cleanedData as DataRecord[]);
        setColumnStats(stats);
        setCorrelationMatrix(matrix);

      } catch (e) {
        setError(e instanceof Error ? `Error parsing CSV: ${e.message}` : 'An unknown error occurred during parsing.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, []);

  const handleAskQuestion = useCallback(async (question: string) => {
    setIsAnswering(true);
    const userMessage: ChatMessage = { role: 'user', content: question };
    
    // Optimistically update UI
    setChatHistory(prev => [...prev, userMessage, { role: 'model', content: '' }]);

    try {
      const stream = await askQuestionAboutData(question, data);
      
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMessage = newHistory[newHistory.length - 1];
          if (lastMessage && lastMessage.role === 'model') {
            lastMessage.content += chunkText;
          }
          return newHistory;
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setChatHistory(prev => {
        const newHistory = [...prev];
        const lastMessage = newHistory[newHistory.length - 1];
        if (lastMessage && lastMessage.role === 'model') {
          lastMessage.content = `Error: ${errorMessage}`;
          lastMessage.isError = true;
        } else {
            newHistory.push({ role: 'model', content: `Error: ${errorMessage}`, isError: true });
        }
        return newHistory;
      });
    } finally {
      setIsAnswering(false);
    }
  }, [data]);

  const hasData = useMemo(() => data.length > 0, [data]);

  const resetState = useCallback(() => {
    setData([]);
    setFileName('');
    setError(null);
    setIsLoading(false);
    setColumnStats([]);
    setCorrelationMatrix(null);
    setChatHistory([]);
    setIsAnswering(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        {!hasData ? (
          <Welcome onFileUpload={handleFileUpload} isLoading={isLoading} error={error} />
        ) : (
          <div className="flex-grow flex flex-col gap-8">
            <DataInsights
              fileName={fileName}
              data={data}
              columnStats={columnStats}
              correlationMatrix={correlationMatrix}
              onReset={resetState}
            />
            <QaSection
              chatHistory={chatHistory}
              onAskQuestion={handleAskQuestion}
              isAnswering={isAnswering}
            />
          </div>
        )}
      </main>
    </div>
  );
}
