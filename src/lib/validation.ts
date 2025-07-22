import { z } from 'zod';

// Generation Configuration Schema
export const GenerationConfigSchema = z.object({
  maxQuestions: z.number().min(1).max(50).default(10),
  evolutionTypes: z.array(z.enum(['simple', 'multi_context', 'reasoning'])).default(['simple', 'multi_context', 'reasoning']),
  complexityTarget: z.number().min(1).max(10).default(5),
  language: z.string().default('en'),
  includeMetadata: z.boolean().default(true),
  openaiApiKey: z.string().optional()
});

// File Validation Schema (kept for reference but using custom validation instead)
export const FileValidationSchema = z.object({
  name: z.string().min(1),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
  type: z.string().optional() // Made optional since MIME types are unreliable
});

// Document Content Schema
export const DocumentContentSchema = z.object({
  content: z.string().min(100, 'Document content must be at least 100 characters'),
  metadata: z.record(z.any()).optional()
});

// API Request Schema
export const GenerateRequestSchema = z.object({
  documents: z.array(DocumentContentSchema).min(1, 'At least one document is required'),
  config: GenerationConfigSchema.optional()
});

// Validation Functions
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file extension as well as MIME type
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const validExtensions = ['txt', 'md', 'pdf'];
  
  if (!validExtensions.includes(fileExtension || '')) {
    return { valid: false, error: 'Invalid file type. Only .txt, .md, and .pdf files are allowed.' };
  }
  
  // Check file size
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File too large (max 10MB)' };
  }
  
  // If extension is valid, don't strictly check MIME type as it can be unreliable for .md files
  return { valid: true };
}

export function validateDocumentContent(content: string): { valid: boolean; error?: string } {
  try {
    DocumentContentSchema.parse({ content });
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid document content' };
  }
}

export function validateGenerationConfig(config: any): { valid: boolean; error?: string; data?: any } {
  try {
    const validatedConfig = GenerationConfigSchema.parse(config);
    return { valid: true, data: validatedConfig };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid configuration' };
  }
}

// Rate Limiting Utilities
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();

