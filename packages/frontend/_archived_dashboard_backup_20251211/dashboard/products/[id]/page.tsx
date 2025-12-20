'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product, productsApi } from '@/lib/api/products';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  EyeIcon,
  TagIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const statusConfig = {
  ACTIVE: { icon: CheckCircleIcon, label: 'Active', color: 'green' },
  INACTIVE: { icon: XCircleIcon, label: 'Inactive', color: 'gray' },
  DISCONTINUED: { icon: ExclamationTriangleIcon, label: 'Discontinued', color: 'red' },
  OUT_OF_STOCK: { icon: ExclamationTriangleIcon, label: 'Out of Stock', color: 'orange' }
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await productsApi.getProduct(params.id as string);
      setProduct(productData);
    } catch (error: any) {
      console.error('Failed to load product:', error);
      toast.error('Nie udało się załadować produktu');
      router.push('/crm/dashboard/products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/crm/dashboard/products?edit=${product?.id}`);
  };

  const handleDuplicate = async () => {
    if (!product) return;
    
    try {
      await productsApi.duplicateProduct(product.id);
      toast.success('Produkt został zduplikowany');
      router.push('/crm/dashboard/products');
    } catch (error: any) {
      console.error('Failed to duplicate product:', error);
      toast.error('Nie udało się zduplikować produktu');
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    
    if (!confirm(`Czy na pewno chcesz usunąć produkt "${product.name}"?`)) {
      return;
    }

    try {
      setDeleting(true);
      await productsApi.deleteProduct(product.id);
      toast.success('Produkt został usunięty');
      router.push('/crm/dashboard/products');
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast.error('Nie udało się usunąć produktu');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const isLowStock = product?.trackInventory && 
    product.stockQuantity !== undefined && 
    product.minStockLevel !== undefined && 
    product.stockQuantity <= product.minStockLevel;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const StatusIcon = statusConfig[product.status as keyof typeof statusConfig]?.icon || CheckCircleIcon;
  const statusInfo = statusConfig[product.status as keyof typeof statusConfig] || statusConfig.ACTIVE;

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
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                {product.images?.[0] ? (
                  <img
                    src={product.images?.[0]}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CubeIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {product.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                      {statusInfo.label}
                    </span>
                    {product.isFeatured && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        Wyróżniony
                      </span>
                    )}
                    {!product.isActive && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        Nieaktywny
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleDuplicate}
                className="btn btn-outline btn-sm"
              >
                <CubeIcon className="w-4 h-4 mr-1" />
                Duplikuj
              </button>
              <button 
                onClick={handleEdit}
                className="btn btn-outline btn-sm"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edytuj
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 border-red-300"
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                {deleting ? 'Usuwanie...' : 'Usuń'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-white rounded-lg shadow-sm border border-gray-200"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="p-8">
                {/* Product Image */}
                {product.images?.[0] && (
                  <div className="mb-8">
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                    />
                  </div>
                )}

                {/* Product Description */}
                {product.description && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Opis</h3>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                    </div>
                  </div>
                )}

                {/* Specifications */}
                {(product.weight || product.dimensions) && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Specyfikacja</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {product.weight && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Waga</dt>
                          <dd className="text-sm text-gray-900">{product.weight} kg</dd>
                        </div>
                      )}
                      {product.dimensions && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Wymiary</dt>
                          <dd className="text-sm text-gray-900">{product.dimensions}</dd>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Pricing & Stock */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cena i Stan</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cena</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>


                  {product.trackInventory && (
                    <>
                      <div className="flex items-center space-x-3">
                        <CubeIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Stan magazynowy</p>
                          <p className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.stockQuantity || 0} szt.
                            {isLowStock && (
                              <span className="ml-2 text-xs text-red-600">(Niski stan)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {product.minStockLevel && (
                        <div className="flex items-center space-x-3">
                          <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Minimalny stan</p>
                            <p className="text-sm text-gray-600">{product.minStockLevel} szt.</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

              {/* Product Details */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Szczegóły produktu</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <TagIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Kategoria</p>
                      <p className="text-sm text-gray-600">
                        {product.category || 'Brak kategorii'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CubeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">SKU</p>
                      <p className="text-sm text-gray-600 font-mono">
                        {product.sku || 'Brak SKU'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Utworzono</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(product.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ostatnia aktualizacja</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(product.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <motion.div
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tagi</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                      >
                        <TagIcon className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}