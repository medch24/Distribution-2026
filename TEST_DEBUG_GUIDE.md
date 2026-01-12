# 🔍 Guide de Test et Débogage - Export Excel

## 🎯 Corrections Appliquées

Le système a été corrigé pour détecter les données existantes avec plusieurs stratégies :

### Stratégie 1 : Recherche avec 'Semaine'
```javascript
collection.find({ 'Semaine': 'Semaine 19' })
```

### Stratégie 2 : Recherche avec 'Sem.'
```javascript
collection.find({ 'Sem.': 'Semaine 19' })
```

### Stratégie 3 : Filtrage Manuel
- Charge les 200 premières entrées
- Filtre manuellement par semaine
- Affiche des échantillons dans les logs

## 📊 Comment Vérifier les Logs

### Sur Vercel

1. Aller sur https://vercel.com/votre-projet
2. Cliquer sur "Deployments" → Dernier déploiement
3. Cliquer sur "View Function Logs"
4. Filtrer par fonction : `/api/downloadWeeklyExcel`

### Logs à Rechercher

Vous devriez voir des messages comme :

```
[downloadWeeklyExcel] Request received: { week: 'Semaine 19', section: 'secondaire' }
[downloadWeeklyExcel] Processing 7 classes for week Semaine 19
[downloadWeeklyExcel] Sample data for PEI1-Français: [{ ... }]
[downloadWeeklyExcel] Found 5 sessions for PEI1 - Français
[downloadWeeklyExcel] Processed 7 classes, 3 with data, 15 total rows
```

## 🧪 Test Étape par Étape

### Étape 1 : Vérifier qu'une classe a des données

1. Ouvrir l'application
2. Aller dans **Section Secondaire**
3. Sélectionner **Classe PEI1**
4. Sélectionner **Matière "Français"**
5. Regarder le tableau → **Y a-t-il des données pour la Semaine 19 ?**

#### ✅ Si OUI :
- Noter les données visibles (ex: "Orientation" dans plusieurs cellules)
- Ces données devraient être exportables

#### ❌ Si NON :
- Remplir au moins une ligne pour la Semaine 19
- Cliquer sur **"Enregistrer"**
- Attendre la confirmation

### Étape 2 : Tester l'export Excel

1. Retourner à l'écran d'accueil
2. Cliquer sur **"Section Secondaire"**
3. Sélectionner **"Semaine 19"**
4. Cliquer sur **"Télécharger Excel"**

### Étape 3 : Observer la Barre de Progression

#### Progression Normale :
```
10% - Connexion au serveur...
30% - Récupération des données...
60% - Génération du fichier Excel...
90% - Préparation du téléchargement...
100% - Téléchargement terminé!
```

#### En Cas d'Erreur :
L'erreur affichera maintenant :
```
❌ Erreur lors de la génération du fichier Excel:

Aucune donnée trouvée pour Semaine 19 (section secondaire)

📊 Détails du traitement:
• Classes traitées: 7
• Classes avec données: 0
• MongoDB configuré: ✅ Oui

⚠️ Aucune donnée trouvée pour "Semaine 19".
```

## 🔧 Débogage Avancé

### Vérifier le Format des Données dans MongoDB

#### Option 1 : Via MongoDB Atlas

1. Se connecter à MongoDB Atlas
2. Aller dans "Browse Collections"
3. Sélectionner : `Classe_PEI1` → Collection `Français`
4. Chercher un document et vérifier les champs :

```javascript
{
  "_id": ObjectId("..."),
  "Mois": "Septembre",
  "Sem.": "Semaine 19",  // ← Vérifier ce champ
  "Séan.": 1,
  "Unité/Chapitre": "...",
  "Contenu de la leçon": "...",
  "Ressources (Leçons)": "...",
  "Devoir": "...",
  "Ressources (Devoirs)": "...",
  "Recherche": "...",
  "Projets": "..."
}
```

#### Option 2 : Via Console Navigateur

Ouvrir la console (F12) et exécuter :

```javascript
// Tester l'API avec logs détaillés
fetch('/api/downloadWeeklyExcel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    week: 'Semaine 1',  // Tester avec Semaine 1 d'abord
    section: 'secondaire' 
  })
})
.then(async r => {
  if (!r.ok) {
    const err = await r.json();
    console.error('Erreur:', err);
  } else {
    const blob = await r.blob();
    console.log('Succès! Taille du fichier:', blob.size, 'bytes');
  }
})
.catch(e => console.error('Erreur réseau:', e));
```

### Vérifier les Noms de Champs

Le système cherche maintenant ces variantes :

| Champ Recherché | Variantes Testées |
|----------------|-------------------|
| Semaine | `'Semaine'`, `'Sem.'` |
| Séance | `'Séan.'`, `'Seance'`, `'Séance'` |
| Ressources Leçons | `'Ressources (Leçons)'`, `'Ressources pour les leçons'` |
| Ressources Devoirs | `'Ressources (Devoirs)'`, `'Ressources pour les devoirs'` |

## 📋 Checklist de Débogage

### ✅ À Vérifier

- [ ] MongoDB est configuré (variable `MONGO_URL` dans Vercel)
- [ ] Des données existent dans l'interface pour la semaine testée
- [ ] Le nom de la semaine correspond exactement (ex: "Semaine 19")
- [ ] Les classes de la section ont bien des matières assignées
- [ ] Les logs Vercel sont accessibles

### 🔍 Si Aucune Donnée Trouvée

1. **Vérifier dans l'interface** : Y a-t-il vraiment des données ?
2. **Tester une autre semaine** : Essayer "Semaine 1" ou "Semaine 2"
3. **Vérifier les logs** : Que dit le message "Sample data" ?
4. **Regarder MongoDB Atlas** : Les champs correspondent-ils ?

### 📝 Informations à Fournir pour Support

Si le problème persiste, fournir :

1. **Logs Vercel complets** (copier-coller)
2. **Capture d'écran** de l'interface avec données visibles
3. **Nom exact** de la semaine testée
4. **Section et classe** testées
5. **Échantillon MongoDB** (screenshot d'un document)

## 🎯 Résultat Attendu

Une fois les données détectées, le fichier Excel contiendra :

```
Classe | Matiere | Séan. | Unité/Chapitre | Contenu de la leçon | Ressources (Leçons) | Devoir | Ressources (Devoirs)
-------|---------|-------|----------------|---------------------|---------------------|--------|---------------------
PEI1   | Français| 1     | Orientation    | ...                 | ...                 | ...    | ...
PEI1   | Français| 2     | Orientation    | ...                 | ...                 | ...    | ...
...
```

## 💡 Conseils

- **Commencer simple** : Tester d'abord avec la Semaine 1
- **Une section à la fois** : Ne pas tester toutes les sections en même temps
- **Vérifier les logs** : Les logs indiquent exactement ce qui est trouvé
- **Patience** : La génération peut prendre 10-30 secondes

---

**Mise à jour** : 12 janvier 2026  
**Version** : 2.1.2
