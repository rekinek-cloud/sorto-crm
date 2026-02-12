'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth/context';
import { knowledgeApi } from '@/lib/api/knowledge';
import { motion } from 'framer-motion';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  FileText,
  ArrowLeft,
  Eye,
  Share2,
  MessageSquare,
  Tag,
  Calendar,
  User,
  Link,
  Paperclip,
  Pencil,
  FileEdit,
  BookOpen,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  FlaskConical,
  File,
  Scale,
  RefreshCw,
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  summary?: string;
  type: string;
  status: string;
  tags: string[];
  viewCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  folder?: {
    id: string;
    name: string;
    color?: string;
  };
  comments: Comment[];
  shares: Share[];
  linkedDocuments: LinkedDocument[];
  backlinkedDocuments: LinkedDocument[];
}

interface Comment {
  id: string;
  content: string;
  isResolved: boolean;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  replies: Comment[];
}

interface Share {
  id: string;
  permission: string;
  sharedWith: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface LinkedDocument {
  id: string;
  type: string;
  targetDocument?: {
    id: string;
    title: string;
    type: string;
  };
  sourceDocument?: {
    id: string;
    title: string;
    type: string;
  };
}

const DocumentTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'NOTE': return <FileEdit className="w-5 h-5 text-blue-500" />;
    case 'ARTICLE': return <FileText className="w-5 h-5 text-green-500" />;
    case 'GUIDE': return <BookOpen className="w-5 h-5 text-purple-500" />;
    case 'TUTORIAL': return <GraduationCap className="w-5 h-5 text-orange-500" />;
    case 'SPECIFICATION': return <ClipboardList className="w-5 h-5 text-red-500" />;
    case 'MEETING_NOTES': return <MessageCircle className="w-5 h-5 text-yellow-500" />;
    case 'RESEARCH': return <FlaskConical className="w-5 h-5 text-pink-500" />;
    case 'TEMPLATE': return <File className="w-5 h-5 text-slate-500" />;
    case 'POLICY': return <Scale className="w-5 h-5 text-indigo-500" />;
    case 'PROCEDURE': return <RefreshCw className="w-5 h-5 text-cyan-500" />;
    default: return <FileEdit className="w-5 h-5 text-blue-500" />;
  }
};

const documentTypeConfig: Record<string, { label: string; color: string }> = {
  NOTE: { label: 'Notatka', color: 'blue' },
  ARTICLE: { label: 'Artykul', color: 'green' },
  GUIDE: { label: 'Przewodnik', color: 'purple' },
  TUTORIAL: { label: 'Tutorial', color: 'orange' },
  SPECIFICATION: { label: 'Specyfikacja', color: 'red' },
  MEETING_NOTES: { label: 'Notatki ze spotkania', color: 'yellow' },
  RESEARCH: { label: 'Badanie', color: 'pink' },
  TEMPLATE: { label: 'Szablon', color: 'slate' },
  POLICY: { label: 'Polityka', color: 'indigo' },
  PROCEDURE: { label: 'Procedura', color: 'cyan' },
};

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useRequireAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    if (user && params.id) {
      loadDocument();
    }
  }, [user, params.id]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await knowledgeApi.getDocument(params.id as string);
      setDocument(response.data);
    } catch (error: any) {
      console.error('Failed to load document:', error);
      router.push('/dashboard/knowledge');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !document) return;

    try {
      setAddingComment(true);
      await knowledgeApi.addDocumentComment(document.id, newComment);
      setNewComment('');
      await loadDocument();
    } catch (error: any) {
      console.error('Failed to add comment:', error);
    } finally {
      setAddingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!user || !document) {
    return null;
  }

  const typeConfig = documentTypeConfig[document.type as keyof typeof documentTypeConfig] || documentTypeConfig.NOTE;

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
                <DocumentTypeIcon type={document.type} />
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {document.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-700 dark:bg-${typeConfig.color}-900/30 dark:text-${typeConfig.color}-400`}>
                      {typeConfig.label}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{document.viewCount} wyswietlen</span>
                    </div>
                    <span>v{document.version}</span>
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
              {/* Document Summary */}
              {document.summary && (
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                  <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Podsumowanie</h3>
                  <p className="text-blue-800 dark:text-blue-400">{document.summary}</p>
                </div>
              )}

              {/* Document Content */}
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div
                  dangerouslySetInnerHTML={{
                    __html: document.content.replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Comments Section */}
          <motion.div
            className="mt-6 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Komentarze ({document.comments.length})
              </h3>
            </div>

            <div className="p-6">
              {/* Add Comment */}
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Dodaj komentarz..."
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim() || addingComment}
                    className="btn btn-primary btn-sm"
                  >
                    {addingComment ? 'Dodawanie...' : 'Dodaj komentarz'}
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-6">
                {document.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <img
                      src={comment.author.avatar || '/placeholder-avatar.png'}
                      alt={`${comment.author.firstName} ${comment.author.lastName}`}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {comment.author.firstName} {comment.author.lastName}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">{comment.content}</p>
                      </div>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="ml-4 mt-3 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-3">
                              <img
                                src={reply.author.avatar || '/placeholder-avatar.png'}
                                alt={`${reply.author.firstName} ${reply.author.lastName}`}
                                className="w-6 h-6 rounded-full"
                              />
                              <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                    {reply.author.firstName} {reply.author.lastName}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 text-sm">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {document.comments.length === 0 && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p>Brak komentarzy. Badz pierwszy!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Document Info */}
            <motion.div
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Informacje</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Autor</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {document.author.firstName} {document.author.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Ostatnia aktualizacja</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(document.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      document.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      document.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {document.status === 'PUBLISHED' ? 'Opublikowany' : document.status === 'DRAFT' ? 'Szkic' : document.status}
                    </span>
                  </div>
                </div>

                {document.folder && (
                  <div className="flex items-center space-x-3">
                    <Paperclip className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Folder</p>
                      <span
                        className="text-sm px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: document.folder.color + '20',
                          color: document.folder.color
                        }}
                      >
                        {document.folder.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tags */}
            {document.tags.length > 0 && (
              <motion.div
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Tagi</h3>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 text-sm bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Linked Documents */}
            {(document.linkedDocuments.length > 0 || document.backlinkedDocuments.length > 0) && (
              <motion.div
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Powiazane dokumenty</h3>

                <div className="space-y-4">
                  {document.linkedDocuments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Linkuje do:</h4>
                      <div className="space-y-2">
                        {document.linkedDocuments.map((link) => (
                          <div key={link.id} className="flex items-center space-x-2">
                            <Link className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <a
                              href={`/dashboard/knowledge/documents/${link.targetDocument?.id}`}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {link.targetDocument?.title}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {document.backlinkedDocuments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Linkowane z:</h4>
                      <div className="space-y-2">
                        {document.backlinkedDocuments.map((link) => (
                          <div key={link.id} className="flex items-center space-x-2">
                            <Link className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <a
                              href={`/dashboard/knowledge/documents/${link.sourceDocument?.id}`}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {link.sourceDocument?.title}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Shared With */}
            {document.shares.length > 0 && (
              <motion.div
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Udostepnione</h3>
                <div className="space-y-3">
                  {document.shares.map((share) => (
                    <div key={share.id} className="flex items-center space-x-3">
                      <img
                        src={share.sharedWith.avatar || '/placeholder-avatar.png'}
                        alt={`${share.sharedWith.firstName} ${share.sharedWith.lastName}`}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {share.sharedWith.firstName} {share.sharedWith.lastName}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                        {share.permission}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
