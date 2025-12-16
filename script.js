/**
 * Скрипт для одностраничного сайта Федерации самбо «Витязь»
 * Функционал:
 * - Плавный скролл до якорей
 * - Анимация появления блоков при прокрутке
 * - Валидация формы обратной связи
 * - Мобильное меню
 * - Карусель новостей
 * - Фильтры расписания
 */

(function() {
    'use strict';

    // ============================================
    // Инициализация при загрузке DOM
    // ============================================
    
    document.addEventListener('DOMContentLoaded', async function() {
        initSmoothScroll();
        await loadDynamicData();
        initScrollAnimations();
        initMobileMenu();
        initNewsSlider();
        initScheduleFilters();
        initContactForm();
        initScrollToTop();
    });

    // ============================================
    // Динамическая загрузка тренеров и новостей
    // ============================================

    async function loadDynamicData() {
        await Promise.all([
            loadCoachesData(),
            loadNewsData(),
            loadHallsData(),
            loadScheduleData(),
            loadContactsData(),
            loadSocialsData()
        ]);
    }

    async function loadCoachesData() {
        const coachesContainer = document.querySelector('.coaches__grid');
        const emptyState = document.querySelector('[data-coaches-empty]');

        if (!coachesContainer) return;

        try {
            const response = await fetch('/api/trainers');
            if (!response.ok) throw new Error('Не удалось загрузить тренеров');

            const trainers = await response.json();
            coachesContainer.innerHTML = '';

            if (!Array.isArray(trainers) || trainers.length === 0) {
                if (emptyState) {
                    emptyState.style.display = 'block';
                }
                return;
            }

            trainers.forEach(trainer => {
                coachesContainer.appendChild(createCoachCard(trainer));
            });

            if (emptyState) {
                emptyState.style.display = 'none';
            }
        } catch (error) {
            console.error(error);
            if (emptyState) {
                emptyState.textContent = 'Не удалось загрузить тренеров. Попробуйте позже.';
                emptyState.style.display = 'block';
            }
        }
    }

    function createCoachCard(trainer) {
        const card = document.createElement('div');
        card.className = 'coach-card';

        const photoWrap = document.createElement('div');
        photoWrap.className = 'coach-card__photo';

        const img = document.createElement('img');
        img.className = 'coach-card__img';
        img.alt = trainer.name || 'Тренер';
        img.src = trainer.photoUrl || 'https://via.placeholder.com/200x200/224D9A/FEFEFE?text=Тренер';

        photoWrap.appendChild(img);

        const content = document.createElement('div');
        content.className = 'coach-card__content';

        const name = document.createElement('h3');
        name.className = 'coach-card__name';
        name.textContent = trainer.name || 'Без имени';

        const position = document.createElement('p');
        position.className = 'coach-card__position';
        position.textContent = trainer.position || '';

        const badgesWrap = document.createElement('div');
        badgesWrap.className = 'coach-card__badges';

        (trainer.badges || []).forEach((badgeText, index) => {
            const badge = document.createElement('span');
            badge.className = `badge ${index % 2 === 0 ? 'badge--red' : 'badge--blue'}`;
            badge.textContent = badgeText;
            badgesWrap.appendChild(badge);
        });

        const experience = document.createElement('p');
        experience.className = 'coach-card__experience';
        experience.textContent = trainer.experience || 'Опыт не указан';

        content.append(name, position, badgesWrap, experience);
        card.append(photoWrap, content);

        return card;
    }

    async function loadNewsData() {
        const newsList = document.querySelector('.news__list');
        const emptyState = document.querySelector('[data-news-empty]');

        if (!newsList) return;

        try {
            const response = await fetch('/api/news');
            if (!response.ok) throw new Error('Не удалось загрузить новости');

            const news = await response.json();
            newsList.innerHTML = '';

            if (!Array.isArray(news) || news.length === 0) {
                if (emptyState) {
                    emptyState.style.display = 'block';
                }
                return;
            }

            const sorted = news.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

            sorted.forEach(item => {
                newsList.appendChild(createNewsCard(item));
            });

            if (emptyState) {
                emptyState.style.display = 'none';
            }
        } catch (error) {
            console.error(error);
            if (emptyState) {
                emptyState.textContent = 'Не удалось загрузить новости. Попробуйте позже.';
                emptyState.style.display = 'block';
            }
        }
    }

    function createNewsCard(item) {
        const article = document.createElement('article');
        article.className = 'news-card';

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'news-card__image';

        const img = document.createElement('img');
        img.className = 'news-card__img';
        img.alt = item.title || item.category || 'Новость';
        img.src = item.imageUrl || 'https://via.placeholder.com/300x200/224D9A/FEFEFE?text=Новость';

        imageWrapper.appendChild(img);

        const content = document.createElement('div');
        content.className = 'news-card__content';

        const time = document.createElement('time');
        time.className = 'news-card__date';
        time.dateTime = item.date || '';
        time.textContent = formatDate(item.date);

        const category = document.createElement('span');
        category.className = 'news-card__category';
        category.textContent = item.category || 'Без категории';

        const text = document.createElement('p');
        text.className = 'news-card__text';
        text.textContent = item.text || '';

        content.append(time, category, text);
        article.append(imageWrapper, content);

        return article;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString || '';

        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // ============================================
    // Динамика залов
    // ============================================

    async function loadHallsData() {
        const hallsContainer = document.querySelector('[data-halls]');
        const emptyState = document.querySelector('[data-halls-empty]');
        if (!hallsContainer) return;

        try {
            const response = await fetch('/api/halls');
            if (!response.ok) throw new Error('Не удалось загрузить залы');

            const halls = await response.json();
            hallsContainer.innerHTML = '';

            if (!Array.isArray(halls) || halls.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            halls.forEach(hall => hallsContainer.appendChild(createHallCard(hall)));
            if (emptyState) emptyState.style.display = 'none';
        } catch (error) {
            console.error(error);
            if (emptyState) {
                emptyState.textContent = 'Не удалось загрузить залы. Попробуйте позже.';
                emptyState.style.display = 'block';
            }
        }
    }

    function createHallCard(hall) {
        const card = document.createElement('div');
        card.className = 'hall-card';

        const imageWrap = document.createElement('div');
        imageWrap.className = 'hall-card__image';
        const img = document.createElement('img');
        img.className = 'hall-card__img';
        img.src = hall.imageUrl || 'https://via.placeholder.com/400x300/224D9A/FEFEFE?text=Зал';
        img.alt = hall.name || 'Зал';
        imageWrap.appendChild(img);

        const content = document.createElement('div');
        content.className = 'hall-card__content';

        const title = document.createElement('h3');
        title.className = 'hall-card__title';
        title.textContent = hall.name || 'Без названия';

        const text = document.createElement('p');
        text.className = 'hall-card__text';
        text.textContent = hall.description || '';

        const address = document.createElement('p');
        address.className = 'hall-card__address';
        address.textContent = hall.address || '';

        content.append(title, text, address);
        card.append(imageWrap, content);
        return card;
    }

    // ============================================
    // Динамика расписания
    // ============================================

    const DAY_ORDER = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    const DAY_LABELS = {
        'ПН': 'ПН',
        'ВТ': 'ВТ',
        'СР': 'СР',
        'ЧТ': 'ЧТ',
        'ПТ': 'ПТ',
        'СБ': 'СБ',
        'ВС': 'ВС'
    };

    async function loadScheduleData() {
        const headerRow = document.querySelector('[data-schedule-header]');
        const body = document.querySelector('[data-schedule-body]');
        const filtersContainer = document.querySelector('[data-schedule-filters]');
        const emptyState = document.querySelector('[data-schedule-empty]');

        if (!headerRow || !body) return;

        try {
            const response = await fetch('/api/schedule');
            if (!response.ok) throw new Error('Не удалось загрузить расписание');
            const schedule = await response.json();

            if (!Array.isArray(schedule) || schedule.length === 0) {
                body.innerHTML = '';
                headerRow.innerHTML = '';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            const hallNames = {};
            schedule.forEach(item => {
                if (item.hall) hallNames[item.hall] = item.hall;
            });

            const uniqueHalls = Array.from(new Set(schedule.map(item => item.hall || 'all')));
            renderScheduleFilters(filtersContainer, uniqueHalls, hallNames);
            renderScheduleTable(schedule, body, headerRow, hallNames);

            if (emptyState) emptyState.style.display = 'none';
        } catch (error) {
            console.error(error);
            if (emptyState) {
                emptyState.textContent = 'Не удалось загрузить расписание. Попробуйте позже.';
                emptyState.style.display = 'block';
            }
        }
    }

    function renderScheduleFilters(container, hallIds, hallNames) {
        if (!container) return;
        container.innerHTML = '';

        const allBtn = createScheduleFilterButton('all', 'Все залы', true);
        container.appendChild(allBtn);

        hallIds
            .filter(h => h !== 'all')
            .forEach(id => {
                const name = hallNames[id] || 'Зал';
                container.appendChild(createScheduleFilterButton(id, name, false));
            });
    }

    function createScheduleFilterButton(value, label, active) {
        const btn = document.createElement('button');
        btn.className = 'schedule__filter' + (active ? ' schedule__filter--active' : '');
        btn.dataset.hall = value;
        btn.innerHTML = `<span>${label}</span>`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.schedule__filter').forEach(b => b.classList.remove('schedule__filter--active'));
            btn.classList.add('schedule__filter--active');
            applyScheduleFilter(value);
        });
        return btn;
    }

    function renderScheduleTable(schedule, bodyEl, headerEl, hallNames) {
        const daysOrder = DAY_ORDER;
        headerEl.innerHTML = '';
        daysOrder.forEach(day => {
            const th = document.createElement('th');
            th.className = 'schedule__header';
            th.textContent = DAY_LABELS[day];
            headerEl.appendChild(th);
        });

        // сгруппируем по дням
        const grouped = daysOrder.map(day => schedule.filter(item => item.day === day));
        // максимальное количество строк
        const maxRows = grouped.reduce((max, items) => Math.max(max, items.length), 0);

        bodyEl.innerHTML = '';
        for (let i = 0; i < maxRows; i++) {
            const tr = document.createElement('tr');
            tr.className = 'schedule__row';
            daysOrder.forEach((day, idx) => {
                const entry = grouped[idx][i];
                const td = document.createElement('td');
                td.className = 'schedule__cell';
                if (entry) {
                    if (entry.type) {
                        td.classList.add(`schedule__cell--${entry.type}`);
                    }
                    td.dataset.hall = entry.hall || 'all';
                    td.innerHTML = `${entry.time || ''}<br>${entry.label || ''}<br><span class="schedule__hall-label">${hallNames[entry.hall] || entry.hall || ''}</span>`;
                } else {
                    td.classList.add('schedule__cell--rest');
                    td.textContent = '—';
                }
                tr.appendChild(td);
            });
            bodyEl.appendChild(tr);
        }
    }

    function applyScheduleFilter(hallId) {
        const cells = document.querySelectorAll('.schedule__cell');
        cells.forEach(cell => {
            if (hallId === 'all') {
                cell.style.opacity = '1';
            } else {
                const matches = cell.dataset.hall === hallId;
                cell.style.opacity = matches ? '1' : '0.25';
            }
        });
    }

    // ============================================
    // Динамика контактов
    // ============================================

    async function loadContactsData() {
        const addressEl = document.querySelector('[data-contact-address]');
        const phonesEl = document.querySelector('[data-contact-phones]');
        const emailEl = document.querySelector('[data-contact-email]');

        try {
            const response = await fetch('/api/contacts');
            if (!response.ok) throw new Error('Не удалось загрузить контакты');
            const data = await response.json();

            if (addressEl) addressEl.textContent = data.address || 'Адрес уточняется';

            if (phonesEl) {
                phonesEl.innerHTML = '';
                const phones = Array.isArray(data.phones) ? data.phones.filter(Boolean) : [];
                if (phones.length === 0) {
                    phonesEl.textContent = 'Телефоны уточняются';
                } else {
                    phones.forEach((phone, idx) => {
                        const link = document.createElement('a');
                        link.href = `tel:${phone.replace(/\D/g, '')}`;
                        link.className = 'contact-item__link';
                        link.textContent = phone;
                        phonesEl.appendChild(link);
                        if (idx !== phones.length - 1) {
                            phonesEl.appendChild(document.createElement('br'));
                        }
                    });
                }
            }

            if (emailEl && data.email) {
                emailEl.textContent = data.email;
                emailEl.href = `mailto:${data.email}`;
            } else if (emailEl) {
                emailEl.textContent = 'Email уточняется';
                emailEl.href = '#';
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function loadSocialsData() {
        const socialsWrapper = document.querySelector('[data-contact-socials]');
        if (!socialsWrapper) return;

        try {
            const response = await fetch('/api/socials');
            if (!response.ok) throw new Error('Не удалось загрузить соцсети');
            const socials = await response.json();

            socialsWrapper.querySelectorAll('.social-link').forEach(link => {
                const key = link.dataset.social;
                const href = socials[key] || '';
                link.href = href || '#';
                link.style.opacity = href ? '1' : '0.4';
                link.setAttribute('aria-disabled', href ? 'false' : 'true');
                link.target = href ? '_blank' : '_self';
                link.rel = 'noopener';
            });
        } catch (error) {
            console.error(error);
        }
    }

    // ============================================
    // Плавный скролл до якорей
    // ============================================
    
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Пропускаем пустые якори
                if (href === '#' || href === '') {
                    return;
                }
                
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    
                    // Закрываем мобильное меню, если открыто
                    const headerNav = document.querySelector('.header__nav');
                    const headerBurger = document.querySelector('.header__burger');
                    if (headerNav && headerNav.classList.contains('active')) {
                        headerNav.classList.remove('active');
                        headerBurger.classList.remove('active');
                    }
                    
                    // Вычисляем позицию с учётом фиксированного хедера
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ============================================
    // Анимация появления блоков при прокрутке
    // ============================================
    
    function initScrollAnimations() {
        // Элементы, которые должны анимироваться
        const animatedElements = document.querySelectorAll(
            '.advantage-card, .hall-card, .coach-card'
        );
        
        // Создаём Intersection Observer для отслеживания видимости элементов
        const observerOptions = {
            threshold: 0.1, // Элемент считается видимым, когда 10% его видно
            rootMargin: '0px 0px -100px 0px' // Задержка перед анимацией для более плавного появления
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Добавляем задержку для последовательного появления элементов
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                    // Отключаем наблюдение после появления, чтобы анимация не повторялась
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Начинаем наблюдение за каждым элементом
        animatedElements.forEach(element => {
            observer.observe(element);
        });
        
        // Анимация для секции "О нас"
        const aboutSection = document.querySelector('.about__content');
        if (aboutSection) {
            const aboutObserver = new IntersectionObserver(function(entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in', 'visible');
                        aboutObserver.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            aboutObserver.observe(aboutSection);
        }
    }

    // ============================================
    // Мобильное меню
    // ============================================
    
    function initMobileMenu() {
        const burger = document.querySelector('.header__burger');
        const nav = document.querySelector('.header__nav');
        const navLinks = document.querySelectorAll('.header__nav-link');
        
        if (!burger || !nav) return;
        
        // Переключение меню по клику на бургер
        burger.addEventListener('click', function() {
            nav.classList.toggle('active');
            burger.classList.toggle('active');
            // Блокируем скролл страницы, когда меню открыто
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });
        
        // Закрытие меню при клике на ссылку
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
                burger.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Закрытие меню при клике вне его области
        document.addEventListener('click', function(e) {
            if (nav.classList.contains('active') && 
                !nav.contains(e.target) && 
                !burger.contains(e.target)) {
                nav.classList.remove('active');
                burger.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // ============================================
    // Карусель новостей
    // ============================================
    
    function initNewsSlider() {
        const prevBtn = document.querySelector('.news__arrow--prev');
        const nextBtn = document.querySelector('.news__arrow--next');
        const newsList = document.querySelector('.news__list');
        const newsTrack = document.querySelector('.news__track');
        
        if (!prevBtn || !nextBtn || !newsList) return;

        const newsCards = newsList.querySelectorAll('.news-card');

        if (newsCards.length === 0) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            prevBtn.style.opacity = '0.4';
            nextBtn.style.opacity = '0.4';
            newsList.style.transform = 'translateX(0px)';
            return;
        }
        
        // Количество карточек, видимых одновременно
        const cardsPerView = 3;
        let currentIndex = 0;
        const maxIndex = Math.max(0, newsCards.length - cardsPerView);
        
        // Функция для вычисления ширины карточки с учётом gap
        function getCardWidth() {
            if (newsCards.length === 0) return 0;
            const card = newsCards[0];
            const cardStyle = window.getComputedStyle(card);
            const cardWidth = card.offsetWidth;
            const gap = parseInt(window.getComputedStyle(newsList).gap) || 16;
            return cardWidth + gap;
        }
        
        // Функция для обновления позиции слайдера
        function updateSlider(index = currentIndex, smooth = true) {
            const cardWidth = getCardWidth();
            // Начальная позиция должна быть 0, чтобы первая карточка была полностью видна
            const translateX = index > 0 ? -index * cardWidth : 0;
            
            newsList.style.transition = smooth ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
            newsList.style.transform = `translateX(${translateX}px)`;
            
            // Обновляем состояние кнопок
            prevBtn.disabled = index <= 0;
            nextBtn.disabled = index >= maxIndex;
            
            // Визуальная обратная связь для кнопок
            if (prevBtn.disabled) {
                prevBtn.style.opacity = '0.4';
            } else {
                prevBtn.style.opacity = '1';
            }
            
            if (nextBtn.disabled) {
                nextBtn.style.opacity = '0.4';
            } else {
                nextBtn.style.opacity = '1';
            }
        }
        
        // Обработчики для кнопок
        prevBtn.addEventListener('click', function() {
            if (currentIndex > 0) {
                currentIndex--;
                updateSlider(currentIndex);
            }
        });
        
        nextBtn.addEventListener('click', function() {
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateSlider(currentIndex);
            }
        });
        
        // Touch-события для свайпа на мобильных
        if (newsTrack) {
            let touchStartX = 0;
            let touchEndX = 0;
            let isDragging = false;
            
            newsTrack.addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].screenX;
                isDragging = true;
            }, { passive: true });
            
            newsTrack.addEventListener('touchmove', function(e) {
                if (isDragging) {
                    touchEndX = e.changedTouches[0].screenX;
                }
            }, { passive: true });
            
            newsTrack.addEventListener('touchend', function(e) {
                if (isDragging) {
                    touchEndX = e.changedTouches[0].screenX;
                    handleSwipe();
                    isDragging = false;
                }
            }, { passive: true });
            
            function handleSwipe() {
                const swipeThreshold = 50;
                const diff = touchStartX - touchEndX;
                
                if (Math.abs(diff) > swipeThreshold) {
                    if (diff > 0 && currentIndex < maxIndex) {
                        // Свайп влево - следующая группа карточек
                        currentIndex = Math.min(currentIndex + 1, maxIndex);
                        updateSlider(currentIndex);
                    } else if (diff < 0 && currentIndex > 0) {
                        // Свайп вправо - предыдущая группа карточек
                        currentIndex = Math.max(currentIndex - 1, 0);
                        updateSlider(currentIndex);
                    }
                }
            }
        }
        
        // Инициализация состояния кнопок
        // Убеждаемся, что начальная позиция = 0
        currentIndex = 0;
        newsList.style.transform = 'translateX(0px)';
        updateSlider(0, false);
        
        // Обработка изменения размера окна
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                updateSlider(currentIndex, false);
            }, 250);
        });
    }

    // ============================================
    // Фильтры расписания
    // ============================================
    
    function initScheduleFilters() {
        // Фильтры создаются динамически в loadScheduleData, здесь дополнительной логики не требуется
    }

    // ============================================
    // Валидация формы обратной связи
    // ============================================
    
    function initContactForm() {
        const form = document.getElementById('contactForm');
        const statusNode = form?.querySelector('[data-contact-status]');
        
        if (!form) return;
        
        const nameInput = form.querySelector('input[name="name"]');
        const phoneInput = form.querySelector('input[name="phone"]');
        const messageTextarea = form.querySelector('textarea[name="message"]');
        
        // Регулярное выражение для валидации имени (только буквы, пробелы, дефисы)
        const nameRegex = /^[а-яА-ЯёЁa-zA-Z\s\-]{2,50}$/;
        
        // Регулярное выражение для валидации телефона (российский формат)
        const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
        
        // Функция для отображения ошибки
        function showError(input, message) {
            const errorElement = input.parentElement.querySelector('.contact-form__error');
            if (errorElement) {
                errorElement.textContent = message;
            }
            input.classList.add('error');
        }
        
        // Функция для очистки ошибки
        function clearError(input) {
            const errorElement = input.parentElement.querySelector('.contact-form__error');
            if (errorElement) {
                errorElement.textContent = '';
            }
            input.classList.remove('error');
        }
        
        // Валидация имени
        if (nameInput) {
            nameInput.addEventListener('blur', function() {
                const value = this.value.trim();
                if (value === '') {
                    showError(this, 'Поле обязательно для заполнения');
                } else if (!nameRegex.test(value)) {
                    showError(this, 'Имя должно содержать только буквы (2-50 символов)');
                } else {
                    clearError(this);
                }
            });
            
            nameInput.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    clearError(this);
                }
            });
        }
        
        // Валидация телефона
        if (phoneInput) {
            phoneInput.addEventListener('blur', function() {
                const value = this.value.trim();
                if (value === '') {
                    showError(this, 'Поле обязательно для заполнения');
                } else if (!phoneRegex.test(value)) {
                    showError(this, 'Введите корректный номер телефона');
                } else {
                    clearError(this);
                }
            });
            
            phoneInput.addEventListener('input', function() {
                // Маска для телефона (опционально)
                let value = this.value.replace(/\D/g, '');
                if (value.startsWith('8')) {
                    value = '7' + value.slice(1);
                }
                if (value.startsWith('7') && value.length > 1) {
                    this.value = '+7 (' + value.slice(1, 4) + ') ' + value.slice(4, 7) + '-' + value.slice(7, 9) + '-' + value.slice(9, 11);
                }
                
                if (this.classList.contains('error')) {
                    clearError(this);
                }
            });
        }
        
        // Обработка отправки формы
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let isValid = true;
            if (statusNode) {
                statusNode.textContent = '';
                statusNode.classList.remove('contact-form__note--success', 'contact-form__note--error');
            }
            
            // Проверка имени
            if (nameInput) {
                const nameValue = nameInput.value.trim();
                if (nameValue === '' || !nameRegex.test(nameValue)) {
                    showError(nameInput, nameValue === '' ? 'Поле обязательно для заполнения' : 'Имя должно содержать только буквы (2-50 символов)');
                    isValid = false;
                } else {
                    clearError(nameInput);
                }
            }
            
            // Проверка телефона
            if (phoneInput) {
                const phoneValue = phoneInput.value.trim();
                if (phoneValue === '' || !phoneRegex.test(phoneValue)) {
                    showError(phoneInput, phoneValue === '' ? 'Поле обязательно для заполнения' : 'Введите корректный номер телефона');
                    isValid = false;
                } else {
                    clearError(phoneInput);
                }
            }
            
            // Если форма валидна, отправляем данные
            if (isValid) {
                const payload = {
                    name: nameInput?.value.trim(),
                    phone: phoneInput?.value.trim(),
                    message: messageTextarea?.value.trim()
                };

                fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(async response => {
                    if (!response.ok) {
                        const error = await response.json().catch(() => ({}));
                        throw new Error(error.message || 'Не удалось отправить заявку');
                    }
                    return response.json();
                })
                .then(() => {
                    if (statusNode) {
                        statusNode.textContent = 'Спасибо! Ваша заявка принята.';
                        statusNode.classList.add('contact-form__note--success');
                    } else {
                        alert('Спасибо! Ваша заявка принята.');
                    }
                    form.reset();
                    form.querySelectorAll('.contact-form__input, .contact-form__textarea').forEach(input => {
                        clearError(input);
                    });
                })
                .catch(err => {
                    if (statusNode) {
                        statusNode.textContent = err.message || 'Сервер недоступен. Попробуйте позже.';
                        statusNode.classList.add('contact-form__note--error');
                    } else {
                        alert(err.message || 'Сервер недоступен. Попробуйте позже.');
                    }
                });
            } else {
                // Прокручиваем к первой ошибке
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }
        });
    }

    // ============================================
    // Кнопка "Наверх"
    // ============================================
    
    function initScrollToTop() {
        const scrollTopBtn = document.querySelector('.footer__scroll-top');
        
        if (!scrollTopBtn) return;
        
        // Показываем/скрываем кнопку при прокрутке
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollTopBtn.style.opacity = '1';
                scrollTopBtn.style.visibility = 'visible';
            } else {
                scrollTopBtn.style.opacity = '0';
                scrollTopBtn.style.visibility = 'hidden';
            }
        });
        
        // Прокрутка наверх при клике
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Изначально скрываем кнопку
        scrollTopBtn.style.opacity = '0';
        scrollTopBtn.style.visibility = 'hidden';
        scrollTopBtn.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    }

    // ============================================
    // Дополнительные улучшения UX
    // ============================================
    
    // Изменение стиля хедера при прокрутке
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        const currentScroll = window.pageYOffset;
        
        if (header) {
            if (currentScroll > 50) {
                header.classList.add('scrolled');
                header.style.backgroundColor = 'rgba(254, 254, 254, 0.98)';
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.12)';
            } else {
                header.classList.remove('scrolled');
                header.style.backgroundColor = 'rgba(254, 254, 254, 0.95)';
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }
            
            lastScroll = currentScroll;
        }
    }, { passive: true });
    
    // Предзагрузка изображений для улучшения производительности
    function preloadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.getAttribute('data-src');
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Запускаем предзагрузку, если есть изображения с data-src
    if (document.querySelectorAll('img[data-src]').length > 0) {
        preloadImages();
    }
    
})();