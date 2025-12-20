'use client';

import React from 'react';
import { Service, ServiceStatus } from '@/types/products';
import { 
  Settings, 
  Edit2, 
  Trash2, 
  Eye, 
  Copy, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onView: (service: Service) => void;
  onDuplicate: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  onView,
  onDuplicate
}) => {
  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'UNAVAILABLE':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'TEMPORARILY_UNAVAILABLE':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'DISCONTINUED':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'UNAVAILABLE':
        return 'bg-red-100 text-red-800';
      case 'TEMPORARILY_UNAVAILABLE':
        return 'bg-orange-100 text-orange-800';
      case 'DISCONTINUED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number, currency: string, billingType: string) => {
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);

    const billingLabels: Record<string, string> = {
      ONE_TIME: '',
      HOURLY: '/hr',
      DAILY: '/day',
      WEEKLY: '/week',
      MONTHLY: '/month',
      YEARLY: '/year',
      PROJECT_BASED: '/project'
    };

    return `${formattedPrice}${billingLabels[billingType] || ''}`;
  };

  const getDeliveryMethodIcon = (method: string) => {
    switch (method) {
      case 'REMOTE':
        return '🌐';
      case 'ON_SITE':
        return '🏢';
      case 'HYBRID':
        return '🔄';
      case 'DIGITAL_DELIVERY':
        return '📱';
      case 'PHYSICAL_DELIVERY':
        return '📦';
      default:
        return '🌐';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Service Image */}
      <div className="relative h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg overflow-hidden">
        {service.images && service.images.length > 0 ? (
          <img
            src={service.images[0]}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Settings className="w-12 h-12 text-blue-500" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
            {getStatusIcon(service.status)}
            <span className="ml-1">{service.status.replace(/_/g, ' ')}</span>
          </span>
        </div>

        {/* Featured Badge */}
        {service.isFeatured && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Service Details */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
            {service.name}
          </h3>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Category */}
        {service.category && (
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              {service.category}
              {service.subcategory && ` / ${service.subcategory}`}
            </span>
          </div>
        )}

        {/* Price and Billing */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(service.price, service.currency, service.billingType)}
            </span>
            {service.cost && (
              <span className="text-sm text-gray-500 ml-2">
                Cost: {formatPrice(service.cost, service.currency, service.billingType)}
              </span>
            )}
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-2 mb-3">
          {/* Duration */}
          {service.duration && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>{formatDuration(service.duration)}</span>
              {service.unit && <span className="ml-1">per {service.unit}</span>}
            </div>
          )}

          {/* Delivery Method */}
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{getDeliveryMethodIcon(service.deliveryMethod)} {service.deliveryMethod.replace(/_/g, ' ')}</span>
          </div>

          {/* Estimated Delivery */}
          {service.estimatedDeliveryDays && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>
                {service.estimatedDeliveryDays === 1 
                  ? '1 day delivery' 
                  : `${service.estimatedDeliveryDays} days delivery`
                }
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {service.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
              >
                {tag}
              </span>
            ))}
            {service.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{service.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Requirements/Resources */}
        {(service.requirements || service.resources) && (
          <div className="text-xs text-gray-500 mb-3">
            {service.requirements && (
              <div className="mb-1">
                <strong>Requirements:</strong> {service.requirements.length > 60 
                  ? `${service.requirements.substring(0, 60)}...` 
                  : service.requirements
                }
              </div>
            )}
            {service.resources && (
              <div>
                <strong>Resources:</strong> {service.resources.length > 60 
                  ? `${service.resources.substring(0, 60)}...` 
                  : service.resources
                }
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => onView(service)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(service)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="Edit Service"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicate(service)}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
              title="Duplicate Service"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => onDelete(service)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Service"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;