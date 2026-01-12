# 🔧 Dépannage : Téléchargement Excel Impossible

## 🚨 Symptômes Observés

D'après les logs et captures d'écran :

```
Erreur: Aucune donnée trouvée pour Semaine 19 (section secondaire)

Détails:
- Classes traitées: 7
- Classes avec données: 0  ← PROBLÈME ICI
- MongoDB configuré: Oui
```

## 🎯 Diagnostic

### ✅ Ce qui fonctionne :
1. ✅ **MongoDB est configuré** (connexion OK)
2. ✅ **Les 7 classes ont été traitées** (PEI1, PEI2, PEI3, PEI4, PEI5, DP1, DP2)
3. ✅ **L'endpoint API est accessible** (pas d'erreur 404)
4. ✅ **Le serveur répond** (statut 404 = réponse valide)

### ❌ Le problème :
**AUCUNE DONNÉE n'a été trouvée dans MongoDB pour la Semaine 19**

Cela signifie que :
- Les collections existent
- Mais elles sont **vides** ou ne contiennent pas de données pour "Semaine 19"
- Aucune classe n'a de distributions enregistrées pour cette semaine

## 🔍 Vérifications à Effectuer

### 1. Vérifier si des données existent dans MongoDB

#### Via MongoDB Atlas :
1. Se connecter à MongoDB Atlas
2. Aller dans "Browse Collections"
3. Sélectionner une base de données de classe (ex: `Classe_PEI1`)
4. Vérifier les collections (une par matière)
5. Regarder les documents et chercher le champ `Semaine`

#### Via l'API :
```bash
# Tester la connexion MongoDB
curl https://votre-site.vercel.app/api/test-mongo

# Devrait retourner:
{
  "status": "success",
  "info": { "ok": 1 }
}
```

### 2. Vérifier le format des données

Les données dans MongoDB doivent avoir ce format :

```javascript
{
  "_id": ObjectId("..."),
  "Mois": "Septembre",
  "Semaine": "Semaine 19",  // ← Doit correspondre exactement
  "Date": "01/09/2025",
  "Jour": "Lundi",
  "type": "Cours",  // ← Doit être "Cours" exactement
  "Unité/Chapitre": "Chapitre 1",
  "Contenu de la leçon": "Introduction",
  "Ressources pour les leçons": "Livre page 5",
  "Devoir": "Exercices 1-3",
  "Ressources pour les devoirs": "Cahier page 2",
  "Recherche": "",
  "Projets": ""
}
```

### 3. Points critiques à vérifier

| Champ | Valeur Attendue | Problème Possible |
|-------|-----------------|-------------------|
| `Semaine` | "Semaine 19" | Typo: "semaine 19", "S19", "Semaine19" |
| `type` | "Cours" | "cours", "COURS", "Classe" |
| Nom de collection | Nom exact de matière | "Mathematiques" vs "Maths" |

## 🛠️ Solutions

### Solution 1 : Enregistrer des données via l'interface

1. Ouvrir l'application
2. Aller dans **Section Secondaire**
3. Choisir une classe (ex: PEI1)
4. Sélectionner une matière (ex: Français)
5. **Remplir le tableau** pour la Semaine 19
6. Cliquer sur **"Enregistrer"**
7. Répéter pour chaque classe et matière

### Solution 2 : Vérifier les données existantes

#### A. Choisir une semaine avec des données

Si d'autres semaines ont des données :
1. Essayer avec **Semaine 1**, **Semaine 2**, etc.
2. Regarder dans l'interface quelle semaine a du contenu
3. Télécharger cette semaine-là

#### B. Vérifier dans MongoDB Atlas

1. Se connecter à MongoDB Atlas
2. Aller dans "Browse Collections"
3. Chercher dans n'importe quelle collection
4. Filtrer les documents avec un filtre :
   ```json
   { "Semaine": { "$exists": true } }
   ```
5. Voir quelles semaines ont réellement des données

