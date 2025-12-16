const express = require('express');
<<<<<<< HEAD
const session = require('express-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { v4: uuidv4 } = require('uuid');
=======
const path = require('path');
>>>>>>> 3e3d861d85e662b00c00686df66ba0b2164f0151

const app = express();
const PORT = process.env.PORT || 3000;

<<<<<<< HEAD
const DATA_DIR = path.join(__dirname, 'data');
const TRAINERS_FILE = path.join(DATA_DIR, 'trainers.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const HALLS_FILE = path.join(DATA_DIR, 'halls.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const SOCIALS_FILE = path.join(DATA_DIR, 'socials.json');

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

function resolveAdminPasswordHash() {
    if (ADMIN_PASSWORD_HASH) {
        return ADMIN_PASSWORD_HASH;
    }

    const password = ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    return bcrypt.hashSync(password, 10);
}

const ADMIN_HASH = resolveAdminPasswordHash();

// Простой санитайзер строк, чтобы срезать теги и управляемую длину
function sanitizeString(value, max = 500) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim().slice(0, max);
    return trimmed
        .replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/<\/?[^>]+(>|$)/g, '');
}

function sanitizeStringArray(values, max = 100, limit = 20) {
    if (!Array.isArray(values)) return [];
    return values.slice(0, limit).map(v => sanitizeString(v, max)).filter(Boolean);
}

async function ensureDataFile(filePath, defaultValue) {
    try {
        await fsPromises.access(filePath, fs.constants.F_OK);
    } catch {
        await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
        await fsPromises.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
    }
}

async function bootstrapData() {
    await ensureDataFile(TRAINERS_FILE, initialTrainers);
    await ensureDataFile(NEWS_FILE, initialNews);
    await ensureDataFile(HALLS_FILE, initialHalls);
    await ensureDataFile(SCHEDULE_FILE, initialSchedule);
    await ensureDataFile(CONTACTS_FILE, initialContacts);
    await ensureDataFile(SOCIALS_FILE, initialSocials);
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ message: 'Требуется авторизация администратора' });
}

async function readJson(filePath) {
    const raw = await fsPromises.readFile(filePath, 'utf8');
    return JSON.parse(raw || '[]');
}

async function writeJson(filePath, data) {
    await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

app.use(helmet({
    contentSecurityPolicy: false, // CSP нужно настраивать отдельно под ресурсы, пока отключаем
    crossOriginEmbedderPolicy: false
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
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
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

// Блокируем прямой доступ к папке с данными
app.use('/data', (_req, res) => res.status(404).json({ message: 'Не найдено' }));

// Раздача статики
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

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
    return res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            return res.json({ ok: true });
        });
    } else {
        res.json({ ok: true });
    }
});

app.get('/api/admin/session', (req, res) => {
    res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
});

// ---------- Тренеры ----------
app.get('/api/trainers', async (_req, res) => {
    try {
        const trainers = await readJson(TRAINERS_FILE);
        res.json(trainers);
    } catch (error) {
        console.error('Ошибка при получении тренеров', error);
        res.status(500).json({ message: 'Не удалось загрузить тренеров' });
    }
});

app.post('/api/trainers', requireAdmin, adminWriteLimiter, async (req, res) => {
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
        photoUrl: photoUrl && typeof photoUrl === 'string' ? sanitizeString(photoUrl, 300) : ''
    };

    try {
        const trainers = await readJson(TRAINERS_FILE);
        trainers.push(trainer);
        await writeJson(TRAINERS_FILE, trainers);
        res.status(201).json(trainer);
    } catch (error) {
        console.error('Ошибка при добавлении тренера', error);
        res.status(500).json({ message: 'Не удалось сохранить тренера' });
    }
});

app.delete('/api/trainers/:id', requireAdmin, adminWriteLimiter, async (req, res) => {
    const { id } = req.params;

    try {
        const trainers = await readJson(TRAINERS_FILE);
        const updated = trainers.filter(trainer => trainer.id !== id);

        if (updated.length === trainers.length) {
            return res.status(404).json({ message: 'Тренер не найден' });
        }

        await writeJson(TRAINERS_FILE, updated);
        res.json({ ok: true });
    } catch (error) {
        console.error('Ошибка при удалении тренера', error);
        res.status(500).json({ message: 'Не удалось удалить тренера' });
    }
});

// ---------- Новости ----------
app.get('/api/news', async (_req, res) => {
    try {
        const news = await readJson(NEWS_FILE);
        res.json(news);
    } catch (error) {
        console.error('Ошибка при получении новостей', error);
        res.status(500).json({ message: 'Не удалось загрузить новости' });
    }
});

app.post('/api/news', requireAdmin, adminWriteLimiter, async (req, res) => {
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
        imageUrl: imageUrl && typeof imageUrl === 'string' ? sanitizeString(imageUrl, 300) : ''
    };

    try {
        const news = await readJson(NEWS_FILE);
        news.push(newsItem);
        await writeJson(NEWS_FILE, news);
        res.status(201).json(newsItem);
    } catch (error) {
        console.error('Ошибка при добавлении новости', error);
        res.status(500).json({ message: 'Не удалось сохранить новость' });
    }
});

