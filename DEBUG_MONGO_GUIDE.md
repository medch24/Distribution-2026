# 🔍 Guide de Débogage MongoDB - Export Excel

## 🎯 Objectif

Ce guide vous aide à **diagnostiquer précisément** pourquoi les données ne sont pas trouvées lors de l'export Excel, même quand elles existent dans l'interface.

---

## 🛠️ Outils de Débogage Ajoutés

### 1. Fonction JavaScript `debugMongoData()`

Une fonction accessible depuis la console du navigateur pour inspecter MongoDB.

### 2. Endpoint API `/debugMongoData`

Un endpoint backend qui affiche la structure exacte des données MongoDB.

### 3. Logs Détaillés

Des logs améliorés qui affichent des échantillons de données et tous les champs disponibles.

---

## 📋 Comment Utiliser

### Étape 1 : Ouvrir l'Application

1. Ouvrir votre site : `https://votre-site.vercel.app` ou `http://localhost:3000`
2. Ouvrir les **Outils de Développement** du navigateur :
   - **Chrome/Edge** : `F12` ou `Ctrl+Shift+I`
   - **Firefox** : `F12` ou `Ctrl+Shift+K`
   - **Safari** : `Cmd+Option+I`

### Étape 2 : Aller dans la Console

1. Cliquer sur l'onglet **"Console"** dans les outils de développement
2. Vous devriez voir une zone où taper du code JavaScript

### Étape 3 : Exécuter le Débogage

Dans la console, taper :

```javascript
debugMongoData('PEI3', 'Physique')
```

**Remplacez** :
- `'PEI3'` par votre classe (ex: `'PEI1'`, `'MS'`, `'PP3'`, `'PEI1-G'`, etc.)
- `'Physique'` par votre matière (ex: `'Français'`, `'Maths'`, `'Langue et littérature'`, etc.)

### Étape 4 : Analyser les Résultats

La console affichera quelque chose comme :

```javascript
[DEBUG] Checking MongoDB for PEI3 - Physique
[DEBUG] MongoDB Result: {
  found: true,
  className: "PEI3",
  subject: "Physique",
  totalRows: 155,
  sampleRows: [
    {
      Mois: "Févr.",
      Sem.: "S19",
      Séan.: "1",
      "Unité/Chapitre": "Chapitre 10 Angles et parallélisme-Triangles",
      "Contenu de la leçon": "Consolidation et spécification des acquis anterieurs!",
      "Ressources (Leçons)": "",
      Devoir: "Devoirs: Exercices 26-27-30 plus",
      "Ressources (Devoirs)": "Ressources: 10-11-12-13-14; 08-09 cahier",
      Recherche: "",
      Projets: ""
    },
    // ... autres lignes
  ],
  weekFields: {
    Semaine: undefined,
    "Sem.": "S19",
    week: undefined,
    allFields: [
      "Mois",
      "Sem.",
      "Séan.",
      "Unité/Chapitre",
      "Contenu de la leçon",
      "Ressources (Leçons)",
      "Devoir",
      "Ressources (Devoirs)",
      "Recherche",
      "Projets"
    ]
  }
}
```

---

## 🔍 Analyser les Résultats

### ✅ Si `found: true`

**Bonne nouvelle !** Les données existent dans MongoDB.

#### Vérifier le Champ Semaine

Regarder `weekFields` :

```javascript
weekFields: {
  Semaine: undefined,        // ❌ Pas utilisé
  "Sem.": "S19",            // ✅ Utilisé avec format "S19"
  week: undefined,           // ❌ Pas utilisé
  allFields: [...]           // Liste de tous les champs
}
```

**Dans cet exemple** :
- Le champ s'appelle `"Sem."` (et non `"Semaine"`)
- Le format est `"S19"` (et non `"Semaine 19"`)

#### Problème Potentiel

Si vous essayez de télécharger avec `"Semaine 19"` mais que MongoDB contient `"S19"`, le filtre ne trouvera rien !

