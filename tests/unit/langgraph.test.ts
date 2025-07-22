import { RAGASLangGraph } from '@/lib/ragas/langgraph-implementation';
import { ChatOpenAI } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

// Mock LangChain dependencies
jest.mock('@langchain/openai');
jest.mock('langgraph');

const mockLLM = {
  invoke: jest.fn(),
  pipe: jest.fn().mockReturnThis()
} as unknown as jest.Mocked<ChatOpenAI>;

const mockGraph = {
  invoke: jest.fn(),
  compile: jest.fn().mockReturnThis()
};

// Mock StateGraph
jest.mock('langgraph', () => ({
  StateGraph: jest.fn().mockImplementation(() => ({
    addNode: jest.fn(),
    addEdge: jest.fn(),
    compile: jest.fn().mockReturnValue(mockGraph)
  })),
  START: 'START',
  END: 'END'
}));

describe('RAGASLangGraph', () => {
  let ragasGraph: RAGASLangGraph;
  
  beforeEach(() => {
    jest.clearAllMocks();
    ragasGraph = new RAGASLangGraph(mockLLM);
  });

  describe('initialization', () => {
    it('should create a RAGASLangGraph instance', () => {
      expect(ragasGraph).toBeInstanceOf(RAGASLangGraph);
    });

    it('should initialize with the provided LLM', () => {
      expect(ragasGraph).toBeDefined();
    });
  });

  describe('run method', () => {
    const mockDocuments = [
      new Document({
        pageContent: 'Machine learning is a subset of artificial intelligence that focuses on algorithms.',
        metadata: { source: 'test1.txt' }
      }),
      new Document({
        pageContent: 'Deep learning uses neural networks with multiple layers to process data.',
        metadata: { source: 'test2.txt' }
      })
    ];

    it('should process documents and return results', async () => {
      const mockResult = {
        evolved_questions: [
          {
            id: 'q1',
            question: 'What is machine learning and how does it relate to AI?',
            evolution_type: 'simple' as const,
            complexity_score: 5,
            source_document_ids: ['doc_0'],
            metadata: {
              original_question: 'What is machine learning?',
              evolution_timestamp: '2025-01-01T00:00:00.000Z'
            }
          }
        ],
        question_answers: [
          {
            question_id: 'q1',
            answer: 'Machine learning is a subset of artificial intelligence.',
            confidence_score: 0.85,
            source_documents: ['doc_0']
          }
        ],
        question_contexts: [
          {
            question_id: 'q1',
            contexts: ['Machine learning is a subset of artificial intelligence.'],
            relevance_scores: [0.8],
            context_sources: ['doc_0']
          }
        ],
        errors: []
      };

      mockGraph.invoke.mockResolvedValue(mockResult);

      const result = await ragasGraph.run(mockDocuments);

      expect(result).toHaveProperty('evolved_questions');
      expect(result).toHaveProperty('question_answers');
      expect(result).toHaveProperty('question_contexts');
      expect(result).toHaveProperty('generation_metadata');
      
      expect(result.evolved_questions).toBeInstanceOf(Array);
      expect(result.question_answers).toBeInstanceOf(Array);
      expect(result.question_contexts).toBeInstanceOf(Array);
      
      expect(result.generation_metadata).toHaveProperty('total_questions');
      expect(result.generation_metadata).toHaveProperty('evolution_types_count');
      expect(result.generation_metadata).toHaveProperty('processing_errors');
      expect(result.generation_metadata).toHaveProperty('generation_timestamp');
    });

    it('should handle empty document array', async () => {
      const mockResult = {
        evolved_questions: [],
        question_answers: [],
        question_contexts: [],
        errors: []
      };

      mockGraph.invoke.mockResolvedValue(mockResult);

      const result = await ragasGraph.run([]);

      expect(result.evolved_questions).toHaveLength(0);
      expect(result.question_answers).toHaveLength(0);
      expect(result.question_contexts).toHaveLength(0);
      expect(result.generation_metadata.total_questions).toBe(0);
    });

    it('should handle processing errors gracefully', async () => {
      const error = new Error('Processing failed');
      mockGraph.invoke.mockRejectedValue(error);

      await expect(ragasGraph.run(mockDocuments)).rejects.toThrow('Generation failed: Processing failed');
    });

    it('should count evolution types correctly', async () => {
      const mockResult = {
        evolved_questions: [
          {
            id: 'q1',
            question: 'Simple question',
            evolution_type: 'simple' as const,
            complexity_score: 5,
            source_document_ids: ['doc_0'],
            metadata: { evolution_timestamp: '2025-01-01T00:00:00.000Z' }
          },
          {
            id: 'q2',
            question: 'Multi-context question',
            evolution_type: 'multi_context' as const,
            complexity_score: 7,
            source_document_ids: ['doc_0', 'doc_1'],
            metadata: { evolution_timestamp: '2025-01-01T00:00:00.000Z' }
          },
          {
            id: 'q3',
            question: 'Reasoning question',
            evolution_type: 'reasoning' as const,
            complexity_score: 8,
            source_document_ids: ['doc_0'],
            metadata: { evolution_timestamp: '2025-01-01T00:00:00.000Z' }
          }
        ],
        question_answers: [],
        question_contexts: [],
        errors: []
      };

      mockGraph.invoke.mockResolvedValue(mockResult);

      const result = await ragasGraph.run(mockDocuments);

      expect(result.generation_metadata.evolution_types_count).toEqual({
        simple: 1,
        multi_context: 1,
        reasoning: 1
      });
    });
  });

  describe('error handling', () => {
    it('should handle unknown errors', async () => {
      mockGraph.invoke.mockRejectedValue('Unknown error');

      await expect(ragasGraph.run([])).rejects.toThrow('Generation failed: Unknown error');
    });

    it('should include processing errors in metadata', async () => {
      const mockResult = {
        evolved_questions: [],
        question_answers: [],
        question_contexts: [],
        errors: ['Document processing error', 'Evolution error']
      };

      mockGraph.invoke.mockResolvedValue(mockResult);

      const result = await ragasGraph.run([]);

      expect(result.generation_metadata.processing_errors).toEqual([
        'Document processing error',
        'Evolution error'
      ]);
    });
  });
});

