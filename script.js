// =====================================================
// ١. قفڵکردنی Zoom، کلیکی ڕاست و پشکنینی کۆد (Security)
// =====================================================
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
    (e.ctrlKey && ['U', 'S'].includes(e.key.toUpperCase()))
  ) {
    e.preventDefault();
  }
});

document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 400) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// =====================================================
// ٢. بارکردنی خێرای وێنەکان (.jpeg لە پێشەوەیە)
// =====================================================
function resolveImageFile(baseName, onSuccess, onFail) {
  const extensions = ['.jpeg', '.JPEG', '.PNG', '.png', '.JPG', '.jpg', '.webp', ''];
  let idx = 0;

  function tryNext() {
    if (idx >= extensions.length) {
      if (onFail) onFail();
      return;
    }
    const candidate = baseName + extensions[idx++];
    const img = new Image();
    img.onload = () => onSuccess(candidate, img);
    img.onerror = tryNext;
    img.src = candidate;
  }
  tryNext();
}

// پاککردنەوەی تەواوەتی باگراوندی واژووەکە (کردنی بە شەفاف)
function removeSignatureBackground(imgElement, loadedImg) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = loadedImg.naturalWidth || loadedImg.width;
    canvas.height = loadedImg.naturalHeight || loadedImg.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(loadedImg, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum < 65) {
        data[i + 3] = 0;
      } else {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = Math.min(255, Math.round((lum - 65) * 2.2));
      }
    }

    ctx.putImageData(imgData, 0, 0);
    imgElement.src = canvas.toDataURL('image/png');
    imgElement.classList.add('clean-alpha');
  } catch (e) {
    imgElement.src = loadedImg.src;
  }
}

resolveImageFile('IMG_6140', (validPath) => {
  document.getElementById('faviconLink').href = validPath;
  document.getElementById('appleIconLink').href = validPath;
});

const sigImgEl = document.getElementById('signatureImg');
const fallbackSigEl = document.getElementById('fallbackSig');
resolveImageFile('IMG_6071', (validPath, loadedImg) => {
  removeSignatureBackground(sigImgEl, loadedImg);
  sigImgEl.style.display = 'block';
  fallbackSigEl.style.display = 'none';
});

const introOverlayEl = document.getElementById('introOverlay');
const introImgEl = document.getElementById('introImg');
resolveImageFile(
  'IMG_6165',
  (validPath) => {
    introImgEl.src = validPath;
    introImgEl.style.display = 'block';
    setTimeout(() => {
      introOverlayEl.classList.add('hide');
    }, 2300);
  },
  () => {
    introOverlayEl.classList.add('hide');
  }
);

// =====================================================
// ٣. سیستمی حاسیبە، دراوەکان و ڕێکخستنەکان
// =====================================================
const TARGET_CHANNEL = 'PMCgroup';
const XEI_RATES_URL = 'https://xeiqd.com/rates.json';

const KURDISH_DAYS = [
  'یەک شەممە',
  'دوو شەممە',
  'سێ شەممە',
  'چوار شەممە',
  'پێنج شەممە',
  'هەینی',
  'شەممە'
];

const CURRENCY_META = {
  USD: { title: 'نرخی دۆلار', name: 'دۆلار', symbol: '$' },
  GBP: { title: 'نرخی پاوەند', name: 'پاوەند', symbol: '£' },
  EUR: { title: 'نرخی یۆرۆ', name: 'یۆرۆ', symbol: '€' },
  TRY: { title: 'نرخی لیرەی تورکی', name: 'لیرەی تورکی', symbol: 'TRY' },
  IRR: { title: 'نرخی تمەنی ئێرانی', name: 'تمەن', symbol: 'IRR' }
};

const savedDarkPref = localStorage.getItem('darkMode');
const initialDarkMode = savedDarkPref !== null ? savedDarkPref === 'true' : true;

let savedXeiRates = null;
try {
  savedXeiRates = JSON.parse(localStorage.getItem('savedXeiRates'));
} catch (e) {
  savedXeiRates = null;
}

const state = {
  selectedCurrency: 'USD',
  baseRatePer100USD: Number(localStorage.getItem('savedRate')) || 168000,
  lastTimestamp: Number(localStorage.getItem('savedTime')) || Date.now(),
  xeiRates: savedXeiRates || {
    GBP: 0.7477,
    EUR: 0.862,
    TRY: 49.9525,
    IRR: 1000000
  },
  isTopForeign: true,
  rawInput: '0',
  minus1000Active: localStorage.getItem('minus1000Active') === 'true',
  isDarkMode: initialDarkMode,
  showDayName: false
};

