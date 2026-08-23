/**
 * @file QuoteModal.tsx
 * @description Bilingual quote request modal with validation and error handling
 */

import React, { useState } from 'react';
import { QuoteRequest } from '../shared/types';
import { requestQuote } from '../services/vendor.api';
import { vendorTranslations, Language } from '../i18n/vendors';

interface QuoteModalProps {
  isOpen: boolean;
  vendorId: string;
  vendorName: string;
  onClose: () => void;
  language: Language;
  onSuccess: () => void;
}

interface ValidationErrors {
  clientName?: string;
  contact?: string;
  message?: string;
  eventType?: string;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+237\d{9}$/;
  return phoneRegex.test(phone);
};

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  vendorId,
  vendorName,
  onClose,
  language,
  onSuccess,
}) => {
  const t = vendorTranslations[language];
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<QuoteRequest>({
    clientName: '',
    contact: '',
    message: '',
    eventType: '',
  });

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = t.quote.validation.clientNameRequired;
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName = t.quote.validation.clientNameMinLength;
    }

    if (!formData.contact.trim()) {
      newErrors.contact = t.quote.validation.contactRequired;
    } else if (!validateEmail(formData.contact) && !validatePhone(formData.contact)) {
      newErrors.contact = t.quote.validation.contactInvalid;
    }

    if (!formData.message.trim()) {
      newErrors.message = t.quote.validation.messageRequired;
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t.quote.validation.messageMinLength;
    } else if (formData.message.length > 1000) {
      newErrors.message = t.quote.validation.messageMaxLength;
    }

    if (!formData.eventType.trim()) {
      newErrors.eventType = t.quote.validation.eventTypeRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      await requestQuote(vendorId, formData);
      setFormData({ clientName: '', contact: '', message: '', eventType: '' });
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : t.quote.error;
      if (message.includes('429') || message.includes('rate')) {
        setApiError(t.quote.rateLimited);
      } else {
        setApiError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-900 dark:to-emerald-800 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{t.quote.title}</h2>
            <p className="text-emerald-100 text-sm mt-1">{vendorName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-emerald-100 text-2xl leading-none"
            aria-label={t.quote.close}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* API Error */}
          {apiError && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
              {apiError}
            </div>
          )}

          {/* Client Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t.quote.clientName}
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                errors.clientName ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.clientName && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.clientName}</p>}
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t.quote.contact}
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="user@example.com or +237612345678"
              className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                errors.contact ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.contact && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.contact}</p>}
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t.quote.eventType}
            </label>
            <input
              type="text"
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              placeholder={language === 'fr' ? 'Mariage, Anniversaire...' : 'Wedding, Birthday...'}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                errors.eventType ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.eventType && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.eventType}</p>}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t.quote.message}
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.message && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {loading ? t.catalog.loading : t.quote.submit}
          </button>
        </form>
      </div>
    </div>
  );
};
