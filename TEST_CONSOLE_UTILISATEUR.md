# 🧪 Test Console - Instructions pour l'Utilisateur

## 🎯 Objectif

Tester et déboguer l'export Excel directement depuis le navigateur sans avoir besoin de compétences techniques.

---

## 📋 Instructions Simples (Étape par Étape)

### Étape 1 : Ouvrir la Console

1. **Ouvrir votre site** dans le navigateur
2. **Appuyer sur la touche `F12`** (ou clic droit > "Inspecter")
3. **Cliquer sur l'onglet "Console"** en haut

Vous devriez voir une zone avec un curseur clignotant où vous pouvez taper du texte.

---

### Étape 2 : Copier-Coller Ce Code

**Copier** cette ligne et **coller** dans la console :

```javascript
debugMongoData('PEI3', 'Physique')
```

**Puis appuyer sur `Entrée`**

---

### Étape 3 : Lire le Résultat

Vous allez voir quelque chose comme :

```
[DEBUG] Checking MongoDB for PEI3 - Physique
[DEBUG] MongoDB Result: Object { found: true, className: "PEI3", ... }
```

**Cliquer sur la petite flèche** à gauche de `Object` pour voir les détails.

---

## 🔍 Ce Qu'il Faut Regarder

### Information 1 : `found`

```javascript
found: true  // ✅ Données trouvées
found: false // ❌ Pas de données
```

- **Si `true`** : Les données existent dans MongoDB → Continuer
- **Si `false`** : Les données n'existent pas → Il faut les enregistrer d'abord

---

### Information 2 : `totalRows`

```javascript
totalRows: 155  // ✅ 155 lignes dans MongoDB
totalRows: 0    // ❌ Aucune ligne
```

- **Si > 0** : Il y a des données
- **Si 0** : Aucune donnée enregistrée

---

### Information 3 : `weekFields`

**Le plus important !** Montre le format du champ semaine :

```javascript
weekFields: {
  Semaine: undefined,     // ❌ Ce champ n'existe pas
  "Sem.": "S19",         // ✅ Ce champ existe avec valeur "S19"
  week: undefined,        // ❌ Ce champ n'existe pas
  allFields: [            // Liste de tous les champs
    "Mois",
    "Sem.",
    "Séan.",
    "Unité/Chapitre",
    ...
  ]
}
```

**Dans cet exemple** :
- Le champ s'appelle `"Sem."` ✅
- La valeur est `"S19"` ✅
- Donc pour télécharger la semaine 19, le système doit chercher `"S19"` (pas `"Semaine 19"`)

---

### Information 4 : `sampleRows`

Les 3 premières lignes de données. Exemple :

```javascript
sampleRows: [
  {
    Mois: "Févr.",
    "Sem.": "S19",
    "Séan.": "1",
    "Unité/Chapitre": "Chapitre 10",
    "Contenu de la leçon": "Consolidation...",
    Devoir: "Exercices 26-27-30",
    ...
  },
  { /* Ligne 2 */ },
  { /* Ligne 3 */ }
]
```

**Cliquer sur les flèches** pour voir les détails de chaque ligne.

---

## 🧪 Tests à Faire

### Test 1 : Votre Classe et Matière Actuelles

**Remplacer** par votre classe et matière :

```javascript
// Exemple pour PEI1 - Français
debugMongoData('PEI1', 'Français')

// Exemple pour MS - Maths
debugMongoData('MS', 'Maths')

// Exemple pour PP3 - Anglais
debugMongoData('PP3', 'Anglais')

// Exemple pour PEI2-G - Sciences
debugMongoData('PEI2-G', 'Sciences')
```

### Test 2 : La Classe Visible dans l'Image

D'après votre capture d'écran, la classe est **PEI3** et la matière **Physique** :

```javascript
debugMongoData('PEI3', 'Physique')
```

### Test 3 : Plusieurs Matières

Tester toutes les matières d'une classe :

```javascript
// PEI3 - Toutes les matières
debugMongoData('PEI3', 'Langue et littérature')
debugMongoData('PEI3', 'Maths')
debugMongoData('PEI3', 'Biologie')
debugMongoData('PEI3', 'Physique-chimie')
debugMongoData('PEI3', 'Anglais')
```

---

## 📸 Ce Qu'il Faut Me Montrer

### Information à Copier-Coller

1. **Exécuter** `debugMongoData('PEI3', 'Physique')` (ou votre classe)
2. **Cliquer droit** sur le résultat
3. **Choisir** "Copy object" ou "Copier l'objet"
4. **Coller** le résultat dans votre réponse