app.delete('/api/news/:id', requireAdmin, adminWriteLimiter, async (req, res) => {
    const { id } = req.params;

    try {
        const news = await readJson(NEWS_FILE);
        const updated = news.filter(item => item.id !== id);

        if (updated.length === news.length) {
            return res.status(404).json({ message: 'Новость не найдена' });
        }

        await writeJson(NEWS_FILE, updated);
        res.json({ ok: true });
    } catch (error) {
        console.error('Ошибка при удалении новости', error);
        res.status(500).json({ message: 'Не удалось удалить новость' });
    }
});

// ---------- Залы ----------
app.get('/api/halls', async (_req, res) => {
    try {
        const halls = await readJson(HALLS_FILE);
        res.json(halls);
    } catch (error) {
        console.error('Ошибка при получении залов', error);
        res.status(500).json({ message: 'Не удалось загрузить залы' });
    }
});

app.post('/api/halls', requireAdmin, adminWriteLimiter, async (req, res) => {
    const { name, address, description, imageUrl } = req.body || {};

    if (!name || !address) {
        return res.status(400).json({ message: 'Название и адрес обязательны' });
    }

    const hall = {
        id: uuidv4(),
        name: sanitizeString(name, 160),
        address: sanitizeString(address, 200),
        description: sanitizeString(description || '', 500),
        imageUrl: imageUrl && typeof imageUrl === 'string' ? sanitizeString(imageUrl, 300) : ''
    };

    try {
        const halls = await readJson(HALLS_FILE);
        halls.push(hall);
        await writeJson(HALLS_FILE, halls);
        res.status(201).json(hall);
    } catch (error) {
        console.error('Ошибка при добавлении зала', error);
        res.status(500).json({ message: 'Не удалось сохранить зал' });
    }
});

app.delete('/api/halls/:id', requireAdmin, adminWriteLimiter, async (req, res) => {
    const { id } = req.params;

    try {
        const halls = await readJson(HALLS_FILE);
        const updated = halls.filter(hall => hall.id !== id);

        if (updated.length === halls.length) {
            return res.status(404).json({ message: 'Зал не найден' });
        }

        await writeJson(HALLS_FILE, updated);
        res.json({ ok: true });
    } catch (error) {
        console.error('Ошибка при удалении зала', error);
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
        console.error('Ошибка при получении расписания', error);
        res.status(500).json({ message: 'Не удалось загрузить расписание' });
    }
});

app.post('/api/schedule', requireAdmin, adminWriteLimiter, async (req, res) => {
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
        console.error('Ошибка при добавлении записи расписания', error);
        res.status(500).json({ message: 'Не удалось сохранить расписание' });
    }
});

app.delete('/api/schedule/:id', requireAdmin, adminWriteLimiter, async (req, res) => {
    const { id } = req.params;

    try {
        const schedule = await readJson(SCHEDULE_FILE);
        const updated = schedule.filter(item => item.id !== id);

        if (updated.length === schedule.length) {
            return res.status(404).json({ message: 'Запись расписания не найдена' });
        }

        await writeJson(SCHEDULE_FILE, updated);
        res.json({ ok: true });
    } catch (error) {
        console.error('Ошибка при удалении записи расписания', error);
        res.status(500).json({ message: 'Не удалось удалить запись' });
    }
});

// ---------- Контакты ----------
app.get('/api/contacts', async (_req, res) => {
    try {
        const contacts = await readJson(CONTACTS_FILE);
        res.json(contacts);
    } catch (error) {
        console.error('Ошибка при получении контактов', error);
        res.status(500).json({ message: 'Не удалось загрузить контакты' });
    }
});

app.post('/api/contacts', requireAdmin, adminWriteLimiter, async (req, res) => {
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
        console.error('Ошибка при сохранении контактов', error);
        res.status(500).json({ message: 'Не удалось сохранить контакты' });
    }
});

// ---------- Соцсети ----------
app.get('/api/socials', async (_req, res) => {
    try {
        const socials = await readJson(SOCIALS_FILE);
        res.json(socials);
    } catch (error) {
        console.error('Ошибка при получении ссылок', error);
        res.status(500).json({ message: 'Не удалось загрузить ссылки' });
    }
});

app.post('/api/socials', requireAdmin, adminWriteLimiter, async (req, res) => {
    const { vk, telegram, instagram } = req.body || {};

    const payload = {
        vk: sanitizeString(vk || '', 240),
        telegram: sanitizeString(telegram || '', 240),
        instagram: sanitizeString(instagram || '', 240)
    };

    try {
        await writeJson(SOCIALS_FILE, payload);
        res.json(payload);
    } catch (error) {
        console.error('Ошибка при сохранении ссылок', error);
        res.status(500).json({ message: 'Не удалось сохранить ссылки' });
    }
});

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

bootstrapData()
    .then(() => {
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Ошибка инициализации данных', err);
        process.exit(1);
=======
// Раздаём статические файлы
app.use(express.static(path.join(__dirname)));

// Все маршруты ведут на index.html (для SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
>>>>>>> 3e3d861d85e662b00c00686df66ba0b2164f0151
});
