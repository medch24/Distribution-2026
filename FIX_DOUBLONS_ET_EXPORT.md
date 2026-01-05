# Correction des Doublons et Filtrage de l'Export Excel

**Date**: 5 janvier 2026  
**Commit**: `63ce04c`  
**Problèmes résolus**: 
1. Doublons lors de l'enregistrement automatique
2. Lignes inutiles dans l'export Excel

---

## 🎯 Problèmes Identifiés

### Problème 1: Duplication lors de la Sauvegarde

**Symptôme**: À chaque modification, le système créait une nouvelle copie dans la base de données `savedCopies`, même lors de l'auto-save (enregistrement automatique toutes les 1.5 secondes).

**Conséquence**: 
- Base de données MongoDB surchargée avec des milliers de copies identiques
- Consommation excessive d'espace de stockage
- Lenteur du système à long terme

**Cause**: 
```javascript
// AVANT (api/index.js ligne 288)
await db.collection('savedCopies').insertOne({ 
  timestamp: new Date(), 
  tables: formatted 
});
// ❌ Créait TOUJOURS une nouvelle copie, même pour l'auto-save
```

### Problème 2: Export Excel avec Lignes Parasites

**Symptôme**: Le fichier Excel exporté contenait TOUTES les lignes du calendrier, y compris:
- Vacances
- Examens finaux
- Orientation
- Jours fériés (Saudi National day, etc.)

**Conséquence**: 
- Fichier Excel encombré et difficile à lire
- Enseignants devaient supprimer manuellement les lignes inutiles
- Confusion entre les séances de cours et les événements spéciaux

**Cause**:
```javascript
// AVANT (public/script.js)
if (isSpecialEvent) { 
  dataForExport.push([...event.type...]); 
  // ❌ Exportait TOUS les événements spéciaux
}
```

---

## ✅ Solutions Appliquées

### Solution 1: Sauvegarde Intelligente avec Backup Conditionnel

#### Modifications Backend (api/index.js)

```javascript
// APRÈS
app.post('/saveTable', async (req, res) => {
  const { className, sheetName, data, createBackup } = req.body || {};
  
  // Mise à jour (ou insertion) dans la collection principale
  await db.collection('tables').updateOne(
    { sheetName }, 
    { $set: { data } }, 
    { upsert: true }  // ✅ UPDATE si existe, INSERT si nouveau
  );
  
  // ✅ Créer backup SEULEMENT si demandé explicitement
  if (createBackup === true) {
    const allTables = await db.collection('tables').find().toArray();
    const formatted = allTables.map(t => ({ matiere: t.sheetName, data: t.data }));
    await db.collection('savedCopies').insertOne({ 
      timestamp: new Date(), 
      tables: formatted 
    });
  }
});
```

#### Modifications Frontend (public/script.js)

```javascript
// APRÈS
async function saveTable(isSilent = false, createBackup = false) {
  // ...
  const ack = await apiCall('saveTable', { 
    className: currentClass, 
    sheetName: selectedMatiere, 
    data: savedData[selectedMatiere],
    createBackup: createBackup  // ✅ Passer le paramètre
  });
  // ...
}
```

#### Bouton Enregistrer (public/index.html)

```html
<!-- AVANT -->
<button onclick="saveTable()">Enregistrer</button>

<!-- APRÈS -->
<button onclick="saveTable(false, true)">Enregistrer</button>
<!-- ✅ isSilent=false, createBackup=true -->
```

### Solution 2: Filtrage de l'Export Excel

#### Modification de prepareExcelDataForSubject()

```javascript
// APRÈS (public/script.js)
sheetData.slice(1).forEach((row, dataIndex) => { 
  const event = academicCalendar[dataIndex]; 
  if (!event) return; 
  
  const isSpecialEvent = !isPlannable(event);
  const eventType = event.type.toLowerCase();
  
  // ✅ FILTRE: Exporter SEULEMENT "Cours" et "evaluation"
  const shouldExport = isPlannable(event) || 
                       eventType.includes('evaluation') || 
                       eventType.includes('évaluation');
  
  if (!shouldExport) {
    return; // ⏭️ Ignorer (vacances, examens, jours fériés, etc.)
  }
  
  // Exporter la ligne...
});
```

---

## 📊 Résultats

### Avant / Après: Sauvegarde

| Aspect | Avant | Après |
|--------|-------|-------|
| **Auto-save** | ❌ Crée backup | ✅ Pas de backup |
| **Sauvegarde manuelle** | ✅ Crée backup | ✅ Crée backup |
| **Stockage DB** | 🔴 Surchargé | 🟢 Optimisé |
| **Performance** | 🔴 Lent | 🟢 Rapide |

### Avant / Après: Export Excel

| Type de Ligne | Avant | Après |
|---------------|-------|-------|
| **Cours** | ✅ Exporté | ✅ Exporté |
| **Évaluations** | ✅ Exporté | ✅ Exporté |
| **Vacances** | ❌ Exporté | ✅ Exclu |
| **Examens** | ❌ Exporté | ✅ Exclu |
| **Orientation** | ❌ Exporté | ✅ Exclu |
| **Jours fériés** | ❌ Exporté | ✅ Exclu |

**Exemple**: Un fichier Excel qui contenait **210 lignes** (calendrier complet) contient maintenant seulement **~155 lignes** (cours + évaluations uniquement).

---

## 🔄 Comportement du Système

### 1. Enregistrement Automatique (Auto-save)

**Déclencheur**: Toutes les 1.5 secondes après une modification

