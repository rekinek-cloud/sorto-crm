'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product, productsApi } from '@/lib/api/products';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Share2,
  Eye,
  Tag,
  Calendar,
  DollarSign,
  Box,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const statusConfig = {
  ACTIVE: { icon: CheckCircle, label: 'Active', color: 'green' },
  INACTIVE: { icon: XCircle, label: 'Inactive', color: 'slate' },
  DISCONTINUED: { icon: AlertTriangle, label: 'Discontinued', color: 'red' },
  OUT_OF_STOCK: { icon: AlertTriangle, label: 'Out of Stock', color: 'orange' }
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
      toast.error('Nie udalo sie zaladowac produktu');
      router.push('/dashboard/products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/products?edit=${product?.id}`);
  };

  const handleDuplicate = async () => {
    if (!product) return;
    try {
      await productsApi.duplicateProduct(product.id);
      toast.success('Produkt zostal zduplikowany');
      router.push('/dashboard/products');
    } catch (error: any) {
      console.error('Failed to duplicate product:', error);
      toast.error('Nie udalo sie zduplikowac produktu');
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Czy na pewno chcesz usunac produkt "${product.name}"?`)) return;
    try {
      setDeleting(true);
      await productsApi.deleteProduct(product.id);
      toast.success('Produkt zostal usuniety');
      router.push('/dashboard/products');
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast.error('Nie udalo sie usunac produktu');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
  };

  const isLowStock = product?.trackInventory && product.stockQuantity !== undefined && product.minStockLevel !== undefined && product.stockQuantity <= product.minStockLevel;

  if (loading) {
    return <PageShell><SkeletonPage /></PageShell>;
  }

  if (!product) {
    return null;
  }

  const StatusIcon = statusConfig[product.status as keyof typeof statusConfig]?.icon || CheckCircle;
  const statusInfo = statusConfig[product.status as keyof typeof statusConfig] || statusConfig.ACTIVE;

  return (
    <PageShell>
      <PageHeader
        title={product.name}
        subtitle={product.category || 'Product Details'}
        icon={Box}
        iconColor="text-indigo-600"
        breadcrumbs={[{ label: 'Products', href: '/dashboard/products' }, { label: product.name }]}
        actions={
          <div className="flex items-center space-x-2">
            <button onClick={handleDuplicate} className="btn btn-outline btn-sm"><Box className="w-4 h-4 mr-1" />Duplikuj</button>
            <button onClick={handleEdit} className="btn btn-outline btn-sm"><Pencil className="w-4 h-4 mr-1" />Edytuj</button>
            <button onClick={handleDelete} disabled={deleting} className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700">
              <Trash2 className="w-4 h-4 mr-1" />{deleting ? 'Usuwanie...' : 'Usun'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <motion.div
            className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="p-8">
              {/* Status badges */}
              <div className="flex items-center space-x-3 mb-6">
                <span className={`px-3 py-1 text-sm font-medium rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700 dark:bg-${statusInfo.color}-900/30 dark:text-${statusInfo.color}-400`}>
                  {statusInfo.label}
                </span>
                {product.isFeatured && <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Wyrozn.</span>}
                {!product.isActive && <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400">Nieaktywny</span>}
              </div>

              {product.images?.[0] && (
                <div className="mb-8"><img src={product.images?.[0]} alt={product.name} className="w-full max-w-md mx-auto rounded-lg shadow-sm" /></div>
              )}
              {product.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Opis</h3>
                  <div className="prose max-w-none"><p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{product.description}</p></div>
                </div>
              )}
              {(product.weight || product.dimensions) && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Specyfikacja</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {product.weight && <div><dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Waga</dt><dd className="text-sm text-slate-900 dark:text-slate-100">{product.weight} kg</dd></div>}
                    {product.dimensions && <div><dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Wymiary</dt><dd className="text-sm text-slate-900 dark:text-slate-100">{product.dimensions}</dd></div>}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Cena i Stan</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3"><DollarSign className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Cena</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(product.price)}</p></div></div>
              {product.trackInventory && (
                <>
                  <div className="flex items-center space-x-3"><Box className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Stan magazynowy</p><p className={`text-sm font-medium ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>{product.stockQuantity || 0} szt.{isLowStock && <span className="ml-2 text-xs text-red-600 dark:text-red-400">(Niski stan)</span>}</p></div></div>
                  {product.minStockLevel && (
                    <div className="flex items-center space-x-3"><AlertTriangle className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Minimalny stan</p><p className="text-sm text-slate-600 dark:text-slate-400">{product.minStockLevel} szt.</p></div></div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          <motion.div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Szczegoly produktu</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3"><Tag className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Kategoria</p><p className="text-sm text-slate-600 dark:text-slate-400">{product.category || 'Brak kategorii'}</p></div></div>
              <div className="flex items-center space-x-3"><Box className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">SKU</p><p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{product.sku || 'Brak SKU'}</p></div></div>
              <div className="flex items-center space-x-3"><Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Utworzono</p><p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(product.createdAt)}</p></div></div>
              <div className="flex items-center space-x-3"><Clock className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Ostatnia aktualizacja</p><p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(product.updatedAt)}</p></div></div>
            </div>
          </motion.div>

          {product.tags && product.tags.length > 0 && (
            <motion.div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Tagi</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 text-sm bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-full"><Tag className="w-3 h-3 mr-1" />{tag}</span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
