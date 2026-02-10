import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../config/database';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';
import { z } from 'zod';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userOrgDir = path.join(uploadsDir, req.user?.organizationId || 'default');
    await fs.mkdir(userOrgDir, { recursive: true });
    cb(null, userOrgDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random suffix
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for security
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-zip-compressed',
    'video/mp4', 'video/mpeg', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];

  // Block potentially dangerous file types
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (dangerousExtensions.includes(fileExt)) {
    return cb(new Error('File type not allowed for security reasons'));
  }

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Max 10 files at once
  }
});

// Validation schemas
const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().optional(),
  description: z.string().optional()
});

const updateFileSchema = z.object({
  fileName: z.string().min(1).max(255).optional(),
  parentId: z.string().uuid().optional()
});

// Helper function to get file type from mimetype
const getFileType = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf')) return 'document';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'document';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'document';
  if (mimetype.includes('zip') || mimetype.includes('compressed')) return 'archive';
  if (mimetype.startsWith('text/')) return 'text';
  return 'other';
};

// GET /api/v1/files - List files and folders
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      parentId, 
      type, 
      search,
      page = '1',
      limit = '50',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      organizationId: req.user!.organizationId
    };

    if (type && type !== 'all') {
      where.fileType = type;
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get folders
    const folders = await prisma.folder.findMany({
      where: {
        organizationId: req.user!.organizationId,
        parentId: parentId ? (parentId as string) : null
      },
      include: {
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get files
    const [files, totalFiles] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          organization: {
            select: { id: true, name: true }
          }
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take: limitNum
      }),
      prisma.file.count({ where })
    ]);

    // Calculate storage statistics
    const storageStats = await prisma.file.aggregate({
      where: {
        organizationId: req.user!.organizationId
      },
      _sum: { size: true },
      _count: { id: true }
    });

    res.json({
      folders,
      files,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiles,
        pages: Math.ceil(totalFiles / limitNum)
      },
      stats: {
        totalFiles: storageStats._count.id || 0,
        totalSize: storageStats._sum.size || 0,
        totalFolders: folders.length
      }
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// POST /api/v1/files/upload - Upload files
router.post('/upload', requireAuth, upload.array('files', 10), async (req: AuthenticatedRequest, res) => {
  try {
    const { parentId, description, tags } = req.body;
    const uploadedFiles = req.files as Express.Multer.File[];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Note: In this implementation, files don't link to folders directly

    const fileRecords = [];
    
    for (const file of uploadedFiles) {
      const fileType = getFileType(file.mimetype);
      const fileTags = tags ? (Array.isArray(tags) ? tags : [tags]) : [];

      const fileRecord = await prisma.file.create({
        data: {
          fileName: file.originalname,
          fileType: fileType,
          urlPath: file.path,
          size: file.size,
          parentId: parentId || null,
          parentType: 'general',
          organizationId: req.user!.organizationId
        },
        include: {
          organization: {
            select: { id: true, name: true }
          }
        }
      });

      fileRecords.push(fileRecord);
    }

    res.status(201).json({
      message: `${fileRecords.length} file(s) uploaded successfully`,
      files: fileRecords
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      for (const file of files) {
        fs.unlink(file.path).catch(console.error);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// GET /api/v1/files/:id - Get file details
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      },
      include: {
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// GET /api/v1/files/:id/download - Download file
router.get('/:id/download', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    try {
      await fs.access(file.urlPath);
    } catch {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    res.sendFile(path.resolve(file.urlPath));
    
    // Update last access time (optional)
    prisma.file.update({
      where: { id: file.id },
      data: { 
        updatedAt: new Date()
      }
    }).catch(console.error);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// PUT /api/v1/files/:id - Update file metadata
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const updates = updateFileSchema.parse(req.body);
    
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const updatedFile = await prisma.file.update({
      where: { id: req.params.id },
      data: {
        fileName: updates.fileName,
        parentId: updates.parentId,
        parentType: updates.parentId ? 'folder' : file.parentType,
        updatedAt: new Date()
      },
      include: {
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(updatedFile);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// DELETE /api/v1/files/:id - Delete file (soft delete)
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file from filesystem
    try {
      await fs.unlink(file.urlPath);
    } catch (error) {
      console.warn('Failed to delete file from filesystem:', error);
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// POST /api/v1/files/folders - Create folder
router.post('/folders', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, parentId, description } = createFolderSchema.parse(req.body);

    // Check for duplicate folder name in same parent
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name,
        parentId: parentId || null,
        organizationId: req.user!.organizationId
      }
    });

    if (existingFolder) {
      return res.status(400).json({ error: 'Folder with this name already exists' });
    }

    // Verify parent folder exists if provided
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: { 
          id: parentId, 
          organizationId: req.user!.organizationId 
        }
      });
      if (!parentFolder) {
        return res.status(400).json({ error: 'Parent folder not found' });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        description,
        parentId: parentId || null,
        organizationId: req.user!.organizationId
      },
      include: {
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      }
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// PUT /api/v1/files/folders/:id - Update folder
router.put('/folders/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description } = req.body;
    
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: req.params.id },
      data: {
        name: name || folder.name,
        description: description !== undefined ? description : folder.description,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      }
    });

    res.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// DELETE /api/v1/files/folders/:id - Delete folder
router.delete('/folders/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId
      },
      include: {
        children: true
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if folder is empty
    if (folder.children.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete non-empty folder. Please move or delete all contents first.' 
      });
    }

    await prisma.folder.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// GET /api/v1/files/statistics - Get storage statistics
router.get('/statistics', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [
      totalFiles,
      totalFolders,
      storageStats,
      fileTypes,
      recentFiles
    ] = await Promise.all([
      prisma.file.count({
        where: { 
          organizationId: req.user!.organizationId
        }
      }),
      prisma.folder.count({
        where: { organizationId: req.user!.organizationId }
      }),
      prisma.file.aggregate({
        where: { 
          organizationId: req.user!.organizationId
        },
        _sum: { size: true }
      }),
      prisma.file.groupBy({
        by: ['fileType'],
        where: { 
          organizationId: req.user!.organizationId
        },
        _count: { id: true },
        _sum: { size: true }
      }),
      prisma.file.findMany({
        where: { 
          organizationId: req.user!.organizationId
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          fileName: true,
          fileType: true,
          size: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      totalFiles,
      totalFolders,
      totalStorage: storageStats._sum.size || 0,
      fileTypeBreakdown: fileTypes,
      recentFiles
    });
  } catch (error) {
    console.error('Error fetching file statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;