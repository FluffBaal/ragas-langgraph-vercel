import { NextRequest, NextResponse } from 'next/server';
import { RAGASLangGraph } from '@/lib/ragas/langgraph-implementation';
import { createOpenAIClient } from '@/lib/openai';
import { Document } from '@langchain/core/documents';
import { 
  GenerationConfigSchema, 
  validateFile, 
  validateDocumentContent,
  globalRateLimiter 
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!globalRateLimiter.isAllowed(clientIP)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          remainingRequests: globalRateLimiter.getRemainingRequests(clientIP)
        },
        { status: 429 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const configString = formData.get('config') as string;
    
    let config;
    try {
      config = JSON.parse(configString || '{}');
    } catch {
      config = {};
    }
    
    // Validate configuration
    const configValidation = GenerationConfigSchema.safeParse(config);
    if (!configValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid configuration',
          details: configValidation.error.errors
        },
        { status: 400 }
      );
    }
    
    const validatedConfig = configValidation.data;
    
    // Extract documents
    const documents: Document[] = [];
    let fileIndex = 0;
    
    while (true) {
      const file = formData.get(`document_${fileIndex}`) as File;
      if (!file) break;
      
      // Validate file
      const fileValidation = validateFile(file);
      if (!fileValidation.valid) {
        return NextResponse.json(
          { error: `File ${file.name}: ${fileValidation.error}` },
          { status: 400 }
        );
      }
      
      // Read file with proper encoding handling
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const content = decoder.decode(buffer);
      const contentValidation = validateDocumentContent(content);
      if (!contentValidation.valid) {
        return NextResponse.json(
          { error: `File ${file.name}: ${contentValidation.error}` },
          { status: 400 }
        );
      }
      
      documents.push(new Document({
        pageContent: content,
        metadata: {
          source: file.name,
          size: file.size,
          type: file.type,
          uploadTimestamp: new Date().toISOString()
        }
      }));
      
      fileIndex++;
    }
    
    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'No valid documents provided' },
        { status: 400 }
      );
    }
    
    // Validate OpenAI API key
    const apiKey = validatedConfig.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required. Please provide your API key.' },
        { status: 400 }
      );
    }
    
    // Initialize OpenAI client with user's API key
    const llm = createOpenAIClient(apiKey);
    
    // Create and run RAGAS LangGraph
    const ragasGraph = new RAGASLangGraph(llm);
    const results = await ragasGraph.run(documents);
    
    // Apply configuration filters
    let filteredResults = { ...results };
    
    // Limit number of questions if specified
    if (validatedConfig.maxQuestions < results.evolved_questions.length) {
      const limitedQuestions = results.evolved_questions.slice(0, validatedConfig.maxQuestions);
      const limitedQuestionIds = new Set(limitedQuestions.map(q => q.id));
      
      filteredResults = {
        ...results,
        evolved_questions: limitedQuestions,
        question_answers: results.question_answers.filter(qa => limitedQuestionIds.has(qa.question_id)),
        question_contexts: results.question_contexts.filter(qc => limitedQuestionIds.has(qc.question_id)),
        generation_metadata: {
          ...results.generation_metadata,
          total_questions: limitedQuestions.length,
          evolution_types_count: {
            simple: limitedQuestions.filter(q => q.evolution_type === 'simple').length,
            multi_context: limitedQuestions.filter(q => q.evolution_type === 'multi_context').length,
            reasoning: limitedQuestions.filter(q => q.evolution_type === 'reasoning').length
          }
        }
      };
    }
    
    // Filter by evolution types if specified
    if (validatedConfig.evolutionTypes.length < 3) {
      const allowedTypes = new Set(validatedConfig.evolutionTypes);
      const filteredQuestions = filteredResults.evolved_questions.filter(q => allowedTypes.has(q.evolution_type));
      const filteredQuestionIds = new Set(filteredQuestions.map(q => q.id));
      
      filteredResults = {
        ...filteredResults,
        evolved_questions: filteredQuestions,
        question_answers: filteredResults.question_answers.filter(qa => filteredQuestionIds.has(qa.question_id)),
        question_contexts: filteredResults.question_contexts.filter(qc => filteredQuestionIds.has(qc.question_id)),
        generation_metadata: {
          ...filteredResults.generation_metadata,
          total_questions: filteredQuestions.length,
          evolution_types_count: {
            simple: filteredQuestions.filter(q => q.evolution_type === 'simple').length,
            multi_context: filteredQuestions.filter(q => q.evolution_type === 'multi_context').length,
            reasoning: filteredQuestions.filter(q => q.evolution_type === 'reasoning').length
          }
        }
      };
    }
    
    // Return results
    return NextResponse.json(filteredResults, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('token limit') || error.message.includes('context length')) {
        return NextResponse.json(
          { error: 'Document too large. Please reduce document size.' },
          { status: 413 }
        );
      }
      
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'OpenAI API configuration error.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timeout. Please try again with smaller documents.' },
          { status: 408 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'RAGAS LangGraph Generation API',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        POST: 'Generate synthetic data from documents',
        GET: 'API information'
      },
      limits: {
        maxFileSize: '10MB',
        maxFiles: 10,
        supportedFormats: ['.txt', '.md', '.pdf']
      }
    },
    { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

