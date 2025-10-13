// API endpoint pour tester la connectivité MongoDB
const { MongoClient } = require('mongodb');
require('dotenv').config();

export default async function handler(req, res) {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const MONGO_URL = process.env.MONGO_URL;
    
    if (!MONGO_URL) {
        return res.status(500).json({ error: 'MONGO_URL non configurée' });
    }
    
    try {
        const client = await MongoClient.connect(MONGO_URL, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 // 5 secondes timeout
        });
        
        await client.db('admin').command({ ismaster: 1 });
        client.close();
        
        res.json({ status: 'success', message: 'Connexion MongoDB réussie' });
    } catch (error) {
        console.error('Erreur test MongoDB:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Échec de connexion MongoDB',
            details: error.message
        });
    }
}