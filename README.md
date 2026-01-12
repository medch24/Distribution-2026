# 📚 Distribution Annuelle 2025-2026

> Application web pour la gestion des distributions pédagogiques annuelles par classe et matière

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/medch24/Distribution-2026)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 🎯 Fonctionnalités Principales

### ✅ Gestion Multi-Sections
- **Maternelle** : TPS, PS, MS, GS
- **Primaire** : PP1, PP2, PP3, PP4, PP5
- **Secondaire** : PEI1, PEI2, PEI3, PEI4, PEI5, DP1, DP2
- **🆕 Secondaire Garçons** : PEI1-G, PEI2-G, PEI3-G, PEI4-G, DP2-G

### 🤖 Intelligence Artificielle (Exclusif "Secondaire Garçons")
- Génération automatique de distributions via **Gemini 1.5 Flash**
- Analyse des sommaires de livres manuels et cahiers d'activités
- Planification intelligente sur 31 semaines
- Respect automatique du calendrier académique 2025-2026

### 📊 Règle de Gestion Automatique des Séances
Le système calcule automatiquement le nombre de séances par semaine en respectant :
- Nombre fixe de séances par matière et par classe
- **Réduction automatique** en cas de :
  - Jours fériés (Saudi National Day, Saudi Foundation Day)
  - Vacances scolaires
  - Évaluations
  - Examens
  - Orientation

**Exemple** : Si une matière a normalement 5 séances/semaine et qu'il y a 2 jours fériés, le système génère automatiquement **3 séances**.

### 💾 Import/Export
- **Import** : Excel (.xlsx), Word (.docx)
- **Export** : Excel, Word, PDF
- Export individuel ou par classe complète
- **🆕 Export Hebdomadaire Excel** : Télécharger toutes les distributions d'une semaine par section

### 📊 Téléchargement Excel Hebdomadaire (NOUVEAU)
- **Sélection par Section** : Choisir Maternelle, Primaire, Secondaire, ou Secondaire Garçons
- **Sélection de Semaine** : 31 semaines disponibles (Semaine 1 à 31)
- **Format Structuré** : Classe | Matiere | Séan. | Unité/Chapitre | Contenu de la leçon | Ressources (Leçons) | Devoir | Ressources (Devoirs)
- **Numérotation Automatique** : Séances numérotées séquentiellement (Séance 1, 2, 3...)
- **Fichier Professionnel** : En-têtes colorés, lignes alternées, bordures
- **Une Section à la Fois** : Génération optimisée par section pour éviter les timeouts
- **Barre de Progression** : Suivi en temps réel avec pourcentage (10% → 100%)

> 📖 **Configuration requise** : MongoDB Atlas (gratuit)  
> 📄 Voir [EXCEL_DOWNLOAD_SETUP.md](./EXCEL_DOWNLOAD_SETUP.md) pour les instructions complètes

### 🎨 Design Moderne
- Interface responsive (mobile, tablette, desktop)
- Animations CSS (fadeIn, slideIn, pulse)
- Codes couleur par section
- Logo arrondi et design professionnel

### ⚡ Temps Réel
- Server-Sent Events (SSE)
- Affichage des utilisateurs actifs
- Notifications instantanées
- Sauvegarde automatique

---

## 🚀 Installation

### Prérequis
- Node.js >= 18.0.0
- MongoDB (local ou Atlas)
- Clé API Gemini (gratuite)

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/medch24/Distribution-2026.git
cd Distribution-2026

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# 4. Démarrer le serveur
npm start

# 5. Ouvrir dans le navigateur
# http://localhost:3000
```

---

## 🔑 Configuration (.env)

```bash
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Gemini AI (REQUIS pour la section Garçons)
GEMINI_API_KEY=your_gemini_api_key_here

