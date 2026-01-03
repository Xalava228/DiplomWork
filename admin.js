(function() {
    'use strict';

    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    const trainerForm = document.getElementById('trainerForm');
    const trainersList = document.getElementById('trainersList');
    const trainersCount = document.getElementById('trainersCount');

    const newsForm = document.getElementById('newsForm');
    const newsList = document.getElementById('newsList');
    const newsCount = document.getElementById('newsCount');

    const hallForm = document.getElementById('hallForm');
    const hallsList = document.getElementById('hallsList');
    const hallsCount = document.getElementById('hallsCount');

    const scheduleForm = document.getElementById('scheduleForm');
    const scheduleList = document.getElementById('scheduleList');
    const scheduleCount = document.getElementById('scheduleCount');

    const contactsForm = document.getElementById('contactsForm');
    const contactsPreview = document.getElementById('contactsPreview');

    const socialsForm = document.getElementById('socialsForm');
    const socialsPreview = document.getElementById('socialsPreview');

    const statusBar = document.getElementById('statusBar');
    
    let csrfToken = null;

    // Хелпер для добавления CSRF токена в запросы
    function getFetchOptions(method = 'GET', body = null) {
        const options = {
            method,
            credentials: 'same-origin',
            headers: {}
        };
        
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        
        if (csrfToken && (method === 'POST' || method === 'DELETE')) {
            options.headers['X-CSRF-Token'] = csrfToken;
            console.log('📤 Отправка запроса с CSRF токеном:', csrfToken.substring(0, 10) + '...');
        } else if ((method === 'POST' || method === 'DELETE') && !csrfToken) {
            console.warn('⚠️ CSRF токен отсутствует для', method, 'запроса');
        }
        
        return options;
    }

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        bindEvents();
        await checkSession();
    }

    function bindEvents() {
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        if (trainerForm) {
            trainerForm.addEventListener('submit', handleTrainerSubmit);
        }

        if (newsForm) {
            newsForm.addEventListener('submit', handleNewsSubmit);
        }

        if (hallForm) {
            hallForm.addEventListener('submit', handleHallSubmit);
        }

        if (scheduleForm) {
            scheduleForm.addEventListener('submit', handleScheduleSubmit);
        }

        if (contactsForm) {
            contactsForm.addEventListener('submit', handleContactsSubmit);
        }

        if (socialsForm) {
            socialsForm.addEventListener('submit', handleSocialsSubmit);
        }
    }

    async function checkSession() {
        try {
            const response = await fetch('/api/admin/session', { credentials: 'same-origin' });
            const { isAdmin, csrfToken: token } = await response.json();
            
            csrfToken = token;

            if (isAdmin) {
                showDashboard();
                await Promise.all([
                    loadTrainers(),
                    loadNews(),
                    loadHalls(),
                    loadSchedule(),
                    loadContacts(),
                    loadSocials()
                ]);
            } else {
                showLogin();
            }
        } catch (error) {
            console.error('Не удалось проверить сессию', error);
            showLogin();
        }
    }

    function showDashboard() {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        statusBar.classList.add('hidden');
    }

    function showLogin() {
        dashboardSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    }

    async function handleLogin(event) {
        event.preventDefault();
        loginError.textContent = '';

        const formData = new FormData(loginForm);
        const password = formData.get('password');

        if (!password) {
            loginError.textContent = 'Введите пароль';
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                const error = await response.json();
                loginError.textContent = error.message || 'Ошибка авторизации';
                return;
            }

            const result = await response.json();
            loginForm.reset();
            showStatus('Успешный вход. Сессия активна на 12 часов.', 'success');
            
            // Получаем CSRF токен из ответа логина или из сессии
            if (result.csrfToken) {
                csrfToken = result.csrfToken;
                console.log('✅ CSRF токен получен из ответа логина:', csrfToken.substring(0, 10) + '...');
            } else {
                // Если токен не в ответе, запрашиваем сессию
                const sessionResponse = await fetch('/api/admin/session', { credentials: 'same-origin' });
                const sessionData = await sessionResponse.json();
                csrfToken = sessionData.csrfToken;
                
                if (!csrfToken) {
                    console.error('⚠️ CSRF токен не получен после логина. isAdmin:', sessionData.isAdmin);
                } else {
                    console.log('✅ CSRF токен получен из сессии:', csrfToken.substring(0, 10) + '...');
                }
            }
            
            // Проверяем сессию после логина
            await checkSession();
        } catch (error) {
            loginError.textContent = 'Сервер недоступен. Попробуйте позже.';
        }
    }

    async function handleLogout() {
        try {
            await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
        } finally {
            showStatus('Вы вышли из аккаунта', 'info');
            showLogin();
        }
    }

    async function uploadFile(file) {
        const fd = new FormData();
        fd.append('file', file);
        const options = {
            method: 'POST',
            credentials: 'same-origin',
            body: fd
        };
        if (csrfToken) {
            options.headers = { 'X-CSRF-Token': csrfToken };
        }
        const response = await fetch('/api/upload', options);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Не удалось загрузить файл');
        }
        const data = await response.json();
        return data.url;
    }

    async function handleTrainerSubmit(event) {
        event.preventDefault();
        const formData = new FormData(trainerForm);

        let photoUrl = formData.get('photoUrl')?.trim();
        const photoFile = formData.get('photoFile');

        const payload = {
            name: formData.get('name')?.trim(),
            position: formData.get('position')?.trim(),
            experience: formData.get('experience')?.trim(),
            badges: formData.get('badges')?.split(',').map(b => b.trim()).filter(Boolean) || [],
            photoUrl
        };

        if (!payload.name || !payload.position) {
            showStatus('Имя и должность обязательны', 'error');
            return;
        }

        try {
            if (photoFile && photoFile.size > 0) {
                payload.photoUrl = await uploadFile(photoFile);
            }

            const response = await fetch('/api/trainers', getFetchOptions('POST', payload));

            if (!response.ok) {
                const error = await response.json();
                showStatus(error.message || 'Не удалось сохранить тренера', 'error');
                return;
            }

            trainerForm.reset();
            showStatus('Тренер добавлен', 'success');
            await loadTrainers();
        } catch (error) {
            showStatus('Ошибка сети. Попробуйте позже.', 'error');
        }
    }

    async function handleNewsSubmit(event) {
        event.preventDefault();
        const formData = new FormData(newsForm);

        let imageUrl = formData.get('imageUrl')?.trim();
        const imageFile = formData.get('imageFile');

        const payload = {
            title: formData.get('title')?.trim(),
            date: formData.get('date'),
            category: formData.get('category')?.trim(),
            text: formData.get('text')?.trim(),
            imageUrl
        };

        if (!payload.date || !payload.category || !payload.text) {
            showStatus('Дата, категория и текст обязательны', 'error');
            return;
        }

        try {
            if (imageFile && imageFile.size > 0) {
                payload.imageUrl = await uploadFile(imageFile);
            }

            const response = await fetch('/api/news', getFetchOptions('POST', payload));

            if (!response.ok) {
                const error = await response.json();
                showStatus(error.message || 'Не удалось сохранить новость', 'error');
                return;
            }

            newsForm.reset();
            showStatus('Новость добавлена', 'success');
            await loadNews();
        } catch (error) {
            showStatus('Ошибка сети. Попробуйте позже.', 'error');
        }
    }

    async function handleHallSubmit(event) {
        event.preventDefault();
        const formData = new FormData(hallForm);

        let imageUrl = formData.get('imageUrl')?.trim();
        const imageFile = formData.get('imageFile');

        const payload = {
            name: formData.get('name')?.trim(),
            address: formData.get('address')?.trim(),
            description: formData.get('description')?.trim(),
            imageUrl
        };

        if (!payload.name || !payload.address) {
            showStatus('Название и адрес обязательны', 'error');
            return;
        }

        try {
            if (imageFile && imageFile.size > 0) {
                payload.imageUrl = await uploadFile(imageFile);
            }

            const response = await fetch('/api/halls', getFetchOptions('POST', payload));

            if (!response.ok) {
                const error = await response.json();
                showStatus(error.message || 'Не удалось сохранить зал', 'error');
                return;
            }

            hallForm.reset();
            showStatus('Зал добавлен', 'success');
            await loadHalls();
        } catch (error) {
            showStatus('Ошибка сети. Попробуйте позже.', 'error');
        }
    }

    async function handleScheduleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(scheduleForm);

        const payload = {
            day: formData.get('day'),
            time: formData.get('time')?.trim(),
            label: formData.get('label')?.trim(),
            type: formData.get('type')?.trim(),
            hall: formData.get('hall')?.trim()
        };

        if (!payload.day || !payload.time || !payload.label) {
            showStatus('День, время и описание обязательны', 'error');
            return;
        }

        try {
            const response = await fetch('/api/schedule', getFetchOptions('POST', payload));

            if (!response.ok) {
                const error = await response.json();
                showStatus(error.message || 'Не удалось сохранить расписание', 'error');
                return;
            }

            scheduleForm.reset();
            showStatus('Запись расписания добавлена', 'success');
            await loadSchedule();
        } catch (error) {
            showStatus('Ошибка сети. Попробуйте позже.', 'error');
        }
    }

    async function handleContactsSubmit(event) {
        event.preventDefault();
        const formData = new FormData(contactsForm);
        const phonesRaw = formData.get('phones')?.trim() || '';

        const payload = {
            address: formData.get('address')?.trim(),
            phones: phonesRaw,
            email: formData.get('email')?.trim()
        };

        try {
            const response = await fetch('/api/contacts', getFetchOptions('POST', payload));

            if (!response.ok) {
                const error = await response.json();
                showStatus(error.message || 'Не удалось сохранить контакты', 'error');
                return;
            }

            showStatus('Контакты обновлены', 'success');
            await loadContacts();
        } catch (error) {
            showStatus('Ошибка сети. Попробуйте позже.', 'error');
        }
    }

    async function handleSocialsSubmit(event) {
        event.preventDefault();
        const formData = new FormData(socialsForm);
        const payload = {
            vk: formData.get('vk')?.trim(),
            telegram: formData.get('telegram')?.trim(),
            instagram: formData.get('instagram')?.trim()
        };

        try {
            const response = await fetch('/api/socials', getFetchOptions('POST', payload));

            if (!response.ok) {
                const error = await response.json();
                showStatus(error.message || 'Не удалось сохранить ссылки', 'error');
                return;
            }

            showStatus('Ссылки обновлены', 'success');
            await loadSocials();
        } catch (error) {
            showStatus('Ошибка сети. Попробуйте позже.', 'error');
        }
    }

    async function loadTrainers() {
        trainersList.textContent = 'Загрузка...';
        try {
            const response = await fetch('/api/trainers', { credentials: 'same-origin' });
            const trainers = await response.json();
            renderTrainers(trainers);
        } catch (error) {
            trainersList.textContent = 'Не удалось загрузить список';
        }
    }

    function renderTrainers(trainers) {
        trainersCount.textContent = trainers.length;

        if (!trainers.length) {
            trainersList.textContent = 'Пока нет тренеров';
            return;
        }

        trainersList.innerHTML = '';
        trainers.forEach(trainer => {
            const item = document.createElement('div');
            item.className = 'list__item';

            const meta = document.createElement('div');
            meta.className = 'list__meta';

            const name = document.createElement('strong');
            name.textContent = trainer.name;

            const role = document.createElement('span');
            role.className = 'muted';
            role.textContent = trainer.position;

            const badges = document.createElement('div');
            badges.style.display = 'flex';
            badges.style.flexWrap = 'wrap';
            badges.style.gap = '6px';
            (trainer.badges || []).forEach(b => {
                const badge = document.createElement('span');
                badge.className = 'tag';
                badge.textContent = b;
                badges.appendChild(badge);
            });

            const exp = document.createElement('span');
            exp.className = 'muted';
            exp.textContent = trainer.experience || 'Опыт не указан';

            meta.append(name, role, exp, badges);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn--ghost';
            removeBtn.textContent = 'Удалить';
            removeBtn.addEventListener('click', () => deleteTrainer(trainer.id));

            item.append(meta, removeBtn);
            trainersList.appendChild(item);
        });
    }

    async function deleteTrainer(id) {
        if (!confirm('Удалить тренера?')) return;
        try {
            const response = await fetch(`/api/trainers/${id}`, getFetchOptions('DELETE'));

            if (!response.ok) {
                showStatus('Не удалось удалить тренера', 'error');
                return;
            }

            showStatus('Тренер удалён', 'success');
            await loadTrainers();
        } catch (error) {
            showStatus('Ошибка сети при удалении', 'error');
        }
    }

    async function loadNews() {
        newsList.textContent = 'Загрузка...';
        try {
            const response = await fetch('/api/news', { credentials: 'same-origin' });
            const news = await response.json();
            const sorted = news.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
            renderNews(sorted);
        } catch (error) {
            newsList.textContent = 'Не удалось загрузить новости';
        }
    }

    function renderNews(news) {
        newsCount.textContent = news.length;

        if (!news.length) {
            newsList.textContent = 'Пока нет новостей';
            return;
        }

        newsList.innerHTML = '';
        news.forEach(item => {
            const listItem = document.createElement('div');
            listItem.className = 'list__item';

            const meta = document.createElement('div');
            meta.className = 'list__meta';

            const title = document.createElement('strong');
            title.textContent = item.title || 'Без заголовка';

            const info = document.createElement('span');
            info.className = 'muted';
            info.textContent = `${formatDate(item.date)} • ${item.category}`;

            const preview = document.createElement('span');
            preview.className = 'muted';
            preview.textContent = item.text;

            meta.append(title, info, preview);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn--ghost';
            removeBtn.textContent = 'Удалить';
            removeBtn.addEventListener('click', () => deleteNews(item.id));

            listItem.append(meta, removeBtn);
            newsList.appendChild(listItem);
        });
    }

    async function deleteNews(id) {
        if (!confirm('Удалить новость?')) return;
        try {
            const response = await fetch(`/api/news/${id}`, getFetchOptions('DELETE'));

            if (!response.ok) {
                showStatus('Не удалось удалить новость', 'error');
                return;
            }

            showStatus('Новость удалена', 'success');
            await loadNews();
        } catch (error) {
            showStatus('Ошибка сети при удалении', 'error');
        }
    }

    async function loadHalls() {
        hallsList.textContent = 'Загрузка...';
        try {
            const response = await fetch('/api/halls', { credentials: 'same-origin' });
            const halls = await response.json();
            renderHalls(halls);
        } catch (error) {
            hallsList.textContent = 'Не удалось загрузить залы';
        }
    }

    function renderHalls(halls) {
        hallsCount.textContent = halls.length;

        if (!halls.length) {
            hallsList.textContent = 'Пока нет залов';
            return;
        }

        hallsList.innerHTML = '';
        halls.forEach(hall => {
            const item = document.createElement('div');
            item.className = 'list__item';

            const meta = document.createElement('div');
            meta.className = 'list__meta';

            const name = document.createElement('strong');
            name.textContent = hall.name;

            const address = document.createElement('span');
            address.className = 'muted';
            address.textContent = hall.address;

            const desc = document.createElement('span');
            desc.className = 'muted';
            desc.textContent = hall.description || '';

            meta.append(name, address, desc);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn--ghost';
            removeBtn.textContent = 'Удалить';
            removeBtn.addEventListener('click', () => deleteHall(hall.id));

            item.append(meta, removeBtn);
            hallsList.appendChild(item);
        });
    }

    async function deleteHall(id) {
        if (!confirm('Удалить зал?')) return;
        try {
            const response = await fetch(`/api/halls/${id}`, getFetchOptions('DELETE'));
            if (!response.ok) {
                showStatus('Не удалось удалить зал', 'error');
                return;
            }
            showStatus('Зал удалён', 'success');
            await loadHalls();
        } catch (error) {
            showStatus('Ошибка сети при удалении', 'error');
        }
    }

    async function loadSchedule() {
        scheduleList.textContent = 'Загрузка...';
        try {
            const response = await fetch('/api/schedule', { credentials: 'same-origin' });
            const schedule = await response.json();
            renderSchedule(schedule);
        } catch (error) {
            scheduleList.textContent = 'Не удалось загрузить расписание';
        }
    }

    function renderSchedule(schedule) {
        const order = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
        const sorted = (schedule || []).slice().sort((a, b) => {
            const ai = order.indexOf(a.day);
            const bi = order.indexOf(b.day);
            if (ai === bi) return (a.time || '').localeCompare(b.time || '');
            return ai - bi;
        });

        scheduleCount.textContent = sorted.length;

        if (!sorted.length) {
            scheduleList.textContent = 'Пока нет записей';
            return;
        }

        scheduleList.innerHTML = '';
        sorted.forEach(item => {
            const row = document.createElement('div');
            row.className = 'list__item';

            const meta = document.createElement('div');
            meta.className = 'list__meta';

            const title = document.createElement('strong');
            title.textContent = `${item.day} • ${item.time || ''}`;

            const subtitle = document.createElement('span');
            subtitle.className = 'muted';
            subtitle.textContent = item.label || '';

            const hall = document.createElement('span');
            hall.className = 'muted';
            hall.textContent = item.hall ? `Зал: ${item.hall}` : '';

            meta.append(title, subtitle, hall);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn--ghost';
            removeBtn.textContent = 'Удалить';
            removeBtn.addEventListener('click', () => deleteSchedule(item.id));

            row.append(meta, removeBtn);
            scheduleList.appendChild(row);
        });
    }

    async function deleteSchedule(id) {
        if (!confirm('Удалить запись расписания?')) return;
        try {
            const response = await fetch(`/api/schedule/${id}`, getFetchOptions('DELETE'));
            if (!response.ok) {
                showStatus('Не удалось удалить запись', 'error');
                return;
            }
            showStatus('Запись удалена', 'success');
            await loadSchedule();
        } catch (error) {
            showStatus('Ошибка сети при удалении', 'error');
        }
    }

    async function loadContacts() {
        contactsPreview.textContent = 'Загрузка...';
        try {
            const response = await fetch('/api/contacts', { credentials: 'same-origin' });
            const contacts = await response.json();

            contactsPreview.innerHTML = '';
            const meta = document.createElement('div');
            meta.className = 'list__meta';

            const addressEl = document.createElement('span');
            addressEl.textContent = contacts.address || 'Адрес не указан';

            const phonesEl = document.createElement('span');
            phonesEl.className = 'muted';
            const phones = Array.isArray(contacts.phones) ? contacts.phones.filter(Boolean) : [];
            phonesEl.textContent = phones.length ? phones.join(', ') : 'Телефоны не указаны';

            const emailEl = document.createElement('span');
            emailEl.className = 'muted';
            emailEl.textContent = contacts.email || 'Email не указан';

            meta.append(addressEl, phonesEl, emailEl);
            contactsPreview.appendChild(meta);

            // Префилл формы
            contactsForm.querySelector('textarea[name="address"]').value = contacts.address || '';
            contactsForm.querySelector('input[name="phones"]').value = phones.join(', ');
            contactsForm.querySelector('input[name="email"]').value = contacts.email || '';
        } catch (error) {
            contactsPreview.textContent = 'Не удалось загрузить контакты';
        }
    }

    async function loadSocials() {
        socialsPreview.textContent = 'Загрузка...';
        try {
            const response = await fetch('/api/socials', { credentials: 'same-origin' });
            const socials = await response.json();

            socialsPreview.innerHTML = '';
            const meta = document.createElement('div');
            meta.className = 'list__meta';

            const vkEl = document.createElement('span');
            vkEl.className = 'muted';
            vkEl.textContent = socials.vk || 'VK не указан';

            const tgEl = document.createElement('span');
            tgEl.className = 'muted';
            tgEl.textContent = socials.telegram || 'Telegram не указан';

            const igEl = document.createElement('span');
            igEl.className = 'muted';
            igEl.textContent = socials.instagram || 'Instagram не указан';

            meta.append(vkEl, tgEl, igEl);
            socialsPreview.appendChild(meta);

            socialsForm.querySelector('input[name="vk"]').value = socials.vk || '';
            socialsForm.querySelector('input[name="telegram"]').value = socials.telegram || '';
            socialsForm.querySelector('input[name="instagram"]').value = socials.instagram || '';
        } catch (error) {
            socialsPreview.textContent = 'Не удалось загрузить ссылки';
        }
    }

    function showStatus(message, type = 'info') {
        statusBar.textContent = message;
        statusBar.classList.remove('hidden', 'status--success', 'status--error');

        if (type === 'success') {
            statusBar.classList.add('status--success');
        } else if (type === 'error') {
            statusBar.classList.add('status--error');
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

})();


