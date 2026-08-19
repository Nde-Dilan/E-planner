/**
 * @file vendors.ts
 * @description Bilingual translation keys for Vendors module (FR/EN)
 */

export const vendorTranslations = {
  fr: {
    // Catalog
    catalog: {
      title: 'Nos Prestataires',
      subtitle: 'Trouvez les meilleurs prestataires pour votre événement',
      noResults: 'Aucun prestataire trouvé',
      loading: 'Chargement...',
      error: 'Erreur lors du chargement des prestataires',
    },

    // Filters
    filters: {
      title: 'Filtres',
      category: 'Catégorie',
      city: 'Ville',
      priceRange: 'Fourchette de prix (XAF)',
      minPrice: 'Prix min',
      maxPrice: 'Prix max',
      rating: 'Note minimale',
      apply: 'Appliquer',
      reset: 'Réinitialiser',
      allCategories: 'Toutes les catégories',
    },

    // Categories
    categories: {
      caterer: 'Traiteur',
      sound: 'Sonorisation',
      decor: 'Décoration',
      photo: 'Photographie',
    },

    // Vendor card
    card: {
      rating: 'Note',
      priceRange: 'Fourchette',
      contact: 'Contacter',
      viewDetails: 'Voir détails',
    },

    // Quote modal
    quote: {
      title: 'Demander un devis',
      close: 'Fermer',
      clientName: 'Votre nom',
      contact: 'Email ou téléphone (+237)',
      message: 'Description de votre besoin',
      eventType: 'Type d\'événement',
      submit: 'Envoyer la demande',
      success: 'Demande de devis envoyée avec succès',
      error: 'Erreur lors de l\'envoi de la demande',
      validation: {
        clientNameRequired: 'Le nom est requis',
        clientNameMinLength: 'Le nom doit avoir au moins 2 caractères',
        contactRequired: 'Email ou téléphone requis',
        contactInvalid: 'Format invalide (email ou +237...)',
        messageRequired: 'Le message est requis',
        messageMinLength: 'Le message doit avoir au moins 10 caractères',
        messageMaxLength: 'Le message ne peut pas dépasser 1000 caractères',
        eventTypeRequired: 'Le type d\'événement est requis',
      },
      rateLimited: 'Trop de demandes. Veuillez réessayer plus tard.',
    },

    // Controls
    controls: {
      language: 'Langue',
      darkMode: 'Mode sombre',
      lightMode: 'Mode clair',
    },
  },

  en: {
    // Catalog
    catalog: {
      title: 'Our Vendors',
      subtitle: 'Find the best vendors for your event',
      noResults: 'No vendors found',
      loading: 'Loading...',
      error: 'Error loading vendors',
    },

    // Filters
    filters: {
      title: 'Filters',
      category: 'Category',
      city: 'City',
      priceRange: 'Price Range (XAF)',
      minPrice: 'Min price',
      maxPrice: 'Max price',
      rating: 'Min rating',
      apply: 'Apply',
      reset: 'Reset',
      allCategories: 'All categories',
    },

    // Categories
    categories: {
      caterer: 'Catering',
      sound: 'Sound',
      decor: 'Decoration',
      photo: 'Photography',
    },

    // Vendor card
    card: {
      rating: 'Rating',
      priceRange: 'Price range',
      contact: 'Contact',
      viewDetails: 'View details',
    },

    // Quote modal
    quote: {
      title: 'Request a Quote',
      close: 'Close',
      clientName: 'Your name',
      contact: 'Email or phone (+237)',
      message: 'Describe your need',
      eventType: 'Event type',
      submit: 'Send request',
      success: 'Quote request sent successfully',
      error: 'Error sending quote request',
      validation: {
        clientNameRequired: 'Name is required',
        clientNameMinLength: 'Name must be at least 2 characters',
        contactRequired: 'Email or phone is required',
        contactInvalid: 'Invalid format (email or +237...)',
        messageRequired: 'Message is required',
        messageMinLength: 'Message must be at least 10 characters',
        messageMaxLength: 'Message cannot exceed 1000 characters',
        eventTypeRequired: 'Event type is required',
      },
      rateLimited: 'Too many requests. Please try again later.',
    },

    // Controls
    controls: {
      language: 'Language',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
    },
  },
};

export type Language = 'fr' | 'en';
export type TranslationKey = keyof typeof vendorTranslations.fr;