### ❌ Si `found: false`

Les données ne sont PAS dans MongoDB. Possibilités :

1. **Données pas enregistrées** : Cliquer sur "💾 Enregistrer" après avoir rempli le tableau
2. **Mauvais nom de classe** : Vérifier l'orthographe exacte (majuscules, tirets, etc.)
3. **Mauvais nom de matière** : Vérifier l'orthographe exacte de la matière

---

## 🔧 Corrections Possibles

### Problème 1 : Format de Semaine Différent

**Symptôme** : `weekFields` montre `"Sem.": "S19"` mais vous cherchez `"Semaine 19"`

**Solution** : Le code a été mis à jour pour gérer :
- `"Semaine 19"` → Cherche aussi `"19"` dans les champs
- `"S19"` → Match avec le numéro `19`

**Mais si ça ne marche toujours pas**, vérifier dans le code backend :

```javascript
// Dans api/index.js, ligne ~620
const weekNum = week.match(/\d+/);  // Extrait "19" de "Semaine 19"
if (weekNum && semaine.includes(weekNum[0])) return true;  // Match "S19"
```

### Problème 2 : Champ Manquant

**Symptôme** : `allFields` ne contient ni `"Semaine"` ni `"Sem."`

**Solution** : Les données ne contiennent pas de champ semaine. Il faut :
1. Réenregistrer les données depuis l'interface
2. Ou ajouter un champ alternatif (ex: utiliser `"Mois"` pour filtrer)

### Problème 3 : Données Vides

**Symptôme** : `totalRows: 0` ou `sampleRows: []`

**Solution** : Aucune donnée enregistrée pour cette classe/matière.
1. Aller dans l'interface
2. Sélectionner la classe et la matière
3. Remplir le tableau
4. Cliquer sur "💾 Enregistrer"

---

## 🧪 Tests Recommandés

### Test 1 : Vérifier Toutes Les Classes

```javascript
// Maternelle
debugMongoData('TPS', 'Français');
debugMongoData('MS', 'Maths');

// Primaire
debugMongoData('PP1', 'Sciences Naturelles');
debugMongoData('PP3', 'Anglais');

// Secondaire
debugMongoData('PEI1', 'Langue et littérature');
debugMongoData('PEI3', 'Physique-chimie');
debugMongoData('DP1', 'Biologie');

// Secondaire Garçons
debugMongoData('PEI1-G', 'Maths');
debugMongoData('DP2-G', 'Anglais');
```

### Test 2 : Vérifier Les Formats de Semaine

Pour chaque classe, regarder le format du champ semaine :

```javascript
const result = await debugMongoData('PEI3', 'Physique');
console.log('Format semaine:', result.weekFields['Sem.'] || result.weekFields['Semaine']);
// Résultat possible: "S19", "Semaine 19", "19", etc.
```

### Test 3 : Compter Les Lignes par Semaine

```javascript
const result = await debugMongoData('PEI1', 'Français');
if (result.found) {
  const week19 = result.sampleRows.filter(row => 
    (row['Sem.'] && row['Sem.'].includes('19')) || 
    (row['Semaine'] && row['Semaine'].includes('19'))
  );
  console.log(`Lignes pour semaine 19: ${week19.length}`);
}
```

---

## 📊 Logs Backend

Quand vous téléchargez l'Excel, le serveur affiche maintenant des logs détaillés :

```
[downloadWeeklyExcel] Request received: { week: 'Semaine 19', section: 'secondaire' }
[downloadWeeklyExcel] Processing 7 classes for week Semaine 19
[downloadWeeklyExcel] Found table for PEI1 - Français with 155 rows
[downloadWeeklyExcel] Sample row: {
  "Mois": "Févr.",
  "Sem.": "S19",
  "Séan.": "1",
  "Unité/Chapitre": "Chapitre 1",
  "Contenu de la leçon": "Introduction...",
  ...
}
[downloadWeeklyExcel] Week fields in sample: {
  Semaine: undefined,
  "Sem.": "S19",
  week: undefined
}
[downloadWeeklyExcel] Filtered 5 rows for PEI1 - Français - Semaine 19
```

