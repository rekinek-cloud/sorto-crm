// Product Types
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
  status: ProductStatus;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
  // Related data
  orderItems?: OrderItem[];
  invoiceItems?: InvoiceItem[];
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
  status?: ProductStatus;
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryData {
  category: string;
  subcategories: string[];
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  price: number;
  cost?: number;
  currency: string;
  billingType: ServiceBillingType;
  duration?: number;
  unit?: string;
  deliveryMethod: ServiceDeliveryMethod;
  estimatedDeliveryDays?: number;
  requirements?: string;
  resources?: string;
  status: ServiceStatus;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
  // Related data
  orderItems?: OrderItem[];
  invoiceItems?: InvoiceItem[];
}

export interface ServiceCreateData {
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  price: number;
  cost?: number;
  currency?: string;
  billingType?: ServiceBillingType;
  duration?: number;
  unit?: string;
  deliveryMethod?: ServiceDeliveryMethod;
  estimatedDeliveryDays?: number;
  requirements?: string;
  resources?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  images?: string[];
}

export interface ServiceUpdateData extends Partial<ServiceCreateData> {}

export interface ServicesResponse {
  services: Service[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ServiceQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: ServiceStatus;
  billingType?: ServiceBillingType;
  deliveryMethod?: ServiceDeliveryMethod;
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Order Item Types
export interface OrderItem {
  id: string;
  itemType: OrderItemType;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalPrice: number;
  productId?: string;
  product?: Product;
  serviceId?: string;
  service?: Service;
  customName?: string;
  customDescription?: string;
  orderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  itemType: InvoiceItemType;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalPrice: number;
  productId?: string;
  product?: Product;
  serviceId?: string;
  service?: Service;
  customName?: string;
  customDescription?: string;
  invoiceId: string;
  createdAt: string;
  updatedAt: string;
}

// Options for selects
export interface BillingTypeOption {
  value: ServiceBillingType;
  label: string;
}

export interface DeliveryMethodOption {
  value: ServiceDeliveryMethod;
  label: string;
}

export interface ProductStatusOption {
  value: ProductStatus;
  label: string;
}

export interface ServiceStatusOption {
  value: ServiceStatus;
  label: string;
}

// Enums
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK';

export type ServiceStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'TEMPORARILY_UNAVAILABLE' | 'DISCONTINUED';

export type ServiceBillingType = 'ONE_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'PROJECT_BASED';

export type ServiceDeliveryMethod = 'REMOTE' | 'ON_SITE' | 'HYBRID' | 'DIGITAL_DELIVERY' | 'PHYSICAL_DELIVERY';

export type OrderItemType = 'PRODUCT' | 'SERVICE' | 'CUSTOM';

export type InvoiceItemType = 'PRODUCT' | 'SERVICE' | 'CUSTOM';

// Constants for dropdown options
export const PRODUCT_STATUS_OPTIONS: ProductStatusOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' }
];

export const SERVICE_STATUS_OPTIONS: ServiceStatusOption[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
  { value: 'TEMPORARILY_UNAVAILABLE', label: 'Temporarily Unavailable' },
  { value: 'DISCONTINUED', label: 'Discontinued' }
];

export const BILLING_TYPE_OPTIONS: BillingTypeOption[] = [
  { value: 'ONE_TIME', label: 'One Time' },
  { value: 'HOURLY', label: 'Hourly' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'PROJECT_BASED', label: 'Project Based' }
];

export const DELIVERY_METHOD_OPTIONS: DeliveryMethodOption[] = [
  { value: 'REMOTE', label: 'Remote' },
  { value: 'ON_SITE', label: 'On-Site' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'DIGITAL_DELIVERY', label: 'Digital Delivery' },
  { value: 'PHYSICAL_DELIVERY', label: 'Physical Delivery' }
];