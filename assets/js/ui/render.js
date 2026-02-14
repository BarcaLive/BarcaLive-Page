import { barcaAPI } from '../core/api.js';
import { getChannelLogoUrl, getCompetitionLogoUrl, getTeamCrestUrl } from '../core/assets.js';
import { BROADCASTERS } from '../core/broadcasters.js';

/**
 * BarcaLive Rendering Module
 *
 * Each public function receives a slice of the API JSON and writes HTML
 * directly into the matching container element.  The module subscribes
 * to barcaAPI.onData() so everything updates automatically.
 *
 * Data-shape (post-normalization, all match arrays share the same shape):
 *   matches.upcoming[]  → { id, startTime, status, homeTeam:{id,name,shortName,crest}, awayTeam:{…}, homeScore, awayScore, competition:{code,name,displayName,type}, … }
 *   matches.finished[]  → same shape as upcoming
 *   matches.live[]      → same shape + minute
 *   standings[]         → { type, group, table:[{pos,name,crest,m,w,d,l,goals,p,promotion,…}] }
 */

const BARCA_ID = 2017;

// ── Internationalisation helpers ──────────────────────────────────────
const t = (key) => (window.I18n?.t ? window.I18n.t(key) : key);
const fmtDate = (d, opts) =>
  window.I18n?.formatDate ? window.I18n.formatDate(d, opts) : new Date(d).toLocaleDateString();

const n = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  // FORCE ENGLISH for team names / localized objects
  return val['en'] || val['pl'] || Object.values(val)[0] || '';
};

// ── Live-minute ticker ────────────────────────────────────────────────
let _currentLiveMatch = null;
let _minuteInterval = null;

function startMinuteUpdater() {
  stopMinuteUpdater();
  _minuteInterval = setInterval(() => {
    if (!_currentLiveMatch) return;
    const el = document.querySelector('[data-live-minute]');
    if (!el) return;

    if (_currentLiveMatch.minute) {
      el.textContent = String(_currentLiveMatch.minute).includes("'")
        ? _currentLiveMatch.minute
        : _currentLiveMatch.minute + "'";
      return;
    }

    const start = new Date(_currentLiveMatch.startTime);
    const diff = Math.floor((Date.now() - start) / 60000);

    if (diff < 0) el.textContent = 'LIVE';
    else if (diff > 135) el.textContent = 'FT';
    else if (diff > 45 && diff <= 60) el.textContent = 'HT';
    else {
      const actual = diff > 60 ? diff - 15 : diff;
      el.textContent = (actual > 90 ? "90+'" : actual + "'");
    }
  }, 1000);
}

function stopMinuteUpdater() {
  if (_minuteInterval) { clearInterval(_minuteInterval); _minuteInterval = null; }
}

