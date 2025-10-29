
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      setIsDragging(isEntering);
    }
  }, [isLoading]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    if (!isLoading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload, isLoading, handleDragEvents]);

  const dragOverClasses = isDragging ? 'border-indigo-400 bg-gray-700/50' : 'border-gray-600 hover:border-indigo-500';

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full max-w-lg p-8 text-center border-2 border-dashed rounded-xl transition-colors duration-300 ${dragOverClasses}`}
      onDragEnter={(e) => handleDragEvents(e, true)}
      onDragLeave={(e) => handleDragEvents(e, false)}
      onDragOver={(e) => handleDragEvents(e, true)}
      onDrop={handleDrop}
    >
      <div className="text-indigo-400 mb-4">
        <UploadIcon />
      </div>
      <p className="text-lg font-semibold text-gray-300">Drag & drop your CSV file here</p>
      <p className="text-gray-500 mt-1">or</p>
      <label htmlFor="file-upload" className="mt-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md cursor-pointer hover:bg-indigo-700 transition-colors duration-200">
        Browse File
      </label>
      <input
        id="file-upload"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />
    </div>
  );
};
