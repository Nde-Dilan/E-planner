/**
 * @file VendorCatalog.tsx
 * @description Main vendor catalog component with filters, language & theme toggles
 */

import React, { useState, useCallback } from 'react';
import { VendorCategory, VendorExtendedSearchParams } from '../shared/types';
import { useVendors } from '../hooks/useVendors';
import { VendorCard } from './VendorCard';
import { QuoteModal } from './QuoteModal';
import { vendorTranslations, Language } from '../i18n/vendors';

export const VendorCatalog: React.FC = () => {
  const [language, setLanguage] = useState<Language>('fr');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedVendorName, setSelectedVendorName] = useState<string>('');
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const { vendors, loading, error, pagination, search } = useVendors();

  const [filters, setFilters] = useState<Partial<VendorExtendedSearchParams>>({
    category: undefined,
    city: '',
    minRating: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    page: 1,
    limit: 20,
  });

  const t = vendorTranslations[language];

  const handleFilterChange = useCallback(
    (key: keyof VendorExtendedSearchParams, value: any) => {
      const newFilters = {
        ...filters,
        [key]: value || undefined,
        page: 1, // Reset to first page when filters change
      };
      setFilters(newFilters);
      search(newFilters);
    },
    [filters, search]
  );

  const handleResetFilters = useCallback(() => {
    const newFilters: Partial<VendorExtendedSearchParams> = {
      category: undefined,
      city: '',
      minRating: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      page: 1,
      limit: 20,
    };
    setFilters(newFilters);
    search(newFilters);
  }, [search]);

  const handlePageChange = useCallback(
    (page: number) => {
      const newFilters = { ...filters, page };
      setFilters(newFilters);
      search(newFilters);
    },
    [filters, search]
  );

  const handleQuoteClick = (vendorId: string, vendorName: string) => {
    setSelectedVendorId(vendorId);
    setSelectedVendorName(vendorName);
    setQuoteModalOpen(true);
  };

  const categories: VendorCategory[] = ['caterer', 'sound', 'decor', 'photo'];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-900 dark:to-emerald-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-bold">{t.catalog.title}</h1>
                <p className="text-emerald-100 mt-2">{t.catalog.subtitle}</p>
              </div>
              <div className="flex gap-2">
                {/* Language Toggle */}
                <button
                  onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                  className="bg-emerald-500 hover:bg-emerald-400 px-4 py-2 rounded font-semibold transition-colors"
                >
                  {language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
                </button>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="bg-emerald-500 hover:bg-emerald-400 px-4 py-2 rounded font-semibold transition-colors"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.filters.title}</h2>

                {/* Category Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.filters.category}
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">{t.filters.allCategories}</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {t.categories[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.filters.city}
                  </label>
                  <input
                    type="text"
                    value={filters.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                    placeholder="Douala, Yaoundé..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Rating Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.filters.rating}
                  </label>
                  <select
                    value={filters.minRating || ''}
                    onChange={(e) =>
                      handleFilterChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">Tous</option>
                    <option value="1">1+ ★</option>
                    <option value="2">2+ ★</option>
                    <option value="3">3+ ★</option>
                    <option value="4">4+ ★</option>
                    <option value="5">5 ★</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.filters.priceRange}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.minPrice || ''}
                      onChange={(e) =>
                        handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      placeholder={t.filters.minPrice}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <input
                      type="number"
                      value={filters.maxPrice || ''}
                      onChange={(e) =>
                        handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      placeholder={t.filters.maxPrice}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    {t.filters.reset}
                  </button>
                </div>
              </div>
            </div>

            {/* Vendors Grid */}
            <div className="lg:col-span-3">
              {/* Error State */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-4 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-96 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {/* No Results */}
              {!loading && vendors.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">{t.catalog.noResults}</p>
                </div>
              )}

              {/* Vendors Grid */}
              {!loading && vendors.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {vendors.map((vendor) => (
                      <VendorCard
                        key={vendor.id}
                        vendor={vendor}
                        onQuoteClick={(id) => handleQuoteClick(id, vendor.name)}
                        language={language}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <button
                        onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                        disabled={!pagination.hasPreviousPage}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded"
                      >
                        ←
                      </button>

                      <div className="flex gap-1">
                        {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                          const pageNum = (filters.page || 1) + (i - 2);
                          if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 rounded ${
                                pageNum === (filters.page || 1)
                                  ? 'bg-emerald-600 text-white dark:bg-emerald-700'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(Math.min(pagination.totalPages, (filters.page || 1) + 1))}
                        disabled={!pagination.hasNextPage}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded"
                      >
                        →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quote Modal */}
        {selectedVendorId && (
          <QuoteModal
            isOpen={quoteModalOpen}
            vendorId={selectedVendorId}
            vendorName={selectedVendorName}
            onClose={() => {
              setQuoteModalOpen(false);
              setSelectedVendorId(null);
            }}
            language={language}
            onSuccess={() => {
              // Optional: Show success toast/message
            }}
          />
        )}
      </div>
    </div>
  );
};
