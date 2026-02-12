'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@/lib/auth/context';
import { knowledgeApi } from '@/lib/api/knowledge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  BookOpen,
  Folder,
  Search,
  Plus,
  Tag,
  Eye,
  MessageCircle,
  Share2,
  StickyNote,
  Newspaper,
  BookMarked,
  GraduationCap,
  ClipboardList,
  Users,
  FlaskConical,
  FileIcon,
  Scale,
  RefreshCw
} from 'lucide-react';
import DocumentModal from '@/components/knowledge/DocumentModal';
import WikiPageModal from '@/components/knowledge/WikiPageModal';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import { ActionButton } from '@/components/ui/ActionButton';

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

interface KnowledgeFolder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  children?: KnowledgeFolder[];
  _count: {
    documents: number;
  };
}

const documentTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  NOTE: { icon: StickyNote, label: 'Notatka', color: 'blue' },
  ARTICLE: { icon: Newspaper, label: 'Artykul', color: 'green' },
  GUIDE: { icon: BookMarked, label: 'Przewodnik', color: 'purple' },
  TUTORIAL: { icon: GraduationCap, label: 'Tutorial', color: 'orange' },
  SPECIFICATION: { icon: ClipboardList, label: 'Specyfikacja', color: 'red' },
  MEETING_NOTES: { icon: Users, label: 'Notatki ze spotkania', color: 'yellow' },
  RESEARCH: { icon: FlaskConical, label: 'Badania', color: 'pink' },
  TEMPLATE: { icon: FileIcon, label: 'Szablon', color: 'slate' },
  POLICY: { icon: Scale, label: 'Polityka', color: 'indigo' },
  PROCEDURE: { icon: RefreshCw, label: 'Procedura', color: 'cyan' }
};

