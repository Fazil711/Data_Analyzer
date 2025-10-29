
import React from 'react';
import { FileUpload } from './FileUpload';
import { Spinner } from './Spinner';

interface WelcomeProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

export const Welcome: React.FC<WelcomeProps> = ({ onFileUpload, isLoading, error }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">Unlock Insights from Your Data</h1>
      <p className="max-w-2xl text-lg text-gray-400 mb-8">
        Upload a CSV to get instant statistics, visualize correlations, and ask complex questions in plain English.
      </p>
      
      <div className="w-full max-w-lg mb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Spinner />
            <p className="mt-4 text-gray-400">Processing your data...</p>
          </div>
        ) : (
          <FileUpload onFileUpload={onFileUpload} isLoading={isLoading} />
        )}
      </div>

      {error && (
        <div className="mt-4 max-w-lg w-full bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md" role="alert">
          <p><strong className="font-bold">Oh no!</strong> {error}</p>
        </div>
      )}
    </div>
  );
};