const topAmountEl = document.getElementById('topAmount');
const bottomAmountEl = document.getElementById('bottomAmount');
const topNameEl = document.getElementById('topName');
const topSymbolEl = document.getElementById('topSymbol');
const bottomNameEl = document.getElementById('bottomName');
const bottomSymbolEl = document.getElementById('bottomSymbol');
const rateTitleEl = document.getElementById('rateTitle');
const liveRateBannerEl = document.getElementById('liveRateBanner');
const dateDisplayEl = document.getElementById('dateDisplay');
const timeDisplayEl = document.getElementById('timeDisplay');
const swapBtn = document.getElementById('swapBtn');
const keypad = document.getElementById('keypad');

const refreshBtn = document.getElementById('refreshBtn');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const menuBackdrop = document.getElementById('menuBackdrop');
const menuCloseBtn = document.getElementById('menuCloseBtn');
const discountToggle = document.getElementById('discountToggle');
const darkModeToggle = document.getElementById('darkModeToggle');
const currSelectBtns = document.querySelectorAll('.curr-select-btn');

discountToggle.checked = state.minus1000Active;
darkModeToggle.checked = state.isDarkMode;
if (!state.isDarkMode) {
  document.body.classList.add('light-mode');
}

function getEffectiveUsdRate() {
  return state.minus1000Active ? (state.baseRatePer100USD - 1000) : state.baseRatePer100USD;
}

function getCalculatedRateForCurrency(curr) {
  const usdRate = getEffectiveUsdRate();
  const rawUsdRate = state.baseRatePer100USD;

  if (curr === 'USD') {
    return usdRate;
  }

  if (curr === 'GBP') {
    const val = Number(state.xeiRates.GBP) || 0.7477;
    if (val > 100000) return Math.round(val);
    if (val > 1000) return Math.round(val * 100);
    if (val >= 1) return Math.round(rawUsdRate * val);
    return Math.round(rawUsdRate / val);
  }

  if (curr === 'EUR') {
    const val = Number(state.xeiRates.EUR) || 0.862;
    if (val > 100000) return Math.round(val);
    if (val > 1000) return Math.round(val * 100);
    if (val >= 1) return Math.round(rawUsdRate * val);
    return Math.round(rawUsdRate / val);
  }

  if (curr === 'TRY') {
    const val = Number(state.xeiRates.TRY) || 49.9525;
    if (val > 1000) return Math.round(val);
    if (val < 1) return Math.round(rawUsdRate * 10 * val);
    return Math.round((rawUsdRate * 10) / val);
  }

  if (curr === 'IRR') {
    const val = Number(state.xeiRates.IRR) || 1000000;
    if (val > 10000000) return Math.round(val);
    return Math.round((10000000 / rawUsdRate) * val);
  }

  return usdRate;
}

function formatNumber(numStr, maxDecimals = 2) {
  if (!numStr || numStr === '0') return '0';
  const parts = numStr.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (parts.length > 1) {
    return `${parts[0]}.${parts[1].slice(0, maxDecimals)}`;
  }
  return parts[0];
}

function normalizeDigits(str) {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (d) => arabicNumbers.indexOf(d));
}

function extractExchangeRate(text) {
  if (!text) return null;
  const cleanText = normalizeDigits(text).replace(/,/g, '');

  const pmcFormat = cleanText.match(/100\s*\$\s*=\s*(1[2-9]\d{4})/);
  if (pmcFormat) return parseInt(pmcFormat[1], 10);

  const sixDigitMatch = cleanText.match(/\b(1[2-9]\d{4})\b/);
  if (sixDigitMatch) return parseInt(sixDigitMatch[1], 10);

  return null;
}

