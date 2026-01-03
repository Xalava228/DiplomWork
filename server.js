// Загружаем переменные окружения из .env файла
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const nodemailer = require('nodemailer');
<<<<<<< HEAD
const crypto = require('crypto');
=======
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const TRAINERS_FILE = path.join(DATA_DIR, 'trainers.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const HALLS_FILE = path.join(DATA_DIR, 'halls.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const SOCIALS_FILE = path.join(DATA_DIR, 'socials.json');
<<<<<<< HEAD
const TELEGRAM_SUBSCRIBERS_FILE = path.join(DATA_DIR, 'telegram_subscribers.json');
// LEADS_FILE больше не используется - заявки не сохраняются
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WHATSAPP_PHONE = process.env.WHATSAPP_PHONE;
=======
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const LEADS_EMAIL_TO = process.env.LEADS_EMAIL_TO;

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-session-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';

const initialTrainers = require('./data/trainers.json');
const initialNews = require('./data/news.json');
const initialHalls = require('./data/halls.json');
const initialSchedule = require('./data/schedule.json');
const initialContacts = require('./data/contacts.json');
const initialSocials = require('./data/socials.json');
<<<<<<< HEAD
=======
const initialLeads = [];
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095

function resolveAdminPasswordHash() {
    if (ADMIN_PASSWORD_HASH) {
        return ADMIN_PASSWORD_HASH;
    }

    const password = ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    return bcrypt.hashSync(password, 10);
}

const ADMIN_HASH = resolveAdminPasswordHash();

<<<<<<< HEAD
// Улучшенный санитайзер строк для защиты от XSS
=======
// Простой санитайзер строк, чтобы срезать теги и управляемую длину
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
function sanitizeString(value, max = 500) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim().slice(0, max);
    return trimmed
        .replace(/<script.*?>.*?<\/script>/gi, '')
<<<<<<< HEAD
        .replace(/<iframe.*?>.*?<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
}

// Валидация и санитизация URL
function sanitizeUrl(url, maxLength = 300) {
    if (typeof url !== 'string') return '';
    const trimmed = url.trim().slice(0, maxLength);
    
    // Разрешаем пустые строки
    if (!trimmed) return '';
    
    // Разрешаем только http/https URLs или относительные пути
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        // Защита от path traversal
        if (trimmed.includes('..')) {
            return '';
        }
        // Проверяем двойной слеш, но не в начале протокола (http:// или https://)
        const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
        if (withoutProtocol.includes('//')) {
            return '';
        }
        return sanitizeString(trimmed, maxLength);
    }
    return '';
=======
        .replace(/<\/?[^>]+(>|$)/g, '');
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
}

function sanitizeStringArray(values, max = 100, limit = 20) {
    if (!Array.isArray(values)) return [];
<<<<<<< HEAD
    // Ограничиваем количество элементов и длину каждого
    return values.slice(0, limit)
        .map(v => sanitizeString(v, max))
        .filter(Boolean)
        .filter(v => v.length > 0 && v.length <= max);
=======
    return values.slice(0, limit).map(v => sanitizeString(v, max)).filter(Boolean);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
}

async function ensureDataFile(filePath, defaultValue) {
    try {
        await fsPromises.access(filePath, fs.constants.F_OK);
    } catch {
        await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
        await fsPromises.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
    }
}

async function ensureUploadsDir() {
    await fsPromises.mkdir(UPLOADS_DIR, { recursive: true });
}

<<<<<<< HEAD
// Функции для работы с подписчиками Telegram
async function getTelegramSubscribers() {
    try {
        const subscribers = await readJson(TELEGRAM_SUBSCRIBERS_FILE);
        return Array.isArray(subscribers) ? subscribers : [];
    } catch {
        return [];
    }
}

async function addTelegramSubscriber(chatId) {
    try {
        const subscribers = await getTelegramSubscribers();
        const chatIdStr = String(chatId);
        if (!subscribers.includes(chatIdStr)) {
            subscribers.push(chatIdStr);
            await writeJson(TELEGRAM_SUBSCRIBERS_FILE, subscribers);
            console.log(`✅ Добавлен подписчик Telegram: ${chatIdStr}`);
        }
        return true;
    } catch (err) {
        console.error('❌ Ошибка добавления подписчика:', err);
        return false;
    }
}

async function removeTelegramSubscriber(chatId) {
    try {
        const subscribers = await getTelegramSubscribers();
        const chatIdStr = String(chatId);
        const filtered = subscribers.filter(id => id !== chatIdStr);
        if (filtered.length !== subscribers.length) {
            await writeJson(TELEGRAM_SUBSCRIBERS_FILE, filtered);
            console.log(`✅ Удалён подписчик Telegram: ${chatIdStr}`);
        }
        return true;
    } catch (err) {
        console.error('❌ Ошибка удаления подписчика:', err);
        return false;
    }
}