// Global Broadcaster Logic
window.openBroadcaster = function (channelName) {
  const links = BROADCASTERS[channelName];
  if (!links || links.length === 0) return;

  if (links.length === 1) {
    window.open(links[0].url, '_blank');
  } else {
    // Use Component Modal
    if (Components && Components.showBroadcasterModal) {
      Components.showBroadcasterModal(links, channelName);
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════
//  OVERVIEW  (hero card + recent form + transmissions)
// ═══════════════════════════════════════════════════════════════════════

function renderOverview(data) {
  if (!data) return;
  const { matches, standings } = data;

  const liveMatch = matches.live?.[0];
  const nextMatch = matches.upcoming?.[0];

  // Ambient class
  if (liveMatch) document.body.classList.add('match-live');
  else document.body.classList.remove('match-live');

  _currentLiveMatch = liveMatch || null;
  if (liveMatch) startMinuteUpdater(); else stopMinuteUpdater();

  const matchToShow = liveMatch || nextMatch;
  const isLive = !!liveMatch;

  renderNextMatch(matchToShow, isLive, standings);

  // Recent form
  const isSmall = window.innerWidth <= 768;
  const formCount = isSmall ? 3 : 6;
  const pastMatches = (matches.finished || []).slice(0, 10).reverse(); // Get more, slice in render
  renderRecentForm(pastMatches);

  // Transmissions
  const channels = matchToShow?.tvChannels || [];
  renderTransmissions(channels);
}

// ── Hero card ────────────────────────────────────────────────────────

export function renderNextMatch(match, isLive, standings) {
  const container = document.getElementById('next-match-container');
  if (!match) {
    if (container) container.innerHTML = `<div class="text-center opacity-50 theme-text">${t('tbd')}</div>`;
    return;
  }
  if (!container) return;

  isLive = isLive || ['IN_PLAY', 'PAUSED', 'LIVE', 'HALFTIME', 'live'].includes(match.status);

  // ── Competition Info
  const compName = match.competition?.displayName || match.competition?.name || 'Unknown Competition';
  const compType = match.competition?.type || match.competition?.code || '';

  // ── Competition logo
  const compLogo = getCompetitionLogoUrl(
    compName,
    document.body.classList.contains('light-theme') ? 'light' : 'dark'
  );

  // ── Smart positions
  const shouldShowPos = () => {
    if (compType === 'league' || compName.includes('La Liga') || compName.includes('Primera')) return true;
    return false;
  };

  const findPos = (teamId, teamName) => {
    if (!standings?.length) return null;
    const targetName = n(teamName);
    for (const s of standings) {
      const row = (s.table || []).find(r => {
        const rowName = n(r.name);
        return (r.team?.id === teamId) || (rowName && (rowName === targetName || rowName.includes(targetName)));
      });
      if (row) return row.pos || row.position;
    }
    return null;
  };

  const showPos = shouldShowPos();
  const homePos = showPos ? (match.competitionPosition || findPos(match.homeTeam.id, match.homeTeam.name)) : null;
  const awayPos = showPos ? findPos(match.awayTeam.id, match.awayTeam.name) : null;

  // ── Score / time
  let mainDisplay = '';
  let subDisplay = '';

  if (isLive) {
    const hs = match.homeScore ?? 0;
    const as = match.awayScore ?? 0;
    mainDisplay = `${hs} - ${as}`;
    subDisplay = match.minute
      ? (String(match.minute).includes("'") ? match.minute : match.minute + "'")
      : 'LIVE';
  } else {
    // Use I18n for date/time
    if (match.startTime) {
      const d = new Date(match.startTime);
      // Time
      mainDisplay = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Date
      subDisplay = fmtDate(match.startTime, { weekday: 'long', month: 'long', day: 'numeric' });
    }
  }

  // ── Meta info (Detailed with Icons)
  let stageLabel = match.stage || '';
  if (match.round && (String(match.round) === '1/2' || String(match.round) === '1/4' || String(match.round) === '1/8' || String(match.round).toLowerCase().includes('final'))) {
    const key = 'stage_' + String(match.round).replace('/', '_').toLowerCase();
    const translated = t(key);
    if (translated && translated !== key) stageLabel = translated;
    else stageLabel = match.round;
  } else if (match.round && /^\d+$/.test(String(match.round))) {
    stageLabel = `Kolejka ${match.round}`;
  }

  const iconVenue = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8"/><path d="M9 21v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"/></svg>`;
  const iconWhistle = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><line x1="10" y1="4" x2="20" y2="14"/><path d="M21.6 15.6a2.5 2.5 0 0 1 0 3.5l-2.4 2.4a2.5 2.5 0 0 1-3.5 0L5.3 11.1a2 2 0 0 1 0-2.8l2.4-2.4a2 2 0 0 1 2.8 0L9.8 14"/><path d="M14 7h7v7"/></svg>`;
  const iconTrophy = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;

  const homeName = n(match.homeTeam.shortName);
  const awayName = n(match.awayTeam.shortName);
  const homeColor = match.homeShirtColor;

  // ── Info Pills (Replacing Win Prob)
  let infoHTML = '';
  const infoItems = [];

  if (match.venue) infoItems.push({ icon: iconVenue, text: match.venue });
  if (match.referee?.displayName) infoItems.push({ icon: iconWhistle, text: match.referee.displayShortName || match.referee.displayName });
  // Add stage if active
  if (stageLabel && !infoItems.find(i => i.text === stageLabel)) {
    // Optional: Decide if stage should be here too. Currently it's in header.
  }

  if (infoItems.length > 0) {
    infoHTML = `
        <div class="flex flex-wrap justify-center gap-3 mt-6">
            ${infoItems.map(item => `
                <div class="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md shadow-sm transform hover:scale-105 transition-transform duration-300">
                    <span class="opacity-70 theme-text text-gold">${item.icon}</span>
                    <span class="text-xs font-bold theme-text uppercase tracking-wide">${item.text}</span>
                </div>
            `).join('')}
        </div>
      `;
  }

  // ── Live card styling
  const parentContainer = container.closest('.glass-premium');
  if (parentContainer) {
    parentContainer.classList.toggle('match-card-live', isLive);
  }

  // ── HTML Construction using new Cleaner CSS structure
  container.innerHTML = `
    
    <!-- Header: Competition & Meta -->
    <div class="desktop-header flex-col md:flex-row gap-4 mb-6">
        <!-- Logo & Comp Name -->
        <div class="flex items-center gap-3">
             <div class="w-12 h-12 md:w-14 md:h-14 bg-white/5 rounded-[18px] flex items-center justify-center border border-white/10 shadow-lg backdrop-blur-md shrink-0">
                <img src="${compLogo}" class="w-8 h-8 md:w-9 md:h-9 object-contain filter drop-shadow-md theme-logo no-animate" 
                     data-code="${compType}" alt="${compName}" loading="lazy" width="36" height="36">
             </div>
             <div class="flex flex-col min-w-0">
                <span class="text-[10px] md:text-[11px] font-black uppercase tracking-widest opacity-60 theme-text truncate">${compName}</span>
                 <div class="mt-1">
                    ${isLive
      ? `<span class="inline-flex items-center gap-2 bg-red-500 text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                             <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE
                           </span>`
      : `<span style="background:rgba(237,187,0,.15);color:var(--gold);" class="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gold/30">
                             <span class="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span> ${t('nextMatch') || 'Następny'}
                           </span>`}
                 </div>
             </div>
        </div>

        <!-- Desktop Meta Tags -->
        <div class="hidden md:flex items-center justify-end gap-2 flex-wrap">
             ${stageLabel ? `<span class="match-meta-tag">${iconTrophy} ${stageLabel}</span>` : ''}
        </div>
    </div>
    
    <!-- Mobile Meta (Below Header on Mobile) -->
    <div class="md:hidden flex flex-wrap justify-center gap-2 mb-6">
         ${stageLabel ? `<span class="match-meta-tag text-[10px]">${iconTrophy} ${stageLabel}</span>` : ''}
    </div>

    <!-- Teams & Score (Centered) -->
    <div class="match-teams-score flex flex-row items-center justify-between w-full relative">
        
        <!-- Home Team -->
        <div class="team-column group flex-1 flex flex-col items-center justify-center min-w-0">
             <div class="w-16 h-16 md:w-32 md:h-32 bg-white/5 rounded-[20px] md:rounded-[40px] flex items-center justify-center border border-white/10 mb-2 md:mb-3 mx-auto shadow-xl transition-all"
                  style="box-shadow:0 0 30px ${homeColor}20;">
                <img src="${match.homeTeam.crest}" alt="${homeName}" class="w-10 h-10 md:w-20 md:h-20 object-contain no-animate" fetchpriority="high" width="80" height="80">
             </div>
             <h2 class="font-bold text-sm md:text-2xl theme-text leading-tight whitespace-nowrap truncate w-full text-center px-1">
                ${homeName}
                ${homePos ? `<div class="mt-1"><span class="bg-white/10 text-[9px] px-1.5 py-0.5 rounded opacity-60 font-mono theme-text whitespace-normal">#${homePos}</span></div>` : ''}
             </h2>
        </div>

        <!-- Score / Time -->
        <div class="score-column flex flex-col items-center justify-center shrink-0 px-2 min-w-[80px]">
             <span class="text-[2rem] md:text-[3.5rem] font-black tracking-tighter leading-none ${isLive ? 'text-red-500' : 'theme-text'} whitespace-nowrap">
                ${mainDisplay}
             </span>
             <span class="text-[9px] md:text-sm font-bold ${isLive ? 'text-gold' : 'opacity-50 theme-text'} uppercase tracking-widest mt-1 md:mt-2 whitespace-nowrap" ${isLive ? 'data-live-minute' : ''}>
                ${subDisplay}
             </span>
        </div>

        <!-- Away Team -->
        <div class="team-column group flex-1 flex flex-col items-center justify-center min-w-0">
             <div class="w-16 h-16 md:w-32 md:h-32 bg-white/5 rounded-[20px] md:rounded-[40px] flex items-center justify-center border border-white/10 mb-2 md:mb-3 mx-auto shadow-xl transition-all">
                <img src="${match.awayTeam.crest}" alt="${awayName}" class="w-10 h-10 md:w-20 md:h-20 object-contain no-animate" fetchpriority="high" width="80" height="80">
             </div>
             <h2 class="font-bold text-sm md:text-2xl theme-text leading-tight whitespace-nowrap truncate w-full text-center px-1">
                ${awayName}
                ${awayPos ? `<div class="mt-1"><span class="bg-white/10 text-[9px] px-1.5 py-0.5 rounded opacity-60 font-mono theme-text whitespace-normal">#${awayPos}</span></div>` : ''}
             </h2>
        </div>

    </div>

    ${infoHTML}
  `;
}

// ── Recent form ─────────────────────────────────────────────────────

function renderRecentForm(matches) {
  const container = document.getElementById('recent-form-container');
  if (!container || !matches?.length) return;

  // Static Stats Summary (Last 6 Matches)
  let wins = 0, draws = 0, losses = 0;

  const recent6 = matches.slice(0, 6).reverse(); // Oldest to Newest

  recent6.forEach(m => {
    // Strict check: if home ID is 2017, it is home match. 
    // If not, check if name contains 'Barcelona'.
    const hName = n(m.homeTeam.name);
    const isHome = m.homeTeam.id === BARCA_ID || (hName && (hName.includes('Barcelona') || hName.includes('Barça')));

    // Opponent is ALWAYS the other team
    const opponent = isHome ? m.awayTeam : m.homeTeam;
    const oppName = n(opponent.shortName);
    const oppCrest = opponent.crest;

    const bS = isHome ? m.homeScore : m.awayScore;
    const oS = isHome ? m.awayScore : m.homeScore;

    if (bS > oS) wins++;
    else if (bS < oS) losses++;
    else draws++;
  });

  const html = `
    <div class="flex flex-col h-full justify-start gap-4 pt-2">
         <!-- Summary Stats -->
         <div class="grid grid-cols-3 divide-x divide-white/10 py-3 px-2 bg-white/5 rounded-2xl border border-white/5 shrink-0 w-full">
             <div class="flex flex-col items-center justify-center px-1 text-center">
                 <span class="text-xl font-black text-green-500">${wins}</span>
                 <span class="text-[8px] uppercase font-bold opacity-60 theme-text break-words w-full">${t('wins')}</span>
             </div>
             <div class="flex flex-col items-center justify-center px-1 text-center">
                 <span class="text-xl font-black opacity-60 theme-text">${draws}</span>
                 <span class="text-[8px] uppercase font-bold opacity-40 theme-text break-words w-full">${t('draws')}</span>
             </div>
             <div class="flex flex-col items-center justify-center px-1 text-center">
                 <span class="text-xl font-black text-red-500">${losses}</span>
                 <span class="text-[8px] uppercase font-bold opacity-60 theme-text break-words w-full">${t('losses')}</span>
             </div>
         </div>

         <!-- Static List -->
         <div class="space-y-2.5 overflow-y-auto pr-1 flex-1">
            ${recent6.map((m, i) => {
    // Strict Check again
    const hName = n(m.homeTeam.name);
    const isHome = m.homeTeam.id === BARCA_ID || (hName && (hName.includes('Barcelona') || hName.includes('Barça')));
    const opponent = isHome ? m.awayTeam : m.homeTeam;
    const oppName = n(opponent.shortName);
    const oppCrest = opponent.crest;

    const bS = isHome ? m.homeScore : m.awayScore;
    const oS = isHome ? m.awayScore : m.homeScore;

    let color = 'bg-white/5 border-white/5';
    let text = 'opacity-60 theme-text';
    let badge = 'D';
    let badgeColor = 'bg-white/20';

    if (bS > oS) { color = 'bg-green-500/10 border-green-500/20'; text = 'text-green-500'; badge = 'W'; badgeColor = 'bg-green-500/20 text-green-500'; }
    else if (bS < oS) { color = 'bg-red-500/10 border-red-500/20'; text = 'text-red-500'; badge = 'L'; badgeColor = 'bg-red-500/20 text-red-500'; }

    return `
                  <div class="flex items-center justify-between p-2 rounded-lg border ${color} transition-all hover:bg-white/10">
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 flex items-center justify-center">
                           <img src="${oppCrest}" alt="${oppName}" class="max-w-full max-h-full object-contain opacity-90" loading="lazy" width="20" height="20">
                        </div>
                        <span class="text-xs md:text-sm font-bold opacity-90 theme-text truncate max-w-[80px] md:max-w-none">${oppName}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-black ${text}">${bS}-${oS}</span>
                        <span class="text-[8px] font-black opacity-80 ${badgeColor} px-1.5 py-0.5 rounded-full">${badge}</span>
                    </div>
                  </div>
                `;
  }).join('')}
         </div>
    </div>
  `;

  container.innerHTML = html;
}


// ── Transmissions ───────────────────────────────────────────────────

function getChannelStyle(name) {
  const map = {
    'Canal+': { bg: 'linear-gradient(135deg, #000000 0%, #2c2c2c 100%)', text: '#FFFFFF' },
    'Canal+ Sport': { bg: 'linear-gradient(135deg, #000000 0%, #2c2c2c 100%)', text: '#FFFFFF' },
    'DAZN': { bg: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', text: '#F8FF0D' },
    'Eleven Sports': { bg: 'linear-gradient(135deg, #E11B22 0%, #8a0c10 100%)', text: '#FFFFFF' },
    'Polsat Sport': { bg: 'linear-gradient(135deg, #004DA3 0%, #002a5c 100%)', text: '#FFD700' },
    'Red Bull TV': { bg: 'linear-gradient(135deg, #222B55 0%, #11152b 100%)', text: '#E20143' },
    'TVP Sport': { bg: 'linear-gradient(135deg, #1C1C1B 0%, #000000 100%)', text: '#FFD100' }
  };

  // Partial match check
  for (const [key, style] of Object.entries(map)) {
    if (name.includes(key)) return style;
  }

  // Fallback: simple gradient based on hash
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return {
    bg: `linear-gradient(135deg,hsla(${hue},70%,20%,.9) 0%,hsla(${hue},70%,10%,.95) 100%)`,
    text: '#FFFFFF',
    border: `1px solid hsla(${hue},50%,40%,.3)`
  };
}

// Global handler for broadcaster clicks
window.openBroadcaster = function (channelName) {
  const links = BROADCASTERS[channelName];
  if (!links || links.length === 0) return;

  if (links.length === 1) {
    window.open(links[0].url, '_blank');
  } else {
    // Show Modal
    showBroadcasterModal(channelName, links);
  }
};

function showBroadcasterModal(title, links) {
  // Remove existing
  const existing = document.getElementById('broadcaster-modal');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'broadcaster-modal';
  div.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200';
  div.onclick = (e) => {
    if (e.target === div) div.remove();
  };

  div.innerHTML = `
        <div class="glass-premium p-6 rounded-[32px] w-full max-w-sm mx-4 flex flex-col gap-4 shadow-2xl transform scale-95 transition-all text-center">
            <h3 class="text-xl font-black theme-text mb-2">Wybierz źródło</h3>
            ${links.map(link => `
                <a href="${link.url}" target="_blank" 
                   onclick="document.getElementById('broadcaster-modal').remove()"
                   class="flex items-center justify-between px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                    <span class="font-bold theme-text">${link.name}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50 group-hover:translate-x-1 transition-transform theme-text"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
            `).join('')}
            <button onclick="document.getElementById('broadcaster-modal').remove()" 
                    class="mt-2 py-3 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 theme-text">
                Anuluj
            </button>
        </div>
    `;

  document.body.appendChild(div);
  // Slight anim delay for scale effect logic if desired, but CSS default OK
}

function renderTransmissions(channels) {
  const container = document.getElementById('transmissions-container');
  if (!container) return;

  if (!channels?.length) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center w-full h-full min-h-[200px] text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-4 opacity-30 theme-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
        </svg>
        <span class="text-[10px] font-black uppercase tracking-widest px-4 theme-text opacity-40">${t('unavailable') || 'Brak informacji'}</span>
      </div>`;
    return;
  }

  // Modern grid layout for tiles
  container.className = "grid grid-cols-2 md:grid-cols-4 gap-4"; // Ensure grid

  container.innerHTML = channels.map(channel => {
    const hasLinks = BROADCASTERS[channel] && BROADCASTERS[channel].length > 0;
    const clickAttr = hasLinks ? `onclick="window.openBroadcaster('${channel}')"` : '';
    const cursorClass = hasLinks ? 'cursor-pointer hover:bg-white/10' : 'cursor-default';

    return `
      <div class="glass-premium flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ${cursorClass}"
           style="border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);"
           ${clickAttr}>
         <div class="mb-2 opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="theme-text"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
         </div>
         <span class="font-bold text-sm md:text-base leading-tight theme-text tracking-wide">${channel}</span>
         ${hasLinks ? `<div class="mt-2 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>` : ''}
      </div>`;
  }).join('');
}


// ═══════════════════════════════════════════════════════════════════════
//  STANDINGS  (La Liga + UCL)
// ═══════════════════════════════════════════════════════════════════════

function renderStandingsTable(container, tableData, competitionType) {
  if (!container || !tableData) return;

  let html = `
    <div class="table-wrapper">
    <table class="football-table">
      <thead><tr>
        <th width="36" class="theme-text">${t('pos')}</th><th class="theme-text">${t('club')}</th>
        <th class="text-center theme-text">${t('pl')}</th>
        <th class="hidden sm:table-cell text-center theme-text">${t('wdl')}</th>
        <th class="text-center theme-text">${t('gd')}</th>
        <th class="text-right theme-text">${t('pts')}</th>
      </tr></thead>
      <tbody>`;

  html += tableData.map((row, idx) => {
    const position = row.pos || row.position;
    // Map team name and crest
    const name = n(row.team?.shortName || row.team?.name || row.name) || 'Unknown';
    const crest = row.team?.crest || row.crest || '';
    const isBarca = name === 'FC Barcelona' || row.team?.id === BARCA_ID;

    // API v2 uses full names: matches, wins, draws, losses, points
    const played = row.m ?? row.playedGames ?? row.matches ?? 0;
    const won = row.w ?? row.won ?? row.wins ?? 0;
    const draw = row.d ?? row.draw ?? row.draws ?? 0;
    const lost = row.l ?? row.lost ?? row.losses ?? 0;
    const points = row.p ?? row.points ?? 0;

    let gd = 0;
    if (row.goalsDiff !== undefined) {
      gd = row.goalsDiff;
    } else if (row.gd !== undefined) {
      gd = row.gd;
    } else if (row.goalDifference !== undefined) {
      gd = row.goalDifference;
    } else if (row.goals && typeof row.goals === 'string' && row.goals.includes(':')) {
      const [sc, co] = row.goals.split(':').map(Number);
      gd = sc - co;
    } else {
      const gf = row.gf ?? row.goalsFor ?? 0;
      const ga = row.ga ?? row.goalsAgainst ?? 0;
      gd = gf - ga;
    }

    let posClass = '';
    if (row.promotion) {
      const p = row.promotion.toLowerCase();
      if (p.includes('liga mistrzów') || p.includes('champions league') || p.includes('awans')) posClass = 'pos-cl';
      else if (p.includes('liga europy') || p.includes('europa league')) posClass = 'pos-el';
      else if (p.includes('konferencji') || p.includes('conference')) posClass = 'pos-ecl';
      else if (p.includes('spadek') || p.includes('relegation')) posClass = 'pos-rel';
    } else {
      if (competitionType === 'laliga') {
        if (position <= 4) posClass = 'pos-cl';
        else if (position === 5) posClass = 'pos-el';
        else if (position === 6) posClass = 'pos-ecl';
        else if (position >= 18) posClass = 'pos-rel';
      } else if (competitionType === 'ucl') {
        if (tableData.length > 20) {
          if (position <= 8) posClass = 'pos-cl';
          else if (position <= 24) posClass = 'pos-el';
          else posClass = 'pos-rel';
        } else {
          if (position <= 2) posClass = 'pos-cl';
          else if (position === 3) posClass = 'pos-el';
          else posClass = 'pos-rel';
        }
      }
    }

    return `
      <tr class="${isBarca ? 'highlight-barca' : ''}" style="animation:none;">
        <td class="font-black text-xs ${posClass}">${position}</td>
        <td>
          <div class="flex items-center gap-3 py-1">
            ${crest ? `<img src="${crest}" alt="${name} Crest" class="w-7 h-7 object-contain" width="28" height="28" loading="lazy" referrerpolicy="no-referrer">` : ''}
            <span class="font-bold ${isBarca ? 'text-gold' : 'theme-text'} text-xs md:text-base">${name}</span>
          </div>
        </td>
        <td class="text-center opacity-40 font-bold text-xs theme-text">${played}</td>
        <td class="hidden sm:table-cell text-center opacity-40 text-[10px] font-black tracking-tighter theme-text">${won}-${draw}-${lost}</td>
        <td class="text-center font-bold text-xs ${gd > 0 ? 'text-green-400' : gd < 0 ? 'text-red-400' : 'opacity-30 theme-text'}">${gd > 0 ? '+' : ''}${gd || 0}</td>
        <td class="text-right font-black text-lg tracking-tighter theme-text">${points}</td>
      </tr>`;
  }).join('');

  html += `</tbody></table></div>`;

  // Legend
  html += `
    <div class="flex flex-wrap gap-4 mt-6 px-2 justify-center md:justify-start">
      <div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-[#3b82f6]"></div><span class="text-[10px] uppercase font-bold opacity-60 theme-text">${t('championsLeague')}</span></div>
      <div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-[#f97316]"></div><span class="text-[10px] uppercase font-bold opacity-60 theme-text">${t('europaLeague')}</span></div>
      <div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-[#ef4444]"></div><span class="text-[10px] uppercase font-bold opacity-60 theme-text">${t('relegation')}</span></div>
    </div>`;

  container.innerHTML = html;
}

// ── La Liga page init ───────────────────────────────────────────────

function renderLaLiga(data) {
  if (!data?.standings) return;
  const container = document.getElementById('laliga-standings-container');
  if (!container) return;

  // Filter for La Liga using normalized competition code
  const standings = data.standings.filter(s =>
    (s.competition?.code === 'PD' || s.competition?.name?.includes('La Liga') || s.league === 'La Liga') &&
    (!s.type || s.type === 'TOTAL' || s.type === 'LEAGUE')
  );

  const total = standings[0]; // Take the first matching table

  if (total) renderStandingsTable(container, total.table, 'laliga');
  else container.innerHTML = `<div class="p-8 text-center opacity-50 theme-text">Tabela niedostępna (Brak danych)</div>`;
}

// ── UCL page init ───────────────────────────────────────────────────

function renderUCL(data) {
  const container = document.getElementById('ucl-standings-container');
  if (!container) return;

  if (!data?.standings?.length) {
    container.innerHTML = `<div class="p-8 text-center bg-white/5 rounded-2xl border border-white/10">
      <p class="opacity-60 mb-2 theme-text">Data currently unavailable</p>
      <span class="text-xs uppercase font-bold text-gold">Check back later</span></div>`;
    return;
  }

  // Filter for UCL using normalized competition code
  // API v2 quirk: sometimes returns 'Premier League' for UCL data?
  const uclStandings = data.standings.filter(s =>
    (s.competition?.code === 'CL' || s.competition?.name?.includes('Champions') || s.league === 'Champions League' || s.competition?.name === 'Premier League') &&
    (!s.type || s.type === 'TOTAL' || s.type === 'LEAGUE_PHASE' || s.type === 'GROUP')
  );

  if (!uclStandings.length) {
    container.innerHTML = `<div class="p-4 opacity-50 flex items-center justify-center h-48 theme-text">No standings available.</div>`;
    return;
  }

  let html = `<div class="flex flex-col gap-12 pt-4">`;
  uclStandings.forEach(gs => {
    // If it's a league phase or group
    const groupName = gs.group ? gs.group.replace(/_/g, ' ') : (gs.stage ? gs.stage.replace(/_/g, ' ') : 'League Table');
    const gid = (gs.group || gs.stage || 'league').toLowerCase().replace(/\s+/g, '-');

    html += `
      <div class="animate-in">
        <div class="glass-header mb-4 pl-4 border-l-2 border-gold">
          <span class="text-xs font-black uppercase tracking-[0.15em] opacity-80 theme-text">${groupName}</span>
        </div>
        <div class="overflow-x-auto" id="ucl-${gid}">
          <!-- Table will be rendered here -->
        </div>
      </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;

  // Render tables into the placeholders
  uclStandings.forEach(gs => {
    const gid = (gs.group || gs.stage || 'league').toLowerCase().replace(/\s+/g, '-');
    const sub = document.getElementById(`ucl-${gid}`);
    if (sub) renderStandingsTable(sub, gs.table, 'ucl');
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  SCHEDULE / RESULTS
// ═══════════════════════════════════════════════════════════════════════

function renderSchedule(data, defaultView = 'upcoming') {
  if (!data?.matches) return;
  // store on window for tab switching
  window._renderScheduleData = data.matches;
  renderScheduleList(defaultView);
}

function renderScheduleList(type) {
  const matches = window._renderScheduleData;
  if (!matches) return;

  let filtered;
  if (type === 'upcoming') {
    // Optimized: Map-Sort-Map for upcoming matches
    const upcoming = (matches.upcoming || [])
      .map(m => ({ item: m, time: new Date(m.startTime).getTime() }))
      .sort((a, b) => a.time - b.time)
      .map(({ item }) => item);
    filtered = (matches.live || []).concat(upcoming);
  } else {
    // Optimized: Map-Sort-Map for finished matches (descending)
    filtered = (matches.finished || [])
      .map(m => ({ item: m, time: new Date(m.startTime).getTime() }))
      .sort((a, b) => b.time - a.time)
      .map(({ item }) => item);
  }

  const container = document.getElementById('schedule-list');
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = `<div class="p-8 text-center opacity-50 glass-premium theme-text">Brak meczów do wyświetlenia.</div>`;
    return;
  }

  const isResult = type === 'results';

  // ── Stage/Round → Polish translation ──────────────────────────────
  const STAGE_MAP = {
    'FINAL': 'Finał',
    'SEMI_FINALS': 'Półfinał',
    'QUARTER_FINALS': 'Ćwierćfinał',
    'LAST_16': '1/8 Finału',
    'ROUND_OF_16': '1/8 Finału',
    'LAST_32': '1/16 Finału',
    'ROUND_OF_32': '1/16 Finału',
    'LAST_64': '1/32 Finału',
    'ROUND_OF_64': '1/32 Finału',
    'GROUP_STAGE': 'Faza grupowa',
    'LEAGUE_STAGE': 'Faza ligowa',
    'PRELIMINARY_ROUND': 'Runda wstępna',
    'QUALIFICATION': 'Kwalifikacje',
    'QUALIFICATION_ROUND_1': '1. runda kwalifikacji',
    'QUALIFICATION_ROUND_2': '2. runda kwalifikacji',
    'QUALIFICATION_ROUND_3': '3. runda kwalifikacji',
    'PLAYOFFS': 'Baraże',
    'REGULAR_SEASON': 'Sezon zasadniczy',
    'THIRD_PLACE': 'Mecz o 3. miejsce',
  };

  const formatStage = (str) => {
    if (!str) return '';
    // Check map for exact key (uppercase)
    const upper = String(str).toUpperCase().replace(/[\s-]/g, '_');
    if (STAGE_MAP[upper]) return STAGE_MAP[upper];
    // Try partial matches
    if (/semi.?final/i.test(str)) return 'Półfinał';
    if (/quarter.?final/i.test(str)) return 'Ćwierćfinał';
    if (/final/i.test(str)) return 'Finał';
    if (/round.of.16|last.16/i.test(str)) return '1/8 Finału';
    if (/round.of.32|last.32/i.test(str)) return '1/16 Finału';
    if (/group/i.test(str)) return 'Faza grupowa';
    if (/league.stage/i.test(str)) return 'Faza ligowa';
    if (/playoff/i.test(str)) return 'Baraże';
    // Matchday number (e.g. "21" or "Matchday 21")
    const mdMatch = str.match(/(\d+)/);
    if (mdMatch) return `${mdMatch[1]}. Kolejka`;
    return str;
  };

  // Chunk rendering to reduce main-thread blocking (TBT)
  const BATCH_SIZE = 12;
  let cursor = 0;
  const parts = [];
  container.innerHTML = '';

  const renderBatch = () => {
    const end = Math.min(cursor + BATCH_SIZE, filtered.length);

    for (let idx = cursor; idx < end; idx++) {
      const m = filtered[idx];
      // Improved check: Exclude "Espanyol" from generic "Barcelona" name match
      const looksLikeBarca = (team) => {
        if (team.id === BARCA_ID) return true;
        if (!team.name) return false;
        const name = n(team.name).toLowerCase();
        // If it says "Barcelona" or "Barça" BUT NOT "Espanyol", it's likely us.
        return (name.includes('barcelona') || name.includes('barça')) && !name.includes('espanyol');
      };

      const isHome = looksLikeBarca(m.homeTeam);
      const isAway = looksLikeBarca(m.awayTeam);

      // Determine opponent
      let oppTeam;
      if (isHome) {
        oppTeam = m.awayTeam;
      } else if (isAway) {
        oppTeam = m.homeTeam;
      } else {
        // Fallback: neither identified as Barca.
        // Could be data error or neutral match.
        // Default to away, but check if one is explicitly NOT Barca
        oppTeam = m.awayTeam;
      }

      // Final Safety: If opponent somehow IS Barca, force swap
      if (looksLikeBarca(oppTeam)) {
        if (isHome) oppTeam = m.awayTeam;
        else oppTeam = m.homeTeam;
      }

      const oppName = n(oppTeam.shortName || oppTeam.name);
      const oppCrest = oppTeam.crest;

      const date = new Date(m.startTime);
      const showTime = idx < 3 || isResult;
      const utcH = date.getUTCHours();
      const isTbd = m.status === 'SCHEDULED' && (utcH === 0 || utcH === 1 || utcH === 2);
      const timeValue = isTbd ? t('tbd') : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const timeDisplay = showTime ? ` • ${timeValue}` : '';

      const compName = m.competition.displayName || m.competition.code;

      // Build round/stage display — prefer round, then stage, then displayName
      let roundDisplay = '';
      if (m.round) {
        roundDisplay = `<br><span class="opacity-60 theme-text">${formatStage(String(m.round))}</span>`;
      } else if (m.stage) {
        roundDisplay = `<br><span class="opacity-60 theme-text">${formatStage(String(m.stage))}</span>`;
      } else if (m.displayName) {
        roundDisplay = `<br><span class="opacity-60 theme-text">${m.displayName}</span>`;
      }

      const hs = m.homeScore;
      const as = m.awayScore;

      parts.push(`
        <div class="glass-premium p-5 mb-4 flex items-center gap-4 animate-in"
             style="animation-delay:${idx * 50}ms;border-radius:28px;">
          <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
            <img src="${oppCrest}" alt="${oppName}" class="w-8 h-8 object-contain" width="32" height="32" loading="lazy" referrerpolicy="no-referrer">
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start mb-0.5">
              <h4 class="font-bold text-base md:text-lg truncate flex items-center gap-1.5 theme-text">vs ${oppName}</h4>
              <span class="text-[9px] font-black text-white/70 uppercase tracking-widest text-right theme-text">${compName}${roundDisplay}</span>
            </div>
            <p class="text-xs text-secondary font-medium theme-text opacity-80">${fmtDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}${timeDisplay}</p>
          </div>
          <div class="flex flex-col items-end gap-1">
            ${isResult && hs !== null
          ? `<span class="font-black text-lg tracking-tighter theme-text">${hs}-${as}</span>`
          : `<div class="w-2 h-2 rounded-full bg-gold"></div>`}
          </div>
        </div>`);
    }

    cursor = end;
    container.insertAdjacentHTML('beforeend', parts.splice(0).join(''));

    if (cursor < filtered.length) {
      requestAnimationFrame(renderBatch);
    }
  };

  requestAnimationFrame(renderBatch);
}

// Tab switching (used by schedule/results pages)
window.switchScheduleTab = function (type) {
  if (type === 'results' && !window.location.pathname.includes('results')) {
    window.barcaRouter ? window.barcaRouter.navigate('results.html') : (window.location.href = 'results.html');
    return;
  }
  if (type === 'upcoming' && window.location.pathname.includes('results')) {
    window.barcaRouter ? window.barcaRouter.navigate('schedule.html') : (window.location.href = 'schedule.html');
    return;
  }
  document.querySelectorAll('.pill-toggle .option').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${type}`)?.classList.add('active');
  renderScheduleList(type);
};

// ═══════════════════════════════════════════════════════════════════════
//  GLOBAL PAGE EXPORTS
// ═══════════════════════════════════════════════════════════════════════

export { renderOverview, renderLaLiga, renderUCL, renderSchedule, renderScheduleList };

// Also expose renderNextMatch for theme toggle refresh
window.renderNextMatch = renderNextMatch;
