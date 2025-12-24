const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const ConvertAPI = require('convertapi');
const OpenAI = require('openai');
// Node 18+ has global fetch; used for GROQ fallback
const mammoth = require('mammoth');

const app = express();

const MONGO_URL = process.env.MONGO_URL;
const CONVERTAPI_SECRET = process.env.CONVERTAPI_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const classDatabases = {};

// --- Utils ---
let mongoClient = null;
let mongoPromise = null;
async function getMongoClient() {
  if (mongoClient) return mongoClient;
  if (!MONGO_URL) return null;
  if (!mongoPromise) {
    mongoPromise = (async () => {
      const client = new MongoClient(MONGO_URL, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
      });
      await client.connect();
      return client;
    })().catch((e) => { console.error('DB connect error:', e); mongoPromise = null; return null; });
  }
  mongoClient = await mongoPromise;
  return mongoClient;
}

async function connectToClassDatabase(className) {
  if (classDatabases[className]) return classDatabases[className];
  const client = await getMongoClient();
  if (!client) return null;
  try {
    const dbName = `Classe_${className.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const db = client.db(dbName);
    classDatabases[className] = db;
    return db;
  } catch (e) {
    console.error('DB select error:', e);
    return null;
  }
}

let convertapi = null;
if (CONVERTAPI_SECRET && CONVERTAPI_SECRET !== 'your_convertapi_secret_here') {
  try { convertapi = new ConvertAPI(CONVERTAPI_SECRET); } catch (_) {}
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Normalize Vercel path prefix so routes work whether called as "/events" or "/api/events"
app.use((req, _res, next) => {
  if (req.url === '/api') req.url = '/';
  else if (req.url.startsWith('/api/')) req.url = req.url.substring(4);
  next();
});

// === SSE (auto-refresh + présence) ===
const sseClients = new Set();
function broadcast(event, payload) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch (_) {}
  }
}

const presence = {}; // key => { userId: timestamp }
function cleanupPresence() {
  const now = Date.now();
  Object.keys(presence).forEach(key => {
    Object.keys(presence[key]).forEach(uid => {
      if (now - presence[key][uid] > 30000) delete presence[key][uid];
    });
    if (Object.keys(presence[key]).length === 0) delete presence[key];
  });
}
setInterval(cleanupPresence, 10000);

// Alias to support direct "/api/events" calls too (after prefix-strip this still matches)
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for SSE
  res.flushHeaders && res.flushHeaders();
  
  // Send initial ping
  res.write(`event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  sseClients.add(res);
  
  // Send keepalive every 30 seconds to prevent timeout
  const keepaliveInterval = setInterval(() => {
    try {
      res.write(`:keepalive ${Date.now()}\n\n`);
    } catch (e) {
      clearInterval(keepaliveInterval);
      sseClients.delete(res);
    }
  }, 30000);
  
  // Cleanup on close
  req.on('close', () => {
    clearInterval(keepaliveInterval);
    sseClients.delete(res);
  });
  
  // Auto-close after 5 minutes to prevent long-running connections on Vercel
  setTimeout(() => {
    try {
      clearInterval(keepaliveInterval);
      sseClients.delete(res);
      res.end();
    } catch (e) {}
  }, 300000);
});

app.post('/presence/heartbeat', (req, res) => {
  try {
    const { className, sheetName, userId } = req.body || {};
    if (!className || !sheetName || !userId) return res.status(400).json({ success: false });
    const key = `${className}:${sheetName}`;
    if (!presence[key]) presence[key] = {};
    presence[key][userId] = Date.now();
    broadcast('presence', { key, count: Object.keys(presence[key]).length, ts: Date.now() });
    res.json({ success: true });
  } catch (_) {
    res.status(500).json({ success: false });
  }
});

