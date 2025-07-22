'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-gray max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Custom renderers for better styling
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
        p: ({ children }) => {
          // Check if children contains only whitespace or is empty
          const hasContent = React.Children.toArray(children).some(child => {
            if (typeof child === 'string') {
              return child.trim().length > 0;
            }
            return true;
          });
          
          if (!hasContent) {
            return null;
          }
          
          return <p className="mb-4 leading-relaxed">{children}</p>;
        },
        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="ml-4">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">{children}</blockquote>
        ),
        code: ({ children }) => {
          return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>;
        },
        pre: ({ children }) => {
          return (
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4 mt-4">
              {children}
            </pre>
          );
        },
        a: ({ href, children }) => (
          <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-gray-300">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-300 px-4 py-2">{children}</td>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};