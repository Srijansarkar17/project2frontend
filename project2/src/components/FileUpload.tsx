import React, { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, Loader2 } from 'lucide-react';
import type { ProcessingResult } from '../types';

// API base URL - change this if your Flask server runs on a different port
const API_BASE_URL = 'https://project2backenddeploy-production.up.railway.app';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Test backend connection
  const testBackendConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      console.log('Backend connection:', data);
      return data.status === 'healthy';
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  };

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Please select a valid .xlsx file');
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    // Test backend connection first
    const isBackendHealthy = await testBackendConnection();
    if (!isBackendHealthy) {
      setError(`Cannot connect to backend server. Make sure Flask is running on ${API_BASE_URL}`);
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        // Handle both possible error structures
        const errorMessage = data.error || data.message || `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      // Type assertion since we know it's a ProcessingResult when successful
      const processedResult = data as ProcessingResult;
      
      // Update download URL to include the full backend URL
      if (processedResult.download_url) {
        processedResult.download_url = `${API_BASE_URL}${processedResult.download_url}`;
      }

      setResult(processedResult);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while uploading the file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (): Promise<void> => {
    if (!result?.download_url) return;

    try {
      const response = await fetch(result.download_url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.stats.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const handleReset = (): void => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Test backend connection on component mount
  React.useEffect(() => {
    testBackendConnection().then(isHealthy => {
      if (!isHealthy) {
        console.warn('Backend server is not reachable');
      }
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Transactions Processor</h1>
            <p className="text-gray-600 mt-1">Upload Excel files to process stock transaction data</p>
            <p className="text-sm text-gray-500 mt-1">
              Backend: <span className="font-mono">{API_BASE_URL}</span>
            </p>
          </div>
          <FileText className="w-8 h-8 text-primary-600" />
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Hidden file input with proper id */}
          <input
            type="file"
            id="file-input"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileInputChange}
          />
          
          <div className="flex flex-col items-center">
            <Upload className={`w-12 h-12 mb-4 ${
              dragActive ? 'text-primary-600' : 'text-gray-400'
            }`} />
            
            <div className="text-gray-700 mb-2">
              <label
                htmlFor="file-input"
                className="text-primary-600 hover:text-primary-700 cursor-pointer font-medium underline"
              >
                Click to upload
              </label>
              <span className="ml-1">or drag and drop</span>
            </div>
            <p className="text-gray-500 text-sm">Excel files (.xlsx) only</p>
            
            {file && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-700 truncate">{file.name}</div>
                    <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          {!result && (
            <>
              <button
                onClick={handleReset}
                className="btn-secondary"
                disabled={uploading}
              >
                Clear
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="btn-primary flex items-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process File'
                )}
              </button>
            </>
          )}
          {result && (
            <>
              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                Process Another File
              </button>
              <button
                onClick={handleDownload}
                className="btn-primary flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Results
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="card">
          <div className="flex items-center mb-6">
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Processing Complete</h2>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-600 font-medium">Total Records</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {result.stats.total_records.toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="text-sm text-green-600 font-medium">Output File</div>
              <div className="font-medium text-gray-900 mt-1 truncate" title={result.stats.filename}>
                {result.stats.filename}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="text-sm text-purple-600 font-medium">Columns</div>
              <div className="font-medium text-gray-900 mt-1">
                {result.stats.columns.length}
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Preview</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {result.stats.columns.map((column) => (
                      <th
                        key={column}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.stats.preview.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {result.stats.columns.map((column) => (
                        <td
                          key={column}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                        >
                          {row[column] !== null && row[column] !== undefined && row[column] !== ''
                            ? typeof row[column] === 'number'
                              ? row[column].toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })
                              : row[column]
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Showing first {result.stats.preview.length} records. Download the complete file for all {result.stats.total_records.toLocaleString()} records.
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!result && (
        <div className="card mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Upload an Excel (.xlsx) file containing stock transaction data</li>
            <li>The system will automatically process the file using predefined rules</li>
            <li>SYS18 and SYS27 codes will be filtered out</li>
            <li>Buy and sell transactions will be consolidated</li>
            <li>Large transactions (quantity &gt; 10,000 or value &gt; 1,000,000) will be extracted</li>
            <li>Download the processed results as a CSV file</li>
          </ol>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> The Excel file must follow the specific format used by the original processing script.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;