// === Health ===
// Health endpoint (+ alias via prefix normalizer)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      node_version: process.version,
      mongodb_configured: !!MONGO_URL,
      convertapi_configured: !!CONVERTAPI_SECRET,
      openai_configured: !!OPENAI_API_KEY,
      groq_configured: !!GROQ_API_KEY,
      gemini_configured: !!GEMINI_API_KEY,
    },
    services: { pdf_conversion: !!convertapi ? 'ready' : 'not_available' },
  });
});

app.get('/test-mongo', async (req, res) => {
  if (!MONGO_URL) return res.status(500).json({ error: 'MONGO_URL non configurée' });
  try {
    const client = await getMongoClient();
    if (!client) return res.status(500).json({ status: 'error', details: 'Impossible de se connecter au cluster' });
    const admin = client.db('admin');
    const info = await admin.command({ ping: 1 });
    res.json({ status: 'success', info });
  } catch (e) { res.status(500).json({ status: 'error', details: e.message }); }
});

// === Import DOCX + IA ===
async function extractTextFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (e) {
    return '';
  }
}
function buildPromptForSubject(subject, className, plainText) {
  return `Vous êtes un assistant pédagogique. À partir du texte brut ci-dessous issu d'un document Word (plan de cours/syllabus), générez un plan annuel structuré pour une seule matière.\n\nContraintes strictes:\n- Sortie attendue: un tableau JSON (Array) nommé sessions, chaque entrée représentant une séance dans l'ordre chronologique.\n- Ne retournez QUE du JSON valide de la forme {"sessions": [...]}, sans texte additionnel.\n- Les clés de chaque objet séance: ["unite", "contenu", "ressources_lecon", "devoir", "ressources_devoir", "recherche", "projet"].\n- Répartissez le contenu par semaine en comblant intelligemment les séances disponibles, sans laisser de vides.\n- Ajoutez pour la fin de CHAQUE semaine: 1 recherche (recherche) et 1 projet (projet) alignés sur le thème étudié.\n- Restez concis, phrases courtes, puces si nécessaire.\n- N'incluez pas de dates; l'app se charge d'assigner aux jours planifiables.\n\nContexte:\n- Classe: ${className}\n- Matière: ${subject}\n- Texte source (extraits nettoyés):\n${plainText.substring(0, 15000)}\n`;
}
async function aiPlanFromText(subject, className, plainText) {
  const userPrompt = buildPromptForSubject(subject, className, plainText);
  if (OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Vous renvoyez strictement un JSON valide.' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      });
      const text = completion.choices?.[0]?.message?.content || '{}';
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.sessions)) return parsed.sessions;
        if (Array.isArray(parsed.data)) return parsed.data;
      } catch (_) {}
    } catch (e) {
      console.error('OpenAI error, will try GROQ fallback:', e.message);
    }
  }
  if (GROQ_API_KEY) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: 'Vous renvoyez strictement un JSON valide.' },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2
        })
      });
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || '{}';
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.sessions)) return parsed.sessions;
        if (Array.isArray(parsed.data)) return parsed.data;
      } catch (_) {}
    } catch (e) {
      console.error('GROQ error:', e.message);
    }
  }
  return [];
}

