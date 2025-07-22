'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { MarkdownRenderer } from './MarkdownRenderer';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  MessageSquare, 
  BookOpen,
  BarChart3,
  Copy,
  Check
} from 'lucide-react';
import { GenerationResult } from '@/types';
import { formatTimestamp } from '@/lib/utils';

interface ResultsDisplayProps {
  results: GenerationResult;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'answers' | 'contexts'>('overview');
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(Array.from(prev).concat(id)));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getEvolutionTypeColor = (type: string) => {
    switch (type) {
      case 'simple': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'multi_context': return 'bg-green-100 text-green-800 border-green-200';
      case 'reasoning': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'questions', label: 'Questions', icon: MessageSquare },
    { id: 'answers', label: 'Answers', icon: FileText },
    { id: 'contexts', label: 'Contexts', icon: BookOpen }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </CardContent>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Questions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {results.generation_metadata.total_questions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Simple Evolution</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {results.generation_metadata.evolution_types_count.simple || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Multi-Context</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {results.generation_metadata.evolution_types_count.multi_context || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Reasoning</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {results.generation_metadata.evolution_types_count.reasoning || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Generation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Generation Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Generated:</dt>
                      <dd className="text-gray-900">{formatTimestamp(results.generation_metadata.generation_timestamp)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Total Questions:</dt>
                      <dd className="text-gray-900">{results.generation_metadata.total_questions}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Answers Generated:</dt>
                      <dd className="text-gray-900">{results.question_answers.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Contexts Retrieved:</dt>
                      <dd className="text-gray-900">{results.question_contexts.length}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Evolution Types</h4>
                  <div className="space-y-2">
                    {Object.entries(results.generation_metadata.evolution_types_count).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <Badge className={getEvolutionTypeColor(type)}>
                          {type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-600">{count} questions</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {results.evolved_questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge className={getEvolutionTypeColor(question.evolution_type)}>
                        {question.evolution_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Complexity: {question.complexity_score}/10
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(question.question, `question-${question.id}`)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedItems.has(`question-${question.id}`) ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2 whitespace-pre-wrap">
                      {question.question}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sources: {question.source_document_ids.join(', ')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleQuestion(question.id)}
                  >
                    {expandedQuestions.has(question.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {expandedQuestions.has(question.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="overflow-hidden">
                        <p className="font-medium text-gray-700 mb-1">Original Question:</p>
                        <p className="text-gray-600 whitespace-pre-wrap break-words overflow-x-auto">
                          {question.metadata.original_question || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Evolution Time:</p>
                        <p className="text-gray-600">
                          {formatTimestamp(question.metadata.evolution_timestamp)}
                        </p>
                      </div>
                      {question.metadata.requires_reasoning && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Requires Reasoning:</p>
                          <Badge variant="outline">Yes</Badge>
                        </div>
                      )}
                      {question.metadata.requires_multiple_contexts && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Multiple Contexts:</p>
                          <Badge variant="outline">Yes</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Answers Tab */}
      {activeTab === 'answers' && (
        <div className="space-y-4">
          {results.question_answers.map((qa, index) => {
            const question = results.evolved_questions.find(q => q.id === qa.question_id);
            return (
              <Card key={qa.question_id}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 whitespace-pre-wrap">
                      {question?.question || 'Question not found'}
                    </h3>
                    <div className="flex items-center space-x-3">
                      {question && (
                        <Badge className={getEvolutionTypeColor(question.evolution_type)}>
                          {question.evolution_type.replace('_', ' ')}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        Confidence: {(qa.confidence_score * 100).toFixed(1)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(qa.answer, `answer-${qa.question_id}`)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedItems.has(`answer-${qa.question_id}`) ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <MarkdownRenderer content={qa.answer} />
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    Sources: {qa.source_documents.join(', ')}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contexts Tab */}
      {activeTab === 'contexts' && (
        <div className="space-y-4">
          {results.question_contexts.map((qc, index) => {
            const question = results.evolved_questions.find(q => q.id === qc.question_id);
            return (
              <Card key={qc.question_id}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 whitespace-pre-wrap">
                      {question?.question || 'Question not found'}
                    </h3>
                    {question && (
                      <Badge className={getEvolutionTypeColor(question.evolution_type)}>
                        {question.evolution_type.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-3">
                    {qc.contexts.map((context, contextIndex) => (
                      <div key={contextIndex} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Context {contextIndex + 1}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              Relevance: {(qc.relevance_scores[contextIndex] * 100).toFixed(1)}%
                            </span>
                            <span className="text-sm text-gray-500">
                              Source: {qc.context_sources[contextIndex]}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(context, `context-${qc.question_id}-${contextIndex}`)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedItems.has(`context-${qc.question_id}-${contextIndex}`) ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <pre className="text-gray-800 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {context}
                        </pre>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

