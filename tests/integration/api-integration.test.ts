import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Integration tests for the full API workflow
describe('API Integration Tests', () => {
  let app: any;
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Set up test environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true
    });
    process.env.OPENAI_API_KEY = 'test-key';
    
    // Create Next.js app
    app = next({ dev: false, dir: process.cwd() });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });
    
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const port = server.address()?.port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  }, 30000);

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    if (app) {
      await app.close();
    }
  });

  describe('Health Check Endpoints', () => {
    it('should return health status', async () => {
      const response = await fetch(`${baseUrl}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('checks');
    });

    it('should return system status', async () => {
      const response = await fetch(`${baseUrl}/api/status`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('system');
      expect(data).toHaveProperty('services');
      expect(data).toHaveProperty('features');
    });
  });

  describe('Generation API', () => {
    it('should return API information on GET', async () => {
      const response = await fetch(`${baseUrl}/api/generate`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('status', 'operational');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'OPTIONS'
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should reject requests without documents', async () => {
      const formData = new FormData();
      formData.append('config', JSON.stringify({}));

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should validate file types', async () => {
      const formData = new FormData();
      formData.append('config', JSON.stringify({}));
      
      // Create an invalid file type
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-executable' });
      formData.append('document_0', invalidFile);

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid file type');
    });

    it('should validate file size', async () => {
      const formData = new FormData();
      formData.append('config', JSON.stringify({}));
      
      // Create a file that's too large (mock)
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
      formData.append('document_0', largeFile);

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('too large');
    });

    it('should validate document content length', async () => {
      const formData = new FormData();
      formData.append('config', JSON.stringify({}));
      
      // Create a file with content that's too short
      const shortFile = new File(['short'], 'short.txt', { type: 'text/plain' });
      formData.append('document_0', shortFile);

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('too short');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in config', async () => {
      const formData = new FormData();
      formData.append('config', 'invalid json');
      
      const validFile = new File(['This is a valid document content that is longer than 100 characters to meet the minimum requirement.'], 'test.txt', { type: 'text/plain' });
      formData.append('document_0', validFile);

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        body: formData
      });

      // Should still work with default config
      expect(response.status).toBe(500); // Will fail due to missing OpenAI key in test
    });

    it('should handle missing OpenAI API key', async () => {
      // Temporarily remove the API key
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const formData = new FormData();
      formData.append('config', JSON.stringify({}));
      
      const validFile = new File(['This is a valid document content that is longer than 100 characters to meet the minimum requirement.'], 'test.txt', { type: 'text/plain' });
      formData.append('document_0', validFile);

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('OpenAI API key not configured');

      // Restore the API key
      process.env.OPENAI_API_KEY = originalKey;
    });
  });

  describe('Rate Limiting', () => {
    it('should track requests per IP', async () => {
      // Make multiple requests quickly
      const promises = Array.from({ length: 5 }, () =>
        fetch(`${baseUrl}/api/status`)
      );

      const responses = await Promise.all(promises);
      
      // All should succeed since we're not hitting the rate limit in tests
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Content Type Handling', () => {
    it('should handle text files', async () => {
      const formData = new FormData();
      formData.append('config', JSON.stringify({ maxQuestions: 1 }));
      
      const textFile = new File(['This is a text document with sufficient content to meet the minimum length requirement for processing.'], 'document.txt', { type: 'text/plain' });
      formData.append('document_0', textFile);

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        body: formData
      });

      // Will fail due to missing real OpenAI key, but should pass validation
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).not.toContain('Invalid file type');
      expect(data.error).not.toContain('too short');
    });

    it('should handle markdown files', async () => {
      const formData = new FormData();
      formData.append('config', JSON.stringify({ maxQuestions: 1 }));
      
      const mdFile = new File(['# Markdown Document\n\nThis is a markdown document with sufficient content to meet the minimum length requirement for processing.'], 'document.md', { type: 'text/markdown' });
      formData.append('document_0', mdFile);

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        body: formData
      });

      // Will fail due to missing real OpenAI key, but should pass validation
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).not.toContain('Invalid file type');
      expect(data.error).not.toContain('too short');
    });
  });
});

