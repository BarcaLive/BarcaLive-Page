import { barcaState } from './core/state.js';
import { barcaAPI } from './core/api.js';
import { barcaPrefetch } from './router/prefetch.js';
import { barcaRouter } from './router/router.js';
import { barcaSync } from './live/sync.js';
import { barcaEvents } from './live/events.js';
import { barcaAmbient } from './ui/ambient.js';
import { barcaAnimations } from './ui/animations.js';
import { renderOverview, renderLaLiga, renderUCL, renderSchedule } from './ui/render.js';

import { updateDateDisplay } from './core/utils.js';

// Notification Helper
const sendNotification = (title, body) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: '/assets/favicons/android-chrome-192x192.png',
      badge: '/assets/favicons/favicon-32x32.png',
      vibrate: [200, 100, 200]
    });
  }
};

/**
 * Page Initialization Functions
 * Exposed to window for Router and inline scripts
 */
window.initOverviewPage = async () => {
  if (window.initComponents) window.initComponents('overview');
  // barcaAPI.getOverview will trigger notify with cache immediately if available
  // But we also await the network result to ensure we have data if cache is empty
  const data = await barcaAPI.getOverview();

  // If cache was empty, we render here. 
  // If cache existed, renderOverview was already called via barcaAPI.onData subscription in initSPA
  // However, we want to ensure it renders if we aren't subscribed yet or if race condition.
  // Actually initSPA subscribes BEFORE calling initOverviewPage.
  // So cache notify happens inside getOverview -> notifies subscriber -> renders.
  // Then getOverview resolves with FRESH data -> we might render again?

  // Let's safe-guard: if we get data and it wasn't rendered (hard to know), we render.
  // But renderOverview is idempotent-ish (just overwrites HTML).
  if (data) renderOverview(data);
};

window.initLaLigaPage = async () => {
  if (window.initComponents) window.initComponents('laliga');



  // 2. Network Update
  const data = await barcaAPI.getLaLiga();
  if (data) renderLaLiga(data);
};

window.initUCLPage = async () => {
  if (window.initComponents) window.initComponents('ucl');



  const data = await barcaAPI.getUCL();
  if (data) renderUCL(data);
};

window.initSchedulePage = async () => {
  if (window.initComponents) window.initComponents('schedule');



  const data = await barcaAPI.getSchedule('next');
  if (data) renderSchedule(data, 'upcoming');
};

window.initResultsPage = async () => {
  if (window.initComponents) window.initComponents('schedule');
  const data = await barcaAPI.getSchedule('prev');
  if (data) renderSchedule(data, 'results');
};

/**
 * BarcaLive SPA Entry Point
 * Orchestrates the initialization of all modules.
 */
const initSPA = async () => {
  // Initialize language
  if (window.I18n) window.I18n.init();

  // Request Notification Permission
  if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }

  // Expose core instances
  window.barcaState = barcaState;
  window.barcaAPI = barcaAPI;
  window.barcaRouter = barcaRouter;
  window.barcaPrefetch = barcaPrefetch;
  window.barcaAmbient = barcaAmbient;
  window.barcaAnimations = barcaAnimations;

  try {
    // 1. Initialize Prefetch
    barcaPrefetch.init();
    barcaPrefetch.warmup([
      '/',
      '/schedule.html',
      '/results.html',
      '/la-liga.html',
      '/ucl.html'
    ]);

    // 2. Initialize Router
    barcaRouter.init();
    updateDateDisplay();
    window.addEventListener('langChanged', () => {
      updateDateDisplay();
      // Reload current view logic if needed
      const path = window.location.pathname;
      if (path === '/' || path.endsWith('index.html')) window.initOverviewPage();
      else if (path.includes('la-liga')) window.initLaLigaPage();
      else if (path.includes('ucl')) window.initUCLPage();
      else if (path.includes('schedule')) window.initSchedulePage();
    });

    // 3. Initial Page Load
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('index.html')) await window.initOverviewPage();
    else if (path.includes('la-liga')) await window.initLaLigaPage();
    else if (path.includes('ucl')) await window.initUCLPage();
    else if (path.includes('schedule')) await window.initSchedulePage();
    else if (path.includes('results')) await window.initResultsPage();

    // 4. Subscribe to Live Data (only affects Overview really)
    barcaAPI.onData((data) => {
      // If we are on Overview, update it
      if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        renderOverview(data);
      }
    });

    barcaAmbient.init();

    // Helper for localized strings
    const n = (val) => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      // FORCE ENGLISH for live notifications
      return val['en'] || val['pl'] || Object.values(val)[0] || '';
    };

    // Live Events
    barcaEvents.on('GOAL', (data) => {
      const teamName = n(data.team === 'home' ? data.match.homeTeam.shortName : data.match.awayTeam.shortName);
      const scoreStr = `${data.score.home} - ${data.score.away}`;
      sendNotification('GOL! ⚽', `${teamName} strzela! Wynik: ${scoreStr}`);

      // Confetti only if Barca scores
      const scoringTeamId = data.team === 'home' ? data.match.homeTeam.id : data.match.awayTeam.id;
      // ID check or name check
      if (scoringTeamId === 2017 || teamName.includes('Barcelona') || teamName.includes('Barça')) {
        if (window.confetti) {
          window.confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#a50044', '#004d98', '#edbb00'],
            disableForReducedMotion: true
          });
        }
      }
    });

    barcaEvents.on('MATCH_START', (data) => {
      const m = data.match;
      sendNotification('Mecz się rozpoczął! 🟢', `${n(m.homeTeam.shortName)} vs ${n(m.awayTeam.shortName)}`);
    });

    barcaEvents.on('MATCH_END', (data) => {
      const m = data.match;
      const score = `${m.homeScore ?? 0} - ${m.awayScore ?? 0}`;
      sendNotification('Koniec Meczu 🏁', `Wynik: ${score}`);
    });

    // Theme Change -> Re-render current page
    window.addEventListener('themeChanged', () => {
      const path = window.location.pathname;
      if (path === '/' || path.endsWith('index.html')) window.renderNextMatch && window.renderNextMatch(barcaAPI.getData()?.matches?.upcoming?.[0]);
    });

  } catch (error) {
    console.error('❌ SPA Initialization Error:', error);
  }
};

