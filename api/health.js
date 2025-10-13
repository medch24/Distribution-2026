// API endpoint pour diagnostic de santé
require('dotenv').config();

export default function handler(req, res) {
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
    const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET;

    const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
            node_version: process.version,
            mongodb_configured: !!MONGO_URL,
            mongodb_valid: MONGO_URL ? (MONGO_URL.startsWith('mongodb://') || MONGO_URL.startsWith('mongodb+srv://')) : false,
            convertapi_configured: !!CONVERTAPI_SECRET,
            convertapi_ready: !!CONVERTAPI_SECRET && CONVERTAPI_SECRET !== 'your_convertapi_secret_here'
        },
        services: {
            database: MONGO_URL ? 'configured' : 'not_configured',
            pdf_conversion: (CONVERTAPI_SECRET && CONVERTAPI_SECRET !== 'your_convertapi_secret_here') ? 'ready' : 'not_available'
        }
    };
    
    const httpCode = (status.environment.mongodb_configured && status.environment.convertapi_ready) ? 200 : 206;
    res.status(httpCode).json(status);
}