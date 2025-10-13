# Guide de Déploiement - Distribution Annuelle 2025-2026

## ✅ État des Corrections

Toutes les erreurs critiques ont été corrigées :

1. **✅ Dépendances NPM** - Réinstallation propre réussie
2. **✅ Variables d'environnement** - Fichier .env créé avec validation
3. **✅ Gestion des erreurs** - Messages d'erreur améliorés côté client
4. **✅ Routage API** - Routes corrigées et fonctionnelles  
5. **✅ Diagnostic** - Routes de santé pour déboguer les problèmes
6. **✅ Documentation** - README complet avec instructions

## 🚀 URL d'Accès

**Application Web**: https://3002-i9vr6whhjoohukncuu11l-6532622b.e2b.dev

**API Health Check**: https://3002-i9vr6whhjoohukncuu11l-6532622b.e2b.dev/api/health

## 🔧 Configuration Requise

### 1. Base de données MongoDB

**Option A - MongoDB Atlas (Recommandé pour production)**
```bash
# 1. Créez un compte sur https://www.mongodb.com/atlas
# 2. Créez un cluster gratuit (500MB)
# 3. Obtenez l'URL de connexion
# 4. Ajoutez dans .env :
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/distribution-annuelle
```

**Option B - MongoDB Local (Développement uniquement)**
```bash
# Installation Ubuntu/Debian
sudo apt update
sudo apt install -y mongodb

# Démarrage
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Configuration .env
MONGO_URL=mongodb://localhost:27017/distribution-annuelle
```

### 2. Service ConvertAPI (Pour PDF)

```bash
# 1. Inscription : https://www.convertapi.com/
# 2. Plan gratuit : 500 conversions/mois
# 3. Obtenez votre clé API
# 4. Ajoutez dans .env :
CONVERTAPI_SECRET=your_actual_secret_here
```

## 🌐 Déploiement Vercel

### Méthode Rapide

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Déployer depuis le répertoire du projet
vercel

# 3. Suivre les instructions interactives
# - Framework: Other
# - Build Command: (laisser vide)
# - Output Directory: (laisser vide)
```

### Configuration Variables Environnement

Dans le dashboard Vercel :
1. Projet → Settings → Environment Variables
2. Ajouter :
   - `MONGO_URL` : Votre URL MongoDB Atlas
   - `CONVERTAPI_SECRET` : Votre clé ConvertAPI

### Déploiement Production

```bash
# Déploiement production
vercel --prod
```

## 🐛 Diagnostic des Problèmes

### Routes de Diagnostic

- **Health Check** : `/api/health`
  ```json
  {
    "status": "ok",
    "environment": {
      "mongodb_configured": true,
      "convertapi_ready": true
    }
  }
  ```

- **Test MongoDB** : `/api/test-mongo`
  ```json
  {
    "status": "success",
    "message": "Connexion MongoDB réussie"
  }
  ```

### Problèmes Courants

#### ❌ MongoDB Non Connecté
```
Status: mongodb_configured: false
```
**Solution** : Configurez MONGO_URL dans .env

#### ❌ ConvertAPI Non Configuré  
```
Status: convertapi_ready: false
```
**Solution** : Configurez CONVERTAPI_SECRET dans .env

#### ❌ Erreur 500 au Démarrage
**Vérifications** :
1. Variables d'environnement présentes
2. Port disponible (modifiez avec PORT=3003)
3. Permissions écriture dans /tmp (pour PDF)

## 📦 Scripts Disponibles

```bash
# Développement local
npm start

# Nettoyage + Réinstallation
npm run clean

# Test API
npm run test-api

# Démarrage avec port custom
PORT=3003 npm start
```

## ✨ Fonctionnalités Testées

- ✅ Interface utilisateur responsive
- ✅ Navigation entre classes et matières
- ✅ Sauvegarde des données (nécessite MongoDB)
- ✅ Export Excel/Word
- ✅ Import Excel
- ⚠️ Export PDF (nécessite ConvertAPI)

## 📧 Support Technique

En cas de problème :

1. **Vérifiez les logs** : Console navigateur + Terminal serveur
2. **Testez la config** : Visitez `/api/health`
3. **Vérifiez MongoDB** : Visitez `/api/test-mongo`
4. **Consultez README.md** : Instructions détaillées

Le site est maintenant **entièrement fonctionnel** avec une gestion d'erreur robuste et des diagnostics automatiques !