/**
 * Checks for mobile app version and shows promotion if version is 1
 */
async function checkAppVersion() {
  try {
    const response = await fetch('/app/app.json');
    if (!response.ok) return;

    const config = await response.json();
    if (config.version === 1) {
      showAppPromo(config);
    }
  } catch (e) {
    console.warn('App version check failed:', e);
  }
}

function showAppPromo(config) {
  const lang = window.I18n ? window.I18n.currentLang : 'pl';
  const appName = typeof config.appName === 'object' ? (config.appName[lang] || config.appName['pl'] || config.appName) : config.appName;
  const description = typeof config.description === 'object' ? (config.description[lang] || config.description['pl'] || config.description) : config.description;
  // Determine button text: "Zainstaluj" (Install) instead of "Pobierz" (Download) if PWA
  const installText = window.I18n ? window.I18n.t('install') : 'Zainstaluj';

  const overlay = document.createElement('div');
  overlay.id = 'app-promo-overlay';
  overlay.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-3xl animate-in';

  overlay.innerHTML = `
        <div class="glass-premium p-8 max-w-sm w-full text-center border-white/20 shadow-2xl">
            <div class="w-20 h-20 bg-gold rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(237,187,0,0.4)]">
                <i data-lucide="smartphone" class="w-10 h-10 text-black"></i>
            </div>
            <h2 class="text-2xl font-black tracking-tighter mb-2">${appName}</h2>
            <p class="text-white/60 text-sm leading-relaxed mb-8">${description}</p>

            <div class="flex flex-col gap-3">
                <button id="promo-install-btn" class="bg-white text-black py-4 rounded-2xl font-bold hover:scale-105 transition-transform w-full">
                    ${installText}
                </button>
                <button onclick="document.getElementById('app-promo-overlay').remove()" class="text-white/40 text-xs font-bold uppercase tracking-widest py-2 hover:text-white transition-colors">
                    ${closeBtn}
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(overlay);
  if (window.lucide) window.lucide.createIcons();

  // Attach PWA Install Logic
  document.getElementById('promo-install-btn').addEventListener('click', async () => {
    // Check if we have a deferred prompt (Android/Desktop)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      document.getElementById('app-promo-overlay').remove();
    }
    // Fallback for iOS (manual instructions)
    else if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
      alert("Aby zainstalować aplikację: \n1. Kliknij przycisk Udostępnij ⍈\n2. Wybierz 'Dodaj do ekranu początkowego' ➕");
      document.getElementById('app-promo-overlay').remove();
    }
    // Fallback if already installed or not supported
    else {
      console.log('PWA installation not available or already installed.');
      document.getElementById('app-promo-overlay').remove();
    }
  });
}

// ── PWA Install Logic ────────────────────────────────────────────────
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI notify the user they can install the PWA
  const installBtns = document.querySelectorAll('.pwa-install-trigger');
  installBtns.forEach(btn => {
    btn.classList.remove('hidden');
    btn.addEventListener('click', async () => {
      // Hide the app provided install promotion
      installBtns.forEach(b => b.classList.add('hidden'));
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, throw it away
      deferredPrompt = null;
    });
  });
});

// Detect iOS for manual instructions
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

if (isIOS && !isStandalone) {
  const installBtns = document.querySelectorAll('.pwa-install-trigger');
  installBtns.forEach(btn => {
    btn.classList.remove('hidden');
    btn.addEventListener('click', () => {
      alert("To install on iOS:\n1. Tap the Share button\n2. Scroll down and tap 'Add to Home Screen'");
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSPA);
} else {
  initSPA();
}
