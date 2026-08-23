/**
 * @file quote.service.ts
 * @description Service métier pour les demandes de devis.
 *              Gère la création de demandes de devis, le masquage des contacts,
 *              et les notifications WhatsApp aux prestataires.
 *              Singleton pattern pour une instance unique dans l'application.
 */

import crypto from 'crypto';
import { Quote, QuoteRequest, WhatsAppPayload } from '@shared/types';
import { quoteStore } from './quote.store';
import { vendorService } from './vendor.service';

/**
 * Interface pour le service de gestion des demandes de devis.
 */
export interface IQuoteService {
  /**
   * Enregistre une nouvelle demande de devis pour un prestataire.
   * Vérifie l'existence du prestataire, masque le contact du client,
   * persiste la demande et déclenche une notification WhatsApp.
   *
   * @param vendorId - Identifiant unique du prestataire (UUID v4)
   * @param payload - Données de la demande (clientName, contact, message, eventType)
   * @returns L'objet Quote enregistré avec tous les champs remplis
   * @throws NotFoundError si le prestataire n'existe pas
   */
  createQuote(vendorId: string, payload: QuoteRequest): Quote;

  /**
   * Masque un numéro de téléphone ou retourne un email inchangé.
   * Pour un numéro E.164 +237 (13 caractères) : retourne +237*****XXXX
   * où XXXX sont les 4 derniers chiffres.
   * Sinon : retourne le contact intact.
   *
   * @param contact - Email ou numéro de téléphone à masquer
   * @returns Contact masqué ou inchangé selon le format
   */
  maskContact(contact: string): string;
}

/**
 * Implémentation du service de gestion des demandes de devis.
 * Responsable de :
 * - Validation de l'existence du prestataire
 * - Masquage du numéro de téléphone
 * - Persistance de la demande en mémoire
 * - Déclenchement des notifications WhatsApp (fire-and-forget)
 */
class QuoteService implements IQuoteService {
  /**
   * Crée une nouvelle instance du QuoteService.
   * En production, seule l'instance singleton `quoteService` est utilisée.
   */
  constructor() {}

  /**
   * Masque un numéro de téléphone au format E.164 +237 ou retourne un email inchangé.
   *
   * Règle de masquage :
   * - Si contact commence par "+237" ET a exactement 13 caractères :
   *   - Retourne "+237*****" + les 4 derniers chiffres (ex: +237612345678 → +237*****5678)
   * - Sinon (email ou autre format) :
   *   - Retourne le contact inchangé
   *
   * @param contact - Email ou numéro de téléphone
   * @returns Contact masqué (numéro +237) ou inchangé (email)
   */
  maskContact(contact: string): string {
    if (contact.startsWith('+237') && contact.length === 13) {
      return '+237*****' + contact.slice(-4);
    }
    return contact;
  }

  /**
   * Enregistre une nouvelle demande de devis pour un prestataire.
   * Workflow:
   * 1. Vérifie que le prestataire existe (lève NotFoundError sinon)
   * 2. Masque le contact du client
   * 3. Crée l'objet Quote avec UUID v4
   * 4. Persiste via quoteStore.save()
   * 5. Déclenche une notification WhatsApp (fire-and-forget, non-bloquant)
   * 6. Retourne l'objet Quote complet
   *
   * @param vendorId - UUID du prestataire ciblé
   * @param payload - Demande de devis avec clientName, contact, message, eventType
   * @returns L'objet Quote enregistré avec id, createdAt, maskedContact remplis
   * @throws NotFoundError si le prestataire n'existe pas
   */
  createQuote(vendorId: string, payload: QuoteRequest): Quote {
    // Vérifier que le prestataire existe
    // vendorService.findById lève NotFoundError automatiquement si absent
    vendorService.findById(vendorId);

    // Masquer le contact pour la sécurité des logs
    const maskedContact = this.maskContact(payload.contact);

    // Construire l'objet Quote
    const quote: Quote = {
      id: crypto.randomUUID(),
      vendorId,
      clientName: payload.clientName,
      contact: payload.contact,
      message: payload.message,
      eventType: payload.eventType,
      createdAt: new Date().toISOString(),
      maskedContact,
    };

    // Persister la demande
    quoteStore.save(quote);

    // Déclencher la notification WhatsApp (fire-and-forget)
    // Construire le payload WhatsApp avec les infos du prestataire et le contact masqué
    const whatsappPayload: WhatsAppPayload = {
      recipientPhone: '+237XXXXXXXXX', // Placeholder - le numéro du prestataire sera intégré ultérieurement
      message: `Nouvelle demande de devis:\n\nClient: ${payload.clientName}\nContact: ${maskedContact}\nÉvénement: ${payload.eventType}\n\nMessage:\n${payload.message}`,
      messageType: 'general',
      correlationId: quote.id,
    };

    // Envoyer la notification de manière asynchrone (non-bloquante)
    // fetch() n'est pas attendu, donc la promesse est ignorée
    if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN) {
      fetch(process.env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify(whatsappPayload),
      }).catch((error) => {
        // Ignorer les erreurs de notification (fire-and-forget)
        // Ne pas bloquer la réponse au client
        console.error(
          `Erreur lors de l'envoi de la notification WhatsApp (${quote.id}):`,
          error
        );
      });
    }

    return quote;
  }
}

/**
 * Singleton instance del QuoteService.
 * Utilisée dans tout le module Vendors pour gérer les demandes de devis.
 */
export const quoteService = new QuoteService();
