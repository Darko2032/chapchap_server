# CHAP-CHAP Administration PWA

Cette application web progressive (PWA) est l'interface d'administration pour CHAP-CHAP, permettant de gérer les commandes de recharges téléphoniques.

## Fonctionnalités

- Installation sur l'écran d'accueil des appareils mobiles et des ordinateurs
- Fonctionnement hors-ligne avec synchronisation automatique
- Gestion complète des commandes (visualisation, modification du statut, suppression)
- Interface responsive adaptée à tous les écrans
- Sécurité par authentification

## Installation

1. Accédez à l'interface admin via l'URL du serveur CHAP-CHAP
2. Connectez-vous avec vos identifiants administrateur
3. Sur mobile : utilisez l'option "Ajouter à l'écran d'accueil" dans le menu du navigateur
4. Sur desktop : cherchez l'icône d'installation dans la barre d'adresse

## Configuration des icônes

Pour que la PWA ait un affichage optimal sur tous les appareils, vous devez générer les icônes dans différentes tailles :

1. Placez votre logo (format carré recommandé) dans le dossier `admin/`
2. Utilisez un outil comme [PWA Image Generator](https://www.pwabuilder.com/imageGenerator) pour créer les différentes tailles
3. Placez les icônes générées dans le dossier `admin/icons/`

Tailles requises :
- 72x72 : icon-72x72.png
- 96x96 : icon-96x96.png
- 128x128 : icon-128x128.png
- 144x144 : icon-144x144.png
- 152x152 : icon-152x152.png
- 192x192 : icon-192x192.png
- 384x384 : icon-384x384.png
- 512x512 : icon-512x512.png

## Déploiement

Cette PWA est automatiquement déployée avec le serveur CHAP-CHAP. Aucune étape supplémentaire n'est nécessaire.

## Sécurité

L'accès à cette interface d'administration est protégé par authentification. Assurez-vous de définir des identifiants sécurisés dans le fichier `.env` du serveur :

```
ADMIN_USERNAME=votre_nom_utilisateur
ADMIN_PASSWORD=votre_mot_de_passe_sécurisé
```

## Fonctionnement hors-ligne

En mode hors-ligne, vous pourrez consulter les commandes déjà chargées. Les modifications seront mises en file d'attente et synchronisées automatiquement lorsque la connexion sera rétablie.
