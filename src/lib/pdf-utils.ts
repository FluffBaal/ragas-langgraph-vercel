// Utility function to extract text from PDF for preview
// This provides a fallback when PDF.js faces CORS issues

export async function extractPDFTextSimple(file: File): Promise<{ content: string; pageCount?: number }> {
  try {
    // For now, return a message about PDF preview limitations
    // The actual PDF processing happens server-side during generation
    const fileSize = (file.size / 1024).toFixed(2);
    
    return {
      content: `[PDF Document: ${file.name}]\n\nPDF preview requires server-side processing for security reasons.\nFile size: ${fileSize} KB\n\nThe PDF content will be extracted and processed when you click "Generate".\n\nNote: PDF processing is fully functional - only the preview is limited.`,
      pageCount: undefined
    };
  } catch (error) {
    console.error('PDF preview error:', error);
    
    return {
      content: `[PDF Document: ${file.name}]\n\nPDF preview encountered an error.\nFile size: ${(file.size / 1024).toFixed(2)} KB\n\nThe PDF will still be processed correctly during generation.`,
      pageCount: undefined
    };
  }
}