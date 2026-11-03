// =====================================================
// ٠. هاوتاکردنی قەبارەی نووسینی ئەندرۆید لەگەڵ ئایفۆن
// =====================================================
function normalizeTypographyForDevice() {
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const docEl = document.documentElement;

  if (isAndroid) {
    document.body.classList.add('android-device');
  }

  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;font-size:16px;width:0;height:0;';
  document.body.appendChild(probe);
  const renderedPx = parseFloat(window.getComputedStyle(probe).fontSize) || 16;
  document.body.removeChild(probe);

  const systemFontBoost = renderedPx / 16;
  const vw = Math.min(window.innerWidth || 390, 430);

  if (isAndroid) {
    const targetPx = Math.min(15.2, Math.max(13.2, (vw / 390) * 14.8));
    const compensatedPx = targetPx / (systemFontBoost > 1.01 ? systemFontBoost : 1);
    docEl.style.fontSize = `${compensatedPx.toFixed(2)}px`;
  } else if (systemFontBoost > 1.02) {
    docEl.style.fontSize = `${(16 / systemFontBoost).toFixed(2)}px`;
  } else {
    docEl.style.fontSize = '16px';
  }
}

normalizeTypographyForDevice();
window.addEventListener('resize', normalizeTypographyForDevice);

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
    if (!e.target.closest('button, a, label, input, #dateDisplay')) {
      e.preventDefault();
    }
  }
  lastTouchEnd = now;
}, { passive: false });

// =====================================================
// ٢. ڕەنگکردنی ناوچەی Home Indicator لە ئایفۆن (ئەپ، لایت، ئینترۆ)
// =====================================================
const themeColorMeta = document.getElementById('themeColorMeta');
let isIntroActive = true;

function syncSafeAreaThemeColor() {
  const isDark = !document.body.classList.contains('light-mode');
  const targetColor = isIntroActive ? '#111615' : (isDark ? '#0d0d0d' : '#f2dec0');
  document.documentElement.style.backgroundColor = targetColor;
  document.body.style.backgroundColor = targetColor;
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', targetColor);
  }
}

// =====================================================
// ٣. بارکردنی خێرای وێنەکان (.jpg و .JPG و .jpeg)
// =====================================================
function resolveImageFile(baseName, onSuccess, onFail) {
  const extensions = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.webp', ''];
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

function finishIntroScreen() {
  if (!isIntroActive) return;
  isIntroActive = false;
  introOverlayEl.classList.add('hide');
  syncSafeAreaThemeColor();
}

resolveImageFile(
  'IMG_6165',
  (validPath) => {
    if (introImgEl.getAttribute('src') !== validPath) {
      introImgEl.src = validPath;
    }
    introImgEl.style.display = 'block';
    setTimeout(finishIntroScreen, 2300);
  },
  () => {
    finishIntroScreen();
  }
);

// =====================================================
// ٤. سیستمی حاسیبە، دراوەکان و ڕێکخستنەکان
// =====================================================
const TARGET_CHANNEL = 'PMCgroup';
const XEIOD_API_URL = 'https://xeiqd.com/rates.json';
const RUDAW_INDEX_URL = 'https://rudawindex.net';

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
  IRR: { title: 'نرخی تمەنی ئێرانی', name: 'تمەنی ئێرانی', symbol: 'تمەن' }
};

const savedDarkPref = localStorage.getItem('darkMode');
const initialDarkMode = savedDarkPref !== null ? savedDarkPref === 'true' : true;

let cachedXeiqdJson = null;
try {
  const savedJson = localStorage.getItem('cachedXeiqdJson');
  if (savedJson) cachedXeiqdJson = JSON.parse(savedJson);
} catch (e) {}

let cachedRudawBuyObj = null;
try {
  const savedRudaw = localStorage.getItem('cachedRudawBuyObj');
  if (savedRudaw) cachedRudawBuyObj = JSON.parse(savedRudaw);
} catch (e) {}

