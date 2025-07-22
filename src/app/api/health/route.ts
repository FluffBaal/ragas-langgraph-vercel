import { NextResponse } from 'next/server';
import { validateOpenAIConfig } from '@/lib/openai';

export async function GET() {
  try {
    // Basic health checks
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        server: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            external: process.memoryUsage().external
          }
        },
        openai: {
          status: validateOpenAIConfig() ? 'healthy' : 'unhealthy',
          configured: validateOpenAIConfig()
        },
        environment: {
          status: 'healthy',
          node_env: process.env.NODE_ENV || 'development',
          node_version: process.version
        }
      }
    };
    
    // Determine overall health
    const isHealthy = checks.checks.openai.status === 'healthy' && 
                     checks.checks.server.status === 'healthy' &&
                     checks.checks.environment.status === 'healthy';
    
    const overallStatus = isHealthy ? 'healthy' : 'unhealthy';
    const httpStatus = isHealthy ? 200 : 503;
    
    return NextResponse.json(
      {
        ...checks,
        status: overallStatus
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
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

export async function HEAD() {
  // Simple HEAD request for basic uptime monitoring
  try {
    const isHealthy = validateOpenAIConfig();
    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

