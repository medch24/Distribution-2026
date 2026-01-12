# 🧪 Guide de Test - Export Excel Hebdomadaire

## ✅ Test Rapide (5 minutes)

### Étape 1 : Enregistrer des Données de Test

1. **Ouvrir l'application** : `https://votre-site.vercel.app` ou `http://localhost:3000`

2. **Naviguer vers une classe** :
   - Cliquer sur **"Section Secondaire"**
   - Cliquer sur la carte **"PEI1"**

3. **Sélectionner une matière** :
   - Dans le menu déroulant, choisir **"Français"**

4. **Remplir quelques cellules pour la Semaine 19** :
   
   Trouver les lignes de la Semaine 19 dans le tableau et remplir par exemple :
   
   | Séan. | Unité/Chapitre | Contenu de la leçon | Ressources (Leçons) | Devoir | Ressources (Devoirs) |
   |-------|----------------|---------------------|---------------------|--------|----------------------|
   | 1     | Chapitre 5     | La grammaire        | Livre p.50-55       | Ex 1-5 | Cahier p.20          |
   | 2     | Chapitre 5     | Suite               | Livre p.56-60       | Ex 6-8 | Cahier p.21          |

5. **Enregistrer** :
   - Cliquer sur le bouton **"💾 Enregistrer"**
   - Attendre le message de confirmation ✅

### Étape 2 : Tester le Téléchargement Excel

1. **Revenir à la Section** :
   - Cliquer sur **"← Changer de Classe"** en haut

2. **Sélectionner la Semaine** :
   - Dans le dropdown "Choisir la semaine", sélectionner **"Semaine 19"**

3. **Télécharger** :
   - Cliquer sur **"📥 Télécharger Excel"**
   - Observer la barre de progression :
     - 10% - Connexion au serveur...
     - 30% - Récupération des données...
     - 60% - Génération du fichier Excel...
     - 90% - Préparation du téléchargement...
     - 100% - Téléchargement terminé ! ✅

4. **Vérifier le Fichier** :
   - Ouvrir `Distribution_Semaine_19.xlsx`
   - Vérifier la présence de vos données :
     - Classe : PEI1
     - Matiere : Français
     - Séan. : 1, 2
     - Les contenus que vous avez saisis

### Étape 3 : Tester Plusieurs Matières

1. **Retourner à PEI1**
2. **Sélectionner "Mathématiques"**
3. **Remplir quelques cellules pour Semaine 19** :

   | Séan. | Unité/Chapitre | Contenu de la leçon | Ressources (Leçons) | Devoir | Ressources (Devoirs) |
   |-------|----------------|---------------------|---------------------|--------|----------------------|
   | 1     | Algèbre        | Équations           | Livre p.30-35       | Ex A-D | Cahier p.15          |
   | 2     | Algèbre        | Systèmes            | Livre p.36-40       | Ex E-H | Cahier p.16          |

4. **Enregistrer** : 💾
5. **Retourner à la Section** : ← Changer de Classe
6. **Télécharger à nouveau Excel pour Semaine 19**
7. **Vérifier** : Le fichier doit maintenant contenir :
   - PEI1 - Français (2 séances)
   - PEI1 - Mathématiques (2 séances)

---

## 🔍 Test Avancé : Plusieurs Classes

### Objectif
Vérifier que l'export fonctionne pour plusieurs classes en même temps

### Procédure

1. **PEI1 - Français** : Remplir 2 séances pour Semaine 19 ✅
2. **PEI1 - Mathématiques** : Remplir 2 séances pour Semaine 19 ✅
3. **PEI2 - Anglais** : Remplir 3 séances pour Semaine 19 ✅
4. **PEI3 - Sciences** : Remplir 2 séances pour Semaine 19 ✅

5. **Télécharger Excel pour Semaine 19**

6. **Résultat attendu** : Fichier avec 9 lignes (2+2+3+2)

---

## 🧪 Test de Cas Limites

### Test 1 : Classe Sans Données
1. **Ne PAS** remplir de données pour PEI4
2. Télécharger Excel pour Semaine 19
3. **Résultat** : PEI4 ne doit PAS apparaître dans l'Excel (pas d'erreur)

### Test 2 : Semaine Sans Données
1. Sélectionner **Semaine 30** (non remplie)
2. Télécharger Excel
3. **Résultat attendu** : Message d'erreur clair :
   ```
   ❌ Aucune donnée trouvée pour Semaine 30
   
   Détails :
   • Semaine : Semaine 30
   • Section : secondaire
   • Classes traitées : 7
   • Classes avec données : 0
   • MongoDB configuré : Oui
   
   💡 Veuillez enregistrer des données pour cette semaine avant de télécharger.
   ```