async function sendTelegramMessage(chatId, message) {
    if (!TELEGRAM_BOT_TOKEN) {
        return false;
    }
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };
    
    try {
        const response = await fetch(url, {
=======
async function notifyTelegram(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
    };
    try {
        await fetch(url, {
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
<<<<<<< HEAD
        
        const data = await response.json();
        
        if (!response.ok || !data.ok) {
            const errorMsg = data.description || data.error_code || `HTTP ${response.status}`;
            throw new Error(errorMsg);
        }
        
        return true;
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(`❌ Ошибка отправки в Telegram (Chat ID: ${String(chatId).substring(0, 10)}...):`, err.message);
        }
        return false;
    }
}

async function notifyTelegram(message) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('⚠️ Telegram не настроен: отсутствует TELEGRAM_BOT_TOKEN');
        return false;
    }
    
    // Собираем всех получателей: из .env + подписчики
    const chatIds = new Set();
    
    // Добавляем Chat ID из .env (если указан)
    if (TELEGRAM_CHAT_ID) {
        TELEGRAM_CHAT_ID.split(',').forEach(id => {
            const trimmed = id.trim();
            if (trimmed) chatIds.add(trimmed);
        });
    }
    
    // Добавляем подписчиков
    const subscribers = await getTelegramSubscribers();
    subscribers.forEach(id => {
        const trimmed = String(id).trim();
        if (trimmed) chatIds.add(trimmed);
    });
    
    if (chatIds.size === 0) {
        console.warn('⚠️ Telegram не настроен: нет получателей (ни в .env, ни подписчиков)');
        return false;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // Отправляем сообщение каждому получателю
    for (const chatId of chatIds) {
        const success = await sendTelegramMessage(chatId, message);
        if (success) {
            successCount++;
        } else {
            failCount++;
            // Если не удалось отправить подписчику, удаляем его из списка
            if (subscribers.includes(String(chatId))) {
                await removeTelegramSubscriber(chatId);
            }
        }
    }
    
    if (successCount > 0) {
        console.log(`✅ Telegram сообщение отправлено ${successCount} из ${chatIds.size} получателей`);
        return true;
    } else {
        console.error(`❌ Не удалось отправить сообщение ни одному получателю из ${chatIds.size}`);
        return false;
    }
}

async function notifyWhatsApp(message) {
    // Используем CallMeBot API (бесплатный сервис для WhatsApp)
    if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE) return;
    
    // Форматируем сообщение для WhatsApp (убираем HTML теги)
    const plainText = message
        .replace(/<b>(.*?)<\/b>/g, '*$1*')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ');
    
    const url = `https://api.callmebot.com/whatsapp.php?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(plainText)}&apikey=${WHATSAPP_API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Не удалось отправить в WhatsApp', err);
        }
=======
    } catch (err) {
        console.error('Не удалось отправить в Telegram', err);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    }
}

function createMailTransport() {
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        console.warn('⚠️ SMTP не настроен. Проверь переменные окружения в .env файле:');
        console.warn('   SMTP_HOST:', SMTP_HOST || 'НЕ ЗАДАН');
        console.warn('   SMTP_PORT:', SMTP_PORT || 'НЕ ЗАДАН');
        console.warn('   SMTP_USER:', SMTP_USER || 'НЕ ЗАДАН');
        console.warn('   SMTP_PASS:', SMTP_PASS ? '***' : 'НЕ ЗАДАН');
        return null;
    }
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
}

const mailTransport = createMailTransport();

if (mailTransport) {
    console.log('✅ SMTP настроен:', SMTP_HOST, ':', SMTP_PORT);
    console.log('   Отправка на:', LEADS_EMAIL_TO || 'НЕ ЗАДАН');
} else {
    console.log('❌ SMTP не настроен. Заявки не будут отправляться на email.');
}

async function notifyEmail(lead) {
    if (!mailTransport) {
        console.warn('⚠️ Пропуск отправки email: SMTP не настроен');
        return;
    }
    if (!LEADS_EMAIL_TO) {
        console.warn('⚠️ Пропуск отправки email: LEADS_EMAIL_TO не задан');
        return;
    }
    const subject = `Новая заявка: ${lead.name || 'без имени'}`;
    const html = `
        <h3>Новая заявка</h3>
        <p><strong>Имя:</strong> ${lead.name || ''}</p>
        <p><strong>Телефон:</strong> ${lead.phone || ''}</p>
        ${lead.message ? `<p><strong>Сообщение:</strong> ${lead.message}</p>` : ''}
        <p><small>Создано: ${lead.createdAt}</small></p>
    `;
    try {
        const info = await mailTransport.sendMail({
            from: SMTP_USER,
            to: LEADS_EMAIL_TO,
            subject,
            html
        });
        console.log('✅ Email отправлен успешно:', info.messageId);
    } catch (err) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('❌ Ошибка отправки email:', err.message);
            if (err.code) console.error('   Код ошибки:', err.code);
            if (err.response) console.error('   Ответ сервера:', err.response);
        }
=======
        console.error('❌ Ошибка отправки email:', err.message);
        if (err.code) console.error('   Код ошибки:', err.code);
        if (err.response) console.error('   Ответ сервера:', err.response);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    }
}

async function bootstrapData() {
    await ensureDataFile(TRAINERS_FILE, initialTrainers);
    await ensureDataFile(NEWS_FILE, initialNews);
    await ensureDataFile(HALLS_FILE, initialHalls);
    await ensureDataFile(SCHEDULE_FILE, initialSchedule);
    await ensureDataFile(CONTACTS_FILE, initialContacts);
    await ensureDataFile(SOCIALS_FILE, initialSocials);
<<<<<<< HEAD
    await ensureDataFile(TELEGRAM_SUBSCRIBERS_FILE, []);
=======
    await ensureDataFile(LEADS_FILE, initialLeads);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    await ensureUploadsDir();
}

function requireAdmin(req, res, next) {
<<<<<<< HEAD
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔐 requireAdmin проверка:', {
            hasSession: !!req.session,
            isAdmin: req.session?.isAdmin,
            sessionID: req.sessionID,
            cookie: req.headers.cookie ? 'есть' : 'нет'
        });
    }
    
    if (req.session && req.session.isAdmin) {
        return next();
    }
    
    if (process.env.NODE_ENV !== 'production') {
        console.warn('❌ Доступ запрещён. Сессия:', req.session ? 'есть' : 'нет', 'isAdmin:', req.session?.isAdmin);
    }
    
    return res.status(401).json({ message: 'Требуется авторизация администратора' });
}

// Генерация CSRF токена для админ-панели
function generateCSRFToken(req) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    return req.session.csrfToken;
}

function validateCSRFToken(req) {
    // Express нормализует заголовки в lowercase
    const token = (req.headers['x-csrf-token'] || req.body?.csrfToken || '').trim();
    
    if (!req.session || !req.session.csrfToken) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️ CSRF токен не найден в сессии');
        }
        return false;
    }
    
    if (!token) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️ CSRF токен не передан в запросе. Заголовки:', Object.keys(req.headers).filter(k => k.toLowerCase().includes('csrf')));
        }
        return false;
    }
    
    const isValid = token === req.session.csrfToken;
    if (!isValid && process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ CSRF токен не совпадает');
        console.warn('   Ожидался:', req.session.csrfToken?.substring(0, 10) + '...');
        console.warn('   Получен:', token.substring(0, 10) + '...');
    }
    
    return isValid;
}

=======
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ message: 'Требуется авторизация администратора' });
}

>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
async function readJson(filePath) {
    const raw = await fsPromises.readFile(filePath, 'utf8');
    return JSON.parse(raw || '[]');
}

async function writeJson(filePath, data) {
    await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https:", "'unsafe-inline'"],
            styleSrc: ["'self'", "https:", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            connectSrc: ["'self'", "https:"],
            frameSrc: ["'self'", "https:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' }
}));

app.use(express.json({ limit: '200kb' }));

// Обработка ошибок парсинга JSON
app.use((err, _req, res, next) => {
    if (err instanceof SyntaxError) {
        return res.status(400).json({ message: 'Некорректный JSON' });
    }
    return next(err);
});

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(session({
    name: 'sambo.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
<<<<<<< HEAD
        secure: false, // Для localhost всегда false
=======
        secure: process.env.NODE_ENV === 'production',
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        maxAge: 1000 * 60 * 60 * 12 // 12 часов
    }
}));

// Rate limit для auth и админ-операций
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});

const adminWriteLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
});

const contactLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

// Блокируем прямой доступ к папке с данными
app.use('/data', (_req, res) => res.status(404).json({ message: 'Не найдено' }));

// Раздача статики
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(UPLOADS_DIR));
<<<<<<< HEAD

// robots.txt и sitemap.xml
app.get('/robots.txt', (_req, res) => {
    res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (_req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.use(express.static(__dirname));

// ---------- Загрузка файлов (изображения) ----------
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

=======
app.use(express.static(__dirname));

// ---------- Загрузка файлов (изображения) ----------
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const ext = (path.extname(file.originalname || '').toLowerCase() || '').slice(0, 5);
<<<<<<< HEAD
        // Безопасное имя файла - только разрешённые расширения
        const safeExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext) ? ext : '.jpg';
        cb(null, `${Date.now()}-${uuidv4()}${safeExt}`);
=======
        cb(null, `${Date.now()}-${uuidv4()}${ext}`);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
<<<<<<< HEAD
        // Проверяем расширение файла
        const ext = path.extname(file.originalname || '').toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
            return cb(new Error('Недопустимое расширение файла. Разрешены: jpg, jpeg, png, gif, webp'));
        }
        
        // Проверяем MIME-тип
        if (!file.mimetype || !ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype)) {
            return cb(new Error('Недопустимый тип файла. Разрешены только изображения'));
        }
        
        cb(null, true);
=======
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
        }
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    }
});

// ---------- Аутентификация ----------
app.post('/api/login', loginLimiter, async (req, res) => {
    const { password } = req.body || {};

    if (!password) {
        return res.status(400).json({ message: 'Пароль обязателен' });
    }

    const isValid = await bcrypt.compare(password, ADMIN_HASH);
    if (!isValid) {
        return res.status(401).json({ message: 'Неверный пароль' });
    }

    req.session.isAdmin = true;
<<<<<<< HEAD
    // Генерируем CSRF токен при логине
    const token = generateCSRFToken(req);
    
    // Сохраняем сессию перед отправкой ответа
    req.session.save((err) => {
        if (err) {
            console.error('❌ Ошибка сохранения сессии:', err);
            return res.status(500).json({ message: 'Ошибка сохранения сессии' });
        }
        
        console.log('✅ Пользователь авторизован. CSRF токен:', token?.substring(0, 10) + '...');
        console.log('   Session ID:', req.sessionID);
        console.log('   isAdmin в сессии:', req.session.isAdmin);
        
        return res.json({ ok: true, csrfToken: token });
    });
=======
    return res.json({ ok: true });
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
});

app.post('/api/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(() => {
<<<<<<< HEAD
            res.clearCookie('sambo.sid');
=======
            res.clearCookie('connect.sid');
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
            return res.json({ ok: true });
        });
    } else {
        res.json({ ok: true });
    }
});

app.get('/api/admin/session', (req, res) => {
<<<<<<< HEAD
    const isAdmin = Boolean(req.session && req.session.isAdmin);
    const csrfToken = isAdmin ? generateCSRFToken(req) : null;
    
    if (process.env.NODE_ENV !== 'production') {
        console.log('📋 Проверка сессии:', {
            hasSession: !!req.session,
            isAdmin,
            hasCsrfToken: !!csrfToken,
            sessionID: req.sessionID
        });
    }
    
    res.json({ isAdmin, csrfToken });
=======
    res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
});

// ---------- Тренеры ----------
app.get('/api/trainers', async (_req, res) => {
    try {
        const trainers = await readJson(TRAINERS_FILE);
        res.json(trainers);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при получении тренеров', error);
        }
=======
        console.error('Ошибка при получении тренеров', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось загрузить тренеров' });
    }
});

app.post('/api/trainers', requireAdmin, adminWriteLimiter, async (req, res) => {
<<<<<<< HEAD
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    
=======
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    const { name, position, experience, badges, photoUrl } = req.body || {};

    if (!name || !position) {
        return res.status(400).json({ message: 'Имя и должность обязательны' });
    }

    if (name.length > 120 || position.length > 120) {
        return res.status(400).json({ message: 'Слишком длинные значения' });
    }

    const parsedBadges = Array.isArray(badges)
        ? badges
        : (typeof badges === 'string' ? badges.split(',').map(b => b.trim()).filter(Boolean) : []);

    const trainer = {
        id: uuidv4(),
        name: sanitizeString(name, 120),
        position: sanitizeString(position, 120),
        experience: sanitizeString(experience || '', 120),
        badges: parsedBadges.map(b => sanitizeString(b, 80)),
<<<<<<< HEAD
        photoUrl: photoUrl && typeof photoUrl === 'string' ? sanitizeUrl(photoUrl, 300) : ''
=======
        photoUrl: photoUrl && typeof photoUrl === 'string' ? sanitizeString(photoUrl, 300) : ''
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    };

    try {
        const trainers = await readJson(TRAINERS_FILE);
        trainers.push(trainer);
        await writeJson(TRAINERS_FILE, trainers);
        res.status(201).json(trainer);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при добавлении тренера', error);
        }
=======
        console.error('Ошибка при добавлении тренера', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось сохранить тренера' });
    }
});

app.delete('/api/trainers/:id', requireAdmin, adminWriteLimiter, async (req, res) => {
<<<<<<< HEAD
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    
    const { id } = req.params;
    
    // Валидация UUID
    if (!id || typeof id !== 'string' || id.length > 100) {
        return res.status(400).json({ message: 'Некорректный ID' });
    }
=======
    const { id } = req.params;
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095

    try {
        const trainers = await readJson(TRAINERS_FILE);
        const updated = trainers.filter(trainer => trainer.id !== id);

        if (updated.length === trainers.length) {
            return res.status(404).json({ message: 'Тренер не найден' });
        }

        await writeJson(TRAINERS_FILE, updated);
        res.json({ ok: true });
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при удалении тренера', error);
        }
=======
        console.error('Ошибка при удалении тренера', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось удалить тренера' });
    }
});

// ---------- Новости ----------
app.get('/api/news', async (_req, res) => {
    try {
        const news = await readJson(NEWS_FILE);
        res.json(news);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при получении новостей', error);
        }
=======
        console.error('Ошибка при получении новостей', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось загрузить новости' });
    }
});

app.post('/api/news', requireAdmin, adminWriteLimiter, async (req, res) => {
<<<<<<< HEAD
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    
=======
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    const { date, category, text, imageUrl, title } = req.body || {};

    if (!date || !category || !text) {
        return res.status(400).json({ message: 'Дата, категория и текст обязательны' });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Некорректный формат даты' });
    }

    const newsItem = {
        id: uuidv4(),
        date: parsedDate.toISOString().split('T')[0],
        category: sanitizeString(category, 120),
        text: sanitizeString(text, 1000),
        title: sanitizeString(title || '', 200),
<<<<<<< HEAD
        imageUrl: imageUrl && typeof imageUrl === 'string' ? sanitizeUrl(imageUrl, 300) : ''
=======
        imageUrl: imageUrl && typeof imageUrl === 'string' ? sanitizeString(imageUrl, 300) : ''
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    };

    try {
        const news = await readJson(NEWS_FILE);
        news.push(newsItem);
        await writeJson(NEWS_FILE, news);
        res.status(201).json(newsItem);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при добавлении новости', error);
        }
=======
        console.error('Ошибка при добавлении новости', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось сохранить новость' });
    }
});

app.delete('/api/news/:id', requireAdmin, adminWriteLimiter, async (req, res) => {
<<<<<<< HEAD
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    
    const { id } = req.params;
    
    // Валидация UUID
    if (!id || typeof id !== 'string' || id.length > 100) {
        return res.status(400).json({ message: 'Некорректный ID' });
    }
=======
    const { id } = req.params;
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095

    try {
        const news = await readJson(NEWS_FILE);
        const updated = news.filter(item => item.id !== id);

        if (updated.length === news.length) {
            return res.status(404).json({ message: 'Новость не найдена' });
        }

        await writeJson(NEWS_FILE, updated);
        res.json({ ok: true });
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при удалении новости', error);
        }
=======
        console.error('Ошибка при удалении новости', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось удалить новость' });
    }
});

// ---------- Залы ----------
app.get('/api/halls', async (_req, res) => {
    try {
        const halls = await readJson(HALLS_FILE);
        res.json(halls);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при получении залов', error);
        }
=======
        console.error('Ошибка при получении залов', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось загрузить залы' });
    }
});

app.post('/api/halls', requireAdmin, adminWriteLimiter, async (req, res) => {
<<<<<<< HEAD
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    
=======
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    const { name, address, description, imageUrl } = req.body || {};

    if (!name || !address) {
        return res.status(400).json({ message: 'Название и адрес обязательны' });
    }

    const hall = {
        id: uuidv4(),
        name: sanitizeString(name, 160),
        address: sanitizeString(address, 200),
        description: sanitizeString(description || '', 500),
<<<<<<< HEAD
        imageUrl: imageUrl && typeof imageUrl === 'string' ? sanitizeUrl(imageUrl, 300) : ''
=======
        imageUrl: imageUrl && typeof imageUrl === 'string' ? sanitizeString(imageUrl, 300) : ''
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    };

    try {
        const halls = await readJson(HALLS_FILE);
        halls.push(hall);
        await writeJson(HALLS_FILE, halls);
        res.status(201).json(hall);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при добавлении зала', error);
        }
=======
        console.error('Ошибка при добавлении зала', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось сохранить зал' });
    }
});

app.delete('/api/halls/:id', requireAdmin, adminWriteLimiter, async (req, res) => {
<<<<<<< HEAD
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    
    const { id } = req.params;
    
    // Валидация UUID
    if (!id || typeof id !== 'string' || id.length > 100) {
        return res.status(400).json({ message: 'Некорректный ID' });
    }
=======
    const { id } = req.params;
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095

    try {
        const halls = await readJson(HALLS_FILE);
        const updated = halls.filter(hall => hall.id !== id);

        if (updated.length === halls.length) {
            return res.status(404).json({ message: 'Зал не найден' });
        }

        await writeJson(HALLS_FILE, updated);
        res.json({ ok: true });
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при удалении зала', error);
        }
=======
        console.error('Ошибка при удалении зала', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось удалить зал' });
    }
});

// ---------- Расписание ----------
const ALLOWED_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const ALLOWED_SLOT_TYPES = ['adults', 'combat', 'children', 'rest', 'other'];

app.get('/api/schedule', async (_req, res) => {
    try {
        const schedule = await readJson(SCHEDULE_FILE);
        res.json(schedule);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при получении расписания', error);
        }
=======
        console.error('Ошибка при получении расписания', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось загрузить расписание' });
    }
});

app.post('/api/schedule', requireAdmin, adminWriteLimiter, async (req, res) => {
<<<<<<< HEAD
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    
=======
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    const { day, time, label, type, hall } = req.body || {};

    if (!day || !time || !label) {
        return res.status(400).json({ message: 'День, время и описание обязательны' });
    }

    const normalizedDay = sanitizeString(day, 4).toUpperCase();
    if (!ALLOWED_DAYS.includes(normalizedDay)) {
        return res.status(400).json({ message: 'Некорректный день недели' });
    }

    const slot = {
        id: uuidv4(),
        day: normalizedDay,
        time: sanitizeString(time, 20),
        label: sanitizeString(label, 120),
        type: ALLOWED_SLOT_TYPES.includes(type) ? type : 'other',
        hall: sanitizeString(hall || '', 80)
    };

    try {
        const schedule = await readJson(SCHEDULE_FILE);
        schedule.push(slot);
        await writeJson(SCHEDULE_FILE, schedule);
        res.status(201).json(slot);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при добавлении записи расписания', error);
        }
=======
        console.error('Ошибка при добавлении записи расписания', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось сохранить расписание' });
    }
});

app.delete('/api/schedule/:id', requireAdmin, adminWriteLimiter, async (req, res) => {
<<<<<<< HEAD
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    
    const { id } = req.params;
    
    // Валидация UUID
    if (!id || typeof id !== 'string' || id.length > 100) {
        return res.status(400).json({ message: 'Некорректный ID' });
    }
=======
    const { id } = req.params;
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095

    try {
        const schedule = await readJson(SCHEDULE_FILE);
        const updated = schedule.filter(item => item.id !== id);

        if (updated.length === schedule.length) {
            return res.status(404).json({ message: 'Запись расписания не найдена' });
        }

        await writeJson(SCHEDULE_FILE, updated);
        res.json({ ok: true });
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при удалении записи расписания', error);
        }
=======
        console.error('Ошибка при удалении записи расписания', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось удалить запись' });
    }
});

// ---------- Контакты ----------
app.get('/api/contacts', async (_req, res) => {
    try {
        const contacts = await readJson(CONTACTS_FILE);
        res.json(contacts);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при получении контактов', error);
        }
=======
        console.error('Ошибка при получении контактов', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось загрузить контакты' });
    }
});

// ---------- Заявки на тренировку ----------
app.post('/api/leads', contactLimiter, async (req, res) => {
    const { name, phone, message } = req.body || {};

    if (!name || !phone) {
        return res.status(400).json({ message: 'Имя и телефон обязательны' });
    }
<<<<<<< HEAD
    
    // Дополнительная валидация на сервере
    const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11 || !phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Некорректный формат телефона' });
    }
    
    const nameRegex = /^[а-яА-ЯёЁa-zA-Z\s\-]{2,50}$/;
    if (!nameRegex.test(name)) {
        return res.status(400).json({ message: 'Некорректный формат имени' });
    }
=======
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095

    const lead = {
        id: uuidv4(),
        name: sanitizeString(name, 100),
        phone: sanitizeString(phone, 80),
        message: sanitizeString(message || '', 600),
        createdAt: new Date().toISOString()
    };

    try {
<<<<<<< HEAD
        // Формируем сообщение
        const text = [
            '📨 *Новая заявка*',
            `Имя: ${lead.name}`,
            `Телефон: ${lead.phone}`,
            lead.message ? `Сообщение: ${lead.message}` : ''
        ].filter(Boolean).join('\n');
        
        const telegramText = [
=======
        const text = [
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
            '📨 <b>Новая заявка</b>',
            `Имя: ${lead.name}`,
            `Телефон: ${lead.phone}`,
            lead.message ? `Сообщение: ${lead.message}` : ''
        ].filter(Boolean).join('\n');
<<<<<<< HEAD
        
        // Отправляем уведомления (не сохраняем на сервере)
        const notifications = [];
        
        // Telegram уведомление (если настроено)
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            notifications.push(notifyTelegram(telegramText));
        }
        
        // WhatsApp уведомление (если настроено)
        if (WHATSAPP_API_KEY && WHATSAPP_PHONE) {
            notifications.push(notifyWhatsApp(text).catch(() => {}));
        }
        
        // Email уведомление (если настроено)
        if (mailTransport && LEADS_EMAIL_TO) {
            notifications.push(notifyEmail(lead).catch(() => {}));
        }
        
        // Проверяем что хотя бы один способ уведомления настроен
        if (notifications.length === 0) {
            console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Не настроено ни одного способа уведомления!');
            console.error('   Настройте хотя бы один из: TELEGRAM_BOT_TOKEN, WHATSAPP_API_KEY, или SMTP');
            return res.status(500).json({ 
                message: 'Сервис уведомлений не настроен. Обратитесь к администратору.' 
            });
        }
        
        // Ждём отправки уведомлений
        await Promise.all(notifications);
        
        return res.json({ ok: true });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при отправке заявки', error);
        }
=======
        await notifyTelegram(text);
        await notifyEmail(lead);

        const leads = await readJson(LEADS_FILE);
        leads.unshift(lead);
        leads.splice(200);
        await writeJson(LEADS_FILE, leads);
        return res.json({ ok: true });
    } catch (error) {
        console.error('Ошибка при сохранении заявки', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        return res.status(500).json({ message: 'Не удалось отправить заявку' });
    }
});

// ---------- Загрузка изображений ----------
<<<<<<< HEAD
app.post('/api/upload', requireAdmin, adminWriteLimiter, (req, res, next) => {
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    next();
}, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Файл не получен' });
    }
    
    // Дополнительная проверка размера файла
    if (req.file.size > 5 * 1024 * 1024) {
        // Удаляем файл если он слишком большой
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: 'Файл слишком большой (максимум 5MB)' });
    }
    
=======
app.post('/api/upload', requireAdmin, adminWriteLimiter, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Файл не получен' });
    }
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    const url = `/uploads/${req.file.filename}`;
    return res.json({ url });
});

<<<<<<< HEAD
// Обработка ошибок загрузки файлов
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Файл слишком большой (максимум 5MB)' });
        }
        return res.status(400).json({ message: 'Ошибка загрузки файла' });
    }
    if (err) {
        return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    }
    next();
});

app.post('/api/contacts', requireAdmin, adminWriteLimiter, async (req, res) => {
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    
=======
app.post('/api/contacts', requireAdmin, adminWriteLimiter, async (req, res) => {
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    const { address, phones, email } = req.body || {};

    const payload = {
        address: sanitizeString(address || '', 300),
        phones: sanitizeStringArray(
            Array.isArray(phones) ? phones : (typeof phones === 'string' ? phones.split(',') : []),
            40,
            10
        ),
        email: sanitizeString(email || '', 120)
    };

    try {
        await writeJson(CONTACTS_FILE, payload);
        res.json(payload);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при сохранении контактов', error);
        }
=======
        console.error('Ошибка при сохранении контактов', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось сохранить контакты' });
    }
});

<<<<<<< HEAD
// Заявки больше не сохраняются на сервере - только отправляются в Telegram/WhatsApp

=======
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
// ---------- Соцсети ----------
app.get('/api/socials', async (_req, res) => {
    try {
        const socials = await readJson(SOCIALS_FILE);
        res.json(socials);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при получении ссылок', error);
        }
=======
        console.error('Ошибка при получении ссылок', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось загрузить ссылки' });
    }
});

app.post('/api/socials', requireAdmin, adminWriteLimiter, async (req, res) => {
<<<<<<< HEAD
    // CSRF защита
    if (!validateCSRFToken(req)) {
        return res.status(403).json({ message: 'Неверный CSRF токен' });
    }
    
    const { vk, telegram, instagram } = req.body || {};

    const payload = {
        vk: sanitizeUrl(vk || '', 240),
        telegram: sanitizeUrl(telegram || '', 240),
        instagram: sanitizeUrl(instagram || '', 240)
=======
    const { vk, telegram, instagram } = req.body || {};

    const payload = {
        vk: sanitizeString(vk || '', 240),
        telegram: sanitizeString(telegram || '', 240),
        instagram: sanitizeString(instagram || '', 240)
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
    };

    try {
        await writeJson(SOCIALS_FILE, payload);
        res.json(payload);
    } catch (error) {
<<<<<<< HEAD
        if (process.env.NODE_ENV !== 'production') {
            console.error('Ошибка при сохранении ссылок', error);
        }
=======
        console.error('Ошибка при сохранении ссылок', error);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        res.status(500).json({ message: 'Не удалось сохранить ссылки' });
    }
});

<<<<<<< HEAD
// ---------- Тест отправки в Telegram (для отладки) ----------
app.get('/api/test-telegram', requireAdmin, async (_req, res) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        return res.status(400).json({ 
            message: 'Telegram не настроен. Проверьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env' 
        });
    }
    
    try {
        const chatIds = TELEGRAM_CHAT_ID.split(',').map(id => id.trim()).filter(Boolean);
        const testMessage = '🧪 <b>Тестовое сообщение</b>\nЕсли вы видите это сообщение, значит Telegram настроен правильно!';
        await notifyTelegram(testMessage);
        res.json({ 
            ok: true, 
            message: `Тестовое сообщение отправлено ${chatIds.length} получателю(ям) в Telegram` 
        });
    } catch (error) {
        res.status(500).json({ 
            ok: false, 
            message: 'Ошибка отправки: ' + error.message 
        });
    }
});

// ---------- Health Check (для мониторинга) ----------
app.get('/health', async (_req, res) => {
    try {
        // Проверяем доступность файлов данных
        await fsPromises.access(TRAINERS_FILE, fs.constants.F_OK);
        await fsPromises.access(NEWS_FILE, fs.constants.F_OK);
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'error', 
            message: 'Сервис недоступен',
            timestamp: new Date().toISOString()
        });
    }
});

=======
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
// ---------- Страницы ----------
app.get('/admin', (_req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// SPA-фолбэк
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'Маршрут не найден' });
    }
    return res.sendFile(path.join(__dirname, 'index.html'));
});

<<<<<<< HEAD
// Проверка настроек Telegram при старте
async function logTelegramStatus() {
    if (TELEGRAM_BOT_TOKEN) {
        console.log('✅ Telegram настроен');
        console.log('   Bot Token:', TELEGRAM_BOT_TOKEN.substring(0, 10) + '...');
        
        if (TELEGRAM_CHAT_ID) {
            const chatIds = TELEGRAM_CHAT_ID.split(',').map(id => id.trim()).filter(Boolean);
            console.log(`   Chat ID из .env: ${chatIds.length} получатель(ей)`);
            chatIds.forEach((id, index) => {
                console.log(`      ${index + 1}. ${id.substring(0, 15)}...`);
            });
        }
        
        const subscribers = await getTelegramSubscribers();
        if (subscribers.length > 0) {
            console.log(`   Подписчики (через /start): ${subscribers.length}`);
            subscribers.forEach((id, index) => {
                console.log(`      ${index + 1}. ${String(id).substring(0, 15)}...`);
            });
        } else {
            console.log('   Подписчиков пока нет (отправьте /start боту)');
        }
    } else {
        console.warn('⚠️ Telegram не настроен');
        console.warn('   Отсутствует: TELEGRAM_BOT_TOKEN');
    }
}

// Обработка команд Telegram бота (polling)
let telegramLastUpdateId = 0;

async function processTelegramUpdates() {
    if (!TELEGRAM_BOT_TOKEN) {
        return;
    }
    
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${telegramLastUpdateId + 1}&timeout=10`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.ok || !data.result || data.result.length === 0) {
            return;
        }
        
        for (const update of data.result) {
            telegramLastUpdateId = update.update_id;
            
            if (update.message && update.message.text) {
                const chatId = update.message.chat.id;
                const text = update.message.text.trim();
                const firstName = update.message.from?.first_name || 'Пользователь';
                
                if (text === '/start') {
                    await addTelegramSubscriber(chatId);
                    await sendTelegramMessage(chatId, 
                        `✅ <b>Подписка активирована!</b>\n\n` +
                        `Привет, ${firstName}! Теперь ты будешь получать все новые заявки с сайта.\n\n` +
                        `Чтобы отписаться, отправь команду /stop`
                    );
                } else if (text === '/stop') {
                    await removeTelegramSubscriber(chatId);
                    await sendTelegramMessage(chatId, 
                        `❌ <b>Подписка отменена</b>\n\n` +
                        `Ты больше не будешь получать уведомления о заявках.\n\n` +
                        `Чтобы подписаться снова, отправь /start`
                    );
                } else if (text === '/status') {
                    const subscribers = await getTelegramSubscribers();
                    const isSubscribed = subscribers.includes(String(chatId));
                    await sendTelegramMessage(chatId, 
                        isSubscribed 
                            ? `✅ <b>Ты подписан на уведомления</b>\n\nВсего подписчиков: ${subscribers.length}`
                            : `❌ <b>Ты не подписан</b>\n\nОтправь /start чтобы получать заявки`
                    );
                } else {
                    // Неизвестная команда - отправляем подсказку
                    await sendTelegramMessage(chatId, 
                        `👋 Привет!\n\n` +
                        `Доступные команды:\n` +
                        `/start - подписаться на уведомления\n` +
                        `/stop - отписаться от уведомлений\n` +
                        `/status - проверить статус подписки`
                    );
                }
            }
        }
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('❌ Ошибка обработки обновлений Telegram:', err.message);
        }
    }
}

// Запускаем polling для Telegram бота
function startTelegramPolling() {
    if (!TELEGRAM_BOT_TOKEN) {
        return;
    }
    
    // Обрабатываем обновления каждые 2 секунды
    setInterval(processTelegramUpdates, 2000);
    console.log('✅ Telegram polling запущен - бот готов принимать команды');
}

bootstrapData()
    .then(async () => {
        await logTelegramStatus();
        app.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`);
            startTelegramPolling();
=======
bootstrapData()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`);
>>>>>>> 7419140d94d7ec7d9329010ddae9bc4fc889d095
        });
    })
    .catch((err) => {
        console.error('Ошибка инициализации данных', err);
        process.exit(1);
    });
