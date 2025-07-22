import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/generate/route';
import { GET as healthGet } from '@/app/api/health/route';
import { GET as statusGet } from '@/app/api/status/route';

// Mock dependencies
jest.mock('@/lib/ragas/langgraph-implementation');
jest.mock('@/lib/openai');
jest.mock('@/lib/validation');

const mockRAGASLangGraph = {
  run: jest.fn()
};

const mockCreateOpenAIClient = jest.fn().mockReturnValue({});

jest.mock('@/lib/ragas/langgraph-implementation', () => ({
  RAGASLangGraph: jest.fn().mockImplementation(() => mockRAGASLangGraph)
}));

jest.mock('@/lib/openai', () => ({
  createOpenAIClient: mockCreateOpenAIClient,
  validateOpenAIConfig: jest.fn().mockReturnValue(true)
}));

jest.mock('@/lib/validation', () => ({
  GenerationConfigSchema: {
    safeParse: jest.fn().mockReturnValue({
      success: true,
      data: {
        maxQuestions: 10,
        evolutionTypes: ['simple', 'multi_context', 'reasoning'],
        complexityTarget: 5,
        language: 'en',
        includeMetadata: true
      }
    })
  },
  validateFile: jest.fn().mockReturnValue({ valid: true }),
  validateDocumentContent: jest.fn().mockReturnValue({ valid: true }),
  globalRateLimiter: {
    isAllowed: jest.fn().mockReturnValue(true),
    getRemainingRequests: jest.fn().mockReturnValue(95)
  }
}));

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key';

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/generate', () => {
    describe('GET', () => {
      it('should return API information', async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('version');
        expect(data).toHaveProperty('status', 'operational');
        expect(data).toHaveProperty('endpoints');
        expect(data).toHaveProperty('limits');
      });
    });

    describe('POST', () => {
      const createMockRequest = (formData: FormData) => {
        return {
          formData: () => Promise.resolve(formData),
          ip: '127.0.0.1',
          headers: {
            get: jest.fn().mockReturnValue('127.0.0.1')
          }
        } as unknown as NextRequest;
      };

      it('should process valid documents and return results', async () => {
        const formData = new FormData();
        formData.append('config', JSON.stringify({
          maxQuestions: 5,
          evolutionTypes: ['simple'],
          complexityTarget: 5
        }));
        
        const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
        formData.append('document_0', mockFile);

        const mockResults = {
          evolved_questions: [
            {
              id: 'q1',
              question: 'Test question',
              evolution_type: 'simple',
              complexity_score: 5,
              source_document_ids: ['doc_0'],
              metadata: { evolution_timestamp: '2025-01-01T00:00:00.000Z' }
            }
          ],
          question_answers: [
            {
              question_id: 'q1',
              answer: 'Test answer',
              confidence_score: 0.85,
              source_documents: ['doc_0']
            }
          ],
          question_contexts: [
            {
              question_id: 'q1',
              contexts: ['Test context'],
              relevance_scores: [0.8],
              context_sources: ['doc_0']
            }
          ],
          generation_metadata: {
            total_questions: 1,
            evolution_types_count: { simple: 1, multi_context: 0, reasoning: 0 },
            processing_errors: [],
            generation_timestamp: '2025-01-01T00:00:00.000Z'
          }
        };

        mockRAGASLangGraph.run.mockResolvedValue(mockResults);

        const request = createMockRequest(formData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('evolved_questions');
        expect(data).toHaveProperty('question_answers');
        expect(data).toHaveProperty('question_contexts');
        expect(data).toHaveProperty('generation_metadata');
        expect(data.evolved_questions).toHaveLength(1);
      });

      it('should return error for no documents', async () => {
        const formData = new FormData();
        formData.append('config', JSON.stringify({}));

        const request = createMockRequest(formData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toHaveProperty('error', 'No valid documents provided');
      });

      it('should handle rate limiting', async () => {
        const { globalRateLimiter } = require('@/lib/validation');
        globalRateLimiter.isAllowed.mockReturnValue(false);
        globalRateLimiter.getRemainingRequests.mockReturnValue(0);

        const formData = new FormData();
        const request = createMockRequest(formData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data).toHaveProperty('error');
        expect(data.error).toContain('Rate limit exceeded');
      });

      it('should handle missing OpenAI API key', async () => {
        delete process.env.OPENAI_API_KEY;

        const formData = new FormData();
        const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        formData.append('document_0', mockFile);

        const request = createMockRequest(formData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toHaveProperty('error', 'OpenAI API key not configured');

        // Restore for other tests
        process.env.OPENAI_API_KEY = 'test-api-key';
      });

      it('should handle generation errors', async () => {
        const formData = new FormData();
        const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
        formData.append('document_0', mockFile);

        mockRAGASLangGraph.run.mockRejectedValue(new Error('Generation failed'));

        const request = createMockRequest(formData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toHaveProperty('error', 'Internal server error');
      });
    });
  });

  describe('/api/health', () => {
    it('should return health status', async () => {
      const response = await healthGet();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('checks');
      expect(data.checks).toHaveProperty('server');
      expect(data.checks).toHaveProperty('openai');
      expect(data.checks).toHaveProperty('environment');
    });

    it('should return unhealthy status when OpenAI is not configured', async () => {
      const { validateOpenAIConfig } = require('@/lib/openai');
      validateOpenAIConfig.mockReturnValue(false);

      const response = await healthGet();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
    });
  });

  describe('/api/status', () => {
    it('should return system status', async () => {
      const mockRequest = {
        ip: '127.0.0.1',
        headers: {
          get: jest.fn().mockReturnValue('127.0.0.1')
        }
      } as unknown as NextRequest;

      const response = await statusGet(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('system');
      expect(data).toHaveProperty('services');
      expect(data).toHaveProperty('features');
      expect(data).toHaveProperty('health');
      expect(data).toHaveProperty('overall_status');
    });
  });
});