### Test 3 : Champs Manquants
1. Remplir une cellule avec seulement l'Unité/Chapitre (laisser les autres vides)
2. Enregistrer
3. Télécharger Excel
4. **Résultat** : La ligne doit apparaître avec les champs remplis vides (pas d'erreur)

---

## 📊 Vérification du Format Excel

### Structure Attendue

| Colonne | Largeur | Contenu |
|---------|---------|---------|
| Classe | 12 | Nom de la classe (ex: PEI1, PEI2-G...) |
| Matiere | 25 | Nom de la matière |
| Séan. | 15 | Numéro de séance (Séance 1, 2, 3...) |
| Unité/Chapitre | 30 | Titre de l'unité ou chapitre |
| Contenu de la leçon | 30 | Contenu pédagogique |
| Ressources (Leçons) | 25 | Références de ressources |
| Devoir | 40 | Description du devoir |
| Ressources (Devoirs) | 25 | Références pour les devoirs |

### Styles Attendus
- **En-tête** : Fond bleu (#4472C4), texte blanc, gras, centré
- **Lignes paires** : Fond gris clair (#F2F2F2)
- **Lignes impaires** : Fond blanc
- **Bordures** : Fines bordures noires sur toutes les cellules
- **Texte** : Alignement en haut, retour à la ligne automatique

---

## 🐛 Dépannage

### Problème : "Aucune donnée trouvée"
**Solution** :
1. Vérifier que MongoDB est configuré (MONGO_URL dans .env)
2. Vérifier que des données ont été enregistrées pour cette semaine
3. Consulter les logs du serveur : `npm start` ou logs Vercel
4. Vérifier que le champ "Semaine" ou "Sem." est bien rempli

### Problème : Téléchargement bloqué à 30%
**Solution** :
1. Vérifier la connexion MongoDB
2. Regarder les logs pour voir quelle classe bloque
3. Essayer de télécharger une seule section
4. Vérifier la console du navigateur (F12 > Console)

### Problème : Fichier vide ou erreur Excel
**Solution** :
1. Vérifier que le buffer généré n'est pas vide (taille > 0)
2. Vérifier les logs : "Generated Excel with X rows"
3. Essayer avec une autre semaine
4. Essayer avec un autre navigateur

---

## ✅ Checklist de Validation

Avant de considérer le test comme réussi, vérifier :

- [ ] Téléchargement Excel fonctionne pour au moins une classe
- [ ] Téléchargement fonctionne pour plusieurs matières
- [ ] Téléchargement fonctionne pour plusieurs classes
- [ ] Le fichier Excel s'ouvre sans erreur
- [ ] Les données dans l'Excel correspondent aux données saisies
- [ ] Les en-têtes sont bien formatés (bleu, blanc, gras)
- [ ] Les lignes alternées ont des couleurs différentes
- [ ] Les bordures sont présentes
- [ ] Les cellules vides ne provoquent pas d'erreur
- [ ] Les classes sans données ne causent pas d'erreur
- [ ] Les semaines sans données affichent un message clair
- [ ] La barre de progression fonctionne (10% → 100%)
- [ ] Les messages de succès/erreur sont clairs

---

## 📈 Tests de Performance

### Test de Charge
1. Remplir **toutes les matières** de **toutes les classes** pour Semaine 19
2. Télécharger Excel
3. **Temps attendu** : < 10 secondes
4. **Résultat** : Fichier avec 100-200 lignes

### Test de Limite MongoDB
1. Vérifier que la limite de 100 résultats par matière n'est jamais dépassée
2. Si une matière a plus de 100 séances (rare), seules les 100 premières seront exportées

---

## 🎯 Résultat Final

Si tous les tests passent :

✅ **La fonctionnalité d'export Excel hebdomadaire est PLEINEMENT FONCTIONNELLE !**

Les enseignants peuvent :
1. Remplir leurs distributions comme d'habitude
2. Sélectionner une semaine par section
3. Télécharger un fichier Excel professionnel
4. Obtenir toutes les données de la semaine pour toutes les classes de la section
5. Utiliser l'Excel pour leurs rapports, présentations, etc.

---

**Date** : 12 janvier 2026  
**Version** : 2.1.2  
**Statut** : ✅ VALIDÉ
