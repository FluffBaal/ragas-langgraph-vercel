import {
  GenerationConfigSchema,
  FileValidationSchema,
  DocumentContentSchema,
  validateFile,
  validateDocumentContent,
  validateGenerationConfig,
  RateLimiter
} from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('GenerationConfigSchema', () => {
    it('should validate valid configuration', () => {
      const validConfig = {
        maxQuestions: 10,
        evolutionTypes: ['simple', 'multi_context', 'reasoning'],
        complexityTarget: 5,
        language: 'en',
        includeMetadata: true
      };

      const result = GenerationConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validConfig);
      }
    });

    it('should apply defaults for missing fields', () => {
      const minimalConfig = {};

      const result = GenerationConfigSchema.safeParse(minimalConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxQuestions).toBe(10);
        expect(result.data.evolutionTypes).toEqual(['simple', 'multi_context', 'reasoning']);
        expect(result.data.complexityTarget).toBe(5);
        expect(result.data.language).toBe('en');
        expect(result.data.includeMetadata).toBe(true);
      }
    });

    it('should reject invalid maxQuestions', () => {
      const invalidConfig = { maxQuestions: 0 };

      const result = GenerationConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject invalid evolution types', () => {
      const invalidConfig = { evolutionTypes: ['invalid_type'] };

      const result = GenerationConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject invalid complexity target', () => {
      const invalidConfig = { complexityTarget: 11 };

      const result = GenerationConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('FileValidationSchema', () => {
    it('should validate valid file', () => {
      const validFile = {
        name: 'test.txt',
        size: 1024,
        type: 'text/plain'
      };

      const result = FileValidationSchema.safeParse(validFile);
      expect(result.success).toBe(true);
    });

    it('should reject file that is too large', () => {
      const largeFile = {
        name: 'large.txt',
        size: 11 * 1024 * 1024, // 11MB
        type: 'text/plain'
      };

      const result = FileValidationSchema.safeParse(largeFile);
      expect(result.success).toBe(false);
    });

    it('should reject invalid file type', () => {
      const invalidFile = {
        name: 'test.exe',
        size: 1024,
        type: 'application/x-executable'
      };

      const result = FileValidationSchema.safeParse(invalidFile);
      expect(result.success).toBe(false);
    });

    it('should accept PDF files', () => {
      const pdfFile = {
        name: 'document.pdf',
        size: 1024,
        type: 'application/pdf'
      };

      const result = FileValidationSchema.safeParse(pdfFile);
      expect(result.success).toBe(true);
    });

    it('should accept Markdown files', () => {
      const mdFile = {
        name: 'readme.md',
        size: 1024,
        type: 'text/markdown'
      };

      const result = FileValidationSchema.safeParse(mdFile);
      expect(result.success).toBe(true);
    });
  });

  describe('DocumentContentSchema', () => {
    it('should validate valid content', () => {
      const validContent = {
        content: 'This is a valid document content that is longer than 100 characters to meet the minimum requirement for processing.'
      };

      const result = DocumentContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });

    it('should reject content that is too short', () => {
      const shortContent = {
        content: 'Too short'
      };

      const result = DocumentContentSchema.safeParse(shortContent);
      expect(result.success).toBe(false);
    });

    it('should accept optional metadata', () => {
      const contentWithMetadata = {
        content: 'This is a valid document content that is longer than 100 characters to meet the minimum requirement for processing.',
        metadata: { source: 'test.txt', author: 'Test Author' }
      };

      const result = DocumentContentSchema.safeParse(contentWithMetadata);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toEqual({ source: 'test.txt', author: 'Test Author' });
      }
    });
  });

  describe('validateFile function', () => {
    it('should validate valid file', () => {
      const validFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(validFile, 'size', { value: 1024 });

      const result = validateFile(validFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file', () => {
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-executable' });
      Object.defineProperty(invalidFile, 'size', { value: 1024 });

      const result = validateFile(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateDocumentContent function', () => {
    it('should validate valid content', () => {
      const validContent = 'This is a valid document content that is longer than 100 characters to meet the minimum requirement for processing.';

      const result = validateDocumentContent(validContent);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid content', () => {
      const invalidContent = 'Too short';

      const result = validateDocumentContent(invalidContent);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateGenerationConfig function', () => {
    it('should validate valid config', () => {
      const validConfig = {
        maxQuestions: 5,
        evolutionTypes: ['simple'],
        complexityTarget: 3
      };

      const result = validateGenerationConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid config', () => {
      const invalidConfig = {
        maxQuestions: 0
      };

      const result = validateGenerationConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(3, 1000); // 3 requests per second
    });

    it('should allow requests within limit', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    it('should reject requests over limit', () => {
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      
      expect(rateLimiter.isAllowed('user1')).toBe(false);
    });

    it('should track different users separately', () => {
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      
      expect(rateLimiter.isAllowed('user1')).toBe(false);
      expect(rateLimiter.isAllowed('user2')).toBe(true);
    });

    it('should return correct remaining requests', () => {
      expect(rateLimiter.getRemainingRequests('user1')).toBe(3);
      
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.getRemainingRequests('user1')).toBe(2);
      
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.getRemainingRequests('user1')).toBe(1);
      
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.getRemainingRequests('user1')).toBe(0);
    });

    it('should reset after time window', (done) => {
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      
      expect(rateLimiter.isAllowed('user1')).toBe(false);
      
      setTimeout(() => {
        expect(rateLimiter.isAllowed('user1')).toBe(true);
        done();
      }, 1100);
    });
  });
});

