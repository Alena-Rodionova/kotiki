// ============================================================
// 🔑 API-ключ TheCatAPI
// ============================================================
const API_KEY = 'live_yE5m11kW7HBUP8a611LHrO2WgqdTApPTzEJo2dsSrPv7oMYQhpBuMTjFQGSUmSuX';
const API_BREEDS = 'https://api.thecatapi.com/v1/breeds';

// ============================================================
// Метки значений (числа API → текст на русском)
// ============================================================
const COAT_LABELS     = { 1: 'Короткая', 2: 'Средняя', 3: 'Длинная' };
const ENERGY_LABELS   = { 1: 'Спокойный', 2: 'Умеренный', 3: 'Активный', 4: 'Очень активный', 5: 'Гиперактивный' };
const SHEDDING_LABELS = { 1: 'Низкая', 2: 'Средняя', 3: 'Высокая' };

const GRADIENTS = [
    'linear-gradient(135deg, #ff8c42, #ff5e62)',
    'linear-gradient(135deg, #ffb86b, #ff6b6b)',
    'linear-gradient(135deg, #ffd3a5, #fd6585)',
    'linear-gradient(135deg, #ffc796, #ff6b9d)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #ffa8a8, #ff6b6b)'
];

const EMOJIS = ['🐱', '😺', '😸', '😻', '🐈', '😽'];

// ============================================================
// Ссылки на DOM
// ============================================================
let cardsGrid, refreshBtn, statusEl, statusText;
let modal, modalClose, modalImg, modalTitle, modalOrigin,
    modalTemper, modalStats, modalDesc, modalLink;

// Состояние
let allBreeds = [];
let currentBreeds = [];

// ============================================================
// 📸 URL фото с ключом
// ============================================================
function getImageUrl(breed) {
    const rawUrl = breed && breed.image && breed.image.url;
    if (!rawUrl) return null;
    const sep = rawUrl.indexOf('?') >= 0 ? '&' : '?';
    return rawUrl + sep + 'api_key=' + API_KEY;
}

// ============================================================
// Fetch с ключом
// ============================================================
async function safeFetch(url, timeout) {
    timeout = timeout || 15000;
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeout);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'x-api-key': API_KEY
            }
        });

        if (res.status === 401 || res.status === 403) {
            throw new Error('API-ключ недействителен.');
        }
        if (res.status === 429) {
            throw new Error('Превышен лимит запросов. Подождите минуту.');
        }
        if (!res.ok) {
            throw new Error('HTTP ' + res.status);
        }

        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

// ============================================================
// Статус
// ============================================================
function setStatus(state, text) {
    statusEl.className = 'status ' + state;
    statusText.textContent = text;
}

// ============================================================
// Скелетоны
// ============================================================
function renderSkeletons() {
    let html = '';
    for (let i = 0; i < 6; i++) {
        html +=
            '<div class="card" style="animation-delay:' + (i * 0.06) + 's; cursor: default;">' +
                '<div class="skeleton-image"></div>' +
                '<div class="card-body">' +
                    '<div class="skeleton-line short"></div>' +
                    '<div class="skeleton-line"></div>' +
                    '<div class="skeleton-line"></div>' +
                    '<div class="skeleton-line short"></div>' +
                '</div>' +
            '</div>';
    }
    cardsGrid.innerHTML = html;
}

