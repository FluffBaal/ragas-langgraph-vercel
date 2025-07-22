import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RAGAS LangGraph Vercel',
  description: 'Production-ready RAGAS Synthetic Data Generation using LangGraph deployed on Vercel',
  keywords: ['RAGAS', 'LangGraph', 'Synthetic Data', 'AI', 'Machine Learning', 'Vercel'],
  authors: [{ name: 'Fluff' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'RAGAS LangGraph Vercel',
    description: 'Production-ready RAGAS Synthetic Data Generation using LangGraph deployed on Vercel',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAGAS LangGraph Vercel',
    description: 'Production-ready RAGAS Synthetic Data Generation using LangGraph deployed on Vercel',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <div className="min-h-full">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    RAGAS LangGraph
                  </h1>
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <nav className="flex space-x-4">
                  <a
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </a>
                  <a
                    href="https://github.com/your-org/ragas-langgraph-vercel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    GitHub
                  </a>
                </nav>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-600">
                    © 2025 RAGAS LangGraph Vercel. Built with Next.js and deployed on Vercel.
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <span className="text-xs text-gray-500">
                    Powered by OpenAI GPT-4.1-mini
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">System Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

