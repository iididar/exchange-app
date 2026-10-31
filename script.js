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
// ٣. سیستمی حاسیبە و ڕێکخستنەکان
// =====================================================
const TARGET_CHANNEL = 'PMCgroup';
const KURDISH_DAYS = [
  'یەک شەممە',
  'دوو شەممە',
  'سێ شەممە',
  'چوار شەممە',
  'پێنج شەممە',
  'هەینی',
  'شەممە'
];

const savedDarkPref = localStorage.getItem('darkMode');
const initialDarkMode = savedDarkPref !== null ? savedDarkPref === 'true' : true;

const state = {
  baseRatePer100USD: Number(localStorage.getItem('savedRate')) || 168150,
  lastTimestamp: Number(localStorage.getItem('savedTime')) || Date.now(),
  isTopUSD: true,
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
const liveRateBannerEl = document.getElementById('liveRateBanner');
const dateDisplayEl = document.getElementById('dateDisplay');
const timeDisplayEl = document.getElementById('timeDisplay');
const swapBtn = document.getElementById('swapBtn');
const keypad = document.getElementById('keypad');

const hamburgerBtn = document.getElementById('hamburgerBtn');
const menuBackdrop = document.getElementById('menuBackdrop');
const menuCloseBtn = document.getElementById('menuCloseBtn');
const discountToggle = document.getElementById('discountToggle');
const darkModeToggle = document.getElementById('darkModeToggle');

// جێگیرکردنی دۆخی سەرەتایی دوگمەکان (ڕاست = کوژاوە، چەپ = کارا)
discountToggle.checked = state.minus1000Active;
darkModeToggle.checked = state.isDarkMode;
if (!state.isDarkMode) {
  document.body.classList.add('light-mode');
}

function getEffectiveRate() {
  return state.minus1000Active ? (state.baseRatePer100USD - 1000) : state.baseRatePer100USD;
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
  return str.replace(/[٠-٩]/g, d => arabicNumbers.indexOf(d));
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

function renderRateBanner(animate = false) {
  const effectiveRate = getEffectiveRate();
  liveRateBannerEl.textContent = `$100 = ${formatNumber(effectiveRate.toString(), 0)} IQD`;

  if (animate) {
    liveRateBannerEl.classList.add('pulse');
    setTimeout(() => liveRateBannerEl.classList.remove('pulse'), 300);
  }
}

function calculateAndRender() {
  topAmountEl.textContent = formatNumber(state.rawInput, 4);
  const inputValue = parseFloat(state.rawInput);
  if (isNaN(inputValue) || inputValue === 0) {
    bottomAmountEl.textContent = '0';
    return;
  }

  const activeRate = getEffectiveRate();
  let result = 0;
  if (state.isTopUSD) {
    result = (inputValue * activeRate) / 100;
    bottomAmountEl.textContent = formatNumber(Math.round(result).toString(), 0);
  } else {
    result = (inputValue / activeRate) * 100;
    const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
    bottomAmountEl.textContent = formatNumber(formattedResult, 2);
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

function handleKeyPress(key) {
  if (key === 'BACKSPACE') {
    state.rawInput = state.rawInput.length > 1 ? state.rawInput.slice(0, -1) : '0';
  } else if (key === '.') {
    if (!state.rawInput.includes('.')) state.rawInput += '.';
  } else {
    if (state.rawInput.replace('.', '').length >= 12) return;
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
  state.isTopUSD = !state.isTopUSD;
  state.rawInput = '0';
  if (state.isTopUSD) {
    topNameEl.textContent = 'دۆلار';
    topSymbolEl.textContent = '$';
    bottomNameEl.textContent = 'دینار';
    bottomSymbolEl.textContent = 'IQD';
  } else {
    topNameEl.textContent = 'دینار';
    topSymbolEl.textContent = 'IQD';
    bottomNameEl.textContent = 'دۆلار';
    bottomSymbolEl.textContent = '$';
  }
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
// ٤. سیستمی ٦ پڕۆکسی هاوکات (Ultra-Fast Parallel Racing)
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

updateLiveRate(state.baseRatePer100USD, state.lastTimestamp);
fetchPublicChannelPMC();
setInterval(fetchPublicChannelPMC, 2500);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    fetchPublicChannelPMC();
  }
});
