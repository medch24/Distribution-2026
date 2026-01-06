# 🔴 PROBLÈME: L'enregistrement ne fonctionne pas

## Diagnostic Rapide

### 1. Vérifier la Console du Navigateur

Ouvrez la console du navigateur (F12) et vérifiez s'il y a des erreurs:

**Erreurs possibles**:
```
❌ Failed to fetch
❌ 500 Internal Server Error
❌ Cannot connect to DB
❌ Missing data
```

### 2. Vérifier les Variables d'Environnement

Sur **Vercel**, assurez-vous que ces variables sont configurées:

| Variable | Description | Requis |
|----------|-------------|---------|
| `MONGO_URL` | URL de connexion MongoDB | ✅ OUI |
| `OPENAI_API_KEY` | Clé API OpenAI (IA) | ⚠️ Optionnel |
| `GROQ_API_KEY` | Clé API Groq (IA fallback) | ⚠️ Optionnel |
| `GEMINI_API_KEY` | Clé API Gemini (IA) | ⚠️ Optionnel |
| `CONVERTAPI_SECRET` | Clé ConvertAPI (PDF) | ⚠️ Optionnel |

**⚠️ IMPORTANT**: `MONGO_URL` est OBLIGATOIRE pour que l'enregistrement fonctionne!

### 3. Format de MONGO_URL

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

Exemple:
```
mongodb+srv://user123:motdepasse@cluster0.abc123.mongodb.net/distribution?retryWrites=true&w=majority
```

## Solutions Possibles

### Solution 1: Vérifier MongoDB

1. Allez sur https://cloud.mongodb.com
2. Vérifiez que votre cluster est **actif**
3. Vérifiez les **IP whitelists** (autorisez `0.0.0.0/0` pour Vercel)
4. Copiez la chaîne de connexion correcte

### Solution 2: Configurer Vercel

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet **Distribution-2026**
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez/mettez à jour `MONGO_URL`
5. **IMPORTANT**: Re-déployez l'application après modification

### Solution 3: Tester Localement

```bash
# 1. Créer le fichier .env
echo "MONGO_URL=votre_url_mongodb_ici" > .env

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur
node start.js

# 4. Ouvrir dans le navigateur
# http://localhost:3000
```

### Solution 4: Vérifier les Logs Vercel

1. Sur Vercel Dashboard
2. Allez dans **Deployments**
3. Cliquez sur le dernier déploiement
4. Regardez les **Function Logs**
5. Cherchez les erreurs liées à MongoDB

## Tests de Diagnostic

### Test 1: API Health Check

Ouvrez cette URL dans votre navigateur:
```
https://votre-app.vercel.app/api/health
```

