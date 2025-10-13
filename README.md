# Distribution Annuelle 2025-2026

Application web pour la gestion des distributions annuelles par classe et matière.

## 🚀 Fonctionnalités

- **Gestion par classe** : Support pour Maternelle, Primaire, Secondaire (PEI et Programme Diplôme)
- **Gestion par matière** : Interface spécialisée pour chaque matière selon le niveau
- **Export multiple** : Génération Excel, Word et PDF des distributions
- **Sauvegarde automatique** : Persistance des données dans MongoDB
- **Interface intuitive** : Navigation simple et ergonomique
- **Calendrier académique** : Intégration du calendrier scolaire 2025-2026

## 🔧 Configuration requise

### Variables d'environnement

Créez un fichier `.env` avec les variables suivantes :

```env
# Base de données MongoDB (OBLIGATOIRE)
MONGO_URL=mongodb://username:password@host:port/database
# Ou pour MongoDB Atlas:
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database

# Clé API ConvertAPI pour la conversion PDF (OBLIGATOIRE pour PDF)
CONVERTAPI_SECRET=your_convertapi_secret_here

# Port du serveur (optionnel, par défaut 3000)
PORT=3000
```

### Services externes requis

1. **MongoDB** : Base de données pour stocker les distributions
   - MongoDB Atlas (recommandé) : https://www.mongodb.com/atlas
   - Ou installation locale de MongoDB

2. **ConvertAPI** : Service de conversion DOCX vers PDF
   - Inscription : https://www.convertapi.com/
   - Plan gratuit disponible (500 conversions/mois)

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd distribution-annuelle-v2
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Puis éditez le fichier .env avec vos vraies valeurs
```

4. **Démarrer le serveur**
```bash
# Développement
npm run dev

# Production
npm start
```

## 🎯 Utilisation

1. **Accéder à l'application** : http://localhost:3000
2. **Sélectionner une section** : Maternelle, Primaire ou Secondaire
3. **Choisir une classe** : Selon la section sélectionnée
4. **Sélectionner une matière** : Dans la liste des matières disponibles
5. **Remplir le tableau** : Saisir les contenus de cours
6. **Sauvegarder** : Enregistrer les modifications
7. **Exporter** : Générer Excel, Word ou PDF

## 🔍 Diagnostic des problèmes

### Routes de diagnostic disponibles

- **Health Check** : `GET /api/health`
  - Vérification de l'état général de l'application
  - Validation de la configuration

- **Test MongoDB** : `GET /api/test-mongo`
  - Test de connectivité à la base de données

### Erreurs courantes

#### ❌ MongoDB non connecté
```
Erreur: "Cannot connect to MongoDB"
```
**Solutions** :
- Vérifiez que MONGO_URL est correctement configurée
- Testez la connexion avec `/api/test-mongo`
- Vérifiez les credentials et les permissions réseau

#### ❌ ConvertAPI non configuré
```
Erreur: "Service de conversion PDF non disponible"
```
**Solutions** :
- Configurez CONVERTAPI_SECRET dans le fichier .env
- Vérifiez votre quota sur convertapi.com
- La génération Word reste disponible

#### ❌ Port déjà utilisé
```
Erreur: "EADDRINUSE: address already in use"
```
**Solutions** :
```bash
# Tuer le processus sur le port 3000
npx kill-port 3000
# Ou changer le port dans .env
echo "PORT=3001" >> .env
```

## 📊 Structure du projet

```
distribution-annuelle-v2/
├── api/                    # API backend
│   └── server.js          # Serveur Express + routes API
├── public/                # Frontend
│   └── index.html         # Application single-page
├── .env                   # Variables d'environnement
├── .env.example           # Modèle de configuration
├── package.json           # Dépendances npm
├── start.js              # Serveur de développement
├── vercel.json           # Configuration Vercel
└── README.md             # Ce fichier
```

## 🚀 Déploiement

### Déploiement sur Vercel

1. **Installer Vercel CLI**
```bash
npm i -g vercel
```

2. **Connecter le projet**
```bash
vercel
```

3. **Configurer les variables d'environnement sur Vercel**
- Aller dans le dashboard Vercel
- Projet > Settings > Environment Variables
- Ajouter MONGO_URL et CONVERTAPI_SECRET

4. **Déployer**
```bash
vercel --prod
```

### Déploiement sur d'autres plateformes

L'application est compatible avec :
- Vercel (recommandé)
- Netlify Functions
- Heroku
- Railway
- Render

## 🛠️ Développement

### Scripts disponibles

```bash
# Développement avec rechargement automatique
npm run dev

# Démarrage production
npm start

# Nettoyage des dépendances
npm run clean

# Test de l'API
npm run test-api
```

### Structure des données

Les données sont organisées par :
- **Classe** : Base de données séparée par classe
- **Matière** : Collection par matière dans chaque classe
- **Séances** : Lignes individuelles avec contenu de cours

## 📞 Support

En cas de problème :

1. **Vérifiez les logs** : Console du navigateur et terminal serveur
2. **Testez la configuration** : Routes `/api/health` et `/api/test-mongo`  
3. **Vérifiez les variables d'environnement** : Fichier `.env`
4. **Consultez la documentation** : Services MongoDB et ConvertAPI

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.