const typeFilterOptions = Object.entries(documentTypeConfig).map(([key, val]) => ({
  value: key,
  label: val.label,
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function KnowledgePage() {
  const { user, isLoading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<'documents' | 'wiki' | 'folders'>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [wikiPages, setWikiPages] = useState<WikiPage[]>([]);
  const [folders, setFolders] = useState<KnowledgeFolder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showWikiModal, setShowWikiModal] = useState(false);

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
    const response = await knowledgeApi.getDocuments({
      folderId: selectedFolder || undefined,
      search: searchQuery || undefined,
    });
    setDocuments(response.data);
  };

  const loadWikiPages = async () => {
    const response = await knowledgeApi.getWikiPages({
      search: searchQuery || undefined,
    });
    setWikiPages(response.data);
  };

  const loadFolders = async () => {
    const response = await knowledgeApi.getFolders();
    setFolders(response.data);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2 || query.length === 0) {
      loadData();
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'type') setTypeFilter(value);
    if (key === 'folder') setSelectedFolder(value === 'all' ? null : value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalViews = documents.reduce((sum, d) => sum + d.viewCount, 0);

  const filteredDocuments = typeFilter === 'all'
    ? documents
    : documents.filter(d => d.type === typeFilter);

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'documents' as const, label: 'Dokumenty', icon: FileText, count: documents.length },
    { id: 'wiki' as const, label: 'Strony wiki', icon: BookOpen, count: wikiPages.length },
    { id: 'folders' as const, label: 'Foldery', icon: Folder, count: folders.length },
  ];

  const folderFilterOptions = folders.map(f => ({
    value: f.id,
    label: `${f.name} (${f._count.documents})`,
  }));

  return (
    <PageShell>
      <PageHeader
        title="Baza wiedzy"
        subtitle="Dokumenty, wiki i zasoby wiedzy"
        icon={BookOpen}
        iconColor="text-emerald-600"
        breadcrumbs={[{ label: 'Baza wiedzy' }]}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              icon={Plus}
              onClick={() => setShowDocumentModal(true)}
            >
              Nowy dokument
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={BookOpen}
              onClick={() => setShowWikiModal(true)}
            >
              Nowa strona wiki
            </ActionButton>
          </div>
        }
      />

      {/* Statystyki */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatCard
          label="Dokumenty"
          value={documents.length}
          icon={FileText}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="Strony wiki"
          value={wikiPages.length}
          icon={BookOpen}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Foldery"
          value={folders.length}
          icon={Folder}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          label="Wyswietlenia"
          value={totalViews}
          icon={Eye}
          iconColor="text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </motion.div>

      {/* Filtrowanie */}
      <div className="mb-6">
        <FilterBar
          search={searchQuery}
          onSearchChange={handleSearch}
          searchPlaceholder="Szukaj dokumentow, stron wiki..."
          filters={[
            { key: 'type', label: 'Typ dokumentu', options: typeFilterOptions },
            ...(folders.length > 0 ? [{ key: 'folder', label: 'Folder', options: folderFilterOptions }] : []),
          ]}
          filterValues={{ type: typeFilter, folder: selectedFolder || 'all' }}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Zakladki */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <nav className="flex gap-1 p-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-xl w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </motion.div>

      {/* Zawartosc */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <SkeletonPage />
          ) : (
            <>
              {/* Dokumenty */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  {filteredDocuments.length > 0 ? (
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filteredDocuments.map((document) => {
                        const typeConfig = documentTypeConfig[document.type] || documentTypeConfig.NOTE;
                        const TypeIcon = typeConfig.icon;

                        return (
                          <motion.div
                            key={document.id}
                            variants={itemVariants}
                            className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                            whileHover={{ y: -2 }}
                          >
                            <div className="p-5">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg bg-${typeConfig.color}-50 dark:bg-${typeConfig.color}-900/30`}>
                                    <TypeIcon className={`w-4 h-4 text-${typeConfig.color}-600 dark:text-${typeConfig.color}-400`} />
                                  </div>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${typeConfig.color}-100 dark:bg-${typeConfig.color}-900/30 text-${typeConfig.color}-700 dark:text-${typeConfig.color}-300`}>
                                    {typeConfig.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{document.viewCount}</span>
                                </div>
                              </div>

                              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {document.title}
                              </h3>

                              {document.summary && (
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 line-clamp-3">
                                  {document.summary}
                                </p>
                              )}

                              {document.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {document.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
                                    >
                                      <Tag className="w-2.5 h-2.5 mr-1" />
                                      {tag}
                                    </span>
                                  ))}
                                  {document.tags.length > 3 && (
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                      +{document.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={document.author.avatar || '/placeholder-avatar.png'}
                                    alt={`${document.author.firstName} ${document.author.lastName}`}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className="text-xs">{document.author.firstName} {document.author.lastName}</span>
                                </div>
                                <span className="text-xs">{formatDate(document.updatedAt)}</span>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>{document._count.comments}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>{document._count.shares}</span>
                                  </div>
                                </div>
                                {document.folder && (
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full"
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
                    </motion.div>
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="Nie znaleziono dokumentow"
                      description={searchQuery ? 'Sprobuj zmienic kryteria wyszukiwania' : 'Zacznij od utworzenia pierwszego dokumentu'}
                      action={
                        <ActionButton
                          variant="primary"
                          icon={Plus}
                          onClick={() => setShowDocumentModal(true)}
                        >
                          Utworz dokument
                        </ActionButton>
                      }
                    />
                  )}
                </div>
              )}

              {/* Wiki */}
              {activeTab === 'wiki' && (
                <>
                  {wikiPages.length > 0 ? (
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {wikiPages.map((page) => (
                        <motion.div
                          key={page.id}
                          variants={itemVariants}
                          className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                          whileHover={{ y: -2 }}
                        >
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {page.category && (
                                  <span
                                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                                    style={{
                                      backgroundColor: page.category.color + '20',
                                      color: page.category.color
                                    }}
                                  >
                                    {page.category.name}
                                  </span>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                page.isPublished
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                              }`}>
                                {page.isPublished ? 'Opublikowane' : 'Szkic'}
                              </span>
                            </div>

                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {page.title}
                            </h3>

                            {page.summary && (
                              <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 line-clamp-3">
                                {page.summary}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <img
                                  src={page.author.avatar || '/placeholder-avatar.png'}
                                  alt={`${page.author.firstName} ${page.author.lastName}`}
                                  className="w-5 h-5 rounded-full"
                                />
                                <span className="text-xs">{page.author.firstName} {page.author.lastName}</span>
                              </div>
                              <span className="text-xs">{formatDate(page.updatedAt)}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <EmptyState
                      icon={BookOpen}
                      title="Nie znaleziono stron wiki"
                      description={searchQuery ? 'Sprobuj zmienic kryteria wyszukiwania' : 'Zacznij od utworzenia pierwszej strony wiki'}
                      action={
                        <ActionButton
                          variant="primary"
                          icon={Plus}
                          onClick={() => setShowWikiModal(true)}
                        >
                          Utworz strone wiki
                        </ActionButton>
                      }
                    />
                  )}
                </>
              )}

              {/* Foldery */}
              {activeTab === 'folders' && (
                <>
                  {folders.length > 0 ? (
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {folders.map((folder) => (
                        <motion.div
                          key={folder.id}
                          variants={itemVariants}
                          className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                          whileHover={{ y: -2 }}
                          onClick={() => {
                            setSelectedFolder(folder.id);
                            setActiveTab('documents');
                          }}
                        >
                          <div className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: (folder.color || '#6366f1') + '20' }}
                              >
                                <Folder
                                  className="w-5 h-5"
                                  style={{ color: folder.color || '#6366f1' }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {folder.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {folder._count.documents} dokumentow
                                </p>
                              </div>
                            </div>

                            {folder.description && (
                              <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 line-clamp-2">
                                {folder.description}
                              </p>
                            )}

                            {folder.children && folder.children.length > 0 && (
                              <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3">
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Podfoldery:</p>
                                <div className="flex flex-wrap gap-1">
                                  {folder.children.slice(0, 3).map((child) => (
                                    <span
                                      key={child.id}
                                      className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
                                    >
                                      {child.name}
                                    </span>
                                  ))}
                                  {folder.children.length > 3 && (
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                      +{folder.children.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <EmptyState
                      icon={Folder}
                      title="Nie znaleziono folderow"
                      description="Organizuj dokumenty tworzac foldery"
                      action={
                        <ActionButton
                          variant="primary"
                          icon={Plus}
                          onClick={() => setShowDocumentModal(true)}
                        >
                          Utworz folder
                        </ActionButton>
                      }
                    />
                  )}
                </>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modale */}
      <DocumentModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSuccess={() => {
          setShowDocumentModal(false);
          loadData();
        }}
      />

      <WikiPageModal
        isOpen={showWikiModal}
        onClose={() => setShowWikiModal(false)}
        onSuccess={() => {
          setShowWikiModal(false);
          loadData();
        }}
      />
    </PageShell>
  );
}
