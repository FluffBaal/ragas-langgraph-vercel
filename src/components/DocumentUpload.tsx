'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { formatFileSize } from '@/lib/utils';

interface DocumentUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['.txt', '.md', '.pdf'],
  disabled = false
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setErrors([]);
    
    // Handle rejected files
    const newErrors: string[] = [];
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          newErrors.push(`${file.name}: File too large (max ${formatFileSize(maxSize)})`);
        } else if (error.code === 'file-invalid-type') {
          newErrors.push(`${file.name}: Invalid file type`);
        }
      });
    });
    
    // Check total file count
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      newErrors.push(`Too many files (max ${maxFiles})`);
      acceptedFiles = acceptedFiles.slice(0, maxFiles - uploadedFiles.length);
    }
    
    setErrors(newErrors);
    
    if (acceptedFiles.length > 0) {
      const newFiles = [...uploadedFiles, ...acceptedFiles];
      setUploadedFiles(newFiles);
      onUpload(newFiles);
    }
  }, [uploadedFiles, maxFiles, maxSize, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf']
    },
    maxSize,
    disabled
  });

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onUpload(newFiles);
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setErrors([]);
    onUpload([]);
  };

  return (
    <div className="w-full space-y-4">
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50 scale-105' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className={`mx-auto h-12 w-12 mb-4 transition-colors ${
            isDragActive ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop files here' : 'Upload documents'}
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-xs text-gray-400">
            Supports: {acceptedTypes.join(', ')} (max {formatFileSize(maxSize)} each)
          </p>
        </div>
      </Card>

      {errors.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">Upload Errors</h3>
          </div>
          <ul className="mt-2 text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2 flex-shrink-0"></span>
                {error}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {uploadedFiles.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={disabled}
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <File className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  className="ml-2 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

