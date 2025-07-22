# RAGAS LangGraph Vercel - Production Ready

A production-ready implementation of RAGAS (Retrieval Augmented Generation Assessment) synthetic data generation using LangGraph agent architecture, deployed on Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/ragas-langgraph-vercel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

## 🚀 Features

### Core Capabilities
- **LangGraph Agent Architecture**: Specialized agents for different evolution types
- **Three Evolution Types**: Simple, Multi-Context, and Reasoning evolution
- **Production-Ready**: Full error handling, validation, and monitoring
- **Scalable**: Optimized for Vercel's serverless environment
- **Type-Safe**: Complete TypeScript implementation
- **Comprehensive Testing**: Unit, integration, and API tests

### Evolution Types
1. **Simple Evolution**: Basic question enhancement and refinement
2. **Multi-Context Evolution**: Cross-document synthesis and comparison
3. **Reasoning Evolution**: Complex analytical and inferential questions

### Technical Features
- **File Support**: Text (.txt), Markdown (.md), and PDF files
- **Rate Limiting**: IP-based request throttling
- **Input Validation**: Comprehensive file and configuration validation
- **Error Handling**: Detailed error messages and recovery
- **Monitoring**: Health checks and system status endpoints
- **Security**: CORS configuration and security headers

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │────│   API Routes     │────│  LangGraph      │
│   (Next.js)     │    │   (Serverless)   │    │  Agents         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Validation     │    │   OpenAI API    │
                       │   & Rate Limit   │    │   (GPT-4o-mini) │
                       └──────────────────┘    └─────────────────┘
```

### Agent Workflow

```
Documents → Process → Simple Evolution → Multi-Context → Reasoning → Generate Answers → Retrieve Contexts → Results
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ragas-langgraph-vercel.git
   cd ragas-langgraph-vercel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your OpenAI API key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Production Deployment

#### Deploy to Vercel (Recommended)

1. **One-click deploy**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/ragas-langgraph-vercel)

2. **Manual deployment**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

3. **Set environment variables**
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add OPENAI_MODEL
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📖 Usage

### Web Interface

1. **Upload Documents**: Drag and drop or select files (.txt, .md, .pdf)
2. **Configure Generation**: Set parameters for question generation
3. **Generate**: Process documents through the LangGraph pipeline
4. **Review Results**: Examine evolved questions, answers, and contexts

### API Usage

```javascript
const formData = new FormData();
formData.append('config', JSON.stringify({
  maxQuestions: 10,
  evolutionTypes: ['simple', 'multi_context', 'reasoning'],
  complexityTarget: 7
}));
formData.append('document_0', file);

const response = await fetch('/api/generate', {
  method: 'POST',
  body: formData
});

const results = await response.json();
```

For complete API documentation, see [API.md](./API.md).

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure

```
tests/
├── unit/                 # Unit tests
│   ├── langgraph.test.ts # LangGraph implementation
│   ├── api.test.ts       # API routes
│   └── validation.test.ts # Validation utilities
└── integration/          # Integration tests
    └── api-integration.test.ts
```

## 📊 Configuration

### Generation Configuration

```json
{
  "maxQuestions": 10,           // 1-50
  "evolutionTypes": [           // Array of evolution types
    "simple",
    "multi_context", 
    "reasoning"
  ],
  "complexityTarget": 5,        // 1-10
  "language": "en",             // Language code
  "includeMetadata": true       // Include detailed metadata
}
```

### File Requirements

- **Formats**: `.txt`, `.md`, `.pdf`
- **Size**: Maximum 10MB per file
- **Content**: Minimum 100 characters
- **Count**: Maximum 10 files per request

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini

# Optional
NODE_ENV=production
ENABLE_CACHING=true
MAX_DOCUMENT_SIZE=10485760
RATE_LIMIT_REQUESTS=100
```

## 🔧 Development

### Project Structure

```
src/
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── dashboard/       # Dashboard page
│   ├── globals.css      # Global styles
│   └── layout.tsx       # Root layout
├── components/          # React components
│   ├── ui/             # UI components
│   ├── DocumentUpload.tsx
│   ├── GenerationForm.tsx
│   └── ResultsDisplay.tsx
├── lib/                # Utilities and core logic
│   ├── ragas/          # RAGAS implementation
│   ├── openai.ts       # OpenAI client
│   ├── validation.ts   # Input validation
│   └── utils.ts        # Utility functions
└── types/              # TypeScript definitions
    └── index.ts
```

### Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run test         # Run tests
npm run format       # Prettier formatting
```

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Husky**: Git hooks (optional)

## 🔍 Monitoring

### Health Checks

- **Health**: `GET /api/health` - Basic health status
- **Status**: `GET /api/status` - Detailed system information
- **Ping**: `POST /api/status` with `{"action": "ping"}`

### Metrics

- Request/response times
- Error rates
- Memory usage
- Function execution duration
- Rate limiting statistics

### Logging

```javascript
// Error logging
console.error('Processing error:', error);

// Performance logging
console.log(`Generation completed in ${duration}ms`);

// Request logging
console.log(`Processing ${fileCount} documents`);
```

## 🛡️ Security

### Input Validation

- File type validation
- File size limits
- Content length validation
- Configuration validation

### Rate Limiting

- 100 requests per 15-minute window per IP
- Configurable limits
- Graceful degradation

### Security Headers

- CORS configuration
- Content Security Policy
- XSS protection
- Frame options

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make changes and test**
   ```bash
   npm run test
   npm run lint
   ```
4. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
5. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commits
- Ensure all checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **RAGAS**: Original framework for synthetic data generation
- **LangChain**: LLM application framework
- **OpenAI**: GPT models for text generation
- **Vercel**: Deployment and hosting platform
- **Next.js**: React framework for production

## 📞 Support

- **Documentation**: [API.md](./API.md), [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/ragas-langgraph-vercel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/ragas-langgraph-vercel/discussions)

## 🗺️ Roadmap

- [ ] Additional evolution types
- [ ] Multi-language support
- [ ] Advanced caching strategies
- [ ] Real-time processing updates
- [ ] Batch processing API
- [ ] Custom model support
- [ ] Analytics dashboard
- [ ] Export formats (JSON, CSV, JSONL)

---

**Built with ❤️ using Next.js, TypeScript, and deployed on Vercel**