# Optionnel
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
CONVERTAPI_SECRET=your_convertapi_secret
```

**Obtenir une clé Gemini gratuite** :  
👉 [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

---

## 📖 Utilisation

### Sections Maternelle, Primaire, Secondaire (Remplissage Manuel)

1. Sélectionner une section
2. Choisir une classe
3. Sélectionner une matière
4. Le tableau se charge automatiquement
5. Remplir les cellules manuellement
6. Les données se sauvegardent automatiquement

### Section "Secondaire Garçons" (IA Disponible)

#### Option A : Remplissage Manuel
- Même processus que les autres sections

#### Option B : Génération Automatique avec IA
1. Sélectionner une classe garçons (PEI1-G à DP2-G)
2. Choisir une matière
3. Copier-coller le **sommaire du livre manuel**
4. Copier-coller le **sommaire du cahier d'activité**
5. Cliquer sur **"Générer Distribution Automatique"**
6. Attendre 10-30 secondes
7. Le tableau se remplit automatiquement sur 31 semaines
8. Vérifier et ajuster si nécessaire
9. Sauvegarder

---

## 📅 Calendrier Académique 2025-2026

- **31 semaines d'enseignement**
- Début : 31 août 2025 (Orientation)
- Fin : Juin 2026
- Total : 210 entrées calendaires

**Jours spéciaux inclus** :
- Orientation (Semaine 1)
- Saudi National Day (23 septembre 2025)
- Saudi Foundation Day
- Évaluations continues
- Examens finaux
- Périodes de vacances

---

## 🛠️ Technologies

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- XLSX.js, FileSaver.js
- PizZip, docxtemplater
- JSZip
- Remixicon

### Backend
- Node.js 18+
- Express.js 4.21.2
- MongoDB
- Server-Sent Events (SSE)

### APIs IA
- **Gemini 1.5 Flash** (Google)
- OpenAI (optionnel)
- Groq (optionnel)

---

## 📊 Structure du Projet

```
Distribution-2026/
├── api/
│   └── index.js           # Backend Express + MongoDB
├── public/
│   ├── index.html         # Interface utilisateur
│   ├── script.js          # Logique client
│   └── styles.css         # Styles CSS
├── package.json           # Dépendances npm
├── start.js               # Serveur de démarrage
├── .env.example           # Template configuration
├── vercel.json            # Config Vercel
├── README.md              # Ce fichier
└── DOCUMENTATION_FINALE.md # Documentation complète
```

---

## 🎓 Matières Supportées

### Maternelle (TPS, PS, MS, GS)
Français, Maths, Sciences, ART, Éducation physique, Montessori, Musique, Bibliothèque

### Primaire (PP1-PP5)
Français, Maths, Anglais, French second language, Informatique, Sciences Naturelles, Sciences Humaines, ART, Éducation physique, Montessori, Musique, Bibliothèque

### Secondaire (PEI1-PEI5, DP1-DP2)
Langue et littérature, Maths, Sciences, Anglais, French second language, Design, Individus et Sociétés, ART, Éducation physique, Musique, Bibliothèque, Biologie, Physique-chimie

---

## 🐛 Débogage

### Le site s'actualise automatiquement
✅ **Corrigé** : La fonction `location.reload()` a été remplacée par des notifications

### Erreur "showClasses is not defined"
✅ **Corrigé** : Script inline dupliqué supprimé

### SSE Timeout sur Vercel
✅ **Corrigé** : Keepalive toutes les 30s + auto-fermeture après 5 min

---

## 📈 Roadmap

- [ ] Support multi-langues (FR, EN, AR)
- [ ] Thème sombre/clair
- [ ] Export vers Google Classroom
- [ ] Notifications email
- [ ] Gestion des utilisateurs et permissions
- [ ] Historique des modifications
- [ ] Comparaison de versions

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Changelog

### Version 2.1.1 (12 janvier 2026)
- ✅ **Correction format Excel** : Format conforme aux exigences
- ✅ Colonnes: Classe, Matiere, Séan., Unité/Chapitre, Contenu de la leçon, Ressources (Leçons), Devoir, Ressources (Devoirs)
- ✅ Numérotation séquentielle des séances par matière
- ✅ Tri chronologique des séances par date
- ✅ Colonnes Devoir et Ressources séparées (non fusionnées)

### Version 2.1.0 (12 janvier 2026)
- ✅ **NOUVEAU** : Téléchargement Excel hebdomadaire par section
- ✅ Sélection de semaine intégrée dans chaque section
- ✅ Format Excel professionnel (en-têtes, couleurs, bordures)
- ✅ Barre de progression avec pourcentage (10% → 100%)
- ✅ Optimisation MongoDB (requêtes filtrées, limit 100)
- ✅ Gestion d'erreurs améliorée avec logs détaillés
- ✅ Documentation complète de configuration
- ✅ Support ExcelJS pour génération avancée

### Version 2.0.0 (25 décembre 2025)
- ✅ Correction de l'actualisation automatique
- ✅ Ajout de la section "Secondaire Garçons"
- ✅ Intégration IA Gemini (exclusif Garçons)
- ✅ Règle de gestion des séances automatique
- ✅ Design moderne et responsive
- ✅ Logo arrondi
- ✅ Colonnes de tableau optimisées
- ✅ 1000 lignes de code en moins (optimisation)

### Version 1.0.0
- 🎉 Première version fonctionnelle

---

## 📞 Support

**Problèmes ou questions ?**
- 📧 Ouvrir une [Issue sur GitHub](https://github.com/medch24/Distribution-2026/issues)
- 💬 Consulter la [Documentation Complète](./DOCUMENTATION_FINALE.md)

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👏 Remerciements

- **Google Gemini AI** pour l'API gratuite
- **MongoDB Atlas** pour l'hébergement de base de données
- **Vercel** pour le déploiement
- Tous les contributeurs et testeurs

---

**Développé avec ❤️ pour l'éducation**

[![GitHub Stars](https://img.shields.io/github/stars/medch24/Distribution-2026?style=social)](https://github.com/medch24/Distribution-2026)
[![GitHub Forks](https://img.shields.io/github/forks/medch24/Distribution-2026?style=social)](https://github.com/medch24/Distribution-2026/fork)
