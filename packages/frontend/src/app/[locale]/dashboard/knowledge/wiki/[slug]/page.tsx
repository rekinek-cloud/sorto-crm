'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth/context';
import { knowledgeApi } from '@/lib/api/knowledge';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  ArrowLeftIcon,
  PencilIcon,
  LinkIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  isPublished: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  linkedPages: LinkedPage[];
  backlinkedPages: LinkedPage[];
}

interface LinkedPage {
  id: string;
  linkText?: string;
  targetPage?: {
    id: string;
    title: string;
    slug: string;
  };
  sourcePage?: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function WikiPageView() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useRequireAuth();
  const [page, setPage] = useState<WikiPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && params.slug) {
      loadPage();
    }
  }, [user, params.slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const response = await knowledgeApi.getWikiPage(params.slug as string);
      setPage(response.data);
    } catch (error: any) {
      console.error('Failed to load wiki page:', error);
      router.push('/dashboard/knowledge');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const processContent = (content: string) => {
    // Simple markdown-like processing
    let processedContent = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-6">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Code blocks
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-4 rounded-lg my-4 overflow-x-auto"><code class="text-sm">$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
      // Lists
      .replace(/^\- (.+$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.+$)/gim, '<li class="ml-4">$1</li>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>');

    return `<p class="mb-4">${processedContent}</p>`;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !page) {
    return null;
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="bg-white shadow-sm border-b border-gray-200"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{page.category?.icon || '📄'}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                      {page.title}
                    </h1>
                    {!page.isPublished && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {page.category && (
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: page.category.color + '20',
                          color: page.category.color
                        }}
                      >
                        {page.category.name}
                      </span>
                    )}
                    <span>v{page.version}</span>
                    <span>/{page.slug}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="btn btn-outline btn-sm">
                <ShareIcon className="w-4 h-4 mr-1" />
                Share
              </button>
              <button className="btn btn-primary btn-sm">
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              className="bg-white rounded-lg shadow-sm border border-gray-200"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="p-8">
                {/* Page Summary */}
                {page.summary && (
                  <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Summary</h3>
                    <p className="text-blue-800">{page.summary}</p>
                  </div>
                )}

                {/* Page Content */}
                <div className="prose prose-lg max-w-none">
                  <div 
                    className="wiki-content"
                    dangerouslySetInnerHTML={{ 
                      __html: processContent(page.content)
                    }} 
                  />
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4" />
                        <span>
                          Created by {page.author.firstName} {page.author.lastName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Last updated {formatDate(page.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      Page ID: {page.slug}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Table of Contents */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contents</h3>
                <nav className="space-y-2">
                  {/* Extract headers from content for TOC */}
                  {page.content.match(/^#+\s+(.+)$/gm)?.map((header, index) => {
                    const level = header.match(/^#+/)?.[0].length || 1;
                    const text = header.replace(/^#+\s+/, '');
                    const anchor = text.toLowerCase().replace(/\s+/g, '-');
                    
                    return (
                      <a
                        key={index}
                        href={`#${anchor}`}
                        className={`block text-sm text-gray-600 hover:text-gray-900 transition-colors ${
                          level === 1 ? 'font-medium' : 
                          level === 2 ? 'ml-2' : 'ml-4'
                        }`}
                      >
                        {text}
                      </a>
                    );
                  }) || (
                    <p className="text-sm text-gray-500">No headers found</p>
                  )}
                </nav>
              </motion.div>

              {/* Related Pages */}
              {(page.linkedPages.length > 0 || page.backlinkedPages.length > 0) && (
                <motion.div
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Related Pages</h3>
                  
                  <div className="space-y-4">
                    {page.linkedPages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Links to:</h4>
                        <div className="space-y-2">
                          {page.linkedPages.map((link) => (
                            <div key={link.id} className="flex items-center space-x-2">
                              <LinkIcon className="w-4 h-4 text-gray-400" />
                              <a
                                href={`/dashboard/knowledge/wiki/${link.targetPage?.slug}`}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {link.targetPage?.title}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {page.backlinkedPages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Referenced by:</h4>
                        <div className="space-y-2">
                          {page.backlinkedPages.map((link) => (
                            <div key={link.id} className="flex items-center space-x-2">
                              <LinkIcon className="w-4 h-4 text-gray-400" />
                              <a
                                href={`/dashboard/knowledge/wiki/${link.sourcePage?.slug}`}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {link.sourcePage?.title}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Page Metadata */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Page Info</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Author</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <img
                        src={page.author.avatar || '/placeholder-avatar.png'}
                        alt={`${page.author.firstName} ${page.author.lastName}`}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-sm text-gray-600">
                        {page.author.firstName} {page.author.lastName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(page.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Modified</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(page.updatedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Version</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {page.version}
                    </p>
                  </div>

                  {page.category && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Category</p>
                      <span
                        className="inline-flex items-center px-2 py-1 text-sm rounded-full mt-1"
                        style={{
                          backgroundColor: page.category.color + '20',
                          color: page.category.color
                        }}
                      >
                        <span className="mr-1">{page.category.icon}</span>
                        {page.category.name}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-2">
                  <button className="w-full btn btn-outline btn-sm justify-start">
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit Page
                  </button>
                  <button className="w-full btn btn-outline btn-sm justify-start">
                    <BookOpenIcon className="w-4 h-4 mr-2" />
                    View History
                  </button>
                  <button className="w-full btn btn-outline btn-sm justify-start">
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Share Page
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .wiki-content h1,
        .wiki-content h2,
        .wiki-content h3 {
          scroll-margin-top: 100px;
        }
        
        .wiki-content pre {
          background: #f7f7f7;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .wiki-content code {
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9em;
        }
        
        .wiki-content pre code {
          background: none;
          padding: 0;
        }
      `}</style>
    </motion.div>
  );
}