// ============================================================
// Утилиты
// ============================================================
function getWeightRange(breed) {
    const w = breed && breed.weight;
    const metric = (w && (w.metric || w.imperial)) || '';
    return metric ? metric + ' кг' : '—';
}
function getLifeSpan(breed) {
    return (breed && breed.life_span) ? breed.life_span + ' лет' : '—';
}

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ============================================================
// Карточка породы (оригинальные данные из API)
// ============================================================
function buildCard(breed, index) {
    const name        = breed.name || 'Без названия';
    const origin      = breed.origin || '—';
    const temperament = breed.temperament || 'Информация отсутствует';
    const weight      = getWeightRange(breed);
    const lifeRange   = getLifeSpan(breed);
    const coatLabel   = COAT_LABELS[breed.coat_length] || '—';

    const imgUrl   = getImageUrl(breed);
    const gradient = GRADIENTS[index % GRADIENTS.length];
    const emoji    = EMOJIS[index % EMOJIS.length];

    const imageHTML = imgUrl
        ? '<img class="card-image" src="' + esc(imgUrl) + '" alt="' + esc(name) + '" ' +
          'loading="lazy" ' +
          'onload="this.classList.add(\'loaded\')" ' +
          'onerror="this.remove()">'
        : '';

    return (
        '<article class="card" data-id="' + esc(breed.id) + '" style="animation-delay:' + (index * 0.08) + 's">' +
            '<div class="card-image-wrap" style="background: ' + gradient + ';" data-emoji="' + emoji + '">' +
                imageHTML +
                '<span class="card-badge">' + esc(origin) + '</span>' +
            '</div>' +
            '<div class="card-body">' +
                '<h3 class="card-name">' + esc(name) + '</h3>' +
                '<div class="card-origin">📍 ' + esc(origin) + '</div>' +
                '<p class="card-temperament">' + esc(temperament) + '</p>' +
                '<div class="card-metrics">' +
                    '<div class="metric">' +
                        '<span class="metric-label">Вес</span>' +
                        '<span class="metric-value">' + esc(weight) + '</span>' +
                    '</div>' +
                    '<div class="metric">' +
                        '<span class="metric-label">Жизнь</span>' +
                        '<span class="metric-value">' + esc(lifeRange) + '</span>' +
                    '</div>' +
                    '<div class="metric">' +
                        '<span class="metric-label">Шерсть</span>' +
                        '<span class="metric-value">' + esc(coatLabel) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</article>'
    );
}

function renderBreeds(breeds) {
    if (!breeds.length) {
        cardsGrid.innerHTML =
            '<div class="card" style="grid-column: 1 / -1; text-align:center; cursor:default">' +
                '<div class="card-body"><h3 class="card-name">🙀 Нет данных</h3></div>' +
            '</div>';
        return;
    }

    let html = '';
    for (let i = 0; i < Math.min(6, breeds.length); i++) {
        html += buildCard(breeds[i], i);
    }
    cardsGrid.innerHTML = html;
}

