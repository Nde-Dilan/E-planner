import { Quote } from '@shared/types';

/**
 * Store en mémoire des demandes de devis.
 * Interface pour l'accès aux demandes de devis persistées en mémoire.
 */
export interface IQuoteStore {
  /**
   * Persiste une nouvelle demande de devis.
   * @param quote - La demande de devis à sauvegarder
   * @returns La demande de devis sauvegardée
   */
  save(quote: Quote): Quote;

  /**
   * Retourne toutes les demandes pour un prestataire donné.
   * @param vendorId - L'identifiant du prestataire
   * @returns Liste des demandes associées au prestataire
   */
  findByVendorId(vendorId: string): Quote[];

  /**
   * Retourne une demande par son identifiant.
   * @param id - L'identifiant de la demande
   * @returns La demande trouvée ou undefined si absente
   */
  findById(id: string): Quote | undefined;

  /**
   * Retourne toutes les demandes enregistrées.
   * @returns Shallow copy de toutes les demandes
   */
  findAll(): Quote[];

  /**
   * Seed pour les tests et initialisation.
   * Remplace intégralement le tableau de demandes par les nouvelles.
   * @param quotes - Tableau des demandes à charger
   */
  seed(quotes: Quote[]): void;
}

/**
 * Implémentation du store en mémoire pour les demandes de devis.
 * Stocke les Quote[] en mémoire pour l'application.
 * Singleton — même cycle de vie que l'application.
 */
class QuoteStore implements IQuoteStore {
  private quotes: Quote[] = [];

  /**
   * Persiste une nouvelle demande de devis.
   * @param quote - La demande de devis à sauvegarder
   * @returns La demande de devis sauvegardée
   */
  save(quote: Quote): Quote {
    this.quotes.push(quote);
    return quote;
  }

  /**
   * Retourne toutes les demandes pour un prestataire donné.
   * @param vendorId - L'identifiant du prestataire
   * @returns Liste des demandes associées au prestataire
   */
  findByVendorId(vendorId: string): Quote[] {
    return this.quotes.filter((quote) => quote.vendorId === vendorId);
  }

  /**
   * Retourne une demande par son identifiant.
   * @param id - L'identifiant de la demande
   * @returns La demande trouvée ou undefined si absente
   */
  findById(id: string): Quote | undefined {
    return this.quotes.find((quote) => quote.id === id);
  }

  /**
   * Retourne toutes les demandes enregistrées.
   * @returns Shallow copy de toutes les demandes
   */
  findAll(): Quote[] {
    return [...this.quotes];
  }

  /**
   * Seed pour les tests et initialisation.
   * Remplace intégralement le tableau de demandes par les nouvelles.
   * @param quotes - Tableau des demandes à charger
   */
  seed(quotes: Quote[]): void {
    this.quotes = quotes;
  }
}

/**
 * Singleton instance du QuoteStore.
 * Utilisé par le module Vendors pour persister les demandes de devis.
 */
export const quoteStore = new QuoteStore();
