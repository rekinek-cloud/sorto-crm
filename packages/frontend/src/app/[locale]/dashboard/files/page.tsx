'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Upload,
  File,
  Image,
  Video,
  FileText,
  Archive,
  Folder,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  Download,
  Share2,
  Plus,
  X,
  FolderPlus,
  FolderOpen,
  LayoutGrid,
  List,
  HardDrive,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import { ActionButton } from '@/components/ui/ActionButton';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'document' | 'image' | 'video' | 'archive' | 'other';
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  parentFolder?: string;
  shared: boolean;
  tags: string[];
  description?: string;
  path: string;
}

interface FolderItem {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  itemCount: number;
  path: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [typeFilter, setTypeFilter] = useState('all');
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadFiles();
  }, [currentFolder]);

  const loadFiles = async () => {
    setTimeout(() => {
      const mockFolders: FolderItem[] = [
        {
          id: 'proj1',
          name: 'Dokumenty projektowe',
          parentId: undefined,
          createdAt: new Date(Date.now() - 2592000000).toISOString(),
          itemCount: 8,
          path: '/Dokumenty projektowe'
        },
        {
          id: 'imgs1',
          name: 'Zdjecia i media',
          parentId: undefined,
          createdAt: new Date(Date.now() - 1296000000).toISOString(),
          itemCount: 12,
          path: '/Zdjecia i media'
        },
        {
          id: 'arch1',
          name: 'Archiwum',
          parentId: undefined,
          createdAt: new Date(Date.now() - 5184000000).toISOString(),
          itemCount: 24,
          path: '/Archiwum'
        }
      ];

      const mockFiles: FileItem[] = [
        {
          id: '1',
          name: 'Propozycja_Projektu_2024.pdf',
          type: 'document',
          size: 2048576,
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          uploadedBy: 'Jan Kowalski',
          shared: true,
          tags: ['propozycja', 'projekt', '2024'],
          description: 'Glowna propozycja projektu',
          path: '/Propozycja_Projektu_2024.pdf'
        },
        {
          id: '2',
          name: 'Notatki_Ze_Spotkania_Sty.docx',
          type: 'document',
          size: 524288,
          uploadedAt: new Date(Date.now() - 172800000).toISOString(),
          uploadedBy: 'Anna Nowak',
          shared: false,
          tags: ['spotkanie', 'notatki'],
          path: '/Notatki_Ze_Spotkania_Sty.docx'
        },
        {
          id: '3',
          name: 'Screenshot_Dashboard.png',
          type: 'image',
          size: 1048576,
          uploadedAt: new Date(Date.now() - 259200000).toISOString(),
          uploadedBy: 'Michal Jankowski',
          shared: true,
          tags: ['screenshot', 'ui'],
          path: '/Screenshot_Dashboard.png'
        },
        {
          id: '4',
          name: 'Demo_Video.mp4',
          type: 'video',
          size: 52428800,
          uploadedAt: new Date(Date.now() - 432000000).toISOString(),
          uploadedBy: 'Sara Wilk',
          shared: true,
          tags: ['demo', 'video'],
          path: '/Demo_Video.mp4'
        },
        {
          id: '5',
          name: 'Kopia_Zapasowa.zip',
          type: 'archive',
          size: 104857600,
          uploadedAt: new Date(Date.now() - 604800000).toISOString(),
          uploadedBy: 'Admin',
          shared: false,
          tags: ['backup', 'dane'],
          path: '/Kopia_Zapasowa.zip'
        },
        {
          id: '6',
          name: 'Wymagania.txt',
          type: 'other',
          size: 2048,
          uploadedAt: new Date(Date.now() - 864000000).toISOString(),
          uploadedBy: 'Zespol Dev',
          shared: true,
          tags: ['wymagania', 'konfiguracja'],
          path: '/Wymagania.txt'
        }
      ];

      setFolders(mockFolders);
      setFiles(mockFiles.filter(file =>
        currentFolder === 'root' ? !file.parentFolder : file.parentFolder === currentFolder
      ));
      setIsLoading(false);
    }, 500);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="w-7 h-7 text-blue-500" />;
      case 'document': return <FileText className="w-7 h-7 text-red-500" />;
      case 'image': return <Image className="w-7 h-7 text-emerald-500" />;
      case 'video': return <Video className="w-7 h-7 text-purple-500" />;
      case 'archive': return <Archive className="w-7 h-7 text-orange-500" />;
      default: return <File className="w-7 h-7 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || file.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'date': return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      case 'size': return b.size - a.size;
      case 'type': return a.type.localeCompare(b.type);
      default: return 0;
    }
  });

  const handleFileUpload = () => {
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: 'Nowy_Dokument.pdf',
      type: 'document',
      size: 1024000,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Obecny uzytkownik',
      shared: false,
      tags: ['nowy'],
      path: '/Nowy_Dokument.pdf'
    };

    setFiles(prev => [newFile, ...prev]);
    setShowUploadModal(false);
    toast.success('Plik zostal przeslany pomyslnie!');
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Nazwa folderu jest wymagana');
      return;
    }

    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      parentId: currentFolder === 'root' ? undefined : currentFolder,
      createdAt: new Date().toISOString(),
      itemCount: 0,
      path: `/${newFolderName.trim()}`
    };

    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setShowCreateFolderModal(false);
    toast.success('Folder zostal utworzony!');
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-900 dark:text-slate-100">
          Czy na pewno chcesz usunac <strong>{fileName}</strong>?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFiles(prev => prev.filter(f => f.id !== fileId));
              toast.dismiss(t.id);
              toast.success('Plik zostal usuniety');
            }}
            className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Usun
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Anuluj
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'type') setTypeFilter(value);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const totalStorageUsed = files.reduce((sum, f) => sum + f.size, 0);
  const sharedCount = files.filter(f => f.shared).length;

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Pliki"
        subtitle="Zarzadzaj plikami i dokumentami"
        icon={FolderOpen}
        iconColor="text-orange-600"
        breadcrumbs={[{ label: 'Pliki' }]}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              icon={FolderPlus}
              onClick={() => setShowCreateFolderModal(true)}
            >
              Nowy folder
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={Upload}
              onClick={() => setShowUploadModal(true)}
            >
              Przeslij plik
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
          label="Pliki"
          value={files.length}
          icon={File}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="Foldery"
          value={folders.length}
          icon={Folder}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Zajete miejsce"
          value={formatFileSize(totalStorageUsed)}
          icon={HardDrive}
          iconColor="text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400"
        />
        <StatCard
          label="Udostepnione"
          value={sharedCount}
          icon={Share2}
          iconColor="text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </motion.div>

      {/* Filtrowanie */}
      <div className="mb-6">
        <FilterBar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Szukaj plikow..."
          filters={[
            {
              key: 'type',
              label: 'Typ pliku',
              options: [
                { value: 'document', label: 'Dokumenty' },
                { value: 'image', label: 'Obrazy' },
                { value: 'video', label: 'Wideo' },
                { value: 'archive', label: 'Archiwa' },
                { value: 'other', label: 'Inne' },
              ],
            },
          ]}
          filterValues={{ type: typeFilter }}
          onFilterChange={handleFilterChange}
          sortOptions={[
            { value: 'name', label: 'Sortuj wg nazwy' },
            { value: 'date', label: 'Sortuj wg daty' },
            { value: 'size', label: 'Sortuj wg rozmiaru' },
            { value: 'type', label: 'Sortuj wg typu' },
          ]}
          sortValue={sortBy}
          onSortChange={(val) => setSortBy(val as any)}
          actions={
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          }
        />
      </div>

      {/* Zawartosc plikow */}
      <motion.div
        className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {currentFolder === 'root' ? 'Wszystkie pliki' : 'Biezacy folder'}
          </h3>
        </div>

        <div className="p-5">
          {/* Foldery */}
          {currentFolder === 'root' && folders.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Foldery</h4>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {folders.map((folder) => (
                  <motion.div
                    key={folder.id}
                    variants={itemVariants}
                    className="p-4 bg-slate-50/80 dark:bg-slate-700/30 border border-slate-200/50 dark:border-slate-600/30 rounded-xl hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 cursor-pointer group"
                    onClick={() => setCurrentFolder(folder.id)}
                    whileHover={{ y: -1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <Folder className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{folder.name}</h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{folder.itemCount} elementow</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Pliki */}
          {sortedFiles.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Nie znaleziono plikow"
              description="Przeslij swoj pierwszy plik, aby rozpoczac"
              action={
                <ActionButton
                  variant="primary"
                  icon={Upload}
                  onClick={() => setShowUploadModal(true)}
                >
                  Przeslij plik
                </ActionButton>
              }
            />
          ) : viewMode === 'grid' ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {sortedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  variants={itemVariants}
                  className="bg-slate-50/80 dark:bg-slate-700/30 border border-slate-200/50 dark:border-slate-600/30 rounded-xl p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group"
                  whileHover={{ y: -1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {getFileIcon(file.type)}
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <button className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1 truncate">{file.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{formatFileSize(file.size)}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {file.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-600/40 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatDate(file.uploadedAt)}</span>
                    {file.shared && <Share2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />}
                  </div>

                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id, file.name)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="space-y-1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {sortedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  variants={itemVariants}
                  className="flex items-center p-3 bg-slate-50/80 dark:bg-slate-700/30 border border-slate-200/50 dark:border-slate-600/30 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="mr-3 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  {getFileIcon(file.type)}
                  <div className="ml-3 flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">{file.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(file.size)} &middot; {formatDate(file.uploadedAt)} &middot; {file.uploadedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.shared && <Share2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 mr-1" />}
                    <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id, file.name)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Modal przesylania */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-white/20 dark:border-slate-700/30"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Przeslij plik</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                  <div className="inline-flex p-3 bg-slate-100 dark:bg-slate-700 rounded-xl mb-3">
                    <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Przeciagnij i upusc pliki tutaj lub kliknij, aby przegladac</p>
                  <input type="file" className="hidden" multiple />
                  <ActionButton variant="secondary" size="sm">
                    Wybierz pliki
                  </ActionButton>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 flex gap-3">
                <ActionButton
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowUploadModal(false)}
                >
                  Anuluj
                </ActionButton>
                <ActionButton
                  variant="primary"
                  className="flex-1"
                  onClick={handleFileUpload}
                >
                  Przeslij
                </ActionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal tworzenia folderu */}
      <AnimatePresence>
        {showCreateFolderModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-white/20 dark:border-slate-700/30"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Utworz nowy folder</h3>
                  <button
                    onClick={() => setShowCreateFolderModal(false)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nazwa folderu
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Podaj nazwe folderu"
                />
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 flex gap-3">
                <ActionButton
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowCreateFolderModal(false)}
                >
                  Anuluj
                </ActionButton>
                <ActionButton
                  variant="primary"
                  className="flex-1"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                >
                  Utworz folder
                </ActionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
