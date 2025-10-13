// API endpoint pour supprimer les données d'une matière
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;
const classDatabases = {};

async function connectToClassDatabase(className) {
    if (classDatabases[className]) return classDatabases[className];
    if (!MONGO_URL) {
        console.error("MONGO_URL n'est pas défini. Impossible de se connecter.");
        return null;
    }
    try {
        const client = await MongoClient.connect(MONGO_URL, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10 secondes timeout
            connectTimeoutMS: 10000,
            maxPoolSize: 10
        });
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

module.exports = async function handler(req, res) {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { className, sheetName } = req.body;
    if (!className || !sheetName) {
        return res.status(400).json({ error: "Nom de classe ou de matière manquant." });
    }

    try {
        const db = await connectToClassDatabase(className);
        if (!db) {
            return res.status(500).json({ error: `Impossible de se connecter à la DB pour ${className}` });
        }
        
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
}