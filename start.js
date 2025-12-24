const express = require('express');
const path = require('path');
const apiHandler = require('./api/index.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Router les requêtes /api vers le handler API
app.use('/api', apiHandler);

// Route par défaut
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📂 Fichiers statiques: ${path.join(__dirname, 'public')}`);
  console.log(`🔌 API disponible sur: http://localhost:${PORT}/api`);
});
