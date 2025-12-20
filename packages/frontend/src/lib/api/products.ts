import { apiClient } from './client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  subcategory?: string;
  price: number;
  cost?: number;
  currency: string;
  stockQuantity?: number;
  minStockLevel?: number;
  trackInventory: boolean;
  unit?: string;
  weight?: number;
  dimensions?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK';
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateData {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  subcategory?: string;
  price: number;
  cost?: number;
  currency?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  trackInventory?: boolean;
  unit?: string;
  weight?: number;
  dimensions?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  images?: string[];
}

export interface ProductUpdateData extends Partial<ProductCreateData> {}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK';
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryData {
  category: string;
  subcategories: string[];
}

export const productsApi = {
  // Get all products with filtering and pagination
  getProducts: async (query?: ProductQuery): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`/products?${params.toString()}`);
    return response.data;
  },

  // Get single product by ID
  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Create new product
  createProduct: async (data: ProductCreateData): Promise<Product> => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  // Update existing product
  updateProduct: async (id: string, data: ProductUpdateData): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  // Get product categories
  getCategories: async (): Promise<CategoryData[]> => {
    const response = await apiClient.get('/products/meta/categories');
    return response.data;
  },

  // Duplicate product
  duplicateProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.post(`/products/${id}/duplicate`);
    return response.data;
  }
};