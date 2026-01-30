import { apiClient } from './client';

export type BugPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BugCategory = 'UI_UX' | 'FUNCTIONALITY' | 'PERFORMANCE' | 'SECURITY' | 'DATA' | 'INTEGRATION' | 'OTHER';
export type BugStatus = 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'WONT_FIX';

export interface BugReport {
  id: string;
  title: string;
  description: string;
  priority: BugPriority;
  status: BugStatus;
  category?: BugCategory;
  userAgent?: string;
  url?: string;
  browserInfo?: string;
  deviceInfo?: string;
  screenshots: string[];
  attachments: string[];
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  reporterId: string;
  reporter?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBugReportData {
  title: string;
  description: string;
  priority?: BugPriority;
  category?: BugCategory;
  userAgent?: string;
  url?: string;
  browserInfo?: string;
  deviceInfo?: string;
  screenshots?: string[];
  attachments?: string[];
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}

export interface UpdateBugReportData {
  title?: string;
  description?: string;
  priority?: BugPriority;
  status?: BugStatus;
  category?: BugCategory;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  resolution?: string;
}

export const bugReportsApi = {
  // Create new bug report
  async createBugReport(data: CreateBugReportData): Promise<BugReport> {
    // Auto-capture browser info
    const enrichedData = {
      ...data,
      userAgent: data.userAgent || navigator.userAgent,
      url: data.url || window.location.href,
      browserInfo: data.browserInfo || getBrowserInfo(),
      deviceInfo: data.deviceInfo || getDeviceInfo()
    };
    const response = await apiClient.post('/bug-reports', enrichedData);
    return response.data;
  },

  // Get all bug reports
  async getBugReports(params?: {
    status?: BugStatus;
    priority?: BugPriority;
    category?: BugCategory;
    reporterId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    bugReports: BugReport[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await apiClient.get('/bug-reports', { params });
    return response.data;
  },

  // Get single bug report
  async getBugReport(id: string): Promise<BugReport> {
    const response = await apiClient.get(`/bug-reports/${id}`);
    return response.data;
  },

  // Update bug report
  async updateBugReport(id: string, data: UpdateBugReportData): Promise<BugReport> {
    const response = await apiClient.put(`/bug-reports/${id}`, data);
    return response.data;
  },

  // Delete bug report
  async deleteBugReport(id: string): Promise<void> {
    await apiClient.delete(`/bug-reports/${id}`);
  }
};

// Helper functions for browser info
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  let browser = 'Unknown';

  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  return `${browser} on ${navigator.platform}`;
}

function getDeviceInfo(): string {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  let device = 'Desktop';
  if (width <= 768) device = 'Mobile';
  else if (width <= 1024) device = 'Tablet';

  return `${device} ${width}x${height} @${dpr}x`;
}
