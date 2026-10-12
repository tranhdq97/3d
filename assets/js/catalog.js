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

const MODEL3D_TAB_ICON = `<svg class="tab-icon tab-icon-stroke" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 21 8v8l-9 5-9-5V8l9-5z"/><path d="M12 12 21 8M12 12v10M12 12 3 8"/></svg>`;

const YOUTUBE_TAB_ICON = `<svg class="tab-icon tab-icon-youtube" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;

function formatPrice(product) {
  if (product.priceDisplay) return product.priceDisplay;
  if (typeof product.price === 'number') {
    return `${product.price.toLocaleString('vi-VN')} đ`;
  }
  return '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function buildPhotoMarkup(product) {
  const src = product.media?.image;
  if (!src) return '<p class="category-empty" style="margin:0;border:none;background:transparent">Chưa có ảnh</p>';
  const alt = escapeHtml(product.media.imageAlt || product.title);
  return `<img src="${escapeHtml(assetUrl(src))}" alt="${alt}" loading="lazy" />`;
}

function buildVideoMarkup(product) {
  const video = product.media?.video;
  if (!video?.embedUrl) return null;
  const url = escapeHtml(video.embedUrl);
  const sep = url.includes('?') ? '&' : '?';
  return `<iframe src="${url}${sep}autoplay=1" allow="autoplay; encrypted-media" allowfullscreen title="Video ${escapeHtml(product.title)}"></iframe>`;
}

function buildModelMarkup(product) {
  const model = product.media?.model3d;
  if (!model?.src) return null;
  const src = escapeHtml(assetUrl(model.src));
  const alt = escapeHtml(model.alt || product.title);
  return `<model-viewer src="${src}" alt="${alt}" auto-rotate camera-controls shadow-intensity="1"></model-viewer>`;
}

function renderSpecsCompact(specs) {
  if (!specs?.length) return '';
  const top = specs.slice(0, 2);
  const items = top
    .map((s) => `<li>${escapeHtml(s.label)}: <strong>${escapeHtml(s.value)}</strong></li>`)
    .join('');
  return `<ul class="specs-compact">${items}</ul>`;
}

function renderProductCard(product, contact) {
  const cardId = `product-${product.id}`;
  const hasVideo = Boolean(product.media?.video?.embedUrl);
  const has3d = Boolean(product.media?.model3d?.src);
  const zaloUrl = escapeHtml(contact.zaloUrl || '#');

  return `
    <article class="product-card" id="${escapeHtml(cardId)}" data-product-id="${escapeHtml(product.id)}">
      <div class="media-section">
        <div class="media-canvas">
          <div class="media-viewport" data-viewport></div>
          <div class="media-tabs" role="tablist" aria-label="Loại media">
            <button type="button" class="tab-btn active" data-tab="photo" role="tab" aria-label="Ảnh">${PHOTO_TAB_ICON}</button>
            <button type="button" class="tab-btn" data-tab="model3d" role="tab" aria-label="Xem 3D" ${has3d ? '' : 'disabled'}>${MODEL3D_TAB_ICON}</button>
            <button type="button" class="tab-btn tab-btn-youtube" data-tab="video" role="tab" aria-label="YouTube" ${hasVideo ? '' : 'disabled'}>${YOUTUBE_TAB_ICON}</button>
          </div>
        </div>
      </div>
      <div class="details-section">
        <h3 class="product-title">${escapeHtml(product.title)}</h3>
        <div class="price-tag">${escapeHtml(formatPrice(product))}</div>
        <p class="description">${escapeHtml(product.description)}</p>
        ${renderSpecsCompact(product.specs)}
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

function initProductCard(card, product) {
  const viewport = card.querySelector('[data-viewport]');
  const tabs = card.querySelectorAll('.tab-btn[data-tab]');

  function setTab(active) {
    tabs.forEach((btn) => {
      const isActive = btn.dataset.tab === active;
      btn.classList.toggle('active', isActive);
    });

    viewport.classList.toggle('is-video', active === 'video');

    if (active === 'photo') {
      viewport.innerHTML = buildPhotoMarkup(product);
      return;
    }
    if (active === 'video') {
      const html = buildVideoMarkup(product);
      viewport.innerHTML = html || buildPhotoMarkup(product);
      return;
    }
    if (active === 'model3d') {
      const html = buildModelMarkup(product);
      viewport.innerHTML = html || buildPhotoMarkup(product);
    }
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
