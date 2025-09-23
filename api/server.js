const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const ConvertAPI = require('convertapi');

const app = express();

const MONGO_URL = process.env.MONGO_URL;
const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET;
const APP_VERSION = Date.now();
const classDatabases = {};

if (!MONGO_URL) {
    console.error("ERREUR CRITIQUE: La variable d'environnement MONGO_URL n'est pas définie !");
}
if (!CONVERTAPI_SECRET) {
    console.error("ERREUR CRITIQUE: La variable d'environnement CONVERTAPI_SECRET n'est pas définie !");
}

const convertapi = new ConvertAPI(CONVERTAPI_SECRET);

// Middlewares
app.use(cors()); // Active CORS pour toutes les routes
app.use(express.json({ limit: '50mb' })); // Pour parser les corps de requêtes JSON (limite augmentée)
app.use(express.static(path.join(__dirname, '../public')));

async function connectToClassDatabase(className) {
    if (classDatabases[className]) return classDatabases[className];
    if (!MONGO_URL) {
        console.error("MONGO_URL n'est pas défini. Impossible de se connecter.");
        return null;
    }
    try {
        const client = await MongoClient.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        const dbName = `Classe_${className.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const db = client.db(dbName);
        classDatabases[className] = db;
        console.log(`Connecté à la base de données ${dbName}`);
        return db;
    } catch (error) {
        console.error(`Erreur de connexion à la base de données pour la classe ${className}:`, error);
        return null;
    }
}

// === ROUTES API (remplacent les événements socket.io) ===

app.post('/api/generatePdfOnServer', async (req, res) => {
    const { docxBuffer, fileName } = req.body;
    if (!docxBuffer) {
        return res.status(400).json({ error: 'Données du document manquantes.' });
    }
    console.log('Préparation de la conversion PDF...');
    let tempDocxPath = null;
    let tempPdfPath = null;
    try {
        const timestamp = Date.now();
        const nodeBuffer = Buffer.from(docxBuffer, 'base64'); // Le buffer est envoyé en base64
        
        tempDocxPath = path.join('/tmp', `docx-in-${timestamp}-${fileName}`);
        tempPdfPath = path.join('/tmp', `pdf-out-${timestamp}.pdf`);
        
        await fs.writeFile(tempDocxPath, nodeBuffer);
        console.log(`Fichier DOCX temporaire créé à: ${tempDocxPath}`);

        const result = await convertapi.convert('pdf', { File: tempDocxPath }, 'docx');
        
        await result.file.save(tempPdfPath);
        console.log(`Fichier PDF temporaire créé à: ${tempPdfPath}`);
        
        const pdfBuffer = await fs.readFile(tempPdfPath);
        console.log('Conversion PDF et lecture terminées avec succès.');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName.replace('.docx', '.pdf')}`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Erreur de ConvertAPI:', error.toString());
        let errorMessage = 'Une erreur est survenue lors de la conversion du document.';
        if (error.response && error.response.data && error.response.data.Message) {
            errorMessage = error.response.data.Message;
        }
        res.status(500).json({ error: errorMessage });
    } finally {
        if (tempDocxPath) await fs.unlink(tempDocxPath).catch(e => console.error("Erreur nettoyage DOCX:", e.message));
        if (tempPdfPath) await fs.unlink(tempPdfPath).catch(e => console.error("Erreur nettoyage PDF:", e.message));
    }
});

app.post('/api/saveTable', async (req, res) => {
    const { className, sheetName, data } = req.body;
    if (!className || !sheetName || !data) return res.status(400).json({ error: "Missing data." });
    try {
        const db = await connectToClassDatabase(className);
        if (!db) return res.status(500).json({ error: `Cannot connect to DB for ${className}` });
        
        await db.collection('tables').updateOne({ sheetName }, { $set: { data } }, { upsert: true });
        
        const allTablesData = await db.collection('tables').find().toArray();
        const formattedTables = allTablesData.map(table => ({ matiere: table.sheetName, data: table.data }));
        await db.collection('savedCopies').insertOne({ timestamp: new Date(), tables: formattedTables });
        
        res.json({ success: true });
    } catch (error) {
        console.error("Error saving table:", error);
        res.status(500).json({ error: "Error saving table" });
    }
});

