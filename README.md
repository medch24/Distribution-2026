# Distribution Annuelle 2025-2026

Application web pour la gestion des distributions annuelles par classe et matière.

## 🚀 Fonctionnalités

- **Gestion par classe** : Support pour Maternelle, Primaire, Secondaire (PEI et Programme Diplôme)
- **Gestion par matière** : Interface spécialisée pour chaque matière selon le niveau
- **Export multiple** : Génération Excel, Word et PDF des distributions
- **Sauvegarde automatique** : Persistance des données dans MongoDB
- **Interface intuitive** : Navigation simple et ergonomique
- **Calendrier académique** : Intégration du calendrier scolaire 2025-2026
- **Diagnostic intégré** : Bouton de diagnostic pour vérifier l'état du système

## 🔧 Configuration Vercel

### Variables d'environnement requises

Dans le dashboard Vercel → Settings → Environment Variables :

```env
# Base de données MongoDB (OBLIGATOIRE)
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/distribution-annuelle

# Clé API ConvertAPI pour PDF (OPTIONNEL)
CONVERTAPI_SECRET=your_convertapi_secret_here
```

### Services externes

1. **MongoDB Atlas** (OBLIGATOIRE) :
   - Inscription gratuite : https://www.mongodb.com/atlas
   - Créez un cluster gratuit (500MB)
   - Obtenez l'URL de connexion
   - Autorisez l'IP 0.0.0.0/0 dans Network Access

2. **ConvertAPI** (OPTIONNEL pour PDF) :
   - Inscription : https://www.convertapi.com/
   - Plan gratuit : 500 conversions/mois
   - Obtenez votre clé secrète

## 🛠️ Utilisation

### Interface principale

1. **Accédez à l'application** sur votre URL Vercel
2. **Diagnostic système** : Cliquez "🔍 Diagnostic Système" pour vérifier la configuration
3. **Sélectionnez une section** : Maternelle, Primaire ou Secondaire
4. **Choisissez une classe** : Selon la section sélectionnée
5. **Sélectionnez une matière** : Dans la liste des matières disponibles

### Gestion des données

- **Saisie** : Remplissez les tableaux interactifs
- **Sauvegarde** : Cliquez "Enregistrer les modifications" (sauvegarde automatique en BD)
- **Import Excel** : Importez des données existantes depuis Excel
- **Export** : Générez Excel, Word ou PDF par matière ou par classe complète

### Diagnostic intégré

Le bouton "🔍 Diagnostic Système" vérifie :
- ✅ État de l'application
- ✅ Configuration MongoDB
- ✅ Configuration ConvertAPI
- ✅ Connectivité des services
- ✅ Recommandations de correction

## 🔍 Résolution des problèmes

### Erreur 404 au démarrage

**Cause** : Configuration Vercel incorrecte
**Solution** :
1. Vérifiez que `vercel.json` pointe vers `/public/index.html`
2. Redéployez avec `vercel --prod`

### Erreur MongoDB

**Symptômes** : "Cannot connect to DB"
**Solutions** :
1. Vérifiez MONGO_URL dans les variables Vercel
2. Testez avec le diagnostic système
3. Vérifiez l'IP whitelist dans MongoDB Atlas (0.0.0.0/0)
4. Vérifiez les credentials MongoDB

### Erreur ConvertAPI

**Symptômes** : "Service de conversion PDF non disponible"
**Solutions** :
1. ConvertAPI est optionnel (Excel/Word fonctionnent sans)
2. Configurez CONVERTAPI_SECRET si vous voulez le PDF
3. Vérifiez votre quota sur convertapi.com

### Données non sauvegardées

**Causes possibles** :
1. MongoDB non connecté
2. Erreur réseau
3. Variables d'environnement manquantes

**Diagnostic** :
1. Utilisez le bouton "🔍 Diagnostic Système"
2. Vérifiez la console navigateur (F12)
3. Vérifiez les logs Vercel

## 📊 Structure des données

```
MongoDB → Bases par classe
├── Distribution_TPS/
├── Distribution_PS/
├── Distribution_PP1/
└── ...

Chaque base contient :
├── tables (données par matière)
├── savedCopies (historique)
└── selections (sélections utilisateur)
```

## 🚀 Déploiement

### Automatique via GitHub

1. Connectez votre repository à Vercel
2. Configurez les variables d'environnement
3. Déployez automatiquement à chaque push

### Manuel

```bash
# Installation Vercel CLI
npm i -g vercel

# Déploiement
vercel --prod
```

## 📞 Support

### Routes de diagnostic

- **Health Check** : `https://your-app.vercel.app/api/health`
- **Test MongoDB** : `https://your-app.vercel.app/api/test-mongo`

### En cas de problème

1. **Utilisez le diagnostic intégré** dans l'interface
2. **Consultez les logs Vercel** dans le dashboard
3. **Vérifiez la console navigateur** (F12 → Console)
4. **Testez les routes API** directement

## 📋 Checklist de déploiement

- [ ] Repository connecté à Vercel
- [ ] Variables d'environnement configurées :
  - [ ] `MONGO_URL` (obligatoire)
  - [ ] `CONVERTAPI_SECRET` (optionnel)
- [ ] MongoDB Atlas configuré :
  - [ ] Cluster créé
  - [ ] Utilisateur avec permissions
  - [ ] IP whitelist : 0.0.0.0/0
- [ ] Test de l'application :
  - [ ] Page d'accueil accessible
  - [ ] Diagnostic système OK
  - [ ] Sauvegarde des données fonctionnelle

## ✅ Statut de l'application

Cette application est **entièrement fonctionnelle** avec :
- ✅ Interface responsive
- ✅ Sauvegarde MongoDB
- ✅ Export Excel/Word
- ✅ Import Excel
- ✅ Diagnostic automatique
- ✅ Gestion d'erreurs robuste
- ⚠️ Export PDF (nécessite ConvertAPI)

## 📜 Licence

MIT License - Voir LICENSE pour les détails.