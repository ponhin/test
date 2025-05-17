// Конфигурация
const config = {
    databaseUrl: 'database.json',
    popularQueries: [
        "JavaScript",
        "HTML",
        "CSS",
        "React",
        "Vue.js",
        "Node.js",
        "Программирование",
        "Веб-разработка"
    ]
};

// Глобальные переменные
let database = [];
let currentTheme = 'light';
let currentQuery = '';

// DOM элементы
const domElements = {
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    searchResults: document.getElementById('search-results'),
    searchStats: document.getElementById('search-stats'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    loadingElement: document.getElementById('loading'),
    suggestionsElement: document.getElementById('suggestions'),
    homePage: document.getElementById('home-page'),
    resultsPage: document.getElementById('results-page'),
    sidebarSearchInput: document.getElementById('sidebar-search-input'),
    sidebarSearchButton: document.getElementById('sidebar-search-button'),
    resultsSearchResults: document.getElementById('results-search-results'),
    resultsSearchStats: document.getElementById('results-search-stats')
};

// Инициализация приложения
async function initApp() {
    try {
        // Загрузка базы данных
        await loadDatabase();
        
        // Установка темы
        setTheme(localStorage.getItem('searchTheme') || 'light');
        
        // Обработка параметров URL
        handleUrlParams();
        
        // Настройка обработчиков событий
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        showError('Произошла ошибка при загрузке приложения. Пожалуйста, обновите страницу.');
    }
}

// Загрузка базы данных из JSON файла
async function loadDatabase() {
    try {
        const response = await fetch(config.databaseUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        database = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки базы данных:', error);
        throw error;
    }
}

// Обработка параметров URL
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('q');
    
    if (searchParam && domElements.resultsPage) {
        // Это страница результатов
        domElements.sidebarSearchInput.value = searchParam;
        performSearch(searchParam, true);
    } else if (domElements.searchInput) {
        // Это главная страница
        domElements.searchInput.focus();
        
        if (searchParam) {
            domElements.searchInput.value = searchParam;
            performSearch(searchParam);
        }
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Поиск
    if (domElements.searchButton) {
        domElements.searchButton.addEventListener('click', () => performSearch(domElements.searchInput.value));
    }

    if (domElements.searchInput) {
        domElements.searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(domElements.searchInput.value);
                domElements.suggestionsElement.style.display = 'none';
            }
        });
        
        domElements.searchInput.addEventListener('input', function() {
            showSuggestions();
        });
    }

    // Подсказки
    if (domElements.suggestionsElement) {
        domElements.suggestionsElement.addEventListener('click', function(e) {
            if (e.target.classList.contains('suggestion-item')) {
                domElements.searchInput.value = e.target.textContent;
                domElements.suggestionsElement.style.display = 'none';
                performSearch(domElements.searchInput.value);
            }
        });
    }

    // Клик вне подсказок скрывает их
    document.addEventListener('click', function(e) {
        if (domElements.suggestionsElement && !e.target.closest('.search-form')) {
            domElements.suggestionsElement.style.display = 'none';
        }
    });

    // Тема
    domElements.themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setTheme(btn.dataset.theme);
        });
    });

    // Сайдбар
    if (domElements.sidebarSearchButton) {
        domElements.sidebarSearchButton.addEventListener('click', () => performSearch(domElements.sidebarSearchInput.value, true));
    }

    if (domElements.sidebarSearchInput) {
        domElements.sidebarSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(domElements.sidebarSearchInput.value, true);
            }
        });
    }
}

// Функция поиска
function performSearch(query, isSidebarSearch = false) {
    query = query.toLowerCase().trim();
    currentQuery = query;
    
    if (query === '') {
        showEmptyQueryMessage(isSidebarSearch);
        return;
    }

    showLoadingIndicator(isSidebarSearch);
    
    // Имитация задержки поиска
    setTimeout(() => {
        try {
            const results = searchInDatabase(query);
            displaySearchResults(results, query, isSidebarSearch);
            
            if (!isSidebarSearch && domElements.resultsPage) {
                window.location.href = `results.html?q=${encodeURIComponent(query)}`;
            }
        } catch (error) {
            console.error('Ошибка поиска:', error);
            showError('Произошла ошибка при выполнении поиска.', isSidebarSearch);
        } finally {
            hideLoadingIndicator(isSidebarSearch);
        }
    }, 800);
}