const state = {
  selectedCurrency: 'USD',
  baseRatePer100USD: Number(localStorage.getItem('savedRate')) || 168000,
  otherRates: {
    GBP: Number(localStorage.getItem('rate_GBP')) || 225000,
    EUR: Number(localStorage.getItem('rate_EUR')) || 185000,
    TRY: Number(localStorage.getItem('rate_TRY')) || 33682,
    IRR: Number(localStorage.getItem('rate_IRR')) || 59435364
  },
  // تەنها کاتی کۆتا پۆستی دۆلار لە تێلێگرامی PMC هەڵدەگرێت
  pmcTimestamp: Number(localStorage.getItem('savedPmcTime')) || Number(localStorage.getItem('savedTime')) || 0,
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
syncSafeAreaThemeColor();

function getEffectiveUsdRate() {
  return state.minus1000Active ? (state.baseRatePer100USD - 1000) : state.baseRatePer100USD;
}

function formatNumber(numStr, maxDecimals = 2) {
  if (!numStr || numStr === '0') return '0';
  let str = numStr.toString();

  if (str.includes('e') || str.includes('E')) {
    const num = Number(str);
    if (!isNaN(num)) {
      str = num.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: maxDecimals });
    }
  }

  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (parts.length > 1 && maxDecimals > 0) {
    return `${parts[0]}.${parts[1].slice(0, maxDecimals)}`;
  }
  return parts[0];
}

function formatRoundedInteger(val) {
  if (!isFinite(val) || isNaN(val) || val === 0) return '0';
  try {
    const bigVal = BigInt(Math.round(val));
    return formatNumber(bigVal.toString(), 0);
  } catch (e) {
    return formatNumber(Math.round(val).toString(), 0);
  }
}

function adjustAmountFontSize(el, formattedText) {
  const len = formattedText.length;
  if (len > 19) {
    el.style.fontSize = '1.15rem';
  } else if (len > 15) {
    el.style.fontSize = '1.38rem';
  } else if (len > 12) {
    el.style.fontSize = '1.68rem';
  } else {
    el.style.fontSize = '';
  }
}

function normalizeDigits(str) {
  if (!str) return '';
  const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const easternArabic = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str)
    .replace(/[٠-٩]/g, (d) => arabicIndic.indexOf(d))
    .replace(/[۰-۹]/g, (d) => easternArabic.indexOf(d));
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
  if (!state.pmcTimestamp || state.pmcTimestamp <= 0) {
    dateDisplayEl.textContent = '--/----/--';
    timeDisplayEl.textContent = '--:--';
    return;
  }

  const postDate = new Date(state.pmcTimestamp);
  if (isNaN(postDate.getTime())) return;

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

function renderRateBanner(animate = false) {
  const curr = state.selectedCurrency;
  const meta = CURRENCY_META[curr];
  rateTitleEl.textContent = meta.title;

  if (curr === 'USD') {
    const effectiveUsd = getEffectiveUsdRate();
    liveRateBannerEl.textContent = `\u2066100$\u2069 = \u2066${formatRoundedInteger(effectiveUsd)} دینار\u2069`;
  } else if (curr === 'GBP') {
    liveRateBannerEl.textContent = `\u2066100£\u2069 = \u2066${formatRoundedInteger(state.otherRates.GBP)} دینار\u2069`;
  } else if (curr === 'EUR') {
    liveRateBannerEl.textContent = `\u2066100€\u2069 = \u2066${formatRoundedInteger(state.otherRates.EUR)} دینار\u2069`;
  } else if (curr === 'TRY') {
    liveRateBannerEl.textContent = `\u20661000 لیرە\u2069 = \u2066${formatRoundedInteger(state.otherRates.TRY)} دینار\u2069`;
  } else if (curr === 'IRR') {
    liveRateBannerEl.textContent = `\u2066100,000 دینار\u2069 = \u2066${formatRoundedInteger(state.otherRates.IRR)} تمەن\u2069`;
  }

  if (animate) {
    liveRateBannerEl.classList.add('pulse');
    setTimeout(() => liveRateBannerEl.classList.remove('pulse'), 300);
  }
}

