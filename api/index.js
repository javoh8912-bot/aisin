const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));

const IS_VERCEL = process.env.VERCEL === '1';
const TMP_DIR = IS_VERCEL ? '/tmp' : process.cwd();

const DB_FILE = path.join(TMP_DIR, 'accounts.json');
const SETTINGS_FILE = path.join(TMP_DIR, 'settings.json');
const P2P_FILE = path.join(TMP_DIR, 'p2p_chats.json');

// In-memory cache — asosiy saqlash joyi (Vercel uchun)
let _cache = { users: null, settings: null, p2p: null };

// Vercel Environment Variable'dan API key olish
// Agar GEMINI_API_KEY env o'rnatilgan bo'lsa, uni ishlatamiz
const ENV_API_KEY = process.env.GEMINI_API_KEY || "";

function readFile(filePath, def) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8') || JSON.stringify(def));
        }
    } catch(e) {}
    return def;
}

function writeFile(filePath, data) {
    try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); } catch(e) {}
}

// Get Users
app.get('/api/users', (req, res) => {
    if (!_cache.users) _cache.users = readFile(DB_FILE, []);
    res.json(_cache.users);
});

// Save Users
app.post('/api/users', (req, res) => {
    _cache.users = req.body;
    writeFile(DB_FILE, _cache.users);
    res.json({ status: 'success' });
});

// Get Global Settings
app.get('/api/settings', (req, res) => {
    if (!_cache.settings) _cache.settings = readFile(SETTINGS_FILE, {});
    const settings = { ..._cache.settings };
    // Agar env'da API key bo'lsa, uni ustunlik bilan qaytaramiz
    if (ENV_API_KEY) settings.gemini_api_key = ENV_API_KEY;
    res.json(settings);
});

// Save Global Settings
app.post('/api/settings', (req, res) => {
    const incoming = req.body;
    // Agar env API key o'rnatilgan bo'lsa, foydalanuvchi undan yuborilgan keyni saqlamaymiz
    // (env ustuvor)
    _cache.settings = incoming;
    writeFile(SETTINGS_FILE, incoming);
    res.json({ status: 'success' });
});

// Get P2P Chats
app.get('/api/p2p', (req, res) => {
    if (!_cache.p2p) _cache.p2p = readFile(P2P_FILE, {});
    res.json(_cache.p2p);
});

// Save P2P Chats
app.post('/api/p2p', (req, res) => {
    _cache.p2p = req.body;
    writeFile(P2P_FILE, _cache.p2p);
    res.json({ status: 'success' });
});

app.get('/', (req, res) => {
    res.send('Avenaa AI API is running...');
});

module.exports = app;

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 API running at http://localhost:${PORT}`);
    });
}
