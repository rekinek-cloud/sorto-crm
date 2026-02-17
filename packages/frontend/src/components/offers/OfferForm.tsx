'use client';

import React, { useState, useEffect } from 'react';
import { Offer, CreateOfferData, UpdateOfferData } from '@/lib/api/offers';
import { X, Plus, Trash2 } from 'lucide-react';

interface OfferItemForm {
  itemType: 'PRODUCT' | 'SERVICE' | 'CUSTOM';
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  productId?: string;
  serviceId?: string;
  customName?: string;
  customDescription?: string;
}

interface OfferFormProps {
  offer?: Offer;
  onSubmit: (data: CreateOfferData | UpdateOfferData) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

const emptyItem: OfferItemForm = {
  itemType: 'CUSTOM',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  tax: 0,
  customName: '',
  customDescription: '',
};

const OfferForm: React.FC<OfferFormProps> = ({ offer, onSubmit, onCancel, isOpen }) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: string;
    priority: string;
    currency: string;
    validUntil: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    paymentTerms: string;
    deliveryTerms: string;
    notes: string;
  }>({
    title: '',
    description: '',
    status: 'DRAFT',
    priority: 'MEDIUM',
    currency: 'USD',
    validUntil: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    paymentTerms: '',
    deliveryTerms: '',
    notes: '',
  });

  const [items, setItems] = useState<OfferItemForm[]>([{ ...emptyItem }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        status: offer.status || 'DRAFT',
        priority: offer.priority || 'MEDIUM',
        currency: offer.currency || 'USD',
        validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().slice(0, 16) : '',
        customerName: offer.customerName || '',
        customerEmail: offer.customerEmail || '',
        customerPhone: offer.customerPhone || '',
        customerAddress: offer.customerAddress || '',
        paymentTerms: offer.paymentTerms || '',
        deliveryTerms: offer.deliveryTerms || '',
        notes: offer.notes || '',
      });
      if (offer.items && offer.items.length > 0) {
        setItems(offer.items.map(item => ({
          itemType: item.itemType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          tax: item.tax || 0,
          productId: item.productId,
          serviceId: item.serviceId,
          customName: item.customName || item.product?.name || item.service?.name || '',
          customDescription: item.customDescription || '',
        })));
      }
    }
  }, [offer]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { ...emptyItem }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: OfferItemForm) => {
    return item.quantity * item.unitPrice - item.discount + item.tax;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTotalDiscount = () => {
    return items.reduce((sum, item) => sum + item.discount, 0);
  };

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => sum + item.tax, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateTotalDiscount() + calculateTotalTax();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (items.length === 0) newErrors.items = 'At least one item is required';

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.itemType === 'CUSTOM' && !item.customName?.trim()) {
        newErrors[`item_${i}_name`] = 'Item name is required';
      }
      if (item.quantity < 1) {
        newErrors[`item_${i}_qty`] = 'Min 1';
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${i}_price`] = 'Min 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData: CreateOfferData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status as CreateOfferData['status'],
        priority: formData.priority as CreateOfferData['priority'],
        currency: formData.currency,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim() || undefined,
        customerPhone: formData.customerPhone.trim() || undefined,
        customerAddress: formData.customerAddress.trim() || undefined,
        paymentTerms: formData.paymentTerms.trim() || undefined,
        deliveryTerms: formData.deliveryTerms.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        items: items.map(item => ({
          itemType: item.itemType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || undefined,
          tax: item.tax || undefined,
          productId: item.itemType === 'PRODUCT' ? item.productId : undefined,
          serviceId: item.itemType === 'SERVICE' ? item.serviceId : undefined,
          customName: item.itemType === 'CUSTOM' ? item.customName : undefined,
          customDescription: item.itemType === 'CUSTOM' ? item.customDescription : undefined,
        })),
      };
      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {offer ? 'Edit Offer' : 'Create New Offer'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title & Customer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Offer title"
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.customerName ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Customer name"
              />
              {errors.customerName && <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Offer description..."
            />
          </div>

          {/* Customer Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleChange('customerEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.customerPhone}
                onChange={(e) => handleChange('customerPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+48..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.customerAddress}
                onChange={(e) => handleChange('customerAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Customer address"
              />
            </div>
          </div>

          {/* Status, Priority, Currency, Valid Until */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="PLN">PLN</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => handleChange('validUntil', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Items *</label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            {errors.items && <p className="mb-2 text-xs text-red-600">{errors.items}</p>}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex items-start gap-3">
                    {/* Item Type */}
                    <div className="w-28 shrink-0">
                      <label className="block text-xs text-gray-500 mb-1">Type</label>
                      <select
                        value={item.itemType}
                        onChange={(e) => handleItemChange(index, 'itemType', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="CUSTOM">Custom</option>
                        <option value="PRODUCT">Product</option>
                        <option value="SERVICE">Service</option>
                      </select>
                    </div>

                    {/* Item Name */}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={item.customName || ''}
                        onChange={(e) => handleItemChange(index, 'customName', e.target.value)}
                        className={`w-full px-2 py-1.5 text-sm border rounded-md ${errors[`item_${index}_name`] ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="Item name"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-20 shrink-0">
                      <label className="block text-xs text-gray-500 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-28 shrink-0">
                      <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      />
                    </div>

                    {/* Discount */}
                    <div className="w-24 shrink-0">
                      <label className="block text-xs text-gray-500 mb-1">Discount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      />
                    </div>

                    {/* Tax */}
                    <div className="w-24 shrink-0">
                      <label className="block text-xs text-gray-500 mb-1">Tax</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.tax}
                        onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                      />
                    </div>

                    {/* Total */}
                    <div className="w-28 shrink-0 text-right">
                      <label className="block text-xs text-gray-500 mb-1">Total</label>
                      <div className="py-1.5 text-sm font-medium text-gray-900">
                        {formatCurrency(calculateItemTotal(item))}
                      </div>
                    </div>

                    {/* Remove */}
                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                        className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {item.itemType === 'CUSTOM' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={item.customDescription || ''}
                        onChange={(e) => handleItemChange(index, 'customDescription', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                        placeholder="Item description (optional)"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex justify-end space-y-1 flex-col items-end text-sm">
                <div className="flex gap-8">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-medium w-28 text-right">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-gray-500">Discount:</span>
                  <span className="font-medium w-28 text-right text-red-600">-{formatCurrency(calculateTotalDiscount())}</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-gray-500">Tax:</span>
                  <span className="font-medium w-28 text-right">+{formatCurrency(calculateTotalTax())}</span>
                </div>
                <div className="flex gap-8 pt-2 border-t border-gray-300">
                  <span className="text-gray-900 font-semibold">Total:</span>
                  <span className="font-bold text-lg w-28 text-right">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Net 30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Terms</label>
              <input
                type="text"
                value={formData.deliveryTerms}
                onChange={(e) => handleChange('deliveryTerms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 14 business days"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : offer ? 'Update Offer' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferForm;
