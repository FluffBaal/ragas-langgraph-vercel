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



## 📖 Usage

### Web Interface

1. **Upload Documents**: Drag and drop or select files (.txt, .md, .pdf)
2. **Configure Generation**: Set parameters for question generation
3. **Generate**: Process documents through the LangGraph pipeline
4. **Review Results**: Examine evolved questions, answers, and contexts



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
- **Content**: Minimum 100 characters
- **Count**: Maximum 10 files per request


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