// Поиск в базе данных
function searchInDatabase(query) {
    return database.filter(item => {
        return item.title.toLowerCase().includes(query) || 
               item.snippet.toLowerCase().includes(query);
    });
}

// Отображение сообщения о пустом запросе
function showEmptyQueryMessage(isSidebarSearch) {
    const message = '<div class="no-results">Пожалуйста, введите поисковый запрос</div>';
    
    if (isSidebarSearch) {
        domElements.resultsSearchResults.innerHTML = message;
        domElements.resultsSearchStats.textContent = '';
    } else {
        domElements.searchResults.innerHTML = message;
        domElements.searchStats.textContent = '';
    }
}

// Показать индикатор загрузки
function showLoadingIndicator(isSidebarSearch) {
    if (isSidebarSearch) {
        domElements.resultsSearchResults.innerHTML = '';
        domElements.resultsSearchStats.textContent = '';
    } else {
        domElements.loadingElement.style.display = 'block';
        domElements.searchResults.innerHTML = '';
    }
}

// Скрыть индикатор загрузки
function hideLoadingIndicator(isSidebarSearch) {
    if (!isSidebarSearch) {
        domElements.loadingElement.style.display = 'none';
    }
}

// Отображение результатов поиска
function displaySearchResults(results, query, isSidebarSearch = false) {
    if (results.length === 0) {
        showNoResultsMessage(query, isSidebarSearch);
        return;
    }

    const statsText = `Найдено ${results.length} ${formatResultsCount(results.length)} по запросу "${query}"`;
    
    if (isSidebarSearch) {
        domElements.resultsSearchStats.textContent = statsText;
        domElements.resultsSearchStats.classList.add('animate__animated', 'animate__fadeIn');
    } else {
        domElements.searchStats.textContent = statsText;
        domElements.searchStats.classList.add('animate__animated', 'animate__fadeIn');
    }

    const html = generateResultsHtml(results, query);
    
    if (isSidebarSearch) {
        domElements.resultsSearchResults.innerHTML = html;
    } else {
        domElements.searchResults.innerHTML = html;
    }
}

// Генерация HTML для результатов
function generateResultsHtml(results, query) {
    return results.map((result, index) => `
        <div class="result-item animate__animated animate__fadeInUp" style="animation-delay: ${index * 0.1}s">
            <a href="${result.url}" class="result-title">${highlightText(result.title, query)}</a>
            <div class="result-url">${result.url}</div>
            <div class="result-snippet">${highlightText(result.snippet, query)}</div>
        </div>
    `).join('');
}

// Сообщение об отсутствии результатов
function showNoResultsMessage(query, isSidebarSearch) {
    const message = `
        <div class="no-results animate__animated animate__fadeIn">
            Ничего не найдено по запросу "${query}". Попробуйте изменить запрос.
        </div>
    `;
    
    if (isSidebarSearch) {
        domElements.resultsSearchResults.innerHTML = message;
    } else {
        domElements.searchResults.innerHTML = message;
    }
}

// Форматирование счетчика результатов
function formatResultsCount(count) {
    if (count % 10 === 1 && count % 100 !== 11) {
        return 'результат';
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
        return 'результата';
    }
    return 'результатов';
}

// Подсветка текста в результатах
function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Показать подсказки
function showSuggestions() {
    const query = domElements.searchInput.value.toLowerCase().trim();
    
    if (query.length < 2) {
        domElements.suggestionsElement.style.display = 'none';
        return;
    }
    
    const filtered = config.popularQueries.filter(q => q.toLowerCase().includes(query));
    
    if (filtered.length === 0) {
        domElements.suggestionsElement.style.display = 'none';
        return;
    }
    
    domElements.suggestionsElement.innerHTML = filtered.map(item => 
        `<div class="suggestion-item">${item}</div>`
    ).join('');
    domElements.suggestionsElement.style.display = 'block';
}

// Установка темы
function setTheme(theme) {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    currentTheme = theme;
    
    domElements.themeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
    
    localStorage.setItem('searchTheme', theme);
}

// Показать сообщение об ошибке
function showError(message, isSidebarSearch = false) {
    const errorHtml = `<div class="no-results error">${message}</div>`;
    
    if (isSidebarSearch) {
        domElements.resultsSearchResults.innerHTML = errorHtml;
    } else {
        domElements.searchResults.innerHTML = errorHtml;
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);