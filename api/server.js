const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const ConvertAPI = require('convertapi');
const OpenAI = require('openai');
const mammoth = require('mammoth');

const app = express();

const MONGO_URL = process.env.MONGO_URL;
const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const classDatabases = {};

// Validation des variables d'environnement critiques
function validateEnvironmentVariables() {
    const errors = [];
    
    if (!MONGO_URL) {
        errors.push("MONGO_URL n'est pas définie");
    } else if (!MONGO_URL.startsWith('mongodb://') && !MONGO_URL.startsWith('mongodb+srv://')) {
        errors.push("MONGO_URL doit être une URL MongoDB valide");
    }
    
    if (!CONVERTAPI_SECRET) {
        errors.push("CONVERTAPI_SECRET n'est pas définie");
    } else if (CONVERTAPI_SECRET === 'your_convertapi_secret_here') {
        console.warn("⚠️  ATTENTION: Vous utilisez un placeholder pour CONVERTAPI_SECRET. La conversion PDF ne fonctionnera pas.");
    }
    
    if (errors.length > 0) {
        console.error("🚨 ERREURS DE CONFIGURATION:");
        errors.forEach(error => console.error(`   - ${error}`));
        console.error("📋 SOLUTIONS:");
        console.error("   1. Créez un fichier .env avec les bonnes valeurs");
        console.error("   2. Ou définissez les variables d'environnement système");
        console.error("   3. Pour MongoDB: utilisez MongoDB Atlas ou une instance locale");
        console.error("   4. Pour ConvertAPI: inscrivez-vous sur convertapi.com pour obtenir une clé");
    }
    
    return errors.length === 0;
}

// Validation au démarrage
const isConfigValid = validateEnvironmentVariables();

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

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Note : app.use(express.static) n'est plus nécessaire car Vercel gère les fichiers statiques séparément
// grâce à la section "builds" dans vercel.json

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

// === ROUTES API ===

// ---- DOCX Import + IA helpers ----
async function extractTextFromDocx(buffer) {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
    } catch (e) {
        console.error('Erreur extraction DOCX:', e.message);
        return '';
    }
}

function buildPromptForSubject(subject, className, plainText) {
    return `Vous êtes un assistant pédagogique. À partir du texte brut ci-dessous issu d'un document Word (plan de cours/syllabus), générez un plan annuel structuré pour une seule matière.

Contraintes strictes:
- Sortie attendue: un tableau JSON (Array) nommé sessions, chaque entrée représentant une séance dans l'ordre chronologique.
- Ne retournez QUE du JSON valide de la forme {"sessions": [...]}, sans texte additionnel.
- Les clés de chaque objet séance: ["unite", "contenu", "ressources_lecon", "devoir", "ressources_devoir", "recherche", "projet"].
- Répartissez le contenu par semaine en comblant intelligemment les séances disponibles, sans laisser de vides.
- Ajoutez pour la fin de CHAQUE semaine: 1 recherche (recherche) et 1 projet (projet) alignés sur le thème étudié.
- Restez concis, phrases courtes, puces si nécessaire.
- N'incluez pas de dates; l'app se charge d'assigner aux jours planifiables.

Contexte:
- Classe: ${className}
- Matière: ${subject}
- Texte source (extraits nettoyés):\n${plainText.substring(0, 15000)}\n`;
}

async function aiPlanFromText(subject, className, plainText) {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY manquant pour l'analyse IA");
    const client = new OpenAI({ apiKey: OPENAI_API_KEY });
    const prompt = buildPromptForSubject(subject, className, plainText);
    const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: 'Vous êtes un assistant qui renvoie strictement du JSON valide.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.2
    });
    const content = completion.choices?.[0]?.message?.content || '{}';
    let sessions = [];
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) sessions = parsed; // au cas où
        else if (Array.isArray(parsed.sessions)) sessions = parsed.sessions;
        else if (Array.isArray(parsed.data)) sessions = parsed.data;
    } catch (e) {
        console.warn('JSON IA invalide, utilisation d\'un tableau vide');
        sessions = [];
    }
    return sessions;
}

