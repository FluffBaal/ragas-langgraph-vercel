'use client';

import React, { useState, useEffect } from 'react';
import { DocumentUpload } from './DocumentUpload';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Progress } from './ui/Progress';
import { Settings, Play, Download, Loader2, UploadCloud } from 'lucide-react';
import { GenerationConfig, GenerationResult } from '@/types';

interface GenerationFormProps {
  onGenerate: (files: File[], config: GenerationConfig) => Promise<void>;
  isGenerating: boolean;
  progress: number;
  currentStage: string;
  results: GenerationResult | null;
}

export const GenerationForm: React.FC<GenerationFormProps> = ({
  onGenerate,
  isGenerating,
  progress,
  currentStage,
  results
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [config, setConfig] = useState<GenerationConfig>({
    maxQuestions: 10,
    evolutionTypes: ['simple', 'multi_context', 'reasoning'],
    complexityTarget: 5,
    language: 'en',
    includeMetadata: true,
    openaiApiKey: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setConfig(prev => ({ ...prev, openaiApiKey: savedApiKey }));
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (config.openaiApiKey) {
      localStorage.setItem('openai_api_key', config.openaiApiKey);
    }
  }, [config.openaiApiKey]);

  const handleGenerate = async () => {
    if (files.length === 0) return;
    await onGenerate(files, config);
  };

  const downloadResults = () => {
    if (!results) return;
    
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ragas-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const evolutionTypeLabels = {
    simple: 'Simple Evolution',
    multi_context: 'Multi-Context Evolution',
    reasoning: 'Reasoning Evolution'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UploadCloud className="h-5 w-5 mr-2" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUpload
            onUpload={setFiles}
            disabled={isGenerating}
          />
        </CardContent>
      </Card>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">OpenAI API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={config.openaiApiKey || ''}
                onChange={(e) => setConfig({
                  ...config,
                  openaiApiKey: e.target.value
                })}
                placeholder="Enter your OpenAI API key"
                className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                disabled={isGenerating}
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Your API key is sent directly to OpenAI and is not stored on our servers. Get your key from{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  platform.openai.com
                </a>
              </p>
              {config.openaiApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setConfig({ ...config, openaiApiKey: '' });
                    localStorage.removeItem('openai_api_key');
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                  disabled={isGenerating}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Generation Settings
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={isGenerating}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Questions
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.maxQuestions}
                onChange={(e) => setConfig({
                  ...config,
                  maxQuestions: parseInt(e.target.value) || 10
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complexity Target (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.complexityTarget}
                onChange={(e) => setConfig({
                  ...config,
                  complexityTarget: parseInt(e.target.value) || 5
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              />
            </div>
          </div>

          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Evolution Types
                </label>
                <div className="space-y-2">
                  {(['simple', 'multi_context', 'reasoning'] as const).map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.evolutionTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfig({
                              ...config,
                              evolutionTypes: [...config.evolutionTypes, type]
                            });
                          } else {
                            setConfig({
                              ...config,
                              evolutionTypes: config.evolutionTypes.filter(t => t !== type)
                            });
                          }
                        }}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isGenerating}
                      />
                      <span className="text-sm text-gray-700">
                        {evolutionTypeLabels[type]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={config.language}
                    onChange={(e) => setConfig({
                      ...config,
                      language: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeMetadata"
                    checked={config.includeMetadata}
                    onChange={(e) => setConfig({
                      ...config,
                      includeMetadata: e.target.checked
                    })}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isGenerating}
                  />
                  <label htmlFor="includeMetadata" className="text-sm text-gray-700">
                    Include detailed metadata
                  </label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Generate Synthetic Data</h2>
              <p className="text-sm text-gray-600 mt-1">
                {files.length} document{files.length !== 1 ? 's' : ''} ready for processing
              </p>
            </div>
            
            <div className="flex space-x-3">
              {results && (
                <Button
                  variant="outline"
                  onClick={downloadResults}
                  disabled={isGenerating}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Results
                </Button>
              )}
              
              <Button
                onClick={handleGenerate}
                disabled={files.length === 0 || isGenerating || config.evolutionTypes.length === 0 || !config.openaiApiKey}
                className="min-w-[120px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {currentStage}
                </span>
                <span className="text-gray-500">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500">
                This may take a few minutes depending on document size and complexity.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

