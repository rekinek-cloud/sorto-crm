'use client';

import React from 'react';
import { Product, ProductStatus } from '@/types/products';
import { 
  Package, 
  Edit2, 
  Trash2, 
  Eye, 
  Copy, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onView: (product: Product) => void;
  onDuplicate: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onView,
  onDuplicate
}) => {
  const getStatusIcon = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'INACTIVE':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'DISCONTINUED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'OUT_OF_STOCK':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'DISCONTINUED':
        return 'bg-red-100 text-red-800';
      case 'OUT_OF_STOCK':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="relative h-32 bg-gray-100 rounded-t-lg overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
            {getStatusIcon(product.status)}
            <span className="ml-1">{product.status.replace('_', ' ')}</span>
          </span>
        </div>

        {/* Featured Badge */}
        {product.isFeatured && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
            {product.name}
          </h3>
        </div>

        {/* SKU */}
        {product.sku && (
          <p className="text-sm text-gray-500 mb-1">
            SKU: {product.sku}
          </p>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Category */}
        {product.category && (
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              {product.category}
              {product.subcategory && ` / ${product.subcategory}`}
            </span>
          </div>
        )}

        {/* Price and Stock */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.cost && (
              <span className="text-sm text-gray-500 ml-2">
                Cost: {formatPrice(product.cost, product.currency)}
              </span>
            )}
          </div>
          
          {product.trackInventory && (
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Stock: {product.stockQuantity || 0}
                {product.unit && ` ${product.unit}`}
              </p>
              {product.minStockLevel && product.stockQuantity && product.stockQuantity <= product.minStockLevel && (
                <p className="text-xs text-orange-600 font-medium">
                  Low Stock
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{product.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => onView(product)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(product)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="Edit Product"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicate(product)}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
              title="Duplicate Product"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => onDelete(product)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;