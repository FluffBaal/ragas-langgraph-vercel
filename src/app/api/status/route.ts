import { NextRequest, NextResponse } from 'next/server';
import { validateOpenAIConfig } from '@/lib/openai';
import { globalRateLimiter } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // System status checks
    const status = {
      timestamp: new Date().toISOString(),
      system: {
        status: 'operational',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      },
      services: {
        openai: {
          configured: validateOpenAIConfig(),
          model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
          status: validateOpenAIConfig() ? 'available' : 'not_configured'
        },
        rateLimit: {
          remainingRequests: globalRateLimiter.getRemainingRequests(clientIP),
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100
        }
      },
      features: {
        evolutionTypes: ['simple', 'multi_context', 'reasoning'],
        supportedFormats: ['.txt', '.md', '.pdf'],
        maxFileSize: '10MB',
        maxFiles: 10,
        maxQuestions: 50
      },
      health: {
        database: 'not_applicable',
        cache: 'not_applicable',
        external_apis: validateOpenAIConfig() ? 'healthy' : 'degraded'
      }
    };
    
    // Determine overall health status
    const overallStatus = validateOpenAIConfig() ? 'healthy' : 'degraded';
    const httpStatus = overallStatus === 'healthy' ? 200 : 503;
    
    return NextResponse.json(
      {
        ...status,
        overall_status: overallStatus
      },
      { 
        status: httpStatus,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
    
  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        overall_status: 'error',
        error: 'Failed to retrieve system status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'ping') {
      return NextResponse.json(
        {
          message: 'pong',
          timestamp: new Date().toISOString(),
          latency: Date.now() - (body.timestamp || Date.now())
        },
        { 
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    if (action === 'validate_config') {
      const validation = {
        openai: validateOpenAIConfig(),
        environment: !!process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(validation, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Supported actions: ping, validate_config' },
      { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Invalid request body',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
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