**OU**

1. **Prendre une capture d'écran** de la console avec le résultat
2. **M'envoyer** la capture

### Ce Que Je Veux Voir

```javascript
{
  found: true,                    // ✅ ou ❌
  className: "PEI3",
  subject: "Physique",
  totalRows: 155,                 // Nombre de lignes
  weekFields: {
    Semaine: undefined,           // Ou une valeur
    "Sem.": "S19",               // Ou une autre valeur
    week: undefined,              // Ou une valeur
    allFields: [...]              // Liste des champs
  },
  sampleRows: [...]               // Les 3 premières lignes
}
```

---

## 🎯 Que Faire Selon Les Résultats

### Résultat A : `found: false`

**Problème** : Aucune donnée dans MongoDB

**Solution** :
1. Ouvrir l'interface
2. Aller dans la classe et la matière
3. **Remplir** le tableau si vide
4. **Cliquer sur le bouton "💾 Enregistrer"** (très important !)
5. Attendre le message de confirmation
6. Réessayer le test

---

### Résultat B : `found: true` mais `"Sem.": "S19"`

**Problème** : Le format est `"S19"` mais on cherche `"Semaine 19"`

**Solution** : Le code doit être ajusté pour extraire le numéro `19` et chercher dans `"S19"`

**Ce que je vais faire** :
- Modifier le code pour qu'il reconnaisse `"S19"` quand on demande `"Semaine 19"`
- Ajouter un mapping automatique

---

### Résultat C : `found: true` mais `"Semaine": "Semaine 19"`

**Problème** : Aucun problème ! Le format est correct.

**Question** : Pourquoi l'export ne fonctionne pas alors ?

**À vérifier** :
- Tester avec une autre semaine
- Vérifier les logs du serveur
- Vérifier la connexion MongoDB

---

### Résultat D : `found: true` mais `allFields` ne contient ni "Semaine" ni "Sem."

**Problème** : Pas de champ semaine du tout !

**Solutions possibles** :
1. Exporter TOUTES les semaines (sans filtre)
2. Filtrer par mois à la place
3. Ajouter un champ semaine manuellement

---

## 💡 Exemples de Résultats

### Exemple 1 : Données OK

```javascript
{
  found: true,
  totalRows: 155,
  weekFields: {
    "Sem.": "S19",
    allFields: ["Mois", "Sem.", "Séan.", ...]
  }
}
```

**Analyse** : ✅ Données présentes, format `"S19"`

---

### Exemple 2 : Pas de Données

```javascript
{
  found: false,
  message: "Aucun document trouvé pour PEI3 - Physique"
}
```

**Analyse** : ❌ Aucune donnée enregistrée

---

### Exemple 3 : Données Présentes, Bon Format

```javascript
{
  found: true,
  totalRows: 120,
  weekFields: {
    "Semaine": "Semaine 19",
    allFields: ["Mois", "Semaine", "Séan.", ...]
  }
}
```

**Analyse** : ✅ Données présentes, format `"Semaine 19"` (parfait !)

---

## 🚀 Après Le Test

Une fois que vous m'avez envoyé le résultat, je pourrai :

1. **Identifier** le problème exact
2. **Ajuster** le code pour votre format spécifique
3. **Corriger** l'export Excel définitivement

---

## 📞 Besoin d'Aide ?

Si vous ne comprenez pas les résultats ou si vous avez des questions :

1. **Prendre une capture d'écran** de la console
2. **M'envoyer** la capture
3. Je vous expliquerai ce que ça signifie

---

## ⚡ Raccourcis Clavier

- **F12** : Ouvrir/fermer les outils de développement
- **Ctrl+L** : Effacer la console
- **Entrée** : Exécuter le code
- **Flèches Haut/Bas** : Naviguer dans l'historique des commandes

---

## ✅ Checklist

- [ ] J'ai ouvert la console (F12)
- [ ] J'ai cliqué sur l'onglet "Console"
- [ ] J'ai tapé/collé `debugMongoData('MaClasse', 'MaMatiere')`
- [ ] J'ai appuyé sur Entrée
- [ ] J'ai vu le résultat
- [ ] J'ai copié le résultat ou pris une capture
- [ ] Je vous envoie les informations

---

**Date** : 12 janvier 2026  
**Version** : 2.1.2+debug  
**Difficulté** : 🟢 Très Simple (Copier-Coller)