function fillGridWithSessions(baseGrid, sessions, sessionsPerWeek, sheetName) {
    const data = baseGrid.map(r => r.slice());
    const items = sessions || [];

    // Créer groupes par semaine
    const weeks = {};
    let currentWeekNum = 0;
    data.slice(1).forEach((row) => {
        const weekLabel = row[1];
        if (weekLabel && weekLabel.startsWith('Semaine ')) {
            const num = parseInt(weekLabel.replace('Semaine ', ''));
            currentWeekNum = num;
        }
        if (!weeks[currentWeekNum]) weeks[currentWeekNum] = { rows: [], filled: 0 };
        if (weeks[currentWeekNum].filled < sessionsPerWeek) {
            weeks[currentWeekNum].rows.push(row);
            weeks[currentWeekNum].filled++;
        }
    });

    // Aplatir slots
    const slots = [];
    Object.keys(weeks).forEach(w => weeks[w].rows.forEach(r => slots.push({ week: parseInt(w), rowRef: r })));

    // Distribuer les éléments IA
    let i = 0;
    for (const slot of slots) {
        if (i >= items.length) break;
        const it = items[i++];
        slot.rowRef[4] = (it.unite || '').toString();
        slot.rowRef[5] = (it.contenu || '').toString();
        slot.rowRef[6] = (it.ressources_lecon || '').toString();
        slot.rowRef[7] = (it.devoir || '').toString();
        slot.rowRef[8] = (it.ressources_devoir || '').toString();
        slot.rowRef[9] = (it.recherche || '').toString();
        slot.rowRef[10] = (it.projet || '').toString();
    }

    // Post-traitement: éviter les vides et ajouter recherche/projet fin de semaine
    Object.keys(weeks).forEach(wk => {
        const group = weeks[wk];
        let lastTheme = '';
        group.rows.forEach(r => { if (r[4]) lastTheme = r[4]; });
        group.rows.forEach((r, idx) => {
            if (!r[5]) r[5] = 'Consolidation et pratique guidée';
            if (!r[7]) r[7] = 'Exercices de consolidation';
            if (!r[6]) r[6] = 'Manuel, diapos, activités interactives';
            if (!r[8]) r[8] = 'Lien de ressources, fiche d\'exercices';
            if (idx === group.rows.length - 1) {
                if (!r[9]) r[9] = `Recherche: approfondissement du thème ${lastTheme || sheetName}`;
                if (!r[10]) r[10] = `Projet: mini-projet d\'application sur ${lastTheme || sheetName}`;
            }
        });
    });

    return data;
}

app.post('/importDocxAnalyze', async (req, res) => {
    try {
        const { className, sheetName, fileName, fileBase64 } = req.body;
        if (!className || !sheetName || !fileBase64) {
            return res.status(400).json({ success: false, error: 'Paramètres manquants.' });
        }
        const buffer = Buffer.from(fileBase64, 'base64');
        const plainText = await extractTextFromDocx(buffer);

        // Demande à l'IA une liste de séances structurées (sans placement calendrier)
        const sessions = await aiPlanFromText(sheetName, className, plainText);

        // On renvoie les "sessions" côté front pour distribution selon le calendrier réel
        res.json({ success: true, sessions });
    } catch (e) {
        console.error('Erreur importDocxAnalyze:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Route de diagnostic/health check
app.get('/health', (req, res) => {
    const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
            node_version: process.version,
            mongodb_configured: !!MONGO_URL,
            mongodb_valid: MONGO_URL ? (MONGO_URL.startsWith('mongodb://') || MONGO_URL.startsWith('mongodb+srv://')) : false,
            convertapi_configured: !!CONVERTAPI_SECRET,
            convertapi_ready: !!convertapi && CONVERTAPI_SECRET !== 'your_convertapi_secret_here'
        },
        services: {
            database: MONGO_URL ? 'configured' : 'not_configured',
            pdf_conversion: convertapi ? 'ready' : 'not_available'
        }
    };
    
    const httpCode = (status.environment.mongodb_configured && status.environment.convertapi_ready) ? 200 : 206;
    res.status(httpCode).json(status);
});

// Route de test de connectivité MongoDB
app.get('/test-mongo', async (req, res) => {
    if (!MONGO_URL) {
        return res.status(500).json({ error: 'MONGO_URL non configurée' });
    }
    
    try {
        const { MongoClient } = require('mongodb');
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
});

app.post('/generatePdfOnServer', async (req, res) => {
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
});

app.post('/saveTable', async (req, res) => {
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

app.post('/loadLatestCopy', async (req, res) => {
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

app.post('/loadAllSelectionsForClass', async (req, res) => {
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

app.post('/deleteMatiereData', async (req, res) => {
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

// Vercel démarre le serveur, donc on exporte l'instance.
module.exports = app;
