import { ChatOpenAI } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { v4 as uuidv4 } from 'uuid';
import { 
  RAGASState, 
  ProcessedDocument, 
  EvolvedQuestion, 
  QuestionAnswer, 
  QuestionContext,
  GenerationResult 
} from '@/types';

// Simple graph implementation without external langgraph dependency
class SimpleGraph<T> {
  private nodes: Map<string, (state: T) => Promise<Partial<T>>> = new Map();
  private edges: Map<string, string> = new Map();
  private startNode: string = '';

  addNode(name: string, func: (state: T) => Promise<Partial<T>>) {
    this.nodes.set(name, func);
  }

  addEdge(from: string, to: string) {
    this.edges.set(from, to);
  }

  setStart(node: string) {
    this.startNode = node;
  }

  async invoke(initialState: T): Promise<T> {
    let currentState = { ...initialState };
    let currentNode = this.startNode;

    while (currentNode && currentNode !== 'END') {
      const nodeFunc = this.nodes.get(currentNode);
      if (!nodeFunc) {
        throw new Error(`Node ${currentNode} not found`);
      }

      const partialState = await nodeFunc(currentState);
      currentState = { ...currentState, ...partialState };

      currentNode = this.edges.get(currentNode) || 'END';
    }

    return currentState;
  }
}

// Main LangGraph Implementation
export class RAGASLangGraph {
  private graph: SimpleGraph<RAGASState>;
  private llm: ChatOpenAI;
  
  constructor(llm: ChatOpenAI) {
    this.llm = llm;
    this.graph = this.createGraph();
  }
  
  private createGraph(): SimpleGraph<RAGASState> {
    const workflow = new SimpleGraph<RAGASState>();
    
    // Add nodes
    workflow.addNode('process_documents', this.processDocuments.bind(this));
    workflow.addNode('simple_evolution', this.simpleEvolution.bind(this));
    workflow.addNode('multi_context_evolution', this.multiContextEvolution.bind(this));
    workflow.addNode('reasoning_evolution', this.reasoningEvolution.bind(this));
    workflow.addNode('generate_answers', this.generateAnswers.bind(this));
    workflow.addNode('retrieve_contexts', this.retrieveContexts.bind(this));
    
    // Define edges
    workflow.setStart('process_documents');
    workflow.addEdge('process_documents', 'simple_evolution');
    workflow.addEdge('simple_evolution', 'multi_context_evolution');
    workflow.addEdge('multi_context_evolution', 'reasoning_evolution');
    workflow.addEdge('reasoning_evolution', 'generate_answers');
    workflow.addEdge('generate_answers', 'retrieve_contexts');
    workflow.addEdge('retrieve_contexts', 'END');
    
    return workflow;
  }
  
  // Document Processing Agent
  private async processDocuments(state: RAGASState): Promise<Partial<RAGASState>> {
    const processed_docs: ProcessedDocument[] = [];
    
    for (let i = 0; i < state.documents.length; i++) {
      const doc = state.documents[i];
      try {
        const questions = await this.extractInitialQuestions(doc.pageContent);
        
        processed_docs.push({
          id: `doc_${i}`,
          content: doc.pageContent,
          metadata: doc.metadata,
          initial_questions: questions
        });
      } catch (error) {
        state.errors.push(`Document processing error: ${error}`);
      }
    }
    
    return { processed_docs };
  }
  