function renderConverterLabels() {
  const meta = CURRENCY_META[state.selectedCurrency];
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

function calculateAndRender() {
  const formattedTop = formatNumber(state.rawInput, 4);
  topAmountEl.textContent = formattedTop;
  adjustAmountFontSize(topAmountEl, formattedTop);
  topAmountEl.scrollLeft = topAmountEl.scrollWidth;

  const inputValue = parseFloat(state.rawInput);
  if (isNaN(inputValue) || inputValue === 0) {
    bottomAmountEl.textContent = '0';
    adjustAmountFontSize(bottomAmountEl, '0');
    return;
  }

  const curr = state.selectedCurrency;
  let bottomText = '0';

  if (curr === 'USD') {
    const rate = getEffectiveUsdRate();
    if (state.isTopForeign) {
      const result = (inputValue * rate) / 100;
      bottomText = formatRoundedInteger(result);
    } else {
      const result = (inputValue / rate) * 100;
      const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
      bottomText = formatNumber(formatted, 2);
    }
  } else if (curr === 'GBP' || curr === 'EUR') {
    const rate = state.otherRates[curr];
    if (state.isTopForeign) {
      const result = (inputValue * rate) / 100;
      bottomText = formatRoundedInteger(result);
    } else {
      const result = (inputValue / rate) * 100;
      const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
      bottomText = formatNumber(formatted, 2);
    }
  } else if (curr === 'TRY') {
    const ratePer1000 = state.otherRates.TRY;
    if (state.isTopForeign) {
      const result = (inputValue * ratePer1000) / 1000;
      bottomText = formatRoundedInteger(result);
    } else {
      const result = (inputValue / ratePer1000) * 1000;
      const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
      bottomText = formatNumber(formatted, 2);
    }
  } else if (curr === 'IRR') {
    const tomanPer100k = Math.round(state.otherRates.IRR);

    if (!state.rawInput.includes('.') && tomanPer100k > 0) {
      try {
        const inputBig = BigInt(state.rawInput);
        const rateBig = BigInt(tomanPer100k);

        if (state.isTopForeign) {
          const resBig = (inputBig * 100000n + rateBig / 2n) / rateBig;
          bottomText = formatNumber(resBig.toString(), 0);
        } else {
          const resBig = (inputBig * rateBig + 50000n) / 100000n;
          bottomText = formatNumber(resBig.toString(), 0);
        }
      } catch (e) {
        const result = state.isTopForeign
          ? (inputValue / tomanPer100k) * 100000
          : (inputValue * tomanPer100k) / 100000;
        bottomText = formatRoundedInteger(result);
      }
    } else {
      const result = state.isTopForeign
        ? (inputValue / tomanPer100k) * 100000
        : (inputValue * tomanPer100k) / 100000;
      bottomText = formatRoundedInteger(result);
    }
  }

  bottomAmountEl.textContent = bottomText;
  adjustAmountFontSize(bottomAmountEl, bottomText);
  bottomAmountEl.scrollLeft = bottomAmountEl.scrollWidth;
}

function updateLiveRateFromPMC(newBaseRate, pmcPostTimestampMs) {
  const isChanged =
    state.baseRatePer100USD !== newBaseRate ||
    (pmcPostTimestampMs > 0 && state.pmcTimestamp !== pmcPostTimestampMs);

  state.baseRatePer100USD = newBaseRate;
  localStorage.setItem('savedRate', newBaseRate);

  if (pmcPostTimestampMs && pmcPostTimestampMs > 0) {
    state.pmcTimestamp = pmcPostTimestampMs;
    localStorage.setItem('savedPmcTime', pmcPostTimestampMs);
    localStorage.setItem('savedTime', pmcPostTimestampMs);
  }

  // لەگەڵ گۆڕینی دۆلاری تێلێگرام، نرخی دراوەکانی تریش نوێ دەکرێتەوە
  if (cachedXeiqdJson) {
    applyXeiqdRates(cachedXeiqdJson);
  }
  if (cachedRudawBuyObj) {
    applyRudawTomanRate(cachedRudawBuyObj);
  }

  renderRateBanner(isChanged);
  renderDateOrDay();
  calculateAndRender();
}

currSelectBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const chosen = btn.dataset.curr;
    if (!chosen) return;

    state.selectedCurrency = chosen;
    state.rawInput = '0';
    state.isTopForeign = true;

    currSelectBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    renderConverterLabels();
    renderRateBanner(true);
    calculateAndRender();

    setTimeout(() => {
      menuBackdrop.classList.remove('open');
    }, 140);
  });
});

