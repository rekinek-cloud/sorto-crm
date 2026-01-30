'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PlusIcon,
  XMarkIcon,
  FolderPlusIcon,
} from '@heroicons/react/24/outline';

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

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  itemCount: number;
  path: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadFiles();
  }, [currentFolder]);

  const loadFiles = async () => {
    setTimeout(() => {
      const mockFolders: Folder[] = [
        {
          id: 'proj1',
          name: 'Project Documents',
          parentId: undefined,
          createdAt: new Date(Date.now() - 2592000000).toISOString(),
          itemCount: 8,
          path: '/Project Documents'
        },
        {
          id: 'imgs1',
          name: 'Images & Media',
          parentId: undefined,
          createdAt: new Date(Date.now() - 1296000000).toISOString(),
          itemCount: 12,
          path: '/Images & Media'
        },
        {
          id: 'arch1',
          name: 'Archive',
          parentId: undefined,
          createdAt: new Date(Date.now() - 5184000000).toISOString(),
          itemCount: 24,
          path: '/Archive'
        }
      ];

      const mockFiles: FileItem[] = [
        {
          id: '1',
          name: 'Project_Proposal_2024.pdf',
          type: 'document',
          size: 2048576,
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          uploadedBy: 'John Doe',
          shared: true,
          tags: ['proposal', 'project', '2024'],
          description: 'Main project proposal document',
          path: '/Project_Proposal_2024.pdf'
        },
        {
          id: '2',
          name: 'Meeting_Notes_Jan.docx',
          type: 'document',
          size: 524288,
          uploadedAt: new Date(Date.now() - 172800000).toISOString(),
          uploadedBy: 'Jane Smith',
          shared: false,
          tags: ['meeting', 'notes'],
          path: '/Meeting_Notes_Jan.docx'
        },
        {
          id: '3',
          name: 'Dashboard_Screenshot.png',
          type: 'image',
          size: 1048576,
          uploadedAt: new Date(Date.now() - 259200000).toISOString(),
          uploadedBy: 'Mike Johnson',
          shared: true,
          tags: ['screenshot', 'ui'],
          path: '/Dashboard_Screenshot.png'
        },
        {
          id: '4',
          name: 'Demo_Video.mp4',
          type: 'video',
          size: 52428800,
          uploadedAt: new Date(Date.now() - 432000000).toISOString(),
          uploadedBy: 'Sarah Wilson',
          shared: true,
          tags: ['demo', 'video'],
          path: '/Demo_Video.mp4'
        },
        {
          id: '5',
          name: 'Backup_Data.zip',
          type: 'archive',
          size: 104857600,
          uploadedAt: new Date(Date.now() - 604800000).toISOString(),
          uploadedBy: 'Admin',
          shared: false,
          tags: ['backup', 'data'],
          path: '/Backup_Data.zip'
        },
        {
          id: '6',
          name: 'Requirements.txt',
          type: 'other',
          size: 2048,
          uploadedAt: new Date(Date.now() - 864000000).toISOString(),
          uploadedBy: 'Dev Team',
          shared: true,
          tags: ['requirements', 'config'],
          path: '/Requirements.txt'
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
      case 'folder': return <FolderIcon className="w-8 h-8 text-blue-500" />;
      case 'document': return <DocumentTextIcon className="w-8 h-8 text-red-500" />;
      case 'image': return <PhotoIcon className="w-8 h-8 text-green-500" />;
      case 'video': return <FilmIcon className="w-8 h-8 text-purple-500" />;
      case 'archive': return <ArchiveBoxIcon className="w-8 h-8 text-orange-500" />;
      default: return <DocumentIcon className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    // Simulate file upload
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: 'New_Document.pdf',
      type: 'document',
      size: 1024000,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Current User',
      shared: false,
      tags: ['new'],
      path: '/New_Document.pdf'
    };

    setFiles(prev => [newFile, ...prev]);
    setShowUploadModal(false);
    toast.success('File uploaded successfully!');
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    const newFolder: Folder = {
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
    toast.success('Folder created successfully!');
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success('File deleted');
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files & Documents</h1>
          <p className="text-gray-600">Manage and organize your project files</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="btn btn-outline"
          >
            <FolderPlusIcon className="w-5 h-5 mr-2" />
            New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            <CloudArrowUpIcon className="w-5 h-5 mr-2" />
            Upload File
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="size">Sort by Size</option>
              <option value="type">Sort by Type</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-semibold text-gray-900">{files.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FolderIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Folders</p>
              <p className="text-2xl font-semibold text-gray-900">{folders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ArchiveBoxIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-2xl font-semibold text-gray-900">2.3 GB</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShareIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Shared Files</p>
              <p className="text-2xl font-semibold text-gray-900">{files.filter(f => f.shared).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Files Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentFolder === 'root' ? 'All Files' : 'Current Folder'}
          </h3>
        </div>

        <div className="p-6">
          {/* Folders */}
          {currentFolder === 'root' && folders.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Folders</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {folders.map((folder, index) => (
                  <motion.div
                    key={folder.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setCurrentFolder(folder.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <div className="flex items-center space-x-3">
                      <FolderIcon className="w-8 h-8 text-blue-500" />
                      <div>
                        <h5 className="font-medium text-gray-900">{folder.name}</h5>
                        <p className="text-sm text-gray-500">{folder.itemCount} items</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {sortedFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Files Found</h3>
              <p className="text-gray-600">Upload your first file to get started</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedFiles.map((file, index) => (
                <motion.div
                  key={file.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="rounded"
                      />
                    </div>
                    <div className="relative">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 mb-1 truncate">{file.name}</h4>
                  <p className="text-sm text-gray-500 mb-2">{formatFileSize(file.size)}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {file.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(file.uploadedAt)}</span>
                    {file.shared && <ShareIcon className="w-4 h-4" />}
                  </div>

                  <div className="flex items-center space-x-2 mt-3">
                    <button className="p-1 text-gray-400 hover:text-blue-600">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-green-600">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFiles.map((file, index) => (
                <motion.div
                  key={file.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="mr-3 rounded"
                  />
                  {getFileIcon(file.type)}
                  <div className="ml-3 flex-1">
                    <h4 className="font-medium text-gray-900">{file.name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)} • {file.uploadedBy}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.shared && <ShareIcon className="w-4 h-4 text-blue-500" />}
                    <button className="p-1 text-gray-400 hover:text-blue-600">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-green-600">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                  <input type="file" className="hidden" multiple />
                  <button className="btn btn-outline">
                    Choose Files
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  className="btn btn-primary flex-1"
                >
                  Upload
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {showCreateFolderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Folder</h3>
                  <button
                    onClick={() => setShowCreateFolderModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter folder name"
                />
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowCreateFolderModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="btn btn-primary flex-1"
                  disabled={!newFolderName.trim()}
                >
                  Create Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}