app.post('/api/loadLatestCopy', async (req, res) => {
    const { className } = req.body;
    if (!className) return res.status(400).json({ error: "Class name is required." });
    try {
        const db = await connectToClassDatabase(className);
        if (!db) return res.status(500).json({ error: `Cannot connect to DB for ${className}` });
        
        const latestCopy = await db.collection('savedCopies').find({ 'tables.0': { '$exists': true } }).sort({ timestamp: -1 }).limit(1).toArray();
        
        if (latestCopy.length > 0 && latestCopy[0].tables) {
            res.json({ success: true, tables: latestCopy[0].tables });
        } else {
            const allTablesData = await db.collection('tables').find().toArray();
            const formattedTables = allTablesData.map(table => ({ matiere: table.sheetName, data: table.data }));
            res.json({ success: true, tables: formattedTables.length > 0 ? formattedTables : [] });
        }
    } catch (error) {
        console.error("Error loading latest copy:", error);
        res.status(500).json({ success: false, error: "Error loading saved data" });
    }
});

app.post('/api/loadAllSelectionsForClass', async (req, res) => {
    const { className } = req.body;
    if (!className) return res.status(400).json({ success: false, error: "Le nom de la classe est requis." });
    try {
        const db = await connectToClassDatabase(className);
        if (!db) return res.status(500).json({ success: false, error: `Impossible de se connecter à la DB pour ${className}` });
        
        const allSelectionsRaw = await db.collection('selections').find({}).toArray();
        const allSelectionsBySheet = {};
        allSelectionsRaw.forEach(selection => {
            if (!allSelectionsBySheet[selection.sheetName]) {
                allSelectionsBySheet[selection.sheetName] = {};
            }
            allSelectionsBySheet[selection.sheetName][selection.cellKey] = { unit: selection.unit, resources: selection.resources };
        });
        res.json({ success: true, allSelections: allSelectionsBySheet });
    } catch (error) {
        if (error.codeName === 'NamespaceNotFound') {
             console.log("Collection 'selections' non trouvée (normal si déjà migré ou nouvelle classe).");
             return res.json({ success: true, allSelections: {} });
        }
        console.error("Erreur lors du chargement de toutes les sélections pour la classe:", error);
        res.status(500).json({ success: false, error: "Erreur serveur lors du chargement des sélections." });
    }
});

app.post('/api/deleteMatiereData', async (req, res) => {
    const { className, sheetName } = req.body;
    if (!className || !sheetName) return res.status(400).json({ error: "Nom de classe ou de matière manquant." });
    try {
        const db = await connectToClassDatabase(className);
        if (!db) return res.status(500).json({ error: `Impossible de se connecter à la DB pour ${className}` });
        
        const deletePromises = [
            db.collection('tables').deleteOne({ sheetName: sheetName }),
            db.collection('selections').deleteMany({ sheetName: sheetName }),
            db.collection('resources').deleteMany({ sheetName: sheetName }),
            db.collection('units').deleteMany({ sheetName: sheetName })
        ];
        await Promise.all(deletePromises.map(p => p.catch(e => console.log("Avertissement:", e.message))));
        
        const latestCopy = await db.collection('savedCopies').find().sort({ timestamp: -1 }).limit(1).toArray();
        if (latestCopy.length > 0) {
            const copy = latestCopy[0];
            const updatedTables = copy.tables.filter(table => table.matiere !== sheetName);
            await db.collection('savedCopies').updateOne({ _id: copy._id }, { $set: { tables: updatedTables } });
        }
        console.log(`Données pour ${sheetName} dans ${className} supprimées.`);
        res.json({ success: true });
    } catch (error) {
        console.error(`Erreur suppression ${sheetName}:`, error);
        res.status(500).json({ error: "Erreur serveur lors de la suppression." });
    }
});

// Route pour servir le fichier principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Vercel démarre le serveur, donc on exporte l'instance.
module.exports = app;