dateDisplayEl.addEventListener('click', () => {
  state.showDayName = !state.showDayName;
  renderDateOrDay();
});

function openMenuSheet(e) {
  if (e) e.stopPropagation();
  menuBackdrop.classList.add('open');
}

hamburgerBtn.addEventListener('click', openMenuSheet);
hamburgerBtn.addEventListener('touchend', (e) => {
  e.preventDefault();
  openMenuSheet(e);
}, { passive: false });

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
  syncSafeAreaThemeColor();
});

async function triggerManualRefresh(e) {
  if (e) e.stopPropagation();
  refreshBtn.classList.add('spinning');
  await Promise.allSettled([
    fetchPublicChannelPMC(true),
    fetchRatesFromXeiqd(true),
    fetchTomanFromRudaw(true)
  ]);
  renderRateBanner(true);
  setTimeout(() => {
    refreshBtn.classList.remove('spinning');
  }, 600);
}

refreshBtn.addEventListener('click', triggerManualRefresh);
refreshBtn.addEventListener('touchend', (e) => {
  e.preventDefault();
  triggerManualRefresh(e);
}, { passive: false });

function handleKeyPress(key) {
  const maxAllowedDigits = state.selectedCurrency === 'IRR' ? 20 : 12;

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
  renderConverterLabels();
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
// ٥. وەرگرتنی نرخی (پاوەند، یۆرۆ، لیرە) لە xeiqd.com/rates.json
// =====================================================
function extractNumericRate(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  const sources = [obj.rates, obj.data, obj.currencies, obj.usd, obj.iqd, obj];

  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;

    if (Array.isArray(src)) {
      for (const item of src) {
        if (!item || typeof item !== 'object') continue;
        const code = String(item.code || item.currency || item.symbol || item.name || '').toUpperCase();
        if (keys.includes(code)) {
          const v = item.rate ?? item.sell ?? item.price ?? item.value ?? item.buy;
          const parsed = parseFloat(String(v).replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      }
      continue;
    }

    for (const k of Object.keys(src)) {
      const upperK = k.toUpperCase();
      if (keys.includes(upperK) || keys.some((target) => upperK === `USD_${target}` || upperK === `${target}_IQD`)) {
        const val = src[k];
        if (typeof val === 'number' && val > 0) return val;
        if (typeof val === 'string') {
          const parsed = parseFloat(val.replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
        if (val && typeof val === 'object') {
          const nested = val.rate ?? val.sell ?? val.price ?? val.value ?? val.buy ?? val.iqd;
          const parsed = parseFloat(String(nested).replace(/,/g, ''));
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      }
    }
  }
  return null;
}

function applyXeiqdRates(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') return false;

  cachedXeiqdJson = jsonData;
  try {
    localStorage.setItem('cachedXeiqdJson', JSON.stringify(jsonData));
  } catch (e) {}

  const rawGBP = extractNumericRate(jsonData, ['GBP', 'POUND']);
  const rawEUR = extractNumericRate(jsonData, ['EUR', 'EURO']);
  const rawTRY = extractNumericRate(jsonData, ['TRY', 'TRL', 'LIRA']);

  const usdBase100 = state.baseRatePer100USD;
  const isUsdRelativeJson = rawGBP !== null && rawGBP < 10;
  let updated = false;

  if (rawGBP) {
    let gbp100 = state.otherRates.GBP;
    if (rawGBP > 50000) {
      gbp100 = Math.round(rawGBP);
    } else if (rawGBP > 500) {
      gbp100 = Math.round(rawGBP * 100);
    } else if (rawGBP > 50) {
      gbp100 = Math.round((rawGBP / 100) * usdBase100);
    } else if (rawGBP > 1) {
      gbp100 = Math.round(rawGBP * usdBase100);
    } else if (rawGBP > 0.1) {
      gbp100 = Math.round(usdBase100 / rawGBP);
    }
    if (gbp100 > 0) {
      state.otherRates.GBP = gbp100;
      localStorage.setItem('rate_GBP', gbp100);
      updated = true;
    }
  }

  if (rawEUR) {
    let eur100 = state.otherRates.EUR;
    if (rawEUR > 50000) {
      eur100 = Math.round(rawEUR);
    } else if (rawEUR > 500) {
      eur100 = Math.round(rawEUR * 100);
    } else if (rawEUR > 50) {
      eur100 = Math.round((rawEUR / 100) * usdBase100);
    } else if (rawGBP && rawGBP < 1) {
      eur100 = Math.round(usdBase100 / rawEUR);
    } else if (rawEUR >= 1) {
      eur100 = Math.round(rawEUR * usdBase100);
    } else if (rawEUR > 0.1) {
      eur100 = Math.round(usdBase100 / rawEUR);
    }
    if (eur100 > 0) {
      state.otherRates.EUR = eur100;
      localStorage.setItem('rate_EUR', eur100);
      updated = true;
    }
  }

  if (rawTRY) {
    let try1000 = state.otherRates.TRY;
    if (rawTRY > 10000) {
      try1000 = Math.round(rawTRY);
    } else if (rawTRY > 500) {
      try1000 = Math.round(rawTRY * 10);
    } else if (isUsdRelativeJson) {
      try1000 = Math.round((usdBase100 * 10) / rawTRY);
    } else {
      try1000 = Math.round(rawTRY * 1000);
    }
    if (try1000 > 0) {
      state.otherRates.TRY = try1000;
      localStorage.setItem('rate_TRY', try1000);
      updated = true;
    }
  }

  if (updated) {
    renderRateBanner(false);
    calculateAndRender();
  }
  return updated;
}

let isFetchingXeiqd = false;
async function fetchRatesFromXeiqd(force = false) {
  if (isFetchingXeiqd && !force) return;
  isFetchingXeiqd = true;

  const cacheBuster = Date.now();
  const urlWithCache = `${XEIOD_API_URL}?t=${cacheBuster}`;

  const endpoints = [
    { url: urlWithCache, wrapped: false },
    { url: `https://corsproxy.io/?url=${encodeURIComponent(urlWithCache)}`, wrapped: false },
    { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(urlWithCache)}`, wrapped: false },
    { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(urlWithCache)}`, wrapped: false },
    { url: `https://api.allorigins.win/get?url=${encodeURIComponent(urlWithCache)}`, wrapped: true }
  ];

  try {
    const fetchJson = async (ep) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(ep.url, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Bad status');
        const data = await res.json();
        if (!data) throw new Error('Empty JSON');
        if (ep.wrapped && data.contents) {
          return JSON.parse(data.contents);
        }
        return data;
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    };

    const data = await Promise.any(endpoints.map((ep) => fetchJson(ep)));
    applyXeiqdRates(data);
  } catch (err) {
  } finally {
    isFetchingXeiqd = false;
  }
}

// =====================================================
// ٦. وەرگرتنی نرخی کڕینی تمەن بەجیا لە https://rudawindex.net
// =====================================================
function parseCleanPositiveNumber(val) {
  if (val === null || val === undefined) return null;
  const cleaned = normalizeDigits(String(val)).replace(/,/g, '').trim();
  const match = cleaned.match(/\d+(\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return !isNaN(num) && num > 0 ? num : null;
}

function searchJsonForTomanBuy(node) {
  if (!node || typeof node !== 'object') return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = searchJsonForTomanBuy(item);
      if (found) return found;
    }
    return null;
  }

  const labelFields = [
    node.name, node.title, node.currency, node.code, node.symbol,
    node.slug, node.name_ku, node.name_ar, node.name_en, node.label
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  const isTomanItem =
    labelFields.includes('IRR') ||
    labelFields.includes('IRT') ||
    labelFields.includes('TOMAN') ||
    labelFields.includes('TMN') ||
    labelFields.includes('تمەن') ||
    labelFields.includes('تومەن') ||
    labelFields.includes('ئێران') ||
    labelFields.includes('تومان');

  if (isTomanItem) {
    // تەنها نرخی کڕین (Buy) وەردەگیرێت نەک فرۆشتن
    const buyCandidate =
      node.buy ??
      node.buy_rate ??
      node.buying ??
      node.buyPrice ??
      node.buy_price ??
      node.krin ??
      node.kreen ??
      node.price_buy ??
      node.rate_buy ??
      node.bid ??
      node.rate ??
      node.value;

    const parsedBuy = parseCleanPositiveNumber(buyCandidate);
    if (parsedBuy && parsedBuy > 100) {
      const isDirectIqd = labelFields.includes('100,000') || labelFields.includes('IQD');
      return { buyRate: parsedBuy, basis: isDirectIqd ? 'IQD100K' : 'AUTO' };
    }
  }

  for (const key of Object.keys(node)) {
    const upperKey = key.toUpperCase();
    if (['IRR', 'IRT', 'TOMAN', 'TMN'].includes(upperKey)) {
      const sub = node[key];
      if (sub && typeof sub === 'object') {
        const buyCandidate = sub.buy ?? sub.buy_rate ?? sub.buying ?? sub.krin ?? sub.price_buy ?? sub.rate;
        const parsedBuy = parseCleanPositiveNumber(buyCandidate);
        if (parsedBuy && parsedBuy > 100) {
          return { buyRate: parsedBuy, basis: 'AUTO' };
        }
      }
    }
    const deep = searchJsonForTomanBuy(node[key]);
    if (deep) return deep;
  }

  return null;
}

function extractTomanBuyFromRudawContent(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return null;

  try {
    const maybeJson = JSON.parse(rawContent);
    const fromJson = searchJsonForTomanBuy(maybeJson);
    if (fromJson) return fromJson;
  } catch (e) {}

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawContent, 'text/html');

  const scripts = doc.querySelectorAll('script');
  for (const s of scripts) {
    const txt = s.textContent || '';
    if (txt.includes('IRR') || txt.includes('تمەن') || txt.includes('تومەن') || txt.includes('toman')) {
      try {
        const jsonVal = JSON.parse(txt);
        const found = searchJsonForTomanBuy(jsonVal);
        if (found) return found;
      } catch (e) {
        const regexBuy = normalizeDigits(txt).match(
          /(?:IRR|IRT|تمەن|تومەن|toman)[\s\S]{0,180}?(?:buy|krin|کڕین)["'\s:=]+([\d,]+(?:\.\d+)?)/i
        );
        if (regexBuy) {
          const val = parseCleanPositiveNumber(regexBuy[1]);
          if (val && val > 100) return { buyRate: val, basis: 'AUTO' };
        }
      }
    }
  }

  const tomanKeywords = ['تمەن', 'تومەن', 'ئێران', 'تومان', 'IRR', 'IRT', 'TOMAN'];
  const containsToman = (str) => {
    if (!str) return false;
    const up = str.toUpperCase();
    return tomanKeywords.some((k) => up.includes(k));
  };

  const tables = doc.querySelectorAll('table');
  for (const table of tables) {
    let buyColIndex = -1;
    const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td');
    headerCells.forEach((cell, idx) => {
      const hText = normalizeDigits(cell.textContent).trim();
      if (hText.includes('کڕین') || hText.includes('کرین') || /buy/i.test(hText)) {
        buyColIndex = idx;
      }
    });

    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
      const rowText = normalizeDigits(row.textContent);
      if (!containsToman(rowText)) continue;

      const cells = Array.from(row.querySelectorAll('td, th'));
      if (buyColIndex >= 0 && cells[buyColIndex]) {
        const cellNum = parseCleanPositiveNumber(cells[buyColIndex].textContent);
        if (cellNum && cellNum > 100 && cellNum !== 100) {
          return { buyRate: cellNum, basis: 'AUTO' };
        }
      }

      const numericCells = [];
      for (const c of cells) {
        const txt = normalizeDigits(c.textContent).replace(/100\s*\$|100,000/g, '').trim();
        const matches = txt.match(/\d[\d,.]*/g);
        if (matches) {
          for (const m of matches) {
            const n = parseCleanPositiveNumber(m);
            if (n && n > 100 && n !== 100 && n !== 1000 && n !== 100000) {
              numericCells.push(n);
            }
          }
        }
      }
      if (numericCells.length >= 1) {
        return { buyRate: numericCells[0], basis: 'AUTO' };
      }
    }
  }

  const candidateContainers = doc.querySelectorAll('tr, li, article, section, .card, .rate-item, .currency-item, div');
  for (const el of candidateContainers) {
    if (el.children.length > 15) continue;
    const text = normalizeDigits(el.textContent || '').trim();
    if (!containsToman(text) || text.length > 450) continue;

    const explicitBuyMatch = text.match(/(?:کڕین|کرین|Buy)[^\d]*([\d,]+(?:\.\d+)?)/i);
    if (explicitBuyMatch) {
      const val = parseCleanPositiveNumber(explicitBuyMatch[1]);
      if (val && val > 100 && val !== 100) {
        return { buyRate: val, basis: 'AUTO' };
      }
    }

    const stripped = text.replace(/100\s*\$|\$\s*100|100,000/g, ' ');
    const allNums = (stripped.match(/\d[\d,.]*/g) || [])
      .map((m) => parseCleanPositiveNumber(m))
      .filter((n) => n && n > 250 && n !== 1000 && n !== 100000);

    if (allNums.length >= 2) {
      return { buyRate: allNums[0], basis: 'AUTO' };
    }
  }

  const cleanFullText = normalizeDigits(rawContent);
  const lines = cleanFullText.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!containsToman(lines[i])) continue;
    const windowText = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 6)).join(' ');

    const buyLabeled = windowText.match(/(?:کڕین|کرین|Buy)[^\d]*([\d,]+(?:\.\d+)?)/i);
    if (buyLabeled) {
      const val = parseCleanPositiveNumber(buyLabeled[1]);
      if (val && val > 100 && val !== 100) {
        return { buyRate: val, basis: 'AUTO' };
      }
    }

    const strippedWindow = windowText.replace(/100\s*\$|\$\s*100|100,000/g, ' ');
    const nums = (strippedWindow.match(/\d[\d,.]*/g) || [])
      .map((m) => parseCleanPositiveNumber(m))
      .filter((n) => n && n > 250 && n !== 1000 && n !== 100000);

    if (nums.length >= 1) {
      return { buyRate: nums[0], basis: 'AUTO' };
    }
  }

  return null;
}

