import { apiClient } from './client';

export interface OrganizationBranding {
  id: string;
  organizationId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  companyName: string | null;
  tagline: string | null;
  footerText: string | null;
  customDomain: string | null;
  emailFromName: string | null;
  emailSignature: string | null;
  customCss: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBrandingData {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  companyName?: string | null;
  tagline?: string | null;
  footerText?: string | null;
  customDomain?: string | null;
  emailFromName?: string | null;
  emailSignature?: string | null;
  customCss?: string | null;
}

export const brandingApi = {
  // Get organization branding
  async getBranding(): Promise<{ branding: OrganizationBranding }> {
    const response = await apiClient.get('/branding');
    return response.data;
  },

  // Update branding
  async updateBranding(data: UpdateBrandingData): Promise<{ branding: OrganizationBranding }> {
    const response = await apiClient.put('/branding', data);
    return response.data;
  },

  // Delete branding (reset to defaults)
  async deleteBranding(): Promise<{ success: boolean }> {
    const response = await apiClient.delete('/branding');
    return response.data;
  },

  // Get branding by custom domain
  async getBrandingByDomain(domain: string): Promise<{ branding: OrganizationBranding }> {
    const response = await apiClient.get(`/branding/domain/${domain}`);
    return response.data;
  },

  // Verify custom domain
  async verifyDomain(domain: string): Promise<{ verified: boolean; message: string }> {
    const response = await apiClient.post('/branding/verify-domain', { domain });
    return response.data;
  }
};
