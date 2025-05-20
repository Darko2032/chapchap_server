# CHAP-CHAP Server

Serveur Node.js pour l'application de recharge mobile CHAP-CHAP.

## Fonctionnalités

- API REST pour la gestion des commandes de recharge mobile
- Interface d'administration sécurisée
- Support pour les opérateurs Orange, MTN et Moov en Côte d'Ivoire
- Gestion des statuts de commande: En attente, En cours, Validée, Effectuée, Annulée, Refusée

## Configuration requise

- Node.js 14.0.0 ou supérieur
- npm 6.0.0 ou supérieur

## Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'exemple de configuration
cp .env.example .env

# Modifier les variables d'environnement
# Éditez le fichier .env avec vos propres valeurs
```

## Variables d'environnement

Copiez le fichier `.env.example` vers `.env` et configurez les variables suivantes:

- `PORT`: Port du serveur (par défaut: 3000)
- `ADMIN_USERNAME`: Nom d'utilisateur pour l'interface d'administration
- `ADMIN_PASSWORD`: Mot de passe pour l'interface d'administration
- `SESSION_SECRET`: Clé secrète pour les sessions
- `JWT_SECRET`: Clé secrète pour les tokens JWT

## Démarrage du serveur

```bash
# Démarrer en mode développement
npm run dev

# Démarrer en mode production
npm start
```

## Déploiement sur Render

1. Créez un nouveau service Web sur Render
2. Connectez votre dépôt GitHub ou GitLab
3. Configurez les variables d'environnement à partir du fichier `.env.example`
4. Utilisez les paramètres suivants:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

## API Routes

- `GET /api/commandes`: Récupérer toutes les commandes
- `GET /api/commandes/:id`: Récupérer une commande par ID
- `POST /api/commandes`: Créer une nouvelle commande
- `PUT /api/commandes/:id`: Mettre à jour le statut d'une commande
- `DELETE /api/commandes/:id`: Supprimer une commande

## Interface d'administration

L'interface d'administration est accessible à l'adresse `/admin`. Vous devrez vous connecter avec les identifiants configurés dans les variables d'environnement.

## Licence

Ce projet est sous licence privée. Tous droits réservés © 2025 CHAP-CHAP.
"# chapchap_server" 