function applyRudawTomanRate(rudawObj) {
  if (!rudawObj || !rudawObj.buyRate || rudawObj.buyRate <= 0) return false;

  cachedRudawBuyObj = rudawObj;
  try {
    localStorage.setItem('cachedRudawBuyObj', JSON.stringify(rudawObj));
  } catch (e) {}

  const rawBuy = rudawObj.buyRate;
  const usdBase100 = state.baseRatePer100USD;
  let irrPer100k = state.otherRates.IRR;

  if (rudawObj.basis === 'IQD100K') {
    irrPer100k = rawBuy < 100000 ? Math.round(rawBuy * 1000) : Math.round(rawBuy);
  } else if (rawBuy >= 30000000) {
    const tomanPer100Usd = rawBuy / 10;
    irrPer100k = Math.round((100000 / usdBase100) * tomanPer100Usd);
  } else if (rawBuy >= 2500000) {
    irrPer100k = Math.round((100000 / usdBase100) * rawBuy);
  } else if (rawBuy >= 300000) {
    irrPer100k = Math.round((1000000 / usdBase100) * rawBuy);
  } else if (rawBuy >= 35000) {
    irrPer100k = Math.round((10000000 / usdBase100) * rawBuy);
  } else if (rawBuy >= 2500) {
    irrPer100k = Math.round((100000 / usdBase100) * (rawBuy * 1000));
  } else {
    irrPer100k = Math.round(rawBuy * 100000);
  }

  if (irrPer100k > 0) {
    state.otherRates.IRR = irrPer100k;
    localStorage.setItem('rate_IRR', irrPer100k);
    renderRateBanner(false);
    calculateAndRender();
    return true;
  }
  return false;
}