  private async extractInitialQuestions(content: string): Promise<string[]> {
    const prompt = ChatPromptTemplate.fromTemplate(`
      Based on the following content, generate 3 basic comprehension questions.
      Return only the questions, one per line, without numbering.
      
      Content: {content}
    `);
    
    try {
      const chain = prompt.pipe(this.llm);
      // Use more content but skip header lines if present
      const contentLines = content.split('\n');
      let mainContent = content;
      
      // Skip metadata/header lines at the beginning
      let startIndex = 0;
      for (let i = 0; i < Math.min(10, contentLines.length); i++) {
        const line = contentLines[i].trim();
        if (line.match(/^(Date|Version|Author|License|Table of Contents):/i) || 
            line.match(/^#+\s*$/) || 
            line.length < 10) {
          startIndex = i + 1;
        } else {
          break;
        }
      }
      
      if (startIndex > 0) {
        mainContent = contentLines.slice(startIndex).join('\n');
      }
      
      const response = await chain.invoke({ content: mainContent.slice(0, 4000) });
      const questions = response.content
        .toString()
        .split('\n')
        .map(q => q.trim())
        .filter(q => q && q.endsWith('?'))
        .slice(0, 3);
      
      return questions.length > 0 ? questions : ['What is the main topic discussed in this document?'];
    } catch (error) {
      return ['What is the main topic discussed in this document?'];
    }
  }
  
  // Simple Evolution Agent
  private async simpleEvolution(state: RAGASState): Promise<Partial<RAGASState>> {
    const evolved_questions: EvolvedQuestion[] = [...(state.evolved_questions || [])];
    const errors = [...(state.errors || [])];
    
    for (const doc of state.processed_docs) {
      for (const question of doc.initial_questions) {
        try {
          const evolved = await this.evolveQuestionSimple(question, doc.content);
          if (evolved) {
            evolved_questions.push({
              id: uuidv4(),
              question: evolved,
              evolution_type: 'simple',
              complexity_score: 5.0,
              source_document_ids: [doc.id],
              metadata: {
                original_question: question,
                evolution_timestamp: new Date().toISOString()
              }
            });
          }
        } catch (error) {
          errors.push(`Simple evolution error: ${error}`);
        }
      }
    }
    
    return { evolved_questions, errors };
  }
  
  private async evolveQuestionSimple(question: string, context: string): Promise<string | null> {
    const prompt = ChatPromptTemplate.fromTemplate(`
      Evolve the following question to make it more complex and educational.
      Add constraints, deepen the inquiry, or increase specificity.
      
      Original Question: {question}
      Context: {context}
      
      Return only the evolved question:
    `);
    
    try {
      const chain = prompt.pipe(this.llm);
      const response = await chain.invoke({
        question,
        context: context.slice(0, 1000)
      });
      return response.content.toString().trim();
    } catch (error) {
      return null;
    }
  }
  
  // Multi-Context Evolution Agent
  private async multiContextEvolution(state: RAGASState): Promise<Partial<RAGASState>> {
    const evolved_questions: EvolvedQuestion[] = [...(state.evolved_questions || [])];
    const errors = [...(state.errors || [])];
    
    if (state.processed_docs.length < 2) {
      errors.push('Need at least 2 documents for multi-context evolution');
      return { evolved_questions, errors };
    }
    
    // Create questions spanning multiple documents
    for (let i = 0; i < state.processed_docs.length; i++) {
      for (let j = i + 1; j < Math.min(i + 2, state.processed_docs.length); j++) {
        const doc1 = state.processed_docs[i];
        const doc2 = state.processed_docs[j];
        
        if (doc1.initial_questions.length > 0) {
          try {
            const evolved = await this.evolveQuestionMultiContext(
              doc1.initial_questions[0],
              doc1.content,
              doc2.content
            );
            
            if (evolved) {
              evolved_questions.push({
                id: uuidv4(),
                question: evolved,
                evolution_type: 'multi_context',
                complexity_score: 7.0,
                source_document_ids: [doc1.id, doc2.id],
                metadata: {
                  original_question: doc1.initial_questions[0],
                  requires_multiple_contexts: true,
                  evolution_timestamp: new Date().toISOString()
                }
              });
            }
          } catch (error) {
            errors.push(`Multi-context evolution error: ${error}`);
          }
        }
      }
    }
    
    return { evolved_questions, errors };
  }
  
  private async evolveQuestionMultiContext(
    question: string,
    context1: string,
    context2: string
  ): Promise<string | null> {
    const prompt = ChatPromptTemplate.fromTemplate(`
      Evolve the following question to require synthesis from both contexts.
      The evolved question should be answerable only by combining information from both sources.
      
      Original Question: {question}
      Context 1: {context1}
      Context 2: {context2}
      
      Return only the evolved question:
    `);
    
    try {
      const chain = prompt.pipe(this.llm);
      const response = await chain.invoke({
        question,
        context1: context1.slice(0, 800),
        context2: context2.slice(0, 800)
      });
      return response.content.toString().trim();
    } catch (error) {
      return null;
    }
  }
  
  // Reasoning Evolution Agent
  private async reasoningEvolution(state: RAGASState): Promise<Partial<RAGASState>> {
    const evolved_questions: EvolvedQuestion[] = [...(state.evolved_questions || [])];
    const errors = [...(state.errors || [])];
    
    // Take some existing questions and evolve them for reasoning
    const existingQuestions = evolved_questions.slice(0, 2);
    
    for (const eq of existingQuestions) {
      // Find source context
      let sourceContext = '';
      for (const doc of state.processed_docs) {
        if (eq.source_document_ids.includes(doc.id)) {
          sourceContext = doc.content;
          break;
        }
      }
      
      if (sourceContext) {
        try {
          const evolved = await this.evolveQuestionReasoning(eq.question, sourceContext);
          if (evolved) {
            evolved_questions.push({
              id: uuidv4(),
              question: evolved,
              evolution_type: 'reasoning',
              complexity_score: 8.0,
              source_document_ids: eq.source_document_ids,
              metadata: {
                original_question: eq.question,
                requires_reasoning: true,
                evolution_timestamp: new Date().toISOString()
              }
            });
          }
        } catch (error) {
          errors.push(`Reasoning evolution error: ${error}`);
        }
      }
    }
    
    return { evolved_questions, errors };
  }
  
  private async evolveQuestionReasoning(question: string, context: string): Promise<string | null> {
    const prompt = ChatPromptTemplate.fromTemplate(`
      Evolve the following question to require complex reasoning and analysis.
      The question should test deep understanding, causal reasoning, or critical evaluation.
      
      Original Question: {question}
      Context: {context}
      
      Return only the evolved question:
    `);
    
    try {
      const chain = prompt.pipe(this.llm);
      const response = await chain.invoke({
        question,
        context: context.slice(0, 1000)
      });
      return response.content.toString().trim();
    } catch (error) {
      return null;
    }
  }
  
  // Answer Generation Agent
  private async generateAnswers(state: RAGASState): Promise<Partial<RAGASState>> {
    const question_answers: QuestionAnswer[] = [];
    
    for (const eq of state.evolved_questions) {
      // Find relevant contexts
      const contexts: string[] = [];
      for (const doc of state.processed_docs) {
        if (eq.source_document_ids.includes(doc.id)) {
          contexts.push(doc.content);
        }
      }
      
      if (contexts.length > 0) {
        try {
          const answer = await this.generateAnswer(eq.question, contexts);
          if (answer) {
            question_answers.push({
              question_id: eq.id,
              answer,
              confidence_score: 0.85,
              source_documents: eq.source_document_ids
            });
          }
        } catch (error) {
          state.errors.push(`Answer generation error: ${error}`);
        }
      }
    }
    
    return { question_answers };
  }
  
  private async generateAnswer(question: string, contexts: string[]): Promise<string | null> {
    const combinedContext = contexts.join('\n\n').slice(0, 2000);
    
    const prompt = ChatPromptTemplate.fromTemplate(`
      Answer the following question based on the provided contexts.
      Provide a comprehensive answer using only the information in the contexts.
      
      Question: {question}
      Contexts: {contexts}
      
      Answer:
    `);
    
    try {
      const chain = prompt.pipe(this.llm);
      const response = await chain.invoke({
        question,
        contexts: combinedContext
      });
      return response.content.toString().trim();
    } catch (error) {
      return null;
    }
  }
  
  // Context Retrieval Agent
  private async retrieveContexts(state: RAGASState): Promise<Partial<RAGASState>> {
    const question_contexts: QuestionContext[] = [];
    
    for (const eq of state.evolved_questions) {
      const contexts: string[] = [];
      const relevance_scores: number[] = [];
      const context_sources: string[] = [];
      
      // Get contexts from source documents
      for (const doc of state.processed_docs) {
        if (eq.source_document_ids.includes(doc.id)) {
          const passages = this.extractRelevantPassages(eq.question, doc.content);
          for (const passage of passages) {
            contexts.push(passage);
            relevance_scores.push(0.8); // Simplified scoring
            context_sources.push(doc.id);
          }
        }
      }
      
      if (contexts.length > 0) {
        question_contexts.push({
          question_id: eq.id,
          contexts: contexts.slice(0, 3), // Limit to top 3
          relevance_scores: relevance_scores.slice(0, 3),
          context_sources: context_sources.slice(0, 3)
        });
      }
    }
    
    return { question_contexts };
  }
  
  private extractRelevantPassages(question: string, content: string): string[] {
    // Extract meaningful passages from the content
    const passages: string[] = [];
    
    // First, skip metadata headers at the beginning
    const lines = content.split('\n');
    let startIndex = 0;
    
    // Skip common metadata patterns
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].trim();
      if (line.match(/^(Date|Version|Author|License|Table of Contents|Executive Summary):/i) ||
          line.match(/^#+\s*(Date|Version|Author|License|Table of Contents|Executive Summary)/i) ||
          line.match(/^(Context \d+|Relevance:|Source:)/i) ||
          line === '' ||
          line.length < 10) {
        startIndex = i + 1;
      } else if (line.length > 30 && !line.includes(':')) {
        // Found actual content
        break;
      }
    }
    
    // Use content after metadata
    const mainContent = lines.slice(startIndex).join('\n');
    
    // Split content into paragraphs (by double newlines or single newlines)
    const paragraphs = mainContent.split(/\n\n+/).filter(p => p.trim().length > 50);
    
    if (paragraphs.length === 0) {
      // If no paragraphs, split by single newlines
      const contentLines = mainContent.split('\n').filter(l => l.trim().length > 20);
      
      // Group lines into chunks of ~500 characters
      let currentPassage = '';
      for (const line of contentLines) {
        if (currentPassage.length + line.length > 500 && currentPassage.length > 100) {
          passages.push(currentPassage.trim());
          currentPassage = line;
        } else {
          currentPassage += (currentPassage ? '\n' : '') + line;
        }
      }
      if (currentPassage.trim().length > 50) {
        passages.push(currentPassage.trim());
      }
    } else {
      // Use paragraphs as passages, but ensure they're not too short
      for (const para of paragraphs) {
        if (para.trim().length > 50) {
          // Limit passage length to ~1000 characters for better context
          if (para.length > 1000) {
            passages.push(para.substring(0, 1000) + '...');
          } else {
            passages.push(para.trim());
          }
        }
      }
    }
    
    // If we still don't have good passages, create chunks from the content
    if (passages.length === 0 && content.length > 100) {
      const chunkSize = 500;
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.substring(i, Math.min(i + chunkSize, content.length));
        if (chunk.trim().length > 50) {
          passages.push(chunk.trim());
        }
      }
    }
    
    // Return up to 3 most relevant passages (in a real implementation, you'd use embeddings)
    return passages.slice(0, 3);
  }
  
  // Main execution method
  async run(documents: Document[]): Promise<GenerationResult> {
    const initialState: RAGASState = {
      documents,
      processed_docs: [],
      evolved_questions: [],
      question_answers: [],
      question_contexts: [],
      errors: []
    };
    
    try {
      const result = await this.graph.invoke(initialState);
      
      return {
        evolved_questions: result.evolved_questions,
        question_answers: result.question_answers,
        question_contexts: result.question_contexts,
        generation_metadata: {
          total_questions: result.evolved_questions.length,
          evolution_types_count: {
            simple: result.evolved_questions.filter(q => q.evolution_type === 'simple').length,
            multi_context: result.evolved_questions.filter(q => q.evolution_type === 'multi_context').length,
            reasoning: result.evolved_questions.filter(q => q.evolution_type === 'reasoning').length
          },
          processing_errors: result.errors,
          generation_timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