function renderDateOrDay() {
  const postDate = new Date(state.lastTimestamp);
  if (state.showDayName) {
    dateDisplayEl.textContent = KURDISH_DAYS[postDate.getDay()];
  } else {
    const year = postDate.getFullYear();
    const month = String(postDate.getMonth() + 1).padStart(2, '0');
    const day = String(postDate.getDate()).padStart(2, '0');
    dateDisplayEl.textContent = `${year}/${month}/${day}`;
  }

  timeDisplayEl.textContent = postDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function updateCardLabels() {
  const meta = CURRENCY_META[state.selectedCurrency];
  rateTitleEl.textContent = meta.title;

  if (state.isTopForeign) {
    topNameEl.textContent = meta.name;
    topSymbolEl.textContent = meta.symbol;
    bottomNameEl.textContent = 'دینار';
    bottomSymbolEl.textContent = 'IQD';
  } else {
    topNameEl.textContent = 'دینار';
    topSymbolEl.textContent = 'IQD';
    bottomNameEl.textContent = meta.name;
    bottomSymbolEl.textContent = meta.symbol;
  }
}

function renderRateBanner(animate = false) {
  const curr = state.selectedCurrency;
  const rateVal = getCalculatedRateForCurrency(curr);
  const formattedRate = formatNumber(rateVal.toString(), 0);
  const LRM = '\u200E';

  if (curr === 'USD') {
    liveRateBannerEl.textContent = `100$ = ${formattedRate}${LRM} دینار`;
  } else if (curr === 'GBP') {
    liveRateBannerEl.textContent = `100£ = ${formattedRate}${LRM} دینار`;
  } else if (curr === 'EUR') {
    liveRateBannerEl.textContent = `100€ = ${formattedRate}${LRM} دینار`;
  } else if (curr === 'TRY') {
    liveRateBannerEl.textContent = `1000${LRM}لیرە${LRM} = ${formattedRate}${LRM} دینار`;
  } else if (curr === 'IRR') {
    liveRateBannerEl.textContent = `100,000${LRM}دینار${LRM} = ${formattedRate}${LRM} تمەن`;
  }

  if (animate) {
    liveRateBannerEl.classList.add('pulse');
    setTimeout(() => liveRateBannerEl.classList.remove('pulse'), 300);
  }
}

function calculateAndRender() {
  const maxDecimalsInput = state.selectedCurrency === 'IRR' ? 6 : 4;
  topAmountEl.textContent = formatNumber(state.rawInput, maxDecimalsInput);

  const inputValue = parseFloat(state.rawInput);
  if (isNaN(inputValue) || inputValue === 0) {
    bottomAmountEl.textContent = '0';
    return;
  }

  const curr = state.selectedCurrency;
  const activeRate = getCalculatedRateForCurrency(curr);
  let result = 0;

  if (curr === 'USD' || curr === 'GBP' || curr === 'EUR') {
    if (state.isTopForeign) {
      result = (inputValue * activeRate) / 100;
      bottomAmountEl.textContent = formatNumber(Math.round(result).toString(), 0);
    } else {
      result = (inputValue / activeRate) * 100;
      const formattedResult = Number.isInteger(result)
        ? result.toString()
        : result.toFixed(2).replace(/\.?0+$/, '');
      bottomAmountEl.textContent = formatNumber(formattedResult, 2);
    }
  } else if (curr === 'TRY') {
    if (state.isTopForeign) {
      result = (inputValue * activeRate) / 1000;
      bottomAmountEl.textContent = formatNumber(Math.round(result).toString(), 0);
    } else {
      result = (inputValue / activeRate) * 1000;
      const formattedResult = Number.isInteger(result)
        ? result.toString()
        : result.toFixed(2).replace(/\.?0+$/, '');
      bottomAmountEl.textContent = formatNumber(formattedResult, 2);
    }
  } else if (curr === 'IRR') {
    if (state.isTopForeign) {
      result = (inputValue / activeRate) * 100000;
      bottomAmountEl.textContent = formatNumber(Math.round(result).toString(), 0);
    } else {
      result = (inputValue * activeRate) / 100000;
      bottomAmountEl.textContent = formatNumber(Math.round(result).toString(), 0);
    }
  }
}

function updateLiveRate(newBaseRate, timestampMs) {
  const isChanged = state.baseRatePer100USD !== newBaseRate || state.lastTimestamp !== timestampMs;
  state.baseRatePer100USD = newBaseRate;
  state.lastTimestamp = timestampMs;
  localStorage.setItem('savedRate', newBaseRate);
  localStorage.setItem('savedTime', timestampMs);

  renderRateBanner(isChanged);
  renderDateOrDay();
  calculateAndRender();
}

currSelectBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const chosenCurr = btn.dataset.curr;
    if (!chosenCurr) return;

    state.selectedCurrency = chosenCurr;
    state.rawInput = '0';
    state.isTopForeign = true;

    currSelectBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    updateCardLabels();
    renderRateBanner(true);
    calculateAndRender();

    menuBackdrop.classList.remove('open');
  });
});

