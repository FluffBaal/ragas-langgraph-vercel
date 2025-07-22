## 🚀 Features

### Core Capabilities
- **LangGraph Agent Architecture**: Specialized agents for different evolution types
- **Three Evolution Types**: Simple, Multi-Context, and Reasoning evolution

### Evolution Types
1. **Simple Evolution**: Basic question enhancement and refinement
2. **Multi-Context Evolution**: Cross-document synthesis and comparison
3. **Reasoning Evolution**: Complex analytical and inferential questions

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
                       │   & Rate Limit   │    │  (GPT-4.1-mini) │
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




## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