**Où voir ces logs** :

### En Local
```bash
cd /home/user/webapp
npm start
# Les logs s'affichent dans le terminal
```

### Sur Vercel
1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner votre projet
3. Onglet "Deployments"
4. Cliquer sur le dernier déploiement
5. Onglet "Logs" ou "Function Logs"

---

## 🎯 Scénarios de Résolution

### Scénario A : Format "S19" vs "Semaine 19"

**Problème** : Les données utilisent `"Sem.": "S19"` mais on cherche `"Semaine 19"`

**Solution** : Le code extrait maintenant le numéro et cherche aussi `"19"` :

```javascript
const weekNum = week.match(/\d+/);  // Extrait "19"
if (weekNum && semaine.includes(weekNum[0])) return true;  // Match "S19"
```

**Test** : Télécharger Excel → Devrait fonctionner

### Scénario B : Pas de Champ Semaine

**Problème** : `allFields` ne contient ni `"Semaine"` ni `"Sem."`

**Solution Alternative 1** : Utiliser le mois pour filtrer

```javascript
// Modifier le code backend pour filtrer par mois si semaine absente
const data = tableDoc.data.filter(row => {
  // Si pas de semaine, filtrer par mois
  if (!row['Semaine'] && !row['Sem.']) {
    return row['Mois'] === 'Févr.';  // Exemple pour février
  }
  // Sinon, filtrer normalement
  const semaine = row['Semaine'] || row['Sem.'];
  return semaine === week || semaine.includes(weekNum[0]);
});
```

**Solution Alternative 2** : Exporter TOUTES les données (sans filtre)

```javascript
// Télécharger toutes les données de toutes les semaines
const data = tableDoc.data;  // Pas de filtre
```

### Scénario C : Données Non Enregistrées

**Problème** : `found: false` ou `totalRows: 0`

**Solution** :
1. Ouvrir l'interface
2. Sélectionner classe et matière
3. Vérifier que le tableau est rempli
4. **Cliquer sur "💾 Enregistrer"**
5. Attendre la confirmation
6. Réessayer l'export

---

## 🚀 Prochaines Étapes

### Après Diagnostic

1. **Exécuter** `debugMongoData()` pour une classe avec des données visibles
2. **Noter** le format exact du champ semaine
3. **Partager** les résultats (copier-coller la sortie de la console)
4. **Ajuster** le code backend si nécessaire

### Exemple de Rapport

```
Classe: PEI3
Matière: Physique
Total lignes: 155
Champ semaine: "Sem." avec format "S19"
Semaine testée: "Semaine 19"
Résultat filtrage: 0 lignes trouvées

Analyse: Le format "S19" ne match pas avec "Semaine 19"
Solution: Le code doit extraire "19" et chercher dans "S19"
```

---

## 📞 Support

Si après utilisation de ces outils, le problème persiste :

1. **Copier** les résultats de `debugMongoData()`
2. **Copier** les logs du serveur (si accessibles)
3. **Ouvrir une Issue** sur GitHub avec ces informations
4. **Mentionner** :
   - Format du champ semaine trouvé
   - Format de semaine recherché
   - Nombre de lignes dans MongoDB
   - Nombre de lignes filtrées (0 si problème)

---

## 🎓 Conclusion

Ces outils de débogage permettent de :

- ✅ Voir exactement ce qui est dans MongoDB
- ✅ Identifier le format du champ semaine
- ✅ Comprendre pourquoi le filtrage ne fonctionne pas
- ✅ Proposer des solutions adaptées

**Une fois le format identifié, le code peut être ajusté pour matcher correctement.**

---

**Date** : 12 janvier 2026  
**Commit** : 8cf3a13  
**Version** : 2.1.2+debug