dateDisplayEl.addEventListener('click', () => {
  state.showDayName = !state.showDayName;
  renderDateOrDay();
});

hamburgerBtn.addEventListener('click', () => {
  menuBackdrop.classList.add('open');
});

menuCloseBtn.addEventListener('click', () => {
  menuBackdrop.classList.remove('open');
});

menuBackdrop.addEventListener('click', (e) => {
  if (e.target === menuBackdrop) {
    menuBackdrop.classList.remove('open');
  }
});

discountToggle.addEventListener('change', (e) => {
  state.minus1000Active = e.target.checked;
  localStorage.setItem('minus1000Active', state.minus1000Active);
  renderRateBanner(true);
  calculateAndRender();
});

darkModeToggle.addEventListener('change', (e) => {
  state.isDarkMode = e.target.checked;
  localStorage.setItem('darkMode', state.isDarkMode);
  if (state.isDarkMode) {
    document.body.classList.remove('light-mode');
  } else {
    document.body.classList.add('light-mode');
  }
});

refreshBtn.addEventListener('click', () => {
  refreshBtn.classList.add('spinning');
  renderRateBanner(true);
  fetchPublicChannelPMC();
  fetchOtherRatesFromXeiqd();
  setTimeout(() => {
    refreshBtn.classList.remove('spinning');
  }, 650);
});

function handleKeyPress(key) {
  const maxAllowedDigits = state.selectedCurrency === 'IRR' ? 16 : 12;

  if (key === 'BACKSPACE') {
    state.rawInput = state.rawInput.length > 1 ? state.rawInput.slice(0, -1) : '0';
  } else if (key === '.') {
    if (!state.rawInput.includes('.')) state.rawInput += '.';
  } else {
    if (state.rawInput.replace('.', '').length >= maxAllowedDigits) return;
    state.rawInput = state.rawInput === '0' ? key : state.rawInput + key;
  }
  calculateAndRender();
}

keypad.addEventListener('touchstart', (e) => {
  const btn = e.target.closest('.key-btn');
  if (!btn) return;
  e.preventDefault();
  btn.classList.add('pressed');
  handleKeyPress(btn.dataset.key);
}, { passive: false });

keypad.addEventListener('touchend', (e) => {
  const btn = e.target.closest('.key-btn');
  if (btn) btn.classList.remove('pressed');
});

keypad.addEventListener('touchcancel', (e) => {
  const btn = e.target.closest('.key-btn');
  if (btn) btn.classList.remove('pressed');
});

keypad.addEventListener('mousedown', (e) => {
  const btn = e.target.closest('.key-btn');
  if (btn) handleKeyPress(btn.dataset.key);
});

function toggleSwap() {
  state.isTopForeign = !state.isTopForeign;
  state.rawInput = '0';
  updateCardLabels();
  calculateAndRender();
}

swapBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  swapBtn.classList.add('pressed');
  toggleSwap();
}, { passive: false });

swapBtn.addEventListener('touchend', () => {
  swapBtn.classList.remove('pressed');
});

swapBtn.addEventListener('mousedown', toggleSwap);

// =====================================================
// ٤. وەرگرتنی نرخی دراوەکانی تر لە xeiqd.com/rates.json
// =====================================================
function parseXeiJsonData(jsonObj) {
  if (!jsonObj || typeof jsonObj !== 'object') return null;
  const source = jsonObj.rates || jsonObj.data || jsonObj;

  const findVal = (keys) => {
    for (const k of keys) {
      if (source[k] !== undefined && !isNaN(Number(source[k]))) {
        return Number(source[k]);
      }
      const lowerKey = Object.keys(source).find((item) => item.toLowerCase() === k.toLowerCase());
      if (lowerKey && !isNaN(Number(source[lowerKey]))) {
        return Number(source[lowerKey]);
      }
    }
    return null;
  };

  const gbp = findVal(['GBP', 'gbp']);
  const eur = findVal(['EUR', 'eur']);
  const tryRate = findVal(['TRY', 'try', 'TRL']);
  const irr = findVal(['IRR', 'irr', 'IRT', 'TOMAN']);

  if (gbp || eur || tryRate || irr) {
    return {
      GBP: gbp || state.xeiRates.GBP,
      EUR: eur || state.xeiRates.EUR,
      TRY: tryRate || state.xeiRates.TRY,
      IRR: irr || state.xeiRates.IRR
    };
  }
  return null;
}