app.post('/importDocxAnalyze', async (req, res) => {
  try {
    const { className, sheetName, fileName, fileBase64 } = req.body || {};
    if (!className || !sheetName || !fileBase64) return res.status(400).json({ success: false, error: 'Paramètres manquants.' });
    const buffer = Buffer.from(fileBase64, 'base64');
    const plainText = await extractTextFromDocx(buffer);
    const sessions = await aiPlanFromText(sheetName, className, plainText);
    res.json({ success: true, sessions });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// === PDF conversion ===
app.post('/generatePdfOnServer', async (req, res) => {
  if (!convertapi) return res.status(503).json({ error: 'Service de conversion PDF non disponible.' });
  const { docxBuffer, fileName } = req.body || {};
  if (!docxBuffer || !fileName) return res.status(400).json({ error: 'Paramètres manquants.' });
  let tempDocxPath = null, tempPdfPath = null;
  try {
    const ts = Date.now();
    const nodeBuffer = Buffer.from(docxBuffer, 'base64');
    tempDocxPath = path.join('/tmp', `docx-in-${ts}-${fileName}`);
    tempPdfPath = path.join('/tmp', `pdf-out-${ts}.pdf`);
    await fs.writeFile(tempDocxPath, nodeBuffer);
    const result = await convertapi.convert('pdf', { File: tempDocxPath }, 'docx');
    await result.file.save(tempPdfPath);
    const pdfBuffer = await fs.readFile(tempPdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName.replace('.docx', '.pdf')}`);
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ error: 'Erreur conversion PDF.' });
  } finally {
    if (tempDocxPath) await fs.unlink(tempDocxPath).catch(()=>{});
    if (tempPdfPath) await fs.unlink(tempPdfPath).catch(()=>{});
  }
});

// === Données principales ===
app.post('/saveTable', async (req, res) => {
  const { className, sheetName, data } = req.body || {};
  if (!className || !sheetName || !data) return res.status(400).json({ error: 'Missing data.' });
  try {
    const db = await connectToClassDatabase(className);
    if (!db) return res.status(500).json({ error: `Cannot connect to DB for ${className}` });
    await db.collection('tables').updateOne({ sheetName }, { $set: { data } }, { upsert: true });
    const allTables = await db.collection('tables').find().toArray();
    const formatted = allTables.map(t => ({ matiere: t.sheetName, data: t.data }));
    await db.collection('savedCopies').insertOne({ timestamp: new Date(), tables: formatted });
    // also persist selections if present in payload in future
    broadcast('refresh', { className, sheetName, ts: Date.now() });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: `Error saving table: ${e.message}` });
  }
});

app.post('/loadLatestCopy', async (req, res) => {
  const { className } = req.body || {};
  if (!className) return res.status(400).json({ error: 'Class name is required.' });
  try {
    const db = await connectToClassDatabase(className);
    if (!db) return res.status(500).json({ error: `Cannot connect to DB for ${className}` });
    const latest = await db.collection('savedCopies').find({}).sort({ timestamp: -1 }).limit(1).toArray();
    if (latest.length > 0 && Array.isArray(latest[0].tables)) return res.json({ success: true, tables: latest[0].tables });
    const allTables = await db.collection('tables').find().toArray();
    const formatted = allTables.map(t => ({ matiere: t.sheetName, data: t.data }));
    res.json({ success: true, tables: formatted.length > 0 ? formatted : [] });
  } catch (e) {
    if (e.codeName === 'NamespaceNotFound') return res.json({ success: true, tables: [] });
    res.status(500).json({ success: false, error: `Error loading saved data: ${e.message}` });
  }
});

app.post('/loadAllSelectionsForClass', async (req, res) => {
  const { className } = req.body || {};
  if (!className) return res.status(400).json({ success: false, error: 'Le nom de la classe est requis.' });
  try {
    const db = await connectToClassDatabase(className);
    if (!db) return res.status(500).json({ success: false, error: `Impossible de se connecter à la DB pour ${className}` });
    const all = await db.collection('selections').find({}).toArray();
    const bySheet = {};
    all.forEach(sel => {
      if (!bySheet[sel.sheetName]) bySheet[sel.sheetName] = {};
      bySheet[sel.sheetName][sel.cellKey] = { unit: sel.unit, resources: sel.resources };
    });
    res.json({ success: true, allSelections: bySheet });
  } catch (e) {
    if (e.codeName === 'NamespaceNotFound') return res.json({ success: true, allSelections: {} });
    res.status(500).json({ success: false, error: 'Erreur serveur lors du chargement des sélections.' });
  }
});

app.post('/deleteMatiereData', async (req, res) => {
  const { className, sheetName } = req.body || {};
  if (!className || !sheetName) return res.status(400).json({ error: 'Nom de classe ou de matière manquant.' });
  try {
    const db = await connectToClassDatabase(className);
    if (!db) return res.status(500).json({ error: `Impossible de se connecter à la DB pour ${className}` });
    await db.collection('tables').deleteOne({ sheetName });
    await db.collection('selections').deleteMany({ sheetName });
    await db.collection('resources').deleteMany({ sheetName });
    await db.collection('units').deleteMany({ sheetName });
    const latest = await db.collection('savedCopies').find().sort({ timestamp: -1 }).limit(1).toArray();
    if (latest.length > 0) {
      const copy = latest[0];
      const updated = copy.tables.filter(t => t.matiere !== sheetName);
      await db.collection('savedCopies').updateOne({ _id: copy._id }, { $set: { tables: updated } });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// === Distribution Automatique avec Gemini ===
function buildPromptForGemini(subject, className, manuelSummary, cahierSummary) {
  return `Tu es un assistant pédagogique expert. À partir des sommaires du livre manuel et du cahier d'activité fournis ci-dessous, génère un plan annuel structuré et complet pour la matière "${subject}" en classe ${className}.

CONTRAINTES STRICTES:
1. Sortie attendue: un tableau JSON (Array) nommé "sessions", chaque entrée représentant UNE séance dans l'ordre chronologique
2. Retourne UNIQUEMENT du JSON valide de la forme {"sessions": [...]}, sans texte additionnel
3. Chaque objet séance doit contenir ces clés: ["unite", "contenu", "ressources_lecon", "devoir", "ressources_devoir", "recherche", "projet"]
4. Répartis intelligemment le contenu sur TOUTE l'année scolaire (environ 150-180 séances selon la matière)
5. Respecte la progression logique: manuel d'abord, puis exercices du cahier correspondants
6. Pour chaque SEMAINE (environ 5 séances), ajoute:
   - "recherche": une activité de recherche liée au thème de la semaine
   - "projet": un mini-projet d'application pratique
7. Sois concis: phrases courtes, puces si nécessaire
8. Ne mets PAS de dates - l'application les assignera automatiquement

SOMMAIRE DU LIVRE MANUEL:
${manuelSummary}

SOMMAIRE DU CAHIER D'ACTIVITÉ:
${cahierSummary}

Génère maintenant le JSON avec toutes les séances pour couvrir l'année complète en alternant contenu théorique (manuel) et pratique (cahier).`;
}

async function callGeminiAPI(subject, className, manuelSummary, cahierSummary) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY non configurée');
  }
  
  const prompt = buildPromptForGemini(subject, className, manuelSummary, cahierSummary);
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8000,
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Nettoyer le JSON potentiellement entouré de markdown
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    try {
      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.sessions)) return parsed.sessions;
      if (Array.isArray(parsed.data)) return parsed.data;
      return [];
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw text:', text);
      return [];
    }
  } catch (error) {
    console.error('Gemini API call error:', error);
    throw error;
  }
}

