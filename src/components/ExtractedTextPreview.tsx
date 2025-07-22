import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExtractedDocument {
  name: string;
  content: string;
  pageCount?: number;
}

interface ExtractedTextPreviewProps {
  documents: ExtractedDocument[];
  isVisible: boolean;
  onClose: () => void;
}

export const ExtractedTextPreview: React.FC<ExtractedTextPreviewProps> = ({
  documents,
  isVisible,
  onClose
}) => {
  const [selectedDoc, setSelectedDoc] = React.useState(0);

  console.log('ExtractedTextPreview render:', { isVisible, documentsCount: documents.length });
  
  if (!isVisible || documents.length === 0) return null;

  return (
    <Card className="w-full max-w-6xl mx-auto my-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Extracted Text Preview
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Document tabs */}
        {documents.length > 1 && (
          <div className="flex gap-2 mb-4 border-b">
            {documents.map((doc, index) => (
              <button
                key={index}
                onClick={() => setSelectedDoc(index)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedDoc === index
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {doc.name}
              </button>
            ))}
          </div>
        )}

        {/* Document content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Document: {documents[selectedDoc].name}</span>
            {documents[selectedDoc].pageCount && (
              <span>Total Pages: {documents[selectedDoc].pageCount}</span>
            )}
          </div>
          
          <ScrollArea className="h-96 w-full rounded-md border bg-gray-50 p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
              {documents[selectedDoc].content}
            </pre>
          </ScrollArea>

          <div className="text-xs text-gray-500 mt-2">
            Character count: {documents[selectedDoc].content.length.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};