let isFetchingXei = false;
async function fetchOtherRatesFromXeiqd() {
  if (isFetchingXei) return;
  isFetchingXei = true;

  const targetUrl = `${XEI_RATES_URL}?t=${Date.now()}`;
  const urlsToTry = [
    targetUrl,
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
  ];

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const data = await res.json();
      const parsed = parseXeiJsonData(data);

      if (parsed) {
        state.xeiRates = parsed;
        localStorage.setItem('savedXeiRates', JSON.stringify(parsed));
        renderRateBanner(false);
        calculateAndRender();
        break;
      }
    } catch (err) {}
  }

  isFetchingXei = false;
}

// =====================================================
// ٥. سیستمی ٦ پڕۆکسی هاوکات بۆ نرخی دۆلار لە تێلێگرامەوە
// =====================================================
function parseChannelHtml(htmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const messages = doc.querySelectorAll('.tgme_widget_message');

  for (let i = messages.length - 1; i >= 0; i--) {
    const msgEl = messages[i];
    const textEl = msgEl.querySelector('.tgme_widget_message_text');
    if (!textEl) continue;

    const rate = extractExchangeRate(textEl.textContent);
    if (rate) {
      const timeEl = msgEl.querySelector('.tgme_widget_message_date time');
      const datetimeAttr = timeEl ? timeEl.getAttribute('datetime') : null;
      const postTimestamp = datetimeAttr ? new Date(datetimeAttr).getTime() : Date.now();
      return { rate, postTimestamp };
    }
  }
  return null;
}

async function fetchViaSingleProxy(proxyConfig, targetUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3200);

  try {
    const response = await fetch(proxyConfig.buildUrl(targetUrl), {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Bad response');

    if (proxyConfig.isJson) {
      const jsonData = await response.json();
      const htmlText = jsonData.contents || '';
      const parsed = parseChannelHtml(htmlText);
      if (parsed) return parsed;
    } else if (proxyConfig.isRawText) {
      const rawText = await response.text();
      const parsedHtml = parseChannelHtml(rawText);
      if (parsedHtml) return parsedHtml;

      const lines = rawText.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const rate = extractExchangeRate(lines[i]);
        if (rate) return { rate, postTimestamp: state.lastTimestamp };
      }
    }
    throw new Error('No valid rate found');
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

let isFetching = false;
async function fetchPublicChannelPMC() {
  if (isFetching) return;
  isFetching = true;

  const cacheBuster = Date.now();
  const targetUrl = `https://t.me/s/${TARGET_CHANNEL}?t=${cacheBuster}`;

  const proxyList = [
    {
      buildUrl: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
      isRawText: true
    },
    {
      buildUrl: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      isRawText: true
    },
    {
      buildUrl: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
      isRawText: true
    },
    {
      buildUrl: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
      isJson: true
    },
    {
      buildUrl: (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
      isRawText: true
    },
    {
      buildUrl: () => `https://r.jina.ai/https://t.me/s/${TARGET_CHANNEL}?t=${cacheBuster}`,
      isRawText: true
    }
  ];

  try {
    const fastestResult = await Promise.any(
      proxyList.map((proxy) => fetchViaSingleProxy(proxy, targetUrl))
    );

    if (fastestResult && fastestResult.rate) {
      if (
        fastestResult.postTimestamp >= state.lastTimestamp ||
        fastestResult.rate !== state.baseRatePer100USD
      ) {
        updateLiveRate(fastestResult.rate, fastestResult.postTimestamp);
      }
    }
  } catch (err) {
  } finally {
    isFetching = false;
  }
}

updateCardLabels();
updateLiveRate(state.baseRatePer100USD, state.lastTimestamp);
fetchPublicChannelPMC();
fetchOtherRatesFromXeiqd();

setInterval(fetchPublicChannelPMC, 2500);
setInterval(fetchOtherRatesFromXeiqd, 60000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    fetchPublicChannelPMC();
    fetchOtherRatesFromXeiqd();
  }
});
