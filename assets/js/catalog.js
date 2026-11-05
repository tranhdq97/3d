function catalogBase() {
  return window.__CATALOG_ASSET_BASE__ || '/';
}

function assetUrl(relative) {
  if (!relative) return '';
  if (/^https?:\/\//i.test(relative)) return relative;
  return catalogBase() + String(relative).replace(/^\//, '');
}

const CATALOG_URL = assetUrl('data/catalog.json');

const PHOTO_TAB_ICON = `<svg class="tab-icon tab-icon-stroke" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.75" cy="10.25" r="1.75" fill="currentColor" stroke="none"/><path d="M21 16.25 14.5 10.5a1.1 1.1 0 0 0-1.45-.02L3 17.5"/></svg>`;

const YOUTUBE_TAB_ICON = `<svg class="tab-icon tab-icon-youtube" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;

function getProductColors(product) {
  const colors = product.media?.colors;
  if (Array.isArray(colors) && colors.length) return colors;
  if (product.media?.image) {
    return [{ id: 'default', name: '', hex: null, image: product.media.image }];
  }
  return [];
}

function getDefaultColorId(product) {
  const colors = getProductColors(product);
  const preferred = product.media?.defaultColor;
  if (preferred && colors.some((c) => c.id === preferred)) return preferred;
  return colors[0]?.id || null;
}

function findColorById(product, colorId) {
  return getProductColors(product).find((c) => c.id === colorId) || null;
}

function getColorImage(color) {
  if (!color) return null;
  if (color.image) return color.image;
  if (Array.isArray(color.images) && color.images[0]) return color.images[0];
  return null;
}

function productPrimaryImage(product) {
  const color = findColorById(product, getDefaultColorId(product));
  const src = getColorImage(color);
  if (src) return src;
  return product.media?.image || null;
}

function sanitizeHex(hex) {
  if (!hex || typeof hex !== 'string') return '#cccccc';
  const t = hex.trim();
  if (/^#[0-9A-Fa-f]{3,8}$/.test(t)) return t;
  return '#cccccc';
}

function mediaLabel(product) {
  return product.title || '';
}

function formatPrice(product) {
  if (typeof product.price === 'number') {
    return `${product.price.toLocaleString('vi-VN')} đ`;
  }
  return '';
}

function hasYoutubeVideo(product) {
  return Boolean(product.media?.video?.embedUrl);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function buildPhotoMarkup(product, imageSrc) {
  const src = imageSrc || productPrimaryImage(product);
  const label = escapeHtml(mediaLabel(product));
  if (!src) {
    return buildMediaFallbackMarkup(product);
  }
  const alt = label;
  return `<img src="${escapeHtml(assetUrl(src))}" alt="${alt}" loading="lazy" />`;
}

function renderColorSwatches(product) {
  const colors = getProductColors(product);
  if (!colors.length) return '';

  const defaultId = getDefaultColorId(product);
  const buttons = colors
    .map((c) => {
      const name = escapeHtml(c.name || c.id);
      const hex = sanitizeHex(c.hex);
      const selected = c.id === defaultId;
      return `<button type="button" class="color-swatch" role="option" data-color-id="${escapeHtml(c.id)}" aria-label="${name}" aria-selected="${selected ? 'true' : 'false'}" style="--swatch:${escapeHtml(hex)}" title="${name}"></button>`;
    })
    .join('');

  return `<div class="color-swatches" role="listbox" aria-label="Chọn màu" data-color-swatches>${buttons}</div>`;
}

function buildVideoMarkup(product) {
  const video = product.media?.video;
  if (!video?.embedUrl) return null;
  const url = escapeHtml(video.embedUrl);
  const sep = url.includes('?') ? '&' : '?';
  const title = escapeHtml(`Video — ${mediaLabel(product)}`);
  return `<iframe src="${url}${sep}autoplay=1" allow="autoplay; encrypted-media" allowfullscreen title="${title}"></iframe>`;
}

function renderMediaTabs(product) {
  if (!hasYoutubeVideo(product)) return '';
  return `
          <div class="media-tabs" role="tablist" aria-label="Loại media">
            <button type="button" class="tab-btn active" data-tab="photo" role="tab" aria-label="Ảnh">${PHOTO_TAB_ICON}</button>
            <button type="button" class="tab-btn tab-btn-youtube" data-tab="video" role="tab" aria-label="YouTube">${YOUTUBE_TAB_ICON}</button>
          </div>`;
}

function renderIncludes(product) {
  const items = product.includes;
  if (!Array.isArray(items) || !items.length) return '';
  const list = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const note = product.includesNote
    ? `<p class="includes-note">${escapeHtml(product.includesNote)}</p>`
    : '';
  return `
        <div class="includes-block">
          <p class="includes-heading">Sản phẩm bao gồm</p>
          <ul class="includes-list">${list}</ul>
          ${note}
        </div>`;
}

function renderSpecsCompact(specs) {
  if (!specs?.length) return '';
  const top = specs.slice(0, 2);
  const items = top
    .map(
      (s) => `<li>${escapeHtml(s.label)}: <strong>${escapeHtml(s.value)}</strong></li>`
    )
    .join('');
  return `<ul class="specs-compact">${items}</ul>`;
}

function renderProductCard(product, contact) {
  const cardId = `product-${product.id}`;
  const zaloUrl = escapeHtml(contact.zaloUrl || '#');
  const priceHtml = formatPrice(product);

  return `
    <article class="product-card" id="${escapeHtml(cardId)}" data-product-id="${escapeHtml(product.id)}">
      <div class="media-section">
        <div class="media-canvas" data-media-canvas>
          <div class="media-viewport" data-viewport></div>
          ${renderColorSwatches(product)}
          ${renderMediaTabs(product)}
        </div>
      </div>
      <div class="details-section">
        <h3 class="product-title">${escapeHtml(product.title)}</h3>
        ${priceHtml ? `<div class="price-tag">${escapeHtml(priceHtml)}</div>` : ''}
        <p class="description">${escapeHtml(product.description)}</p>
        ${renderSpecsCompact(product.specs)}
        ${renderIncludes(product)}
        <p class="color-selected-label" data-color-label hidden></p>
        <a href="${zaloUrl}" target="_blank" rel="noopener noreferrer" class="btn-zalo">💬 Zalo</a>
      </div>
    </article>
  `;
}

function renderCategorySection(category, contact) {
  const sectionId = `category-${category.id}`;
  const productsHtml = category.products?.length
    ? category.products.map((p) => renderProductCard(p, contact)).join('')
    : '<p class="category-empty">Chưa có sản phẩm trong danh mục này. Thêm object vào <code>products</code> trong file JSON.</p>';

  return `
    <section class="category-section" id="${escapeHtml(sectionId)}" data-category-id="${escapeHtml(category.id)}">
      <header class="category-heading">
        <div class="category-heading-text">
          <h2>${escapeHtml(category.name)}</h2>
          ${category.description ? `<p>${escapeHtml(category.description)}</p>` : ''}
        </div>
        ${category.products?.length > 1 ? '<span class="category-scroll-hint">Vuốt ngang</span>' : ''}
      </header>
      <div class="product-track" tabindex="0" aria-label="Cuộn ngang xem sản phẩm">${productsHtml}</div>
    </section>
  `;
}

function buildMediaFallbackMarkup(product) {
  const label = escapeHtml(mediaLabel(product) || 'Sản phẩm');
  return `<div class="media-fallback"><span>${label}</span></div>`;
}

function bindPhotoFallback(viewport, product) {
  const img = viewport.querySelector('img');
  if (!img) return;
  img.addEventListener(
    'error',
    () => {
      viewport.innerHTML = buildMediaFallbackMarkup(product);
    },
    { once: true }
  );
}

function initProductCard(card, product) {
  const canvas = card.querySelector('[data-media-canvas]');
  const viewport = card.querySelector('[data-viewport]');
  const tabs = card.querySelectorAll('.tab-btn[data-tab]');
  const swatchesHost = card.querySelector('[data-color-swatches]');
  const colorLabel = card.querySelector('[data-color-label]');

  let selectedColorId = getDefaultColorId(product);

  function updateColorLabel() {
    if (!colorLabel) return;
    const colors = getProductColors(product);
    if (colors.length < 2 && !colors[0]?.name) {
      colorLabel.hidden = true;
      return;
    }
    const color = findColorById(product, selectedColorId);
    const name = color?.name || color?.id;
    if (!name) {
      colorLabel.hidden = true;
      return;
    }
    colorLabel.hidden = false;
    colorLabel.textContent = `Màu: ${name}`;
  }

  function syncSwatches() {
    if (!swatchesHost) return;
    swatchesHost.querySelectorAll('.color-swatch').forEach((btn) => {
      const on = btn.dataset.colorId === selectedColorId;
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function currentPhotoSrc() {
    const color = findColorById(product, selectedColorId);
    return getColorImage(color) || productPrimaryImage(product);
  }

  function showPhoto() {
    viewport.classList.remove('is-video');
    if (canvas) canvas.classList.remove('is-video-mode');
    viewport.innerHTML = buildPhotoMarkup(product, currentPhotoSrc());
    bindPhotoFallback(viewport, product);
    syncSwatches();
    updateColorLabel();
  }

  function setTab(active) {
    tabs.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === active);
    });

    const isVideo = active === 'video';
    viewport.classList.toggle('is-video', isVideo);
    if (canvas) canvas.classList.toggle('is-video-mode', isVideo);

    if (isVideo) {
      const html = buildVideoMarkup(product);
      viewport.innerHTML = html || buildPhotoMarkup(product, currentPhotoSrc());
      if (!html) bindPhotoFallback(viewport, product);
      return;
    }
    showPhoto();
  }

  if (swatchesHost) {
    swatchesHost.querySelectorAll('.color-swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedColorId = btn.dataset.colorId;
        const photoTab = card.querySelector('.tab-btn[data-tab="photo"]');
        if (photoTab && !photoTab.classList.contains('active')) {
          setTab('photo');
          return;
        }
        showPhoto();
      });
    });
  }

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      setTab(btn.dataset.tab);
    });
  });

  setTab('photo');
}

function initCategoryNav(categories) {
  const pills = document.querySelectorAll('.category-pill');
  const sections = categories.map((c) => document.getElementById(`category-${c.id}`)).filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.dataset.categoryId;
        pills.forEach((pill) => {
          pill.classList.toggle('is-active', pill.dataset.category === id);
        });
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

function initRevealCards() {
  const cards = document.querySelectorAll('.product-card');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  cards.forEach((card) => observer.observe(card));
}

function findProductById(catalog, productId) {
  for (const category of catalog.categories) {
    const product = category.products?.find((p) => p.id === productId);
    if (product) return product;
  }
  return null;
}

function phoneTel(display) {
  if (!display) return '';
  const digits = String(display).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `tel:+84${digits.slice(1)}`;
  return `tel:+${digits}`;
}

function renderSiteFooter(site) {
  const contact = site.contact || {};
  const brand = document.getElementById('footer-brand');
  const tagline = document.getElementById('footer-tagline');
  const phone = document.getElementById('footer-phone');
  const zalo = document.getElementById('footer-zalo');

  if (brand) brand.textContent = site.title || brand.textContent;
  if (tagline) tagline.textContent = site.subtitle || '';

  if (phone && contact.phoneDisplay) {
    const tel = phoneTel(contact.phoneDisplay);
    phone.innerHTML = tel
      ? `📞 <a href="${escapeHtml(tel)}">${escapeHtml(contact.phoneDisplay)}</a>`
      : escapeHtml(contact.phoneDisplay);
  }

  if (zalo && contact.zaloUrl) {
    zalo.href = contact.zaloUrl;
    zalo.textContent = contact.ctaLabel || 'Liên hệ Zalo';
  }
}

function renderCatalog(catalog) {
  const root = document.getElementById('catalog-root');
  const site = catalog.site || {};
  const contact = site.contact || {};

  document.title = site.title ? `${site.title} - Sản Phẩm In 3D` : document.title;

  const titleEl = document.getElementById('site-title');
  const subtitleEl = document.getElementById('site-subtitle');
  if (titleEl) titleEl.textContent = site.title || '';
  if (subtitleEl) subtitleEl.textContent = site.subtitle || '';

  const navItems = (catalog.categories || [])
    .map(
      (c) =>
        `<a class="category-pill" href="#category-${escapeHtml(c.id)}" data-category="${escapeHtml(c.id)}">${escapeHtml(c.name)}</a>`
    )
    .join('');

  const navEl = document.getElementById('category-nav-inner');
  if (navEl) navEl.innerHTML = navItems;

  const sectionsHtml = (catalog.categories || [])
    .map((c) => renderCategorySection(c, contact))
    .join('');

  root.innerHTML = sectionsHtml;

  document.querySelectorAll('.product-card').forEach((card) => {
    const productId = card.dataset.productId;
    const product = findProductById(catalog, productId);
    if (product) initProductCard(card, product);
  });

  initCategoryNav(catalog.categories || []);
  initRevealCards();
  initPinnedCategoryBar();
  focusProductFromHash();
  renderSiteFooter(site);
}

function focusProductFromHash() {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#product-')) return;

  const card = document.querySelector(hash);
  if (!card) return;

  const run = () => {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('product-card--focus');
    window.setTimeout(() => card.classList.remove('product-card--focus'), 3500);
  };

  window.requestAnimationFrame(() => {
    window.setTimeout(run, 280);
  });
}

function initPinnedCategoryBar() {
  const intro = document.getElementById('site-intro');
  const bar = document.getElementById('site-bar');
  if (!intro || !bar) return;

  const setPinned = (pinned) => {
    bar.classList.toggle('is-pinned', pinned);
    document.body.classList.toggle('has-pinned-bar', pinned);
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      setPinned(!entry.isIntersecting);
    },
    { root: null, threshold: 0, rootMargin: '0px 0px -8px 0px' }
  );

  observer.observe(intro);
  setPinned(intro.getBoundingClientRect().bottom < 0);
}

function showLoadError(message) {
  const root = document.getElementById('catalog-root');
  root.innerHTML = `
    <div class="catalog-error">
      <strong>Không tải được danh mục</strong>
      <p>${escapeHtml(message)}</p>
      <code>${escapeHtml(CATALOG_URL)}</code>
      <p style="margin-top:12px;font-size:14px;color:#64748b">Local: <code>npx serve .</code> — GitHub Pages: đợi 1–2 phút sau push, hard refresh (Cmd+Shift+R).</p>
    </div>
  `;
}

async function loadCatalog() {
  try {
    const res = await fetch(CATALOG_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${CATALOG_URL}`);
    const catalog = await res.json();
    renderCatalog(catalog);
  } catch (err) {
    showLoadError(err.message || 'Lỗi không xác định');
  }
}

loadCatalog();
