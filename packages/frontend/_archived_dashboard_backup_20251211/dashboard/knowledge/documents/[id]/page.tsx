'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
import { motion } from 'framer-motion';
import {
  DocumentIcon,
  ArrowLeftIcon,
  EyeIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  LinkIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

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

const documentTypeConfig = {
  NOTE: { icon: '📝', label: 'Note', color: 'blue' },
  ARTICLE: { icon: '📰', label: 'Article', color: 'green' },
  GUIDE: { icon: '📖', label: 'Guide', color: 'purple' },
  TUTORIAL: { icon: '🎓', label: 'Tutorial', color: 'orange' },
  SPECIFICATION: { icon: '📋', label: 'Specification', color: 'red' },
  MEETING_NOTES: { icon: '🗣️', label: 'Meeting Notes', color: 'yellow' },
  RESEARCH: { icon: '🔬', label: 'Research', color: 'pink' },
  TEMPLATE: { icon: '📄', label: 'Template', color: 'gray' },
  POLICY: { icon: '⚖️', label: 'Policy', color: 'indigo' },
  PROCEDURE: { icon: '🔄', label: 'Procedure', color: 'cyan' }
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
      const response = await apiClient.get(`/knowledge/documents/${params.id}`);
      setDocument(response.data.data);
    } catch (error: any) {
      console.error('Failed to load document:', error);
      router.push('/crm/dashboard/knowledge');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !document) return;

    try {
      setAddingComment(true);
      await apiClient.post(`/knowledge/documents/${document.id}/comments`, {
        content: newComment
      });
      setNewComment('');
      await loadDocument(); // Reload to get updated comments
    } catch (error: any) {
      console.error('Failed to add comment:', error);
    } finally {
      setAddingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !document) {
    return null;
  }

  const typeConfig = documentTypeConfig[document.type as keyof typeof documentTypeConfig] || documentTypeConfig.NOTE;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{typeConfig.icon}</span>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {document.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-700`}>
                      {typeConfig.label}
                    </span>
                    <div className="flex items-center space-x-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>{document.viewCount} views</span>
                    </div>
                    <span>v{document.version}</span>
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
                Edit
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {/* Document Summary */}
                {document.summary && (
                  <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Summary</h3>
                    <p className="text-blue-800">{document.summary}</p>
                  </div>
                )}

                {/* Document Content */}
                <div className="prose prose-lg max-w-none">
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
              className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Comments ({document.comments.length})
                </h3>
              </div>

              <div className="p-6">
                {/* Add Comment */}
                <div className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={addComment}
                      disabled={!newComment.trim() || addingComment}
                      className="btn btn-primary btn-sm"
                    >
                      {addingComment ? 'Adding...' : 'Add Comment'}
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
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              {comment.author.firstName} {comment.author.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
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
                                <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-900 text-sm">
                                      {reply.author.firstName} {reply.author.lastName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 text-sm">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {document.comments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No comments yet. Be the first to add one!</p>
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
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Document Info</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Author</p>
                      <p className="text-sm text-gray-600">
                        {document.author.firstName} {document.author.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(document.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        document.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                        document.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {document.status}
                      </span>
                    </div>
                  </div>

                  {document.folder && (
                    <div className="flex items-center space-x-3">
                      <PaperClipIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Folder</p>
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
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                      >
                        <TagIcon className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Linked Documents */}
              {(document.linkedDocuments.length > 0 || document.backlinkedDocuments.length > 0) && (
                <motion.div
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Related Documents</h3>
                  
                  <div className="space-y-4">
                    {document.linkedDocuments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Links to:</h4>
                        <div className="space-y-2">
                          {document.linkedDocuments.map((link) => (
                            <div key={link.id} className="flex items-center space-x-2">
                              <LinkIcon className="w-4 h-4 text-gray-400" />
                              <a
                                href={`/dashboard/knowledge/documents/${link.targetDocument?.id}`}
                                className="text-sm text-blue-600 hover:text-blue-800"
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
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Linked from:</h4>
                        <div className="space-y-2">
                          {document.backlinkedDocuments.map((link) => (
                            <div key={link.id} className="flex items-center space-x-2">
                              <LinkIcon className="w-4 h-4 text-gray-400" />
                              <a
                                href={`/dashboard/knowledge/documents/${link.sourceDocument?.id}`}
                                className="text-sm text-blue-600 hover:text-blue-800"
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
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Shared With</h3>
                  <div className="space-y-3">
                    {document.shares.map((share) => (
                      <div key={share.id} className="flex items-center space-x-3">
                        <img
                          src={share.sharedWith.avatar || '/placeholder-avatar.png'}
                          alt={`${share.sharedWith.firstName} ${share.sharedWith.lastName}`}
                          className="w-6 h-6 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {share.sharedWith.firstName} {share.sharedWith.lastName}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
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
      </div>
    </motion.div>
  );
}