// ============================================================
// Модалка
// ============================================================
function openModal(breed) {
    const name   = breed.name || '—';
    const imgUrl = getImageUrl(breed);

    if (imgUrl) {
        modalImg.style.display = 'block';
        modalImg.src = imgUrl;
    } else {
        modalImg.style.display = 'none';
    }
    modalImg.alt = name;
    modalImg.onerror = function () { this.style.display = 'none'; };

    modalTitle.textContent = name;
    modalOrigin.textContent = '🌍 Страна выведения: ' + (breed.origin || 'неизвестна');
    modalTemper.textContent = breed.temperament ? '«' + breed.temperament + '»' : '';

    modalStats.innerHTML =
        '<div class="stat"><div class="stat-label">Вес</div>' +
        '<div class="stat-value">' + esc(getWeightRange(breed)) + '</div></div>' +
        '<div class="stat"><div class="stat-label">Жизнь</div>' +
        '<div class="stat-value">' + esc(getLifeSpan(breed)) + '</div></div>' +
        '<div class="stat"><div class="stat-label">Шерсть</div>' +
        '<div class="stat-value">' + esc(COAT_LABELS[breed.coat_length] || '—') + '</div></div>' +
        '<div class="stat"><div class="stat-label">Энергия</div>' +
        '<div class="stat-value">' + esc(ENERGY_LABELS[breed.energy_level] || '—') + '</div></div>' +
        '<div class="stat"><div class="stat-label">Линька</div>' +
        '<div class="stat-value">' + esc(SHEDDING_LABELS[breed.shedding_level] || '—') + '</div></div>' +
        '<div class="stat"><div class="stat-label">Гипоаллергенность</div>' +
        '<div class="stat-value">' + (breed.hypoallergenic ? 'Да' : 'Нет') + '</div></div>';

    modalDesc.textContent = breed.description || 'Описание отсутствует.';
    modalLink.href = breed.wikipedia_url
        || 'https://www.google.com/search?q=' + encodeURIComponent(breed.name + ' порода кошек');

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================================
// Перемешивание
// ============================================================
function showRandomBreeds() {
    if (!allBreeds.length) return;
    const shuffled = allBreeds.slice().sort(function () { return Math.random() - 0.5; });
    currentBreeds = shuffled.slice(0, 6);
    renderBreeds(currentBreeds);
}

// ============================================================
// Загрузка
// ============================================================
async function loadData() {
    refreshBtn.disabled = true;
    setStatus('loading', 'Загрузка пород...');
    renderSkeletons();

    try {
        if (!allBreeds.length) {
            const breeds = await safeFetch(API_BREEDS);
            if (!Array.isArray(breeds) || !breeds.length) {
                throw new Error('API вернул пустой список.');
            }
            allBreeds = breeds;

            const withImg = breeds.filter(function (b) {
                return b.image && b.image.url;
            });
            console.log('📊 Породы: всего ' + breeds.length + ', с фото: ' + withImg.length);
        }

        showRandomBreeds();
        setStatus('', 'Пород: ' + allBreeds.length + ' · ' + new Date().toLocaleTimeString('ru-RU'));
    } catch (err) {
        console.error(err);
        setStatus('error', 'Ошибка загрузки');
        cardsGrid.innerHTML =
            '<div class="card" style="grid-column: 1 / -1; cursor:default">' +
                '<div class="card-body" style="text-align:center;padding:32px 24px">' +
                    '<h3 class="card-name" style="margin-bottom:12px">🙀 Не удалось загрузить</h3>' +
                    '<p style="white-space:pre-line;color:var(--muted-color)">' + esc(err.message) + '</p>' +
                '</div>' +
            '</div>';
    } finally {
        refreshBtn.disabled = false;
    }
}

// ============================================================
// Клики
// ============================================================
function handleGridClick(e) {
    const card = e.target.closest('.card');
    if (!card || !card.dataset.id) return;
    const breed = currentBreeds.find(function (b) { return b.id === card.dataset.id; })
               || allBreeds.find(function (b) { return b.id === card.dataset.id; });
    if (breed) openModal(breed);
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    cardsGrid  = document.getElementById('cardsGrid');
    refreshBtn = document.getElementById('refreshBtn');
    statusEl   = document.getElementById('status');
    statusText = document.getElementById('statusText');

    modal        = document.getElementById('modal');
    modalClose   = document.getElementById('modalClose');
    modalImg     = document.getElementById('modalImg');
    modalTitle   = document.getElementById('modalTitle');
    modalOrigin  = document.getElementById('modalOrigin');
    modalTemper  = document.getElementById('modalTemperament');
    modalStats   = document.getElementById('modalStats');
    modalDesc    = document.getElementById('modalDescription');
    modalLink    = document.getElementById('modalLink');

    const required = {
        cardsGrid, refreshBtn, statusEl, statusText,
        modal, modalClose, modalImg, modalTitle, modalOrigin,
        modalTemper, modalStats, modalDesc, modalLink
    };
    const missing = Object.keys(required).filter(function (k) { return !required[k]; });

    if (missing.length) {
        console.error('❌ Не найдены элементы:', missing);
        return;
    }

    if (!API_KEY || API_KEY.indexOf('ВСТАВЬТЕ') >= 0) {
        setStatus('error', 'API-ключ не указан');
        return;
    }

    loadData();

    refreshBtn.addEventListener('click', function () {
        showRandomBreeds();
        setStatus('', 'Обновлено · ' + new Date().toLocaleTimeString('ru-RU'));
    });

    cardsGrid.addEventListener('click', handleGridClick);

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });

    console.log('%c✅ Панель котиков запущена!', 'color:#4caf50;font-weight:700;font-size:14px');
});