**Processus**:
```
1. L'utilisateur tape dans un champ
2. Timer de 1.5 secondes démarre
3. Auto-save se déclenche
4. ✅ Mise à jour dans collection 'tables'
5. ❌ PAS de copie dans 'savedCopies'
6. Indicateur "Enregistrement automatique activé" s'affiche
```

### 2. Enregistrement Manuel (Bouton)

**Déclencheur**: Clic sur le bouton "Enregistrer"

**Processus**:
```
1. L'utilisateur clique sur "Enregistrer"
2. Message de progression s'affiche
3. ✅ Mise à jour dans collection 'tables'
4. ✅ Copie backup dans 'savedCopies'
5. Message de succès: "Modifications enregistrées avec succès!"
```

### 3. Export Excel (Bouton)

**Déclencheur**: Clic sur le bouton "Excel"

**Processus**:
```
1. L'utilisateur clique sur "Excel"
2. Fonction prepareExcelDataForSubject() s'exécute
3. ✅ Filtre les lignes (garde seulement Cours + Évaluations)
4. Génère le fichier .xlsx
5. Téléchargement automatique
6. Message: "Fichier Excel généré avec succès!"
```

---

## 📝 Types d'Événements

### Événements EXPORTÉS dans Excel

1. **Cours** (type = "Cours")
   - Toutes les séances normales de cours
   - Exemple: Lundi 08/09/2025

2. **Évaluation** (type contient "evaluation" ou "évaluation")
   - Évaluations continues
   - Exemple: Dimanche 12/10/2025 (evaluation)

### Événements EXCLUS de l'export Excel

1. **Vacances** (type contient "Vacance")
   - Vacances d'automne, d'hiver, de printemps
   - Vacances d'été

2. **Examens** (type contient "Examen")
   - Examen Final Semestre 1
   - Examen Final Semestre 2

3. **Orientation** (type = "Orientation")
   - Semaine d'orientation (début d'année)

4. **Jours fériés** (type contient "day")
   - Saudi National day
   - Saudi foundation day

---

## 🧪 Tests de Validation

### Test 1: Vérifier l'Auto-save

1. Ouvrir une matière
2. Modifier un champ
3. Attendre 2 secondes
4. ✅ Vérifier: Indicateur "Enregistrement automatique activé" s'affiche
5. ✅ Vérifier en DB: `tables` collection mise à jour
6. ✅ Vérifier en DB: `savedCopies` collection INCHANGÉE

### Test 2: Vérifier la Sauvegarde Manuelle

1. Ouvrir une matière
2. Modifier plusieurs champs
3. Cliquer sur "Enregistrer"
4. ✅ Vérifier: Message "Modifications enregistrées avec succès!"
5. ✅ Vérifier en DB: `tables` collection mise à jour
6. ✅ Vérifier en DB: `savedCopies` nouvelle entrée avec timestamp

### Test 3: Vérifier l'Export Excel

1. Remplir une matière avec des cours
2. Cliquer sur "Excel"
3. Ouvrir le fichier .xlsx téléchargé
4. ✅ Vérifier: Seulement lignes "Cours" et "Évaluations" présentes
5. ✅ Vérifier: PAS de lignes "Vacances", "Examens", "Orientation"
6. ✅ Vérifier: PAS de lignes "Saudi National day", etc.

---

## 💡 Conseils pour les Enseignants

### Quand utiliser "Enregistrer" manuellement?

- ✅ Après avoir terminé une section importante
- ✅ Avant de fermer le navigateur
- ✅ Avant d'exporter en Excel/Word
- ✅ Pour créer un point de sauvegarde "sûr"

### Quand NE PAS s'inquiéter?

- ✅ Pendant la saisie normale → Auto-save s'en occupe
- ✅ Après chaque modification mineure → Auto-save suffit
- ✅ Toutes les 1.5 secondes → Déjà sauvegardé automatiquement

---

## 🔧 Détails Techniques

### Base de Données MongoDB

**Structure**:
```
Classe_<NomClasse>/
├── tables/              # Collection principale
│   ├── { sheetName: "Français", data: [...] }
│   ├── { sheetName: "Maths", data: [...] }
│   └── ...
└── savedCopies/        # Backups (seulement sauvegarde manuelle)
    ├── { timestamp: Date, tables: [...] }
    └── ...
```

**Opération de Sauvegarde**:
```javascript
// upsert: true signifie:
// - Si document existe (même sheetName) → UPDATE
// - Si document n'existe pas → INSERT
await db.collection('tables').updateOne(
  { sheetName },           // Filtre: cherche ce sheetName
  { $set: { data } },      // Action: remplace data
  { upsert: true }         // Option: insert si pas trouvé
);
```

### Paramètres de la Fonction saveTable()

```javascript
async function saveTable(isSilent = false, createBackup = false)
```

| Paramètre | Type | Par défaut | Description |
|-----------|------|------------|-------------|
| `isSilent` | boolean | `false` | Si `true`, pas de messages UI |
| `createBackup` | boolean | `false` | Si `true`, crée une copie backup |

**Cas d'usage**:
- `saveTable()` → Sauvegarde manuelle avec messages
- `saveTable(true)` → Auto-save silencieux sans backup
- `saveTable(false, true)` → Sauvegarde manuelle avec backup

---

## 📖 Références

- **Commit**: `63ce04c` - fix(storage): Prevent duplicate saves and filter Excel export
- **Date**: 5 janvier 2026
- **Fichiers modifiés**:
  - `api/index.js` (ligne 279-295)
  - `public/script.js` (ligne 383, 522-596)
  - `public/index.html` (ligne 368)

---

**✅ Ces modifications garantissent**:
1. Pas de duplication inutile des données
2. Export Excel propre et utilisable directement
3. Meilleure performance du système
4. Réduction de l'utilisation du stockage MongoDB
