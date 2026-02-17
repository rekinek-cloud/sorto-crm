'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Product, ProductQuery, ProductCreateData, ProductUpdateData } from '@/types/products';
import { productsApi } from '@/lib/api/products';
import ProductCard from '@/components/products/ProductCard';
import ProductForm from '@/components/products/ProductForm';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Package,
  RefreshCw,
  Download,
  Upload,
  Pencil,
  Trash2,
  Copy,
  CheckCircle2,
  FileEdit,
  Archive,
  AlertTriangle,
  Star,
} from 'lucide-react';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import { FormModal } from '@/components/ui/FormModal';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  ACTIVE: { label: 'Aktywny', variant: 'success' },
  INACTIVE: { label: 'Nieaktywny', variant: 'neutral' },
  DISCONTINUED: { label: 'Wycofany', variant: 'error' },
  OUT_OF_STOCK: { label: 'Brak w magazynie', variant: 'warning' },
};

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortValue, setSortValue] = useState('createdAt-desc');
  const [filters, setFilters] = useState<ProductQuery>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchTerm || undefined,
        page: 1
      }));
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getProducts(filters);
      setProducts(response.products);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      toast.error('Blad ladowania produktow');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (data: ProductCreateData) => {
    try {
      const newProduct = await productsApi.createProduct(data);
      setProducts(prev => [newProduct, ...prev]);
      setShowForm(false);
      toast.success('Produkt utworzony pomyslnie');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      toast.error('Blad tworzenia produktu');
    }
  };

  const handleUpdateProduct = async (data: ProductUpdateData) => {
    if (!editingProduct) return;

    try {
      const updatedProduct = await productsApi.updateProduct(editingProduct.id, data);
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setEditingProduct(undefined);
      setShowForm(false);
      toast.success('Produkt zaktualizowany pomyslnie');
    } catch (error: any) {
      console.error('Failed to update product:', error);
      toast.error('Blad aktualizacji produktu');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Czy na pewno chcesz usunac produkt "${product.name}"? Ta operacja jest nieodwracalna.`)) return;

    try {
      await productsApi.deleteProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setSelectedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
      toast.success('Produkt usuniety pomyslnie');
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast.error('Blad usuwania produktu');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`Czy na pewno chcesz usunac ${selectedProducts.size} wybranych produktow? Ta operacja jest nieodwracalna.`)) return;

    try {
      const deletePromises = Array.from(selectedProducts).map(id =>
        productsApi.deleteProduct(id)
      );
      await Promise.all(deletePromises);

      setProducts(prev => prev.filter(p => !selectedProducts.has(p.id)));
      toast.success(`Usunieto ${selectedProducts.size} produktow`);
      setSelectedProducts(new Set());
    } catch (error: any) {
      console.error('Failed to delete products:', error);
      toast.error('Blad usuwania niektorych produktow');
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const duplicatedProduct = await productsApi.duplicateProduct(product.id);
      setProducts(prev => [duplicatedProduct, ...prev]);
      toast.success('Produkt zduplikowany pomyslnie');
    } catch (error: any) {
      console.error('Failed to duplicate product:', error);
      toast.error('Blad duplikowania produktu');
    }
  };

  const handleViewProduct = (product: Product) => {
    console.log('View product:', product);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    if (key === 'status') {
      setFilters(prev => ({
        ...prev,
        status: (value === 'all' ? undefined : value) as any,
        page: 1,
      }));
    } else if (key === 'active') {
      setFilters(prev => ({
        ...prev,
        isActive: value === 'all' ? undefined : value === 'true',
        page: 1,
      }));
    } else if (key === 'category') {
      setFilters(prev => ({
        ...prev,
        category: value === 'all' ? undefined : value,
        page: 1,
      }));
    }
  };

  const handleSortChange = (value: string) => {
    setSortValue(value);
    const [sortBy, sortOrder] = value.split('-');
    setFilters(prev => ({
      ...prev,
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: 1,
    }));
  };

  const activeCount = useMemo(() => products.filter(p => p.isActive).length, [products]);
  const lowStockCount = useMemo(
    () => products.filter(p =>
      p.trackInventory &&
      p.stockQuantity !== undefined &&
      p.minStockLevel !== undefined &&
      p.stockQuantity <= p.minStockLevel
    ).length,
    [products]
  );
  const featuredCount = useMemo(() => products.filter(p => p.isFeatured).length, [products]);

  const tableColumns: Column<Product>[] = [
    {
      key: 'select',
      label: '',
      sortable: false,
      width: 'w-10',
      render: (_val: any, row: Product) => (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedProducts.has(row.id)}
            onChange={() => toggleProductSelection(row.id)}
            className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
          />
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Nazwa',
      sortable: true,
      render: (_val: any, row: Product) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{row.name}</div>
          {row.description && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: false,
      render: (_val: any, row: Product) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm font-mono">{row.sku || '-'}</span>
      ),
    },
    {
      key: 'category',
      label: 'Kategoria',
      sortable: false,
      render: (_val: any, row: Product) => (
        <span className="text-slate-600 dark:text-slate-400">{row.category || '-'}</span>
      ),
    },
    {
      key: 'price',
      label: 'Cena',
      sortable: true,
      render: (_val: any, row: Product) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {row.price?.toFixed(2)} {row.currency || 'PLN'}
        </span>
      ),
    },
    {
      key: 'stock',
      label: 'Stan',
      sortable: false,
      render: (_val: any, row: Product) => {
        if (!row.trackInventory) return <span className="text-slate-400 dark:text-slate-500">-</span>;
        const isLow = row.stockQuantity !== undefined &&
          row.minStockLevel !== undefined &&
          row.stockQuantity <= row.minStockLevel;
        return (
          <span className={isLow ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-600 dark:text-slate-400'}>
            {row.stockQuantity ?? '-'} {row.unit || 'szt.'}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (_val: any, row: Product) => {
        const s = STATUS_MAP[row.status] || { label: row.status, variant: 'default' as const };
        return <StatusBadge variant={s.variant} dot>{s.label}</StatusBadge>;
      },
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: 'w-28',
      render: (_val: any, row: Product) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEditProduct(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            title="Edytuj"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDuplicateProduct(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Duplikuj"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteProduct(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Usun"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Produkty"
        subtitle="Zarzadzaj katalogiem produktow"
        icon={Package}
        iconColor="text-blue-600"
        breadcrumbs={[{ label: 'Produkty' }]}
        actions={
          <div className="flex items-center gap-2">
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Wybrano: {selectedProducts.size}
                </span>
                <ActionButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={handleBulkDelete}
                >
                  Usun
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProducts(new Set())}
                >
                  Anuluj
                </ActionButton>
              </div>
            )}
            <ActionButton
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadProducts()}
              title="Odswiez"
            />
            <ActionButton
              variant="primary"
              icon={Plus}
              onClick={() => setShowForm(true)}
            >
              Dodaj produkt
            </ActionButton>
          </div>
        }
      />

      {/* Statystyki */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <StatCard
          label="Wszystkie produkty"
          value={pagination.total}
          icon={Package}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="Aktywne"
          value={activeCount}
          icon={CheckCircle2}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Niski stan"
          value={lowStockCount}
          icon={AlertTriangle}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          label="Wyrozniione"
          value={featuredCount}
          icon={Star}
          iconColor="text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </motion.div>

      {/* Filtrowanie */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <FilterBar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Szukaj produktow..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'ACTIVE', label: 'Aktywny' },
                { value: 'INACTIVE', label: 'Nieaktywny' },
                { value: 'DISCONTINUED', label: 'Wycofany' },
                { value: 'OUT_OF_STOCK', label: 'Brak w magazynie' },
              ],
            },
            {
              key: 'active',
              label: 'Aktywnosc',
              options: [
                { value: 'true', label: 'Tylko aktywne' },
                { value: 'false', label: 'Tylko nieaktywne' },
              ],
            },
          ]}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          sortOptions={[
            { value: 'name-asc', label: 'Nazwa A-Z' },
            { value: 'name-desc', label: 'Nazwa Z-A' },
            { value: 'price-asc', label: 'Cena rosnaco' },
            { value: 'price-desc', label: 'Cena malejaco' },
            { value: 'createdAt-desc', label: 'Najnowsze' },
            { value: 'createdAt-asc', label: 'Najstarsze' },
            { value: 'updatedAt-desc', label: 'Ostatnio zmienione' },
          ]}
          sortValue={sortValue}
          onSortChange={handleSortChange}
          actions={
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="Widok siatki"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="Widok listy"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          }
        />
      </motion.div>

      {/* Zawartosc */}
      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Brak produktow"
          description={
            searchTerm || filters.category || filters.status
              ? 'Sprobuj zmienic kryteria wyszukiwania lub filtry.'
              : 'Zacznij dodawac produkty do katalogu.'
          }
          action={
            !searchTerm && !filters.category && !filters.status ? (
              <ActionButton variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
                Dodaj produkt
              </ActionButton>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Zaznacz wszystkie */}
          {products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center mb-4 px-2"
            >
              <input
                type="checkbox"
                checked={selectedProducts.size === products.length && products.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                Zaznacz wszystkie ({products.length})
              </span>
            </motion.div>
          )}

          {viewMode === 'grid' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="relative group"
                >
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 bg-white dark:bg-slate-800 shadow-sm"
                    />
                  </div>
                  <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 overflow-hidden">
                    <ProductCard
                      product={product}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                      onView={handleViewProduct}
                      onDuplicate={handleDuplicateProduct}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <DataTable<Product>
                columns={tableColumns}
                data={products}
                onRowClick={(row) => handleViewProduct(row)}
                storageKey="products-table"
                pageSize={20}
                emptyMessage="Brak produktow"
              />
            </motion.div>
          )}

          {/* Paginacja */}
          {pagination.pages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between mt-6"
            >
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {((pagination.page - 1) * pagination.limit) + 1}
                {' - '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
                {' z '}
                {pagination.total} wynikow
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Poprzednia
                </button>

                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = Math.max(1, pagination.page - 2) + i;
                  if (page > pagination.pages) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Nastepna
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Formularz produktu */}
      <ProductForm
        product={editingProduct}
        onSubmit={(editingProduct ? handleUpdateProduct : handleCreateProduct) as any}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(undefined);
        }}
        isOpen={showForm}
      />
    </PageShell>
  );
};

export default ProductsPage;
