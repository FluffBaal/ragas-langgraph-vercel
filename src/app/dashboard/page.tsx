'use client';

import React, { useState, useCallback } from 'react';
import { GenerationForm } from '@/components/GenerationForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { GenerationConfig, GenerationResult } from '@/types';

export default function DashboardPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [results, setResults] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulateProgress = useCallback(() => {
    const stages = [
      'Processing documents...',
      'Extracting initial questions...',
      'Applying simple evolution...',
      'Generating multi-context questions...',
      'Creating reasoning questions...',
      'Generating answers...',
      'Retrieving contexts...',
      'Finalizing results...'
    ];

    let currentStageIndex = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      if (currentProgress >= 100) {
        clearInterval(interval);
        return;
      }

      currentProgress += Math.random() * 15 + 5;
      currentProgress = Math.min(currentProgress, 100);
      
      if (currentProgress > (currentStageIndex + 1) * (100 / stages.length)) {
        currentStageIndex = Math.min(currentStageIndex + 1, stages.length - 1);
      }

      setProgress(Math.floor(currentProgress));
      setCurrentStage(stages[currentStageIndex]);
    }, 1000);

    return interval;
  }, []);

  const handleGenerate = async (files: File[], config: GenerationConfig) => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentStage('Initializing...');
    setError(null);
    setResults(null);

    const progressInterval = simulateProgress();

    try {
      const formData = new FormData();
      
      // Add files
      files.forEach((file, index) => {
        formData.append(`document_${index}`, file);
      });
      
      // Add configuration
      formData.append('config', JSON.stringify(config));

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            // Use default error message
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Complete the progress
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStage('Generation complete!');
      
      // Show results after a brief delay
      setTimeout(() => {
        setResults(data);
        setIsGenerating(false);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsGenerating(false);
      setProgress(0);
      setCurrentStage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              RAGAS Synthetic Data Generation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Generate high-quality synthetic training data using LangGraph Agent architecture 
              with Evol-Instruct methodology. Transform your documents into evolved questions, 
              comprehensive answers, and relevant contexts.
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  LangGraph Architecture
                </h3>
                <p className="text-sm text-gray-600">
                  Agent-based processing pipeline with specialized evolution agents
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Three Evolution Types
                </h3>
                <p className="text-sm text-gray-600">
                  Simple, Multi-Context, and Reasoning evolution for comprehensive coverage
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Production Ready
                </h3>
                <p className="text-sm text-gray-600">
                  Deployed on Vercel with security, monitoring, and scalability
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Generation Error:</strong> {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Generation Form */}
        {!results && (
          <div className="animate-fade-in">
            <GenerationForm
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              progress={progress}
              currentStage={currentStage}
              results={results}
            />
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Generation Results</h2>
                <p className="text-gray-600">
                  Successfully generated {results.generation_metadata.total_questions} questions 
                  with answers and contexts
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setResults(null);
                    setError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Generate New
                </button>
              </div>
            </div>
            <ResultsDisplay results={results} />
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardContent className="p-6">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Generating Synthetic Data
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {currentStage}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {progress}% complete
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