### Solution 3 : Importer des données

Si vous avez des fichiers Excel existants :

1. Utiliser le bouton **"Importer Excel"** dans l'interface
2. Sélectionner votre fichier Excel
3. Le système importera les données dans MongoDB
4. Puis télécharger via le nouveau bouton

## 🎬 Procédure de Test Complète

### Étape 1 : Vérifier la configuration
```bash
curl https://votre-site.vercel.app/api/health
```

Résultat attendu :
```json
{
  "status": "ok",
  "environment": {
    "mongodb_configured": true  ← Doit être true
  }
}
```

### Étape 2 : Enregistrer des données de test

1. Ouvrir l'application
2. Section Secondaire → Classe PEI1 → Matière "Français"
3. Trouver la ligne de la "Semaine 19"
4. Remplir au moins une cellule (ex: "Contenu de la leçon")
5. Cliquer sur **"Enregistrer"**
6. Attendre le message de confirmation

### Étape 3 : Télécharger l'Excel

1. Retourner sur l'écran des sections
2. Cliquer sur **"Section Secondaire"**
3. Sélectionner **"Semaine 19"**
4. Cliquer sur **"Télécharger Excel"**
5. Observer la barre de progression

### Résultats attendus :

#### ✅ Si des données existent :
```
10% - Connexion au serveur...
30% - Récupération des données...
60% - Génération du fichier Excel...
90% - Préparation du téléchargement...
100% - Téléchargement terminé!

✅ Fichier Excel téléchargé avec succès!
📁 Distribution_Secondaire_Semaine_19_2026-01-12.xlsx
```

#### ❌ Si aucune donnée :
```
❌ Erreur lors de la génération du fichier Excel:

Erreur du serveur: 404

📊 Détails du traitement:
• Classes traitées: 7
• Classes avec données: 0
• MongoDB configuré: ✅ Oui

⚠️ Aucune donnée trouvée pour "Semaine 19".
Veuillez d'abord enregistrer des distributions pour cette semaine.
```

## 📝 Notes Importantes

### Format de la Semaine
Le système recherche **exactement** : `"Semaine 19"`
- ✅ Correct : "Semaine 19"
- ❌ Incorrect : "semaine 19", "S19", "Semaine19", "Semaine 19 "

### Type de Jour
Le système filtre sur : `type: "Cours"`
- ✅ Correct : "Cours"
- ❌ Incorrect : "cours", "COURS", "Classe", "Leçon"

### Noms de Matières
Les noms doivent correspondre exactement aux collections MongoDB :
```javascript
Section Secondaire:
['Langue et littérature', 'Maths', 'Biologie', 'Physique-chimie', 
 'Anglais', 'Design', 'Individus et Sociétés', 'Éducation physique', 
 'Musique', 'Bibliothèque', 'ART']
```

## 🆘 Besoin d'Aide ?

### Informations à fournir :

1. **Logs du serveur** (depuis Vercel ou console)
2. **Logs de la console navigateur** (F12 → Console)
3. **Capture d'écran** de l'erreur complète
4. **Confirmation** :
   - MongoDB est configuré ? (voir `/api/health`)
   - Des données existent ? (tester avec une autre semaine)
   - Quelle section/classe/semaine testée ?

### Vérification Rapide

Copier-coller ce script dans la console du navigateur (F12) :

```javascript
// Test rapide de l'API
fetch('/api/downloadWeeklyExcel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ week: 'Semaine 1', section: 'secondaire' })
})
.then(r => r.json())
.then(d => console.log('Résultat:', d))
.catch(e => console.error('Erreur:', e));
```

Regarder le résultat dans la console.

## 🎯 Résumé

**Le système fonctionne correctement.**

Le problème actuel est simplement qu'**aucune donnée n'a été enregistrée** dans MongoDB pour la Semaine 19 de la section Secondaire.

**Solution** : Enregistrer au moins une distribution pour cette semaine via l'interface, puis réessayer le téléchargement Excel.
