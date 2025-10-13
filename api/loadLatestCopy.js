// API endpoint pour charger la dernière copie sauvegardée d'une classe
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

export default async function handler(req, res) {
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

    const { className } = req.body;
    if (!className) {
        return res.status(400).json({ error: "Class name is required." });
    }

    try {
        const db = await connectToClassDatabase(className);
        if (!db) {
            return res.status(500).json({ error: `Cannot connect to DB for ${className}` });
        }
        
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
}