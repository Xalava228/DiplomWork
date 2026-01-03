// Тестовый скрипт для проверки отправки email
require('dotenv').config();
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const LEADS_EMAIL_TO = process.env.LEADS_EMAIL_TO;

console.log('🔍 Проверка настроек SMTP:');
console.log('SMTP_HOST:', SMTP_HOST || '❌ НЕ ЗАДАН');
console.log('SMTP_PORT:', SMTP_PORT || '❌ НЕ ЗАДАН');
console.log('SMTP_USER:', SMTP_USER || '❌ НЕ ЗАДАН');
console.log('SMTP_PASS:', SMTP_PASS ? '✅ Задан (' + SMTP_PASS.length + ' символов)' : '❌ НЕ ЗАДАН');
console.log('SMTP_SECURE:', SMTP_SECURE);
console.log('LEADS_EMAIL_TO:', LEADS_EMAIL_TO || '❌ НЕ ЗАДАН');
console.log('');

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !LEADS_EMAIL_TO) {
    console.error('❌ Не все параметры заданы! Проверь файл .env');
    process.exit(1);
}

const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

console.log('📧 Отправка тестового письма...');

transport.sendMail({
    from: SMTP_USER,
    to: LEADS_EMAIL_TO,
    subject: 'Тест отправки с сайта',
    html: '<h2>Это тестовое письмо</h2><p>Если ты получил это письмо, значит настройка работает!</p>'
})
.then(info => {
    console.log('✅ Письмо отправлено успешно!');
    console.log('   Message ID:', info.messageId);
    console.log('   Проверь почту:', LEADS_EMAIL_TO);
    process.exit(0);
})
.catch(err => {
    console.error('❌ Ошибка отправки:');
    console.error('   Сообщение:', err.message);
    if (err.code) console.error('   Код:', err.code);
    if (err.response) console.error('   Ответ сервера:', err.response);
    process.exit(1);
});

