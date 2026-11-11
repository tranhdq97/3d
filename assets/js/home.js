function catalogBase() {
  return window.__CATALOG_ASSET_BASE__ || '/';
}

function assetUrl(relative) {
  if (!relative) return '';
  if (/^https?:\/\//i.test(relative)) return relative;
  return catalogBase() + String(relative).replace(/^\//, '');
}

function catalogPageUrl(productId) {
  const base = catalogBase();
  const hash = productId ? `#product-${productId}` : '';
  return `${base}catalog.html${hash}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function formatPrice(price) {
  if (typeof price === 'number') return `${price.toLocaleString('vi-VN')} đ`;
  return '';
}

function phoneTel(display) {
  if (!display) return '';
  const digits = String(display).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `tel:+84${digits.slice(1)}`;
  return `tel:+${digits}`;
}

function productPrimaryImage(product) {
  const colors = product.media?.colors;
  if (Array.isArray(colors) && colors.length) {
    const def = product.media?.defaultColor;
    const color = colors.find((c) => c.id === def) || colors[0];
    if (color?.image) return color.image;
    if (Array.isArray(color?.images) && color.images[0]) return color.images[0];
  }
  return product.media?.image || null;
}

function renderShowcaseTile(product, categoryName, options = {}) {
  const { featured = false, index = 0 } = options;
  const img = productPrimaryImage(product);
  const alt = escapeHtml(product.title || '');
  const src = img ? escapeHtml(assetUrl(img)) : '';
  const href = escapeHtml(catalogPageUrl(product.id));
  const price = formatPrice(product.price);
  const delay = Math.min(index, 5);
  const classes = ['showcase-tile', featured ? 'showcase-tile--feature' : ''].filter(Boolean).join(' ');

  return `
    <a class="${classes}" href="${href}" data-reveal style="--reveal-delay:${delay * 70}ms">
      <div class="showcase-media">
        ${src ? `<img src="${src}" alt="${alt}" loading="lazy" />` : '<div class="showcase-placeholder"></div>'}
        <div class="showcase-shine" aria-hidden="true"></div>
      </div>
      <div class="showcase-body">
        ${categoryName ? `<span class="showcase-category">${escapeHtml(categoryName)}</span>` : ''}
        <h3 class="showcase-title">${escapeHtml(product.title)}</h3>
        ${price ? `<span class="showcase-price">${escapeHtml(price)}</span>` : ''}
        <span class="showcase-cta">Chi tiết &amp; đặt hàng <span aria-hidden="true">→</span></span>
      </div>
    </a>
  `;
}

function renderCustomPrint(site) {
  const svc = site.customPrint;
  const section = document.getElementById('home-custom-print');
  const root = document.getElementById('home-custom-print-root');
  if (!svc?.enabled || !section || !root) {
    if (section) section.hidden = true;
    return;
  }

  section.hidden = false;
  const highlights = (svc.highlights || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');
  const zalo = site.contact?.zaloUrl || '#';
  const cta = svc.ctaLabel || site.contact?.ctaLabel || 'Liên hệ Zalo';
  const catalogHref = escapeHtml(catalogPageUrl());

  root.innerHTML = `
    <div class="home-custom-print-card">
      <div class="home-custom-print-copy">
        <p class="home-custom-print-badge">${escapeHtml(svc.badge || 'Dịch vụ')}</p>
        <h2 id="home-custom-print-title">${escapeHtml(svc.title || 'In 3D theo yêu cầu')}</h2>
        <p class="home-custom-print-tagline">${escapeHtml(svc.tagline || '')}</p>
        ${highlights ? `<ul class="home-custom-print-list">${highlights}</ul>` : ''}
        ${svc.note ? `<p class="home-custom-print-note">${escapeHtml(svc.note)}</p>` : ''}
        <div class="home-custom-print-actions">
          <a class="home-cta-primary home-cta-primary--dark" href="${escapeHtml(zalo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cta)}</a>
          <a class="home-custom-print-link" href="${catalogHref}">Xem đèn &amp; decor có sẵn</a>
        </div>
      </div>
      <div class="home-custom-print-visual" aria-hidden="true">
        <div class="home-custom-print-orbit"></div>
        <div class="home-custom-print-chip">STL · 3MF · STEP</div>
        <div class="home-custom-print-chip home-custom-print-chip--alt">Màu &amp; hoàn thiện</div>
      </div>
    </div>
  `;
}

function applyContact(site) {
  const contact = site.contact || {};
  const zaloLabel = contact.ctaLabel || 'Liên hệ Zalo';

  for (const id of ['home-footer-zalo', 'home-cta-zalo']) {
    const el = document.getElementById(id);
    if (el && contact.zaloUrl) {
      el.href = contact.zaloUrl;
      el.textContent = id === 'home-cta-zalo' ? zaloLabel : zaloLabel;
    }
  }

  const phoneEl = document.getElementById('home-cta-phone');
  if (phoneEl && contact.phoneDisplay) {
    const tel = phoneTel(contact.phoneDisplay);
    phoneEl.innerHTML = tel
      ? `<a href="${escapeHtml(tel)}">${escapeHtml(contact.phoneDisplay)}</a>`
      : escapeHtml(contact.phoneDisplay);
  }

  const copy = document.getElementById('home-footer-copy');
  if (copy && site.title) copy.textContent = `© ${site.title}`;
}

function setupHero(catalog, firstProduct) {
  const heroBg = document.getElementById('home-hero-bg');
  const heroProduct = document.getElementById('home-hero-product');
  const navBrand = document.getElementById('nav-brand');

  if (navBrand && catalog.site?.title) {
    navBrand.textContent = catalog.site.title;
    navBrand.href = '#home-hero';
  }

  if (firstProduct?.media && heroBg) {
    const heroImg = productPrimaryImage(firstProduct);
    if (heroImg) heroBg.style.backgroundImage = `url("${assetUrl(heroImg)}")`;
  }

  if (heroProduct && firstProduct) {
    heroProduct.href = catalogPageUrl(firstProduct.id);
    heroProduct.textContent = `Khám phá ${firstProduct.title}`;
  }
}

function initScrollEffects() {
  const nav = document.getElementById('home-nav');
  const onScroll = () => {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const revealEls = document.querySelectorAll('[data-reveal]');
  if (!revealEls.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
  );
  revealEls.forEach((el) => observer.observe(el));
}

function renderHome(catalog) {
  const site = catalog.site || {};

  document.title = site.title ? `${site.title}` : document.title;

  const titleEl = document.getElementById('home-title');
  const leadEl = document.getElementById('home-lead');
  if (titleEl) titleEl.textContent = site.title || '';
  if (leadEl) leadEl.textContent = site.subtitle || '';

  applyContact(site);
  renderCustomPrint(site);

  const products = [];
  for (const category of catalog.categories || []) {
    for (const product of category.products || []) {
      products.push({ product, categoryName: category.name });
    }
  }

  setupHero(catalog, products[0]?.product);

  const root = document.getElementById('home-root');
  if (!products.length) {
    root.innerHTML = '<p class="home-loading">Chưa có sản phẩm trong catalog.json</p>';
    initScrollEffects();
    return;
  }

  const tiles = products.map(({ product, categoryName }, index) =>
    renderShowcaseTile(product, categoryName, { featured: index === 0, index })
  );

  root.innerHTML = `<div class="showcase-grid">${tiles.join('')}</div>`;
  initScrollEffects();
}

async function loadHome() {
  try {
    const res = await fetch(assetUrl('data/catalog.json'), { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    renderHome(await res.json());
  } catch (err) {
    document.getElementById('home-root').innerHTML =
      `<p class="home-loading">Không tải được dữ liệu. ${escapeHtml(err.message)}</p>`;
    initScrollEffects();
  }
}

loadHome();
