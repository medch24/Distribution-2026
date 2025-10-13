// API endpoint pour générer des PDF via ConvertAPI
const fs = require('fs').promises;
const path = require('path');
const ConvertAPI = require('convertapi');
require('dotenv').config();

const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET;

// Initialisation conditionnelle de ConvertAPI
let convertapi = null;
if (CONVERTAPI_SECRET && CONVERTAPI_SECRET !== 'your_convertapi_secret_here') {
    try {
        convertapi = new ConvertAPI(CONVERTAPI_SECRET);
        console.log("✅ ConvertAPI initialisé avec succès");
    } catch (error) {
        console.error("❌ Erreur d'initialisation ConvertAPI:", error.message);
    }
} else {
    console.warn("⚠️  ConvertAPI non initialisé - les conversions PDF seront désactivées");
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

    // Vérification de la disponibilité de ConvertAPI
    if (!convertapi) {
        return res.status(503).json({ 
            error: 'Service de conversion PDF non disponible. Veuillez configurer CONVERTAPI_SECRET dans les variables d\'environnement.'
        });
    }

    const { docxBuffer, fileName } = req.body;
    if (!docxBuffer) {
        return res.status(400).json({ error: 'Données du document manquantes.' });
    }
    if (!fileName) {
        return res.status(400).json({ error: 'Nom de fichier manquant.' });
    }
    
    let tempDocxPath = null;
    let tempPdfPath = null;
    
    try {
        const timestamp = Date.now();
        const nodeBuffer = Buffer.from(docxBuffer, 'base64');
        
        tempDocxPath = path.join('/tmp', `docx-in-${timestamp}-${fileName}`);
        tempPdfPath = path.join('/tmp', `pdf-out-${timestamp}.pdf`);
        
        await fs.writeFile(tempDocxPath, nodeBuffer);
        
        console.log(`🔄 Conversion PDF en cours: ${fileName}`);
        const result = await convertapi.convert('pdf', { File: tempDocxPath }, 'docx');
        await result.file.save(tempPdfPath);
        
        const pdfBuffer = await fs.readFile(tempPdfPath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName.replace('.docx', '.pdf')}`);
        res.send(pdfBuffer);
        
        console.log(`✅ Conversion PDF réussie: ${fileName}`);

    } catch (error) {
        console.error('❌ Erreur de ConvertAPI:', error.toString());
        
        let errorMessage = 'Une erreur est survenue lors de la conversion du document.';
        
        // Messages d'erreur plus spécifiques
        if (error.message.includes('Invalid API key')) {
            errorMessage = 'Clé API ConvertAPI invalide. Vérifiez votre configuration.';
        } else if (error.message.includes('Insufficient credits')) {
            errorMessage = 'Crédits ConvertAPI insuffisants. Rechargez votre compte ConvertAPI.';
        } else if (error.message.includes('Network')) {
            errorMessage = 'Erreur réseau lors de la conversion. Réessayez plus tard.';
        }
        
        res.status(500).json({ error: errorMessage });
    } finally {
        // Nettoyage des fichiers temporaires
        if (tempDocxPath) {
            await fs.unlink(tempDocxPath).catch(e => console.warn("Avertissement nettoyage DOCX:", e.message));
        }
        if (tempPdfPath) {
            await fs.unlink(tempPdfPath).catch(e => console.warn("Avertissement nettoyage PDF:", e.message));
        }
    }
}