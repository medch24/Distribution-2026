const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const ConvertAPI = require('convertapi');

const app = express();

// Configuration des middlewares
app.use(cors()); // Active CORS pour toutes les routes
app.use(express.json({ limit: '50mb' })); // Augmente la limite de la taille du corps de la requête
app.use(express.static(path.join(__dirname, '../public')));

const MONGO_URL = process.env.MONGO_URL;
const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET;
const classDatabases = {};

if (!MONGO_URL || !CONVERTAPI_SECRET) {
    console.error("ERREUR CRITIQUE: Variables d'environnement manquantes !");
}

const convertapi = new ConvertAPI(CONVERTAPI_SECRET);

// --- Fonctions de base de données (inchangées) ---
async function connectToClassDatabase(className) {
    if (classDatabases[className]) return classDatabases[className];
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

// ========================================================================
// === TRANSFORMATION DES ÉVÉNEMENTS SOCKET.IO EN ROUTES D'API HTTP ===
// ========================================================================

// Route pour vérifier la version de l'application
app.get('/api/appVersion', (req, res) => {
    res.json({ version: Date.now() });
});

// Route pour la génération de PDF
app.post('/api/generatePdfOnServer', async (req, res) => {
    const { docxBuffer, fileName } = req.body;
    if (!docxBuffer) {
        return res.status(400).json({ error: 'Données du document manquantes.' });
    }
    
    let tempDocxPath = null;
    let tempPdfPath = null;
    try {
        const timestamp = Date.now();
        tempDocxPath = path.join('/tmp', `docx-in-${timestamp}-${fileName}`);
        tempPdfPath = path.join('/tmp', `pdf-out-${timestamp}.pdf`);
        
        // Le buffer arrive en tant qu'objet, il faut le reconvertir
        const nodeBuffer = Buffer.from(Object.values(docxBuffer));

        await fs.writeFile(tempDocxPath, nodeBuffer);
        
        const result = await convertapi.convert('pdf', { File: tempDocxPath }, 'docx');
        await result.file.save(tempPdfPath);
        
        const pdfBuffer = await fs.readFile(tempPdfPath);

        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Erreur de ConvertAPI:', error.toString());
        res.status(500).json({ error: 'Erreur lors de la conversion du document.' });
    } finally {
        if (tempDocxPath) fs.unlink(tempDocxPath).catch(err => console.error("Erreur suppression docx:", err));
        if (tempPdfPath) fs.unlink(tempPdfPath).catch(err => console.error("Erreur suppression pdf:", err));
    }
});

// Route pour sauvegarder un tableau
app.post('/api/saveTable', async (req, res) => {
    const { className, sheetName, data } = req.body;
    if (!className || !sheetName || !data) {
        return res.status(400).json({ error: "Données manquantes." });
    }
    try {
        const db = await connectToClassDatabase(className);
        if (!db) return res.status(500).json({ error: `Impossible de se connecter à la DB pour ${className}` });
        
        await db.collection('tables').updateOne({ sheetName }, { $set: { data } }, { upsert: true });
        const allTablesData = await db.collection('tables').find().toArray();
        const formattedTables = allTablesData.map(table => ({ matiere: table.sheetName, data: table.data }));
        await db.collection('savedCopies').insertOne({ timestamp: new Date(), tables: formattedTables });
        
        res.json({ success: true });
    } catch (error) {
        console.error("Erreur en sauvegardant le tableau:", error);
        res.status(500).json({ error: "Erreur serveur lors de la sauvegarde." });
    }
});

// Route pour charger la dernière copie
app.post('/api/loadLatestCopy', async (req, res) => {
    const { className } = req.body;
    if (!className) return res.status(400).json({ error: "Nom de classe requis." });
    try {
        const db = await connectToClassDatabase(className);
        if (!db) return res.status(500).json({ error: `Impossible de se connecter à la DB pour ${className}` });
        
        const latestCopy = await db.collection('savedCopies').find({ 'tables.0': { '$exists': true } }).sort({ timestamp: -1 }).limit(1).toArray();
        if (latestCopy.length > 0 && latestCopy[0].tables) {
            res.json({ success: true, tables: latestCopy[0].tables });
        } else {
            const allTablesData = await db.collection('tables').find().toArray();
            const formattedTables = allTablesData.map(table => ({ matiere: table.sheetName, data: table.data }));
            res.json({ success: true, tables: formattedTables.length > 0 ? formattedTables : [] });
        }
    } catch (error) {
        console.error("Erreur au chargement de la dernière copie:", error);
        res.status(500).json({ success: false, error: "Erreur serveur au chargement." });
    }
});

// Route pour charger toutes les sélections (pour la migration)
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
             return res.json({ success: true, allSelections: {} });
        }
        console.error("Erreur lors du chargement des sélections:", error);
        res.status(500).json({ success: false, error: "Erreur serveur lors du chargement des sélections." });
    }
});

// Route pour supprimer les données d'une matière
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
        res.json({ success: true });
    } catch (error) {
        console.error(`Erreur suppression ${sheetName}:`, error);
        res.status(500).json({ error: "Erreur serveur lors de la suppression." });
    }
});

// Route par défaut pour servir l'application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Vercel gère le démarrage du serveur, on exporte juste l'application Express.
module.exports = app;
