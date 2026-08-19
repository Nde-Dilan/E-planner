/**
 * @file VendorCard.tsx
 * @description Responsive vendor card component with Dark/Light mode support
 */

import React from 'react';
import { Vendor, VendorCategory } from '../shared/types';
import { vendorTranslations, Language } from '../i18n/vendors';

interface VendorCardProps {
  vendor: Vendor;
  onQuoteClick: (vendorId: string) => void;
  language: Language;
}

const categoryIcons: Record<VendorCategory, string> = {
  caterer: '🍽️',
  sound: '🔊',
  decor: '🎨',
  photo: '📸',
};

export const VendorCard: React.FC<VendorCardProps> = ({ vendor, onQuoteClick, language }) => {
  const t = vendorTranslations[language];
  const categoryLabel = t.categories[vendor.category] || vendor.category;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-xl transition-shadow">
      {/* Header with category badge */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-900 dark:to-emerald-800 px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white truncate">{vendor.name}</h3>
            <p className="text-emerald-100 text-sm mt-1">{categoryLabel}</p>
          </div>
          <span className="text-2xl ml-2">{categoryIcons[vendor.category]}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* City */}
        <div className="flex items-center text-gray-700 dark:text-gray-300">
          <span className="text-sm font-medium">📍</span>
          <span className="text-sm ml-2">{vendor.city}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-lg ${
                  i < Math.floor(vendor.rating)
                    ? 'text-amber-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2">
            {vendor.rating.toFixed(1)}
          </span>
        </div>

        {/* Price Range */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
            {t.filters.priceRange}
          </p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{vendor.priceRange}</p>
        </div>
      </div>

      {/* Action button */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => onQuoteClick(vendor.id)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          {t.card.contact}
        </button>
      </div>
    </div>
  );
};