**Réponse attendue**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-06T...",
  "database": "connected"
}
```

Si vous voyez `"database": "disconnected"`, c'est un problème MongoDB.

### Test 2: Console du Navigateur

1. Ouvrez votre application
2. F12 → Console
3. Sélectionnez une classe et une matière
4. Modifiez un champ
5. Cliquez sur "Enregistrer"

**Messages attendus**:
```
✅ POST /api/saveTable 200 OK
✅ Modifications enregistrées avec succès!
```

**Messages d'erreur**:
```
❌ POST /api/saveTable 500 Internal Server Error
❌ Erreur lors de l'enregistrement: Cannot connect to DB
```

### Test 3: Network Tab

1. F12 → Network
2. Cliquez sur "Enregistrer"
3. Trouvez la requête `saveTable`
4. Vérifiez:
   - **Status**: doit être `200`
   - **Response**: `{"success": true}`

## Problèmes Connus et Solutions

### Problème 1: "Cannot connect to DB"

**Cause**: MongoDB n'est pas accessible

**Solutions**:
1. Vérifier que `MONGO_URL` est correcte
2. Vérifier les IP whitelists sur MongoDB Atlas
3. Vérifier que le cluster MongoDB est actif

### Problème 2: "Missing data"

**Cause**: Les données ne sont pas envoyées correctement

**Solutions**:
1. Vérifier que vous avez sélectionné une classe et une matière
2. Vérifier qu'il y a des données dans le tableau
3. Vider le cache du navigateur (Ctrl+Shift+Delete)

### Problème 3: "Authentication failed"

**Cause**: Mot de passe MongoDB incorrect ou expiré

**Solutions**:
1. Régénérer le mot de passe sur MongoDB Atlas
2. Mettre à jour `MONGO_URL` avec le nouveau mot de passe
3. Re-déployer sur Vercel

### Problème 4: "Timeout"

**Cause**: MongoDB prend trop de temps à répondre

**Solutions**:
1. Vérifier la région du cluster MongoDB (choisir la plus proche)
2. Augmenter le timeout dans le code
3. Vérifier la connexion Internet

## Code de Debug à Ajouter

Si vous voulez voir exactement ce qui se passe, ajoutez ceci dans `api/index.js`:

```javascript
app.post('/saveTable', async (req, res) => {
  console.log('🔵 Requête saveTable reçue:', {
    className: req.body?.className,
    sheetName: req.body?.sheetName,
    dataLength: req.body?.data?.length,
    createBackup: req.body?.createBackup
  });
  
  const { className, sheetName, data, createBackup } = req.body || {};
  
  if (!className || !sheetName || !data) {
    console.error('❌ Données manquantes');
    return res.status(400).json({ error: 'Missing data.' });
  }
  
  try {
    const db = await connectToClassDatabase(className);
    
    if (!db) {
      console.error('❌ Impossible de se connecter à la DB');
      return res.status(500).json({ error: `Cannot connect to DB for ${className}` });
    }
    
    console.log('✅ Connexion DB établie');
    
    await db.collection('tables').updateOne(
      { sheetName }, 
      { $set: { data } }, 
      { upsert: true }
    );
    
    console.log('✅ Données sauvegardées dans tables');
    
    if (createBackup === true) {
      const allTables = await db.collection('tables').find().toArray();
      const formatted = allTables.map(t => ({ matiere: t.sheetName, data: t.data }));
      await db.collection('savedCopies').insertOne({ 
        timestamp: new Date(), 
        tables: formatted 
      });
      console.log('✅ Backup créé dans savedCopies');
    }
    
    broadcast('refresh', { className, sheetName, ts: Date.now() });
    console.log('✅ Sauvegarde complète avec succès');
    
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Erreur lors de la sauvegarde:', e);
    res.status(500).json({ error: `Error saving table: ${e.message}` });
  }
});
```

Vous verrez alors exactement où se situe le problème dans les logs Vercel.

## Vérification Post-Modification

Après avoir appliqué nos modifications (commit `63ce04c`), vérifiez:

1. ✅ Le code est bien sur GitHub
2. ✅ Vercel a automatiquement re-déployé (ou forcez le déploiement)
3. ✅ Les variables d'environnement sont configurées sur Vercel
4. ✅ L'URL de MongoDB est correcte
5. ✅ Le cluster MongoDB est actif

## Déploiement Manuel sur Vercel

Si Vercel n'a pas auto-déployé:

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
cd /path/to/Distribution-2026
vercel --prod
```

## Contact & Support

Si le problème persiste après toutes ces vérifications:

1. Partagez les logs de la console (F12)
2. Partagez les logs Vercel
3. Vérifiez l'erreur exacte dans Network tab
4. Vérifiez que MongoDB est accessible

---

**Checklist Rapide**:
- [ ] MongoDB URL est configurée sur Vercel
- [ ] Le cluster MongoDB est actif
- [ ] Les IP sont whitelisted (0.0.0.0/0)
- [ ] Le code est déployé sur Vercel (dernier commit)
- [ ] La console du navigateur ne montre pas d'erreur
- [ ] Network tab montre 200 OK pour /api/saveTable

Si tous ces points sont cochés et que ça ne fonctionne toujours pas, il y a probablement un problème spécifique que nous devons investiguer avec les logs détaillés.
