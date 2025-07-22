// Core RAGAS Types
export interface RAGASState {
  documents: Document[];
  processed_docs: ProcessedDocument[];
  evolved_questions: EvolvedQuestion[];
  question_answers: QuestionAnswer[];
  question_contexts: QuestionContext[];
  errors: string[];
}

export interface ProcessedDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  initial_questions: string[];
}

export interface EvolvedQuestion {
  id: string;
  question: string;
  evolution_type: 'simple' | 'multi_context' | 'reasoning';
  complexity_score: number;
  source_document_ids: string[];
  metadata: {
    original_question?: string;
    evolution_timestamp: string;
    requires_reasoning?: boolean;
    requires_multiple_contexts?: boolean;
    [key: string]: any;
  };
}

export interface QuestionAnswer {
  question_id: string;
  answer: string;
  confidence_score: number;
  source_documents: string[];
}

export interface QuestionContext {
  question_id: string;
  contexts: string[];
  relevance_scores: number[];
  context_sources: string[];
}

// Generation Configuration
export interface GenerationConfig {
  maxQuestions: number;
  evolutionTypes: ('simple' | 'multi_context' | 'reasoning')[];
  complexityTarget: number;
  language: string;
  includeMetadata: boolean;
  openaiApiKey?: string;
}

// API Response Types
export interface GenerationResult {
  evolved_questions: EvolvedQuestion[];
  question_answers: QuestionAnswer[];
  question_contexts: QuestionContext[];
  generation_metadata: {
    total_questions: number;
    evolution_types_count: {
      simple: number;
      multi_context: number;
      reasoning: number;
    };
    processing_errors: string[];
    generation_timestamp: string;
  };
}

export interface APIError {
  error: string;
  code?: string;
  details?: any;
}

// UI Component Types
export interface DocumentUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

export interface GenerationFormProps {
  onGenerate: (files: File[], config: GenerationConfig) => Promise<void>;
  isGenerating: boolean;
  progress: number;
  currentStage: string;
  results: GenerationResult | null;
}

export interface ResultsDisplayProps {
  results: GenerationResult;
}

// Document Type (from LangChain)
export interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

