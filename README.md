# Event & Logistics Cameroon — AWS re:Deploy 2026 (Mois 2)

Bienvenue dans le dépôt officiel du projet. Ce document explique la structure du projet, ce qui a déjà été initialisé et la procédure stricte à suivre par chaque développeur pour travailler sans conflits Git.

---

## 1. Ce qui a déjà été fait (Étape 0 & Setup)
- [x] Initialisation du dépôt GitHub et création de la branche `develop`.
- [x] Arborescence complète du projet (`src/modules/`, `src/shared/`, `tests/`, `docs/`).
- [x] Configuration de Kiro (`.kiro/steering/project-context.md`) pour le contexte du projet.
- [x] Fichiers essentiels générés : `package.json`, `tsconfig.json`, et `src/shared/types.ts`.

---

## 2. Attributions des Modules (1 Dev par Module)

Chaque développeur est responsable **exclusivement** d'un seul module :

1. **Dev 1 (Salles) :** Reçoit le dossier `src/modules/venues/` (Recherche, filtrage multicritère et fiches de salles).
2. **Dev 2 (Prestataires) :** Reçoit le dossier `src/modules/vendors/` (Catalogue traiteurs, sono, déco, photo et prise de contact).
3. **Dev 3 (Budget) :** Reçoit le dossier `src/modules/budget/` (Calculateur d'estimation budgétaire automatique).
4. **Dev 4 (Avis & WhatsApp) :** Reçoit le dossier `src/modules/reviews/` (Système de notation 5 étoiles et génération de liens WhatsApp).

---

## 3. Règle d'Or (Anti-Conflit Git)
> **Chaque développeur travaille UNIQUEMENT dans son dossier module attribué dans `src/modules/<son-module>/`.**  
> Ne modifiez **JAMAIS** le dossier `src/shared/` ou le travail d'un autre module sans en discuter préalablement sur le groupe de l'équipe.

---

## 4. Guide Pas à Pas pour Démarrer (Pour chaque Développeur)

### Étape A — Récupérer le projet
1. Clonez le dépôt GitHub sur votre machine (si ce n'est pas fait).

2. Basculez sur la branche `develop` et récupérez la dernière version :
   ```bash
   git checkout develop
   git pull origin develop

### Étape B Créer votre branche de travail
Créez une branche dédiée à votre module depuis develop :

Dev 1 : git checkout -b feature/venues

Dev 2 : git checkout -b feature/vendors

Dev 3 : git checkout -b feature/budget

Dev 4 : git checkout -b feature/reviews-whatsapp



### Étape C Génération de votre Spec et Code avec Kiro
Ouvrez le projet dans Kiro (basé sur VS Code).

Lancez le prompt de génération de Spec pour votre module uniquement (ex: "Génère une Spec Kiro complète pour le module Salles dans src/modules/venues...").

#### ❗❗IMPORTANT (Preuve Hackathon) : Prenez une capture d'écran de votre interface Kiro (avec la barre latérale des specs visible) et enregistrez-la dans docs/kiro-screenshots/votre-nom-module.png. C'est ce qui nous donnera les 15 points "Use of Kiro".####

Validez la Spec et cliquez sur Implement.

#### Étape D — Soumettre votre travail (Pull Request)
Une fois votre module testé et fonctionnel :

Ajoutez et committez vos modifications :

Bash
git add .
git commit -m "feat(<nom-module>): implémentation complète avec Kiro spec"
git push origin feature/<votre-branche>
Allez sur GitHub et ouvrez une Pull Request (PR) pour demander la fusion de votre branche feature/<votre-branche> vers la branche develop.

Informez l'équipe sur WhatsApp pour la revue et le merge.

5. Scripts Utiles
npm run dev : Lance le serveur en mode développement avec rechargement automatique.

npm run test : Exécute les tests unitaires Jest.

npm run build : Compile le code TypeScript vers JavaScript dans dist/.