let isFetchingRudaw = false;
async function fetchTomanFromRudaw(force = false) {
  if (isFetchingRudaw && !force) return;
  isFetchingRudaw = true;

  const cacheBuster = Date.now();
  const targetUrl = `${RUDAW_INDEX_URL}/?t=${cacheBuster}`;

  const proxyEndpoints = [
    { url: `https://r.jina.ai/${RUDAW_INDEX_URL}?t=${cacheBuster}`, wrapped: false },
    { url: `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`, wrapped: false },
    { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`, wrapped: false },
    { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`, wrapped: false },
    { url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, wrapped: true },
    { url: `https://thingproxy.freeboard.io/fetch/${targetUrl}`, wrapped: false }
  ];

  try {
    const fetchAndExtract = async (ep) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(ep.url, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Bad response');

        let content = '';
        if (ep.wrapped) {
          const json = await res.json();
          content = json && json.contents ? json.contents : '';
        } else {
          content = await res.text();
        }

        const extracted = extractTomanBuyFromRudawContent(content);
        if (!extracted || !extracted.buyRate) {
          throw new Error('Toman buy rate not found');
        }
        return extracted;
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    };

    const rudawResult = await Promise.any(proxyEndpoints.map((ep) => fetchAndExtract(ep)));
    if (rudawResult) {
      applyRudawTomanRate(rudawResult);
    }
  } catch (err) {
  } finally {
    isFetchingRudaw = false;
  }
}

