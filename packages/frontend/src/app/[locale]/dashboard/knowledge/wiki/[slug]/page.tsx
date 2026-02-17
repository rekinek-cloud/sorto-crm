'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth/context';
import { knowledgeApi } from '@/lib/api/knowledge';
import { motion } from 'framer-motion';
import { PageShell } from '@/components/ui/PageShell';
import {
  BookOpen,
  ArrowLeft,
  Pencil,
  Link,
  Calendar,
  User,
  Share2,
  FileText,
  History,
} from 'lucide-react';

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
      setPage(response.data as any);
    } catch (error: any) {
      console.error('Failed to load wiki page:', error);
      router.push('/dashboard/knowledge');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const processContent = (content: string) => {
    let processedContent = content
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-6">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/```([^`]+)```/g, '<pre class="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg my-4 overflow-x-auto"><code class="text-sm">$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded text-sm">$1</code>')
      .replace(/^\- (.+$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.+$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>');

    return `<p class="mb-4">${processedContent}</p>`;
  };

  if (isLoading || loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </PageShell>
    );
  }

  if (!user || !page) {
    return null;
  }

  return (
    <PageShell>
      {/* Header */}
      <motion.div
        className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {page.title}
                    </h1>
                    {!page.isPublished && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                        Szkic
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
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
                <Share2 className="w-4 h-4 mr-1" />
                Udostepnij
              </button>
              <button className="btn btn-primary btn-sm">
                <Pencil className="w-4 h-4 mr-1" />
                Edytuj
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="p-8">
              {page.summary && (
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                  <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Podsumowanie</h3>
                  <p className="text-blue-800 dark:text-blue-400">{page.summary}</p>
                </div>
              )}

              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div
                  className="wiki-content"
                  dangerouslySetInnerHTML={{
                    __html: processContent(page.content)
                  }}
                />
              </div>

              <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>
                        Utworzono przez {page.author.firstName} {page.author.lastName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Ostatnia aktualizacja {formatDate(page.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="text-slate-400 dark:text-slate-500">
                    ID: {page.slug}
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
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Spis tresci</h3>
              <nav className="space-y-2">
                {page.content.match(/^#+\s+(.+)$/gm)?.map((header, index) => {
                  const level = header.match(/^#+/)?.[0].length || 1;
                  const text = header.replace(/^#+\s+/, '');
                  const anchor = text.toLowerCase().replace(/\s+/g, '-');

                  return (
                    <a
                      key={index}
                      href={`#${anchor}`}
                      className={`block text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors ${
                        level === 1 ? 'font-medium' :
                        level === 2 ? 'ml-2' : 'ml-4'
                      }`}
                    >
                      {text}
                    </a>
                  );
                }) || (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Brak naglowkow</p>
                )}
              </nav>
            </motion.div>

            {/* Related Pages */}
            {(page.linkedPages.length > 0 || page.backlinkedPages.length > 0) && (
              <motion.div
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Powiazane strony</h3>

                <div className="space-y-4">
                  {page.linkedPages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Linkuje do:</h4>
                      <div className="space-y-2">
                        {page.linkedPages.map((link) => (
                          <div key={link.id} className="flex items-center space-x-2">
                            <Link className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <a
                              href={`/dashboard/knowledge/wiki/${link.targetPage?.slug}`}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Odwolania:</h4>
                      <div className="space-y-2">
                        {page.backlinkedPages.map((link) => (
                          <div key={link.id} className="flex items-center space-x-2">
                            <Link className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <a
                              href={`/dashboard/knowledge/wiki/${link.sourcePage?.slug}`}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Informacje o stronie</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Autor</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <img
                      src={page.author.avatar || '/placeholder-avatar.png'}
                      alt={`${page.author.firstName} ${page.author.lastName}`}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {page.author.firstName} {page.author.lastName}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Utworzono</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {formatDate(page.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Ostatnia modyfikacja</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {formatDate(page.updatedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Wersja</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {page.version}
                  </p>
                </div>

                {page.category && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Kategoria</p>
                    <span
                      className="inline-flex items-center px-2 py-1 text-sm rounded-full mt-1"
                      style={{
                        backgroundColor: page.category.color + '20',
                        color: page.category.color
                      }}
                    >
                      {page.category.name}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Szybkie akcje</h3>

              <div className="space-y-2">
                <button className="w-full btn btn-outline btn-sm justify-start">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edytuj strone
                </button>
                <button className="w-full btn btn-outline btn-sm justify-start">
                  <History className="w-4 h-4 mr-2" />
                  Historia zmian
                </button>
                <button className="w-full btn btn-outline btn-sm justify-start">
                  <Share2 className="w-4 h-4 mr-2" />
                  Udostepnij strone
                </button>
              </div>
            </motion.div>
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
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .wiki-content code {
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9em;
        }

        .wiki-content pre code {
          background: none;
          padding: 0;
        }
      `}</style>
    </PageShell>
  );
}
