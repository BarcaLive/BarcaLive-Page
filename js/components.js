/**
 * Component System for BarcaLive
 */

const Components = {
    navbar: (activePage) => {
        return `
        <nav class="glass-premium p-1.5 flex gap-1 rounded-[20px] items-center desktop-nav">
            <a href="/" data-i18n="overview" data-spa="true"
               class="nav-btn px-4 md:px-5 py-2 rounded-[16px] text-xs font-bold transition-all ${activePage === 'overview' ? 'active' : 'opacity-50 hover:opacity-100'}">Overview</a>
            <a href="la-liga.html" data-i18n="laliga" data-spa="true"
               class="nav-btn px-4 md:px-5 py-2 rounded-[16px] text-xs font-bold transition-all ${activePage === 'laliga' ? 'active' : 'opacity-50 hover:opacity-100'}">La Liga</a>
            <a href="ucl.html" data-i18n="ucl" data-spa="true"
               class="nav-btn px-4 md:px-5 py-2 rounded-[16px] text-xs font-bold transition-all ${activePage === 'ucl' ? 'active' : 'opacity-50 hover:opacity-100'}">UCL</a>
            <a href="schedule.html" data-i18n="schedule" data-spa="true"
               class="nav-btn px-4 md:px-5 py-2 rounded-[16px] text-xs font-bold transition-all ${activePage === 'schedule' ? 'active' : 'opacity-50 hover:opacity-100'}">Schedule</a>
            
            <div class="w-[1px] h-4 bg-white/20 mx-1"></div>

            <!-- Install App Button (Hidden by default) -->
            <button id="pwa-install-btn-desktop" class="pwa-install-trigger hidden nav-btn p-2 rounded-[16px] opacity-50 hover:opacity-100 text-gold" data-i18n-title="install">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>

            <!-- Settings Button -->
            <button onclick="window.toggleSettings()" class="nav-btn p-2 rounded-[16px] opacity-50 hover:opacity-100" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
        </nav>
    `;
    },

    mobileTabBar: (activePage) => {
        return `
        <div class="tab-bar">
            <a href="/" data-spa="true" class="tab-item ${activePage === 'overview' ? 'active' : ''}">
                <i data-lucide="layout-grid"></i>
                <span data-i18n="overview">Overview</span>
            </a>
            <a href="la-liga.html" data-spa="true" class="tab-item ${activePage === 'laliga' ? 'active' : ''}">
                <i data-lucide="trophy"></i>
                <span data-i18n="laliga">La Liga</span>
            </a>
            <a href="ucl.html" data-spa="true" class="tab-item ${activePage === 'ucl' ? 'active' : ''}">
                <i data-lucide="star"></i>
                <span data-i18n="ucl">UCL</span>
            </a>
            <a href="schedule.html" data-spa="true" class="tab-item ${activePage === 'schedule' ? 'active' : ''}">
                <i data-lucide="calendar"></i>
                <span data-i18n="schedule">Schedule</span>
            </a>

             <button id="pwa-install-btn-mobile" class="pwa-install-trigger hidden tab-item flex items-center justify-center text-gold">
                <i data-lucide="download"></i>
                <span data-i18n="install">Install</span>
            </button>

             <button onclick="window.toggleSettings()" class="tab-item flex items-center justify-center">
                <i data-lucide="settings"></i>
                <span data-i18n="settings">Settings</span>
            </button>
        </div>

    `;
    },

    footer: () => `
        <footer class="footer-barcalive">
            <a href="https://ko-fi.com/barcalive" target="_blank" rel="noopener noreferrer" class="footer-barcalive-text">
                <span class="footer-letter" style="transition-delay: 0ms">B</span>
                <span class="footer-letter" style="transition-delay: 50ms">A</span>
                <span class="footer-letter" style="transition-delay: 100ms">R</span>
                <span class="footer-letter" style="transition-delay: 150ms">C</span>
                <span class="footer-letter" style="transition-delay: 200ms">A</span>
                <span class="footer-letter" style="transition-delay: 250ms">L</span>
                <span class="footer-letter" style="transition-delay: 300ms">I</span>
                <span class="footer-letter" style="transition-delay: 350ms">V</span>
                <span class="footer-letter" style="transition-delay: 400ms">E</span>
            </a>
        </footer>
    `,

    settingsOverlay: () => {
        const langs = ['pl', 'en', 'es', 'de', 'fr'];
        const current = window.I18n ? window.I18n.currentLang : 'pl';

        return `
        <div id="settingsOverlay" class="settings-overlay" onclick="if(event.target === this) window.toggleSettings()">
            <div class="settings-menu animate-in">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-black" data-i18n="settings">Settings</h3>
                    <button onclick="window.toggleSettings()" class="opacity-50 hover:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                
                <div class="setting-item">
                    <span class="font-bold" data-i18n="language">Language</span>
                    <div class="flex gap-1 bg-white/5 p-1 rounded-lg">
                        ${langs.map(lang => `
                            <button onclick="window.I18n.setLang('${lang}')" 
                               class="w-8 h-8 flex items-center justify-center rounded-md text-[10px] font-black uppercase transition-all ${current === lang ? 'bg-white text-black shadow-lg scale-105' : 'text-white/50 hover:text-white hover:bg-white/10'}">
                               ${lang}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="setting-item">
                    <span class="font-bold" data-i18n="theme">Theme</span>
                    <button onclick="window.toggleTheme()" class="pill-toggle">
                        <div class="option ${!document.body.classList.contains('light-theme') ? 'active' : ''}">Dark</div>
                        <div class="option ${document.body.classList.contains('light-theme') ? 'active' : ''}">Light</div>
                    </button>
                </div>

                <div class="setting-item">
                    <span class="text-sm opacity-80" data-i18n="reduceMotion">Reduce Motion</span>
                    <button onclick="window.toggleMotion()" class="pill-toggle">
                        <div class="option ${document.body.classList.contains('motion-reduce') ? 'active' : ''}" data-i18n="yes">Yes</div>
                        <div class="option ${!document.body.classList.contains('motion-reduce') ? 'active' : ''}" data-i18n="no">No</div>
                    </button>
                </div>

                <div class="pt-6 pb-2 border-b border-white/5">
                    <h4 class="text-[10px] font-black uppercase tracking-widest opacity-40" data-i18n="notifications">Notifications</h4>
                </div>

                <div class="setting-item">
                    <span class="text-sm opacity-80" data-i18n="notifyGoals">Goals</span>
                    <button onclick="window.toggleNotification('goals')" class="pill-toggle">
                        <div class="option ${window.getNotificationSetting('goals') ? 'active' : ''}" data-i18n="yes">Yes</div>
                        <div class="option ${!window.getNotificationSetting('goals') ? 'active' : ''}" data-i18n="no">No</div>
                    </button>
                </div>

                <div class="setting-item">
                    <span class="text-sm opacity-80" data-i18n="notifyStartEnd">Start/End</span>
                    <button onclick="window.toggleNotification('matchStatus')" class="pill-toggle">
                        <div class="option ${window.getNotificationSetting('matchStatus') ? 'active' : ''}" data-i18n="yes">Yes</div>
                        <div class="option ${!window.getNotificationSetting('matchStatus') ? 'active' : ''}" data-i18n="no">No</div>
                    </button>
                </div>

                <div class="setting-item">
                    <span class="text-sm opacity-80" data-i18n="notifyCards">Cards</span>
                    <button onclick="window.toggleNotification('cards')" class="pill-toggle">
                        <div class="option ${window.getNotificationSetting('cards') ? 'active' : ''}" data-i18n="yes">Yes</div>
                        <div class="option ${!window.getNotificationSetting('cards') ? 'active' : ''}" data-i18n="no">No</div>
                    </button>
                </div>
            </div>
        </div>
    `;
    },

    broadcasterModal: (links, channelName) => `
        <div id="broadcasterModal" class="settings-overlay active" onclick="if(event.target === this) window.closeBroadcasterModal()">
            <div class="settings-menu animate-in" style="max-width: 320px;">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-black truncate pr-4 text-white dark:text-black">${channelName}</h3>
                    <button onclick="window.closeBroadcasterModal()" class="opacity-50 hover:opacity-100 text-white dark:text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                
                <div class="flex flex-col gap-3">
                    ${links.map(link => `
                        <a href="${link.url}" target="_blank" rel="noopener noreferrer" 
                           onclick="window.closeBroadcasterModal()"
                           class="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                            <span class="font-bold text-sm text-white dark:text-black opacity-80 group-hover:opacity-100">${link.name}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="opacity-50 group-hover:opacity-100 transition-opacity text-white dark:text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                    `).join('')}
                </div>
            </div>
        </div>
    `,

    init: (activePage) => {
        window.currentPage = activePage;

        const headerNav = document.getElementById('header-nav');
        if (headerNav) headerNav.innerHTML = Components.navbar(activePage);

        // Mobile Tab Bar
        const existingTabBar = document.querySelector('.tab-bar');
        if (!existingTabBar) {
            const tabBarContainer = document.createElement('div');
            tabBarContainer.innerHTML = Components.mobileTabBar(activePage);
            document.body.appendChild(tabBarContainer);
        } else {
            existingTabBar.outerHTML = Components.mobileTabBar(activePage);
        }

        // Footer
        const existingFooter = document.querySelector('.footer-barcalive');
        if (!existingFooter) {
            const footerContainer = document.createElement('div');
            footerContainer.innerHTML = Components.footer();
            // Insert before tab bar if possible, or append to body
            const tabbar = document.querySelector('.tab-bar');
            if (tabbar && tabbar.parentElement) {
                // Actually footer should be at bottom of content, above tab bar
                // But tab bar is fixed. So appending to body is fine, but we need padding.
                // Let's safe append to body.
                document.body.appendChild(footerContainer.firstElementChild);
            } else {
                document.body.appendChild(footerContainer.firstElementChild);
            }
        }

        // Settings Overlay
        const settingsOverlay = document.getElementById('settingsOverlay');
        const wasSettingsActive = settingsOverlay && settingsOverlay.classList.contains('active');

        if (!settingsOverlay) {
            const settingsContainer = document.createElement('div');
            settingsContainer.innerHTML = Components.settingsOverlay();
            document.body.appendChild(settingsContainer);
        } else {
            settingsOverlay.outerHTML = Components.settingsOverlay();
            if (wasSettingsActive) {
                // Fast re-apply active state to the new element
                setTimeout(() => document.getElementById('settingsOverlay').classList.add('active'), 0);
            }
        }

        window.updateThemeIcons && window.updateThemeIcons();
        window.I18n && window.I18n.updatePage();

        // Refresh icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },

    showBroadcasterModal: (links, channelName) => {
        const existing = document.getElementById('broadcasterModal');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.innerHTML = Components.broadcasterModal(links, channelName);
        document.body.appendChild(container.firstElementChild);
    }
};

window.initComponents = Components.init;
window.toggleSettings = function () {
    const overlay = document.getElementById('settingsOverlay');
    overlay.classList.toggle('active');
};

window.closeBroadcasterModal = function () {
    const modal = document.getElementById('broadcasterModal');
    if (modal) modal.remove();
};

// ── Notification Settings (localStorage-backed) ──────────────────────
window.getNotificationSetting = function (key) {
    try {
        const prefs = JSON.parse(localStorage.getItem('bp_notifications') || '{}');
        return prefs[key] !== false; // default true
    } catch { return true; }
};

window.toggleNotification = function (key) {
    const prefs = JSON.parse(localStorage.getItem('bp_notifications') || '{}');
    prefs[key] = !window.getNotificationSetting(key);
    localStorage.setItem('bp_notifications', JSON.stringify(prefs));
    // Re-init components to refresh the toggle UI
    if (window.currentPage) Components.init(window.currentPage);
};

// ── Theme Toggle ─────────────────────────────────────────────────────
window.toggleTheme = function () {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('bp_theme', isLight ? 'light' : 'dark');
    window.updateThemeIcons && window.updateThemeIcons();

    // Dispatch Global Event
    window.dispatchEvent(new Event('themeChanged'));

    // Update comp logo variants etc.
    if (window.currentPage) Components.init(window.currentPage);
};

window.updateThemeIcons = function () {
    const isLight = document.body.classList.contains('light-theme');
    document.querySelectorAll('.theme-logo').forEach(img => {
        const src = img.getAttribute('src') || '';
        if (isLight) {
            img.setAttribute('src', src.replace('/dark/', '/light/'));
        } else {
            img.setAttribute('src', src.replace('/light/', '/dark/'));
        }
    });
};

// ── Motion Toggle ────────────────────────────────────────────────────
window.toggleMotion = function () {
    document.body.classList.toggle('motion-reduce');
    const isReduced = document.body.classList.contains('motion-reduce');
    localStorage.setItem('bp_motion', isReduced ? 'reduce' : 'no-preference');

    // Refresh UI
    if (window.currentPage) Components.init(window.currentPage);
};

// Restore theme & motion on load
(function () {
    const savedTheme = localStorage.getItem('bp_theme');
    if (savedTheme === 'light') document.body.classList.add('light-theme');

    const savedMotion = localStorage.getItem('bp_motion');
    if (savedMotion === 'reduce') document.body.classList.add('motion-reduce');
})();

// ── Logo Error Fallback ──────────────────────────────────────────────
window.handleLogoError = function (img) {
    const name = img.getAttribute('data-name') || '';
    img.onerror = null;
    img.style.display = 'none';
    const placeholder = document.createElement('span');
    placeholder.className = 'text-[10px] font-bold text-white/60 leading-tight text-center';
    placeholder.textContent = name.substring(0, 3);
    img.parentNode?.insertBefore(placeholder, img);
};
