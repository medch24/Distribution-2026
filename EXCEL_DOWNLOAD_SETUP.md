# 📊 Configuration du Téléchargement Excel Hebdomadaire

## 🎯 Fonctionnalité

Cette fonctionnalité permet de télécharger un fichier Excel avec toutes les distributions d'une semaine spécifique pour une section complète (Maternelle, Primaire, Secondaire, ou Secondaire Garçons).

## ⚙️ Prérequis

### MongoDB Atlas (Obligatoire)

La fonctionnalité nécessite une base de données MongoDB pour fonctionner. Voici comment la configurer :

#### 1. Créer un compte MongoDB Atlas (Gratuit)

1. Aller sur [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Créer un compte gratuit
3. Créer un nouveau cluster (Free Tier M0)

#### 2. Configurer l'accès réseau

1. Dans MongoDB Atlas, aller dans "Network Access"
2. Cliquer sur "Add IP Address"
3. Sélectionner "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirmer

#### 3. Créer un utilisateur de base de données

1. Aller dans "Database Access"
2. Cliquer sur "Add New Database User"
3. Choisir "Password" comme méthode d'authentification
4. Créer un nom d'utilisateur et un mot de passe (noter ces informations)
5. Définir les privilèges sur "Read and write to any database"
6. Ajouter l'utilisateur

#### 4. Obtenir la chaîne de connexion

1. Aller dans "Database" → "Connect"
2. Choisir "Connect your application"
3. Copier la chaîne de connexion (Connection String)
4. Remplacer `<password>` par votre mot de passe
5. Remplacer `<dbname>` par le nom de votre base (ex: `distribution_2026`)

Exemple de chaîne de connexion :
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/distribution_2026?retryWrites=true&w=majority
```

### Variables d'Environnement

Créer ou modifier le fichier `.env` à la racine du projet :

```bash
# MongoDB Configuration (OBLIGATOIRE pour Excel Download)
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/distribution_2026?retryWrites=true&w=majority

# Autres configurations (optionnelles)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
CONVERTAPI_SECRET=your_convertapi_secret
```

### Déploiement sur Vercel

Si vous déployez sur Vercel :

1. Aller dans les paramètres du projet Vercel
2. Section "Environment Variables"
3. Ajouter la variable `MONGO_URL` avec votre chaîne de connexion
4. Redéployer le projet

## 📋 Format du Fichier Excel

Le fichier Excel généré contient les colonnes suivantes :

| Colonne | Description |
|---------|-------------|
| **Classe** | Nom de la classe (ex: PP1, PEI2-G) |
| **Matiere** | Nom de la matière (ex: Français, Maths) |
| **Séan.** | Numéro de séance (Séance 1, Séance 2, ...) |
| **Unité/Chapitre** | Unité ou chapitre étudié |
| **Contenu de la leçon** | Description du contenu de la leçon |
| **Ressources (Leçons)** | Ressources utilisées pour les leçons |
| **Devoir** | Devoirs assignés aux élèves |
| **Ressources (Devoirs)** | Ressources pour les devoirs |

### ℹ️ Notes sur les Séances

- Les séances sont numérotées séquentiellement par matière (Séance 1, Séance 2, Séance 3...)
- Le compteur redémarre à 1 pour chaque nouvelle matière
- Les séances sont triées par date dans l'ordre chronologique

### Style du fichier

- **En-tête** : Fond bleu, texte blanc, gras
- **Lignes alternées** : Gris clair pour améliorer la lisibilité
- **Bordures** : Toutes les cellules ont des bordures
- **Alignement** : Texte enveloppé (wrap) pour les cellules longues

## 🚀 Utilisation

1. Ouvrir l'application
2. Cliquer sur une section (ex: "Section Maternelle")
3. Dans la zone de téléchargement Excel, sélectionner une semaine
4. Cliquer sur "Télécharger Excel"
5. Le fichier sera téléchargé avec le nom : `Distribution_[Section]_[Semaine]_[Date].xlsx`

## 🐛 Dépannage

### Erreur : "La base de données n'est pas configurée"

**Solution** : Vérifier que la variable `MONGO_URL` est bien définie dans le fichier `.env` ou dans les variables d'environnement Vercel.

### Erreur : "Aucune donnée trouvée pour cette semaine"

**Causes possibles** :
1. La semaine sélectionnée n'a pas encore de données enregistrées
2. Les données n'ont pas été sauvegardées dans MongoDB
3. Les collections MongoDB sont vides

**Solution** : 
- Vérifier que des données ont été enregistrées via l'interface pour cette semaine
- Vérifier dans MongoDB Atlas que les collections existent et contiennent des données

### Timeout après 300 secondes

**Cause** : Trop de données à traiter ou connexion MongoDB lente

**Solutions** :
1. Vérifier que le cluster MongoDB est dans la même région que le serveur
2. Réduire le nombre de matières/classes avec des données
3. Optimiser les index MongoDB (créer un index sur `Semaine` et `type`)

### Erreur de connexion MongoDB

**Solutions** :
1. Vérifier que l'IP est autorisée (0.0.0.0/0)
2. Vérifier le nom d'utilisateur et le mot de passe
3. Vérifier que la chaîne de connexion est correcte
4. Tester la connexion via l'endpoint `/api/test-mongo`

## 📊 Structure MongoDB

Les données sont organisées comme suit :

```
Database: Classe_[NomClasse]
├── Collection: [Matière1]
│   └── Documents avec: Semaine, Date, type, Contenu de la leçon, etc.
├── Collection: [Matière2]
│   └── Documents avec: Semaine, Date, type, Contenu de la leçon, etc.
└── ...
```

Exemple :
```
Database: Classe_PP1
├── Français
├── Maths
├── Anglais
└── Sciences Naturelles
```

## 🔍 Vérification de l'Installation

Pour vérifier que MongoDB est bien configuré :

```bash
# Via curl
curl -X GET https://votre-domaine.vercel.app/api/test-mongo

# Via le navigateur
https://votre-domaine.vercel.app/api/test-mongo
```

Réponse attendue :
```json
{
  "status": "success",
  "info": { "ok": 1 }
}
```

## 📝 Notes

- La génération du fichier Excel peut prendre de 5 à 30 secondes selon la quantité de données
- Un fichier vide sera généré si aucune donnée n'existe pour la semaine sélectionnée
- Maximum 100 séances par matière pour éviter les problèmes de mémoire
- Le fichier est généré côté serveur (pas de limite de taille côté client)

## 🆘 Support

Pour toute question ou problème :
1. Vérifier les logs du serveur
2. Vérifier la console du navigateur (F12)
3. Tester l'endpoint `/api/health` pour voir la configuration
4. Ouvrir une issue sur GitHub avec les détails de l'erreur
