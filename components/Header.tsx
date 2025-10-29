
import React from 'react';

export const Header: React.FC = () => (
  <header className="bg-gray-900/50 border-b border-gray-700/50 backdrop-blur-sm sticky top-0 z-10">
    <div className="container mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
       <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex-shrink-0"></div>
       <div>
         <h1 className="text-xl font-bold text-white">CSV Data Analysis</h1>
         <p className="text-sm text-gray-400">Instant Insights with Gemini AI</p>
       </div>
    </div>
  </header>
);
