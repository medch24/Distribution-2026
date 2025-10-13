const express = require('express');
const path = require('path');

// Importation du serveur API
const apiApp = require('./api/server.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Routes API en premier (avant les fichiers statiques)
app.use('/api', apiApp);

// Configuration pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route fallback pour servir index.html pour les routes non-API (SPA)
app.get('*', (req, res) => {
    // Ne pas intercepter les routes API
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📱 Interface accessible à: http://localhost:${PORT}`);
    console.log(`🔧 API disponible à: http://localhost:${PORT}/api/health`);
    console.log('✅ Site web prêt à fonctionner!');
});