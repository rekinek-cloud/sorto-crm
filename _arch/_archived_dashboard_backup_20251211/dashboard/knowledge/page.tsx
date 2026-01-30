'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
import { motion } from 'framer-motion';
import {
  DocumentIcon,
  BookOpenIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TagIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

interface Document {
  id: string;
  title: string;
  summary?: string;
  type: string;
  status: string;
  tags: string[];
  viewCount: number;
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
  _count: {
    comments: number;
    shares: number;
  };
}

interface WikiPage {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  isPublished: boolean;
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
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  children?: Folder[];
  _count: {
    documents: number;
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

export default function KnowledgePage() {
  const { user, isLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<'documents' | 'wiki' | 'folders'>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [wikiPages, setWikiPages] = useState<WikiPage[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab, selectedFolder]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'documents':
          await loadDocuments();
          break;
        case 'wiki':
          await loadWikiPages();
          break;
        case 'folders':
          await loadFolders();
          break;
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    const params = new URLSearchParams();
    if (selectedFolder) params.append('folderId', selectedFolder);
    if (searchQuery) params.append('search', searchQuery);

    const response = await apiClient.get(`/knowledge/documents?${params}`);
    setDocuments(response.data.data);
  };

  const loadWikiPages = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);

    const response = await apiClient.get(`/knowledge/wiki?${params}`);
    setWikiPages(response.data.data);
  };

  const loadFolders = async () => {
    const response = await apiClient.get('/knowledge/folders');
    setFolders(response.data.data);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2 || query.length === 0) {
      loadData();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Knowledge Base 📚
              </h1>
              <p className="text-gray-600 mt-1">
                Centralized repository for documents, wiki pages, and team knowledge
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="btn btn-outline btn-sm">
                <PlusIcon className="w-4 h-4 mr-1" />
                New Document
              </button>
              <button className="btn btn-primary btn-sm">
                <BookOpenIcon className="w-4 h-4 mr-1" />
                New Wiki Page
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <motion.div
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative max-w-md mx-auto">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents, wiki pages..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'documents', label: 'Documents', icon: DocumentIcon, count: documents.length },
              { id: 'wiki', label: 'Wiki Pages', icon: BookOpenIcon, count: wikiPages.length },
              { id: 'folders', label: 'Folders', icon: FolderIcon, count: folders.length }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative py-4 px-1 font-medium text-sm transition-colors ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Folder Filter */}
              {folders.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Filter by Folder</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedFolder(null)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        !selectedFolder
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All Documents
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.id)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedFolder === folder.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={{ 
                          backgroundColor: selectedFolder === folder.id ? folder.color + '20' : undefined,
                          borderColor: selectedFolder === folder.id ? folder.color : undefined
                        }}
                      >
                        {folder.name} ({folder._count.documents})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((document) => {
                  const typeConfig = documentTypeConfig[document.type as keyof typeof documentTypeConfig] || documentTypeConfig.NOTE;
                  
                  return (
                    <motion.div
                      key={document.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{typeConfig.icon}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-700`}>
                              {typeConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <EyeIcon className="w-4 h-4" />
                            <span>{document.viewCount}</span>
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {document.title}
                        </h3>

                        {document.summary && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {document.summary}
                          </p>
                        )}

                        {document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {document.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                              >
                                <TagIcon className="w-3 h-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                            {document.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{document.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <img
                              src={document.author.avatar || '/placeholder-avatar.png'}
                              alt={`${document.author.firstName} ${document.author.lastName}`}
                              className="w-5 h-5 rounded-full"
                            />
                            <span>{document.author.firstName} {document.author.lastName}</span>
                          </div>
                          <span>{formatDate(document.updatedAt)}</span>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <ChatBubbleLeftIcon className="w-4 h-4" />
                              <span>{document._count.comments}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ShareIcon className="w-4 h-4" />
                              <span>{document._count.shares}</span>
                            </div>
                          </div>
                          {document.folder && (
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: document.folder.color + '20',
                                color: document.folder.color
                              }}
                            >
                              {document.folder.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {documents.length === 0 && !loading && (
                <div className="text-center py-12">
                  <DocumentIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first document'}
                  </p>
                  <button className="btn btn-primary">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Create Document
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wiki' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wikiPages.map((page) => (
                <motion.div
                  key={page.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{page.category?.icon || '📄'}</span>
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
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        page.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {page.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {page.title}
                    </h3>

                    {page.summary && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {page.summary}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <img
                          src={page.author.avatar || '/placeholder-avatar.png'}
                          alt={`${page.author.firstName} ${page.author.lastName}`}
                          className="w-5 h-5 rounded-full"
                        />
                        <span>{page.author.firstName} {page.author.lastName}</span>
                      </div>
                      <span>{formatDate(page.updatedAt)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {wikiPages.length === 0 && !loading && (
                <div className="col-span-full text-center py-12">
                  <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No wiki pages found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first wiki page'}
                  </p>
                  <button className="btn btn-primary">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Create Wiki Page
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'folders' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setActiveTab('documents');
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: folder.color + '20' }}
                      >
                        <FolderIcon 
                          className="w-6 h-6"
                          style={{ color: folder.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {folder.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {folder._count.documents} documents
                        </p>
                      </div>
                    </div>

                    {folder.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {folder.description}
                      </p>
                    )}

                    {folder.children && folder.children.length > 0 && (
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-500 mb-2">Subfolders:</p>
                        <div className="flex flex-wrap gap-1">
                          {folder.children.slice(0, 3).map((child) => (
                            <span
                              key={child.id}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                            >
                              {child.name}
                            </span>
                          ))}
                          {folder.children.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{folder.children.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {folders.length === 0 && !loading && (
                <div className="col-span-full text-center py-12">
                  <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No folders found</h3>
                  <p className="text-gray-600 mb-4">
                    Organize your documents by creating folders
                  </p>
                  <button className="btn btn-primary">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Create Folder
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}