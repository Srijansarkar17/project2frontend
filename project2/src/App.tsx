import React from 'react';
import FileUpload from './components/FileUpload';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <FileUpload />
        
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-500 text-sm">
            <p>Stock Transactions Processor v1.0</p>
            <p className="mt-1">Upload Excel files for automated processing and analysis</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;