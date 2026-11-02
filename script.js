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
const XEIOD_API_URL = 'https://xeiqd.com/rates.json';

const KURDISH_DAYS = [
  'یەک شەممە',
  'دوو شەممە',
  'سێ شەممە',
  'چوار شەممە',
  'پێنج شەممە',
  'هەینی',
  'شەممە'
];

// زانیارییەکانی هەر ٥ دراوەکە
const CURRENCY_META = {
  USD: { title: 'نرخی دۆلار', name: 'دۆلار', symbol: '$' },
  GBP: { title: 'نرخی پاوەند', name: 'پاوەند', symbol: '£' },
  EUR: { title: 'نرخی یۆرۆ', name: 'یۆرۆ', symbol: '€' },
  TRY: { title: 'نرخی لیرەی تورکی', name: 'لیرەی تورکی', symbol: 'TRY' },
  IRR: { title: 'نرخی تمەنی ئێرانی', name: 'تمەنی ئێرانی', symbol: 'تمەن' }
};

const savedDarkPref = localStorage.getItem('darkMode');
const initialDarkMode = savedDarkPref !== null ? savedDarkPref === 'true' : true;

const state = {
  // هەمیشە لە کاتی کردنەوەی وێبسایتەکەدا ڕاستەوخۆ دۆلار هەڵبژێردراوە
  selectedCurrency: 'USD',
  baseRatePer100USD: Number(localStorage.getItem('savedRate')) || 168000,
  otherRates: {
    GBP: Number(localStorage.getItem('rate_GBP')) || 225000,   // نرخی ١٠٠ پاوەند بە دینار
    EUR: Number(localStorage.getItem('rate_EUR')) || 185000,   // نرخی ١٠٠ یۆرۆ بە دینار
    TRY: Number(localStorage.getItem('rate_TRY')) || 33682,    // نرخی ١٠٠٠ لیرە بە دینار
    IRR: Number(localStorage.getItem('rate_IRR')) || 59435364  // نرخی ١٠٠,٠٠٠ دینار بە تمەن
  },
  lastTimestamp: Number(localStorage.getItem('savedTime')) || Date.now(),
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

// جێگیرکردنی دۆخی سەرەتایی دوگمەکان
discountToggle.checked = state.minus1000Active;
darkModeToggle.checked = state.isDarkMode;
if (!state.isDarkMode) {
  document.body.classList.add('light-mode');
}

function getEffectiveUsdRate() {
  return state.minus1000Active ? (state.baseRatePer100USD - 1000) : state.baseRatePer100USD;
}

// فۆرماتکردنی ژمارە بەبێ کێشەی ژمارەی زۆر گەورە (بەتایبەت بۆ تمەن)
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

// نوێکردنەوەی ناونیشان و بانەری نرخ بەپێی دراوی هەڵبژێردراو
function renderRateBanner(animate = false) {
  const curr = state.selectedCurrency;
  const meta = CURRENCY_META[curr];
  rateTitleEl.textContent = meta.title;

  if (curr === 'USD') {
    const effectiveUsd = getEffectiveUsdRate();
    liveRateBannerEl.textContent = `100$ \u200E=\u200E ${formatRoundedInteger(effectiveUsd)} دینار`;
  } else if (curr === 'GBP') {
    liveRateBannerEl.textContent = `100£ \u200E=\u200E ${formatRoundedInteger(state.otherRates.GBP)} دینار`;
  } else if (curr === 'EUR') {
    liveRateBannerEl.textContent = `100€ \u200E=\u200E ${formatRoundedInteger(state.otherRates.EUR)} دینار`;
  } else if (curr === 'TRY') {
    liveRateBannerEl.textContent = `1000 لیرە \u200E=\u200E ${formatRoundedInteger(state.otherRates.TRY)} دینار`;
  } else if (curr === 'IRR') {
    liveRateBannerEl.textContent = `100,000 دینار \u200E=\u200E ${formatRoundedInteger(state.otherRates.IRR)} تمەن`;
  }

  if (animate) {
    liveRateBannerEl.classList.add('pulse');
    setTimeout(() => liveRateBannerEl.classList.remove('pulse'), 300);
  }
}

// نوێکردنەوەی ناوی دراوەکان لەسەر هەردوو کارتی حاسیبەکە
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

// هەژمارکردنی ورد بۆ هەر ٥ دراوەکە
function calculateAndRender() {
  topAmountEl.textContent = formatNumber(state.rawInput, 4);
  topAmountEl.scrollLeft = topAmountEl.scrollWidth;

  const inputValue = parseFloat(state.rawInput);
  if (isNaN(inputValue) || inputValue === 0) {
    bottomAmountEl.textContent = '0';
    return;
  }

  const curr = state.selectedCurrency;
  let result = 0;

  if (curr === 'USD') {
    const rate = getEffectiveUsdRate();
    if (state.isTopForeign) {
      result = (inputValue * rate) / 100;
      bottomAmountEl.textContent = formatRoundedInteger(result);
    } else {
      result = (inputValue / rate) * 100;
      const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
      bottomAmountEl.textContent = formatNumber(formatted, 2);
    }
  } else if (curr === 'GBP' || curr === 'EUR') {
    const rate = state.otherRates[curr];
    if (state.isTopForeign) {
      result = (inputValue * rate) / 100;
      bottomAmountEl.textContent = formatRoundedInteger(result);
    } else {
      result = (inputValue / rate) * 100;
      const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
      bottomAmountEl.textContent = formatNumber(formatted, 2);
    }
  } else if (curr === 'TRY') {
    const ratePer1000 = state.otherRates.TRY;
    if (state.isTopForeign) {
      // لیرە بۆ دینار (١٠٠٠ لیرە جێگیرە)
      result = (inputValue * ratePer1000) / 1000;
      bottomAmountEl.textContent = formatRoundedInteger(result);
    } else {
      // دینار بۆ لیرە
      result = (inputValue / ratePer1000) * 1000;
      const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
      bottomAmountEl.textContent = formatNumber(formatted, 2);
    }
  } else if (curr === 'IRR') {
    const tomanPer100kIQD = state.otherRates.IRR;
    if (state.isTopForeign) {
      // تمەن بۆ دینار
      result = (inputValue / tomanPer100kIQD) * 100000;
      bottomAmountEl.textContent = formatRoundedInteger(result);
    } else {
      // دینار بۆ تمەن (١٠٠,٠٠٠ دینار جێگیرە)
      result = (inputValue * tomanPer100kIQD) / 100000;
      bottomAmountEl.textContent = formatRoundedInteger(result);
    }
  }

  bottomAmountEl.scrollLeft = bottomAmountEl.scrollWidth;
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

// هەڵبژاردنی دراوەکان لەناو مێنۆی Hamburger
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

    // داخستنی نەرمی مێنۆکە دوای هەڵبژاردن
    setTimeout(() => {
      menuBackdrop.classList.remove('open');
    }, 140);
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

// دوگمەی Refresh لە تەنیشت Hamburger
refreshBtn.addEventListener('click', async () => {
  refreshBtn.classList.add('spinning');
  await Promise.allSettled([
    fetchPublicChannelPMC(true),
    fetchRatesFromXeiqd(true)
  ]);
  renderRateBanner(true);
  setTimeout(() => {
    refreshBtn.classList.remove('spinning');
  }, 600);
});

function handleKeyPress(key) {
  // تەنها بۆ تمەن تا ١٨ ژمارە ڕێگەپێدراوە (زیاتر لە ١٤ ژمارە)، بۆ ئەوانی تر ١٢ ژمارە
  const maxAllowedDigits = state.selectedCurrency === 'IRR' ? 18 : 12;

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
// ٤. وەرگرتنی نرخی (پاوەند، یۆرۆ، لیرە، تمەن) لە xeiqd.com/rates.json
// =====================================================
function extractNumericRate(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  const sources = [obj.rates, obj.data, obj.currencies, obj];

  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    for (const k of Object.keys(src)) {
      if (keys.includes(k.toUpperCase())) {
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
  if (!jsonData) return false;

  const rawGBP = extractNumericRate(jsonData, ['GBP', 'POUND']);
  const rawEUR = extractNumericRate(jsonData, ['EUR', 'EURO']);
  const rawTRY = extractNumericRate(jsonData, ['TRY', 'TRL', 'LIRA']);
  const rawIRR = extractNumericRate(jsonData, ['IRR', 'IRT', 'TOMAN', 'TMN']);

  const usdBase100 = state.baseRatePer100USD; // نرخی ١٠٠ دۆلار لە تێلێگرامەوە
  const isUsdRelativeJson = rawGBP !== null && rawGBP < 10;
  let updated = false;

  // ١. پاوەند (نرخی ١٠٠ پاوەند بە دینار)
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

  // ٢. یۆرۆ (نرخی ١٠٠ یۆرۆ بە دینار)
  if (rawEUR) {
    let eur100 = state.otherRates.EUR;
    if (rawEUR > 50000) {
      eur100 = Math.round(rawEUR);
    } else if (rawEUR > 500) {
      eur100 = Math.round(rawEUR * 100);
    } else if (rawEUR > 50) {
      eur100 = Math.round((rawEUR / 100) * usdBase100);
    } else if (rawGBP && rawGBP < 1) {
      // کاتێک نرخەکان بەرامبەر ١ دۆلارن
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

  // ٣. لیرەی تورکی (نرخی ١٠٠٠ لیرە بە دینار)
  if (rawTRY) {
    let try1000 = state.otherRates.TRY;
    if (rawTRY > 10000) {
      try1000 = Math.round(rawTRY);
    } else if (rawTRY > 500) {
      try1000 = Math.round(rawTRY * 10);
    } else if (isUsdRelativeJson) {
      // گۆڕینی نرخی ١ دۆلار بەرامبەر لیرە بۆ نرخی ١٠٠٠ لیرە بە دینار
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

  // ٤. تمەنی ئێرانی (نرخی ١٠٠,٠٠٠ دینار بە تمەن)
  if (rawIRR) {
    let irrPer100k = state.otherRates.IRR;
    if (!isUsdRelativeJson && rawIRR > 5000000) {
      irrPer100k = Math.round(rawIRR);
    } else if (isUsdRelativeJson) {
      // ١٠٠,٠٠٠ دینار چەند دۆلارە * نرخی تمەن بۆ هەر دۆلارێک
      irrPer100k = Math.round((10000000 / usdBase100) * rawIRR);
    } else if (rawIRR < 10000) {
      irrPer100k = Math.round(rawIRR * 100000);
    } else {
      irrPer100k = Math.round((10000000 / usdBase100) * rawIRR);
    }
    if (irrPer100k > 0) {
      state.otherRates.IRR = irrPer100k;
      localStorage.setItem('rate_IRR', irrPer100k);
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
    urlWithCache,
    `https://corsproxy.io/?url=${encodeURIComponent(urlWithCache)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(urlWithCache)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(urlWithCache)}`
  ];

  try {
    const fetchJson = async (endpoint) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(endpoint, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Bad status');
        const data = await res.json();
        if (!data) throw new Error('Empty JSON');
        return data;
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    };

    const data = await Promise.any(endpoints.map(ep => fetchJson(ep)));
    applyXeiqdRates(data);
  } catch (err) {
    // ئەگەر ئینتەرنێت نەبوو، نرخە پاشەکەوتکراوەکان بەکاردەهێنێت
  } finally {
    isFetchingXeiqd = false;
  }
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

// دەستپێکردنی سەرەتایی بەرنامەکە
renderConverterLabels();
updateLiveRate(state.baseRatePer100USD, state.lastTimestamp);
fetchPublicChannelPMC();
fetchRatesFromXeiqd();

// نوێکردنەوەی خۆکار
setInterval(fetchPublicChannelPMC, 2500);
setInterval(fetchRatesFromXeiqd, 60000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    fetchPublicChannelPMC();
    fetchRatesFromXeiqd();
  }
});