app.post('/generateAIDistributionGemini', async (req, res) => {
  try {
    const { className, sheetName, manuelSummary, cahierSummary } = req.body || {};
    
    if (!className || !sheetName || !manuelSummary || !cahierSummary) {
      return res.status(400).json({ 
        success: false, 
        error: 'Paramètres manquants (classe, matière, sommaire manuel, sommaire cahier requis).' 
      });
    }
    
    // Vérifier que c'est une classe éligible
    if (!['PEI1', 'PEI2', 'PEI3', 'PEI4', 'DP2'].includes(className)) {
      return res.status(400).json({
        success: false,
        error: 'Cette fonctionnalité est disponible uniquement pour PEI1, PEI2, PEI3, PEI4 et DP2.'
      });
    }
    
    const sessions = await callGeminiAPI(sheetName, className, manuelSummary, cahierSummary);
    
    if (!sessions || sessions.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'L\'IA n\'a pas pu générer de sessions valides. Veuillez vérifier les sommaires.'
      });
    }
    
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error in generateAIDistributionGemini:', error);
    res.status(500).json({ 
      success: false, 
      error: `Erreur lors de la génération IA: ${error.message}` 
    });
  }
});

// Export handler for Vercel serverless (@vercel/node)
module.exports = (req, res) => app(req, res);