// =====================================================
// ٧. وەرگرتنی نرخی دۆلار و بەروار و کاتژمێر تەنها لە کەناڵی تێلێگرامی PMC
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
      const parsedTime = datetimeAttr ? new Date(datetimeAttr).getTime() : 0;

      if (parsedTime > 0 && !isNaN(parsedTime)) {
        return { rate, postTimestamp: parsedTime };
      }
    }
  }
  return null;
}

async function fetchViaSingleProxy(proxyConfig, targetUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

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
    }
    throw new Error('No valid PMC rate with timestamp found');
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

let isFetching = false;
async function fetchPublicChannelPMC(force = false) {
  if (isFetching && !force) return;
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
    }
  ];

  try {
    const fastestResult = await Promise.any(
      proxyList.map((proxy) => fetchViaSingleProxy(proxy, targetUrl))
    );

    if (fastestResult && fastestResult.rate && fastestResult.postTimestamp > 0) {
      if (
        fastestResult.postTimestamp !== state.pmcTimestamp ||
        fastestResult.rate !== state.baseRatePer100USD
      ) {
        updateLiveRateFromPMC(fastestResult.rate, fastestResult.postTimestamp);
      }
    }
  } catch (err) {
  } finally {
    isFetching = false;
  }
}

// دەستپێکردنی سەرەتایی بەرنامەکە
renderConverterLabels();
updateLiveRateFromPMC(state.baseRatePer100USD, state.pmcTimestamp);
fetchPublicChannelPMC();
fetchRatesFromXeiqd();
fetchTomanFromRudaw();

// نوێکردنەوەی خۆکار
setInterval(fetchPublicChannelPMC, 2500);
setInterval(fetchRatesFromXeiqd, 60000);
setInterval(fetchTomanFromRudaw, 45000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    fetchPublicChannelPMC();
    fetchRatesFromXeiqd();
    fetchTomanFromRudaw();
  }
});
// === کۆتایی فایلی script.js ===
