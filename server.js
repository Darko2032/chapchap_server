// Importation des modules nécessaires
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

// Modules pour l'authentification
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Import du middleware d'authentification
let auth = {
  verifyToken: (req, res, next) => next(), // Version simplifiée sans dépendances
  validateCredentials: (username, password) => {
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'chapchap2025';
    return username === validUsername && password === validPassword;
  }
};

try {
  auth = require('./middleware/auth');
} catch (error) {
  console.log('Middleware d\'authentification non disponible, utilisation du mode basique');
}

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware supplémentaires pour l'authentification
app.use(cookieParser());

// Configuration de la session
app.use(session({
  secret: process.env.SESSION_SECRET || 'chap-chap-secret-session',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 12 } // 12 heures
}));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Chemin du fichier pour stocker les commandes
const COMMANDES_FILE = path.join(__dirname, 'commandes.json');

// Fonction pour lire les commandes depuis le fichier
async function readCommandes() {
  try {
    const data = await fs.readFile(COMMANDES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Si le fichier n'existe pas, renvoyer un tableau vide
    return [];
  }
}

// Fonction pour écrire les commandes dans le fichier
async function writeCommandes(commandes) {
  await fs.writeFile(COMMANDES_FILE, JSON.stringify(commandes, null, 2), 'utf8');
}

// Routes API

// Récupérer toutes les commandes
app.get('/api/commandes', async (req, res) => {
  try {
    const commandes = await readCommandes();
    res.json(commandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes', error: error.message });
  }
});

// Récupérer une commande par ID
app.get('/api/commandes/:id', async (req, res) => {
  try {
    const commandes = await readCommandes();
    const commande = commandes.find(c => c.id === req.params.id);
    
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la commande', error: error.message });
  }
});

// Créer une nouvelle commande
app.post('/api/commandes', async (req, res) => {
  try {
    const commandes = await readCommandes();
    
    // Création d'une nouvelle commande avec statut "En attente" par défaut
    const nouvelleCommande = {
      ...req.body,
      id: req.body.id || Date.now().toString(),
      statut: 'En attente',
      statut_date: new Date().toISOString()
    };
    
    commandes.push(nouvelleCommande);
    await writeCommandes(commandes);
    
    res.status(201).json(nouvelleCommande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la commande', error: error.message });
  }
});

// Mettre à jour le statut d'une commande
app.put('/api/commandes/:id', async (req, res) => {
  try {
    const commandes = await readCommandes();
    const index = commandes.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    // Statuts valides pour les commandes
    const statutsValides = ['En attente', 'En cours', 'Validée', 'Effectuée', 'Annulée', 'Refusée'];
    
    // Vérifier si le statut demandé est valide
    if (req.body.statut && !statutsValides.includes(req.body.statut)) {
      return res.status(400).json({ 
        message: 'Statut invalide', 
        statutsValides 
      });
    }
    
    // Mettre à jour la commande
    commandes[index] = {
      ...commandes[index],
      statut: req.body.statut || commandes[index].statut,
      statut_date: new Date().toISOString()
    };
    
    await writeCommandes(commandes);
    res.json(commandes[index]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la commande', error: error.message });
  }
});

// Supprimer une commande
app.delete('/api/commandes/:id', async (req, res) => {
  try {
    const commandes = await readCommandes();
    const commandesFiltrées = commandes.filter(c => c.id !== req.params.id);
    
    if (commandesFiltrées.length === commandes.length) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    await writeCommandes(commandesFiltrées);
    res.json({ message: 'Commande supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la commande', error: error.message });
  }
});

// Authentification pour l'API
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (auth.validateCredentials(username, password)) {
      // Générer un token avec JWT
      const token = auth.generateToken(username);
      
      res.json({ success: true, token, message: 'Connexion réussie' });
    } else {
      res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la connexion', error: error.message });
  }
});

// Middleware pour sécuriser les routes admin
const secureAdminRoute = (req, res, next) => {
  // Vérifier le token dans les cookies ou dans l'en-tête Authorization
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    return res.redirect('/admin/login.html');
  }
  
  try {
    // Vérifier le token JWT
    const decoded = jwt.verify(token, auth.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // Rediriger vers la page de connexion en cas d'erreur
    if (req.path === '/admin' || req.path === '/admin/') {
      return res.redirect('/admin/login.html');
    }
    
    // API accès refusé
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    next();
  }
};

// Routes pour l'interface d'administration
app.use('/admin', (req, res, next) => {
  // Ne pas appliquer la sécurité à la page de connexion
  if (req.path === '/login.html') {
    return next();
  }
  
  // Sécuriser les autres routes admin
  secureAdminRoute(req, res, next);
}, express.static(path.join(__dirname, 'admin')));

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API du serveur CHAP-CHAP!', 
    endpoints: [
      { method: 'GET', path: '/api/commandes', description: 'Récupérer toutes les commandes' },
      { method: 'GET', path: '/api/commandes/:id', description: 'Récupérer une commande par ID' },
      { method: 'POST', path: '/api/commandes', description: 'Créer une nouvelle commande' },
      { method: 'PUT', path: '/api/commandes/:id', description: 'Mettre à jour le statut d\'une commande' },
      { method: 'DELETE', path: '/api/commandes/:id', description: 'Supprimer une commande' }
    ],
    admin: `${req.protocol}://${req.get('host')}/admin/login.html`
  });
});

// Démarrage du serveur
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Serveur CHAP-CHAP démarré sur ${HOST}, port ${PORT}`);
  console.log(`- Accès local: http://localhost:${PORT}`);
  console.log(`- Pour l'émulateur Android: http://10.0.2.2:${PORT}`);
  console.log(`- Pour un accès international: utilisez l'URL de la plateforme d'hébergement`);
});
