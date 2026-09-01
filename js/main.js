/* ═══════════════════════════════════════════
   6FORM — логика прототипа
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── ФОТО ──────────────────────────────────────────────
     Все картинки ищутся сначала в папке img/.
     Если файла нет — подставляется временная ссылка из data-fb
     (или показывается силуэт формы). Кладёте своё фото в img/ —
     ничего править в коде не нужно.
     ───────────────────────────────────────────────────── */
  var failed = function (img) { return img.complete && img.naturalWidth === 0; };

  $$('img[data-fb]').forEach(function (img) {
    var swap = function () {
      if (img.dataset.done) return;
      img.dataset.done = '1';
      img.src = img.dataset.fb;
    };
    img.addEventListener('error', swap);
    if (failed(img)) swap();
  });

  $$('img[data-photo]').forEach(function (img) {
    var hide = function () { img.hidden = true; };
    var show = function () {
      var sil = img.parentNode.querySelector('.fcard__sil');
      if (sil) sil.style.display = 'none';                                   // фото есть → силуэт прячем
    };
    img.addEventListener('error', hide);
    img.addEventListener('load', show);
    if (failed(img)) hide();
    else if (img.complete) show();
  });

  /* ── шапка ── */
  var hdr = $('#hdr');
  var onScroll = function () {
    hdr.classList.toggle('is-solid', window.scrollY > window.innerHeight * 0.85);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── бургер-меню ── */
  var burger = $('#burger'), mmenu = $('#mmenu');
  function closeMenu() {
    mmenu.classList.remove('is-open');
    hdr.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    var open = mmenu.classList.toggle('is-open');
    hdr.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('#mmenu a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ═══ КОНФИГУРАТОР ═══ */
  var state = {
    form: '01', name: 'ADELE', size: '160',
    set: 'head', price: 'от 60 000 ₽', tone: '#E7E0D4'
  };

  var pvUse = $('#previewUse'), pvScene = $('#pvScene'), pvHead = $('#pvHead'), pvBed = $('#pvBed');
  var pvName = $('#pvName'), pvSize = $('#pvSize'), pvSet = $('#pvSet'), pvPrice = $('#pvPrice');
  var cap = function (s) { return s.charAt(0) + s.slice(1).toLowerCase(); };

  function render() {
    pvUse.setAttribute('href', '#form-' + state.form);
    // масштаб пропорционален выбранной ширине: 90 см → 0.62, 210 см → 1.0
    var k = 0.62 + (parseInt(state.size, 10) - 90) / (210 - 90) * 0.38;
    pvScene.style.transform = 'scale(' + k.toFixed(3) + ')';
    pvHead.style.fill = state.tone;

    var withBed = state.set === 'base';
    // с основанием изголовье стоит на кровати, без него — висит на стене до пола
    pvHead.setAttribute('transform', 'translate(20,' + (withBed ? 2 : 44) + ')');
    if (withBed) pvBed.removeAttribute('data-off'); else pvBed.setAttribute('data-off', '');
    pvName.textContent = 'Form ' + state.form + ' · ' + cap(state.name);
    pvSize.textContent = state.size + ' см';
    pvSet.textContent = state.set === 'head' ? 'Только изголовье' : 'Изголовье + основание';
    pvPrice.textContent = state.price;
  }

  function bindChips(wrapId, fn) {
    var wrap = $(wrapId);
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', wrap).forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      fn(chip);
      render();
    });
  }

  bindChips('#chipsForm', function (c) { state.form = c.dataset.form; state.name = c.dataset.name; });
  bindChips('#chipsSize', function (c) { state.size = c.dataset.size; });
  bindChips('#chipsSet', function (c) { state.set = c.dataset.set; state.price = c.dataset.price; });
  bindChips('#chipsTone', function (c) { state.tone = c.dataset.tone; });

  $$('#chipsTone .chip--tone').forEach(function (c) { c.style.background = c.dataset.tone; });

  /* карточка формы → выбор в конфигураторе */
  $$('.fcard').forEach(function (card) {
    card.addEventListener('click', function () {
      var chip = $('#chipsForm .chip[data-form="' + card.dataset.form + '"]');
      if (chip) chip.click();
      document.getElementById('order').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  render();

  /* ── маска телефона: +7-(999)-999-9999 ── */
  function phoneDigits(raw) {
    var d = String(raw).replace(/^\s*\+?7/, '').replace(/\D/g, '');  // код страны снимаем как текст
    if (d.length === 11 && d[0] === '8') d = d.slice(1);             // вставили номер через 8
    return d.slice(0, 10);
  }
  function maskPhone(raw) {
    var d = phoneDigits(raw);
    var out = '+7';
    if (d.length) out += '-(' + d.slice(0, 3);
    if (d.length >= 3) out += ')';
    if (d.length > 3) out += '-' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 10);
    return out;
  }
  var digits = phoneDigits;

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.tagName !== 'INPUT' || (el.type !== 'tel' && el.dataset.mask !== 'phone')) return;
    el.value = maskPhone(el.value);
    try { el.setSelectionRange(el.value.length, el.value.length); } catch (err) {}
  });
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el.tagName === 'INPUT' && el.type === 'tel' && !el.value) el.value = '+7-(';
  });
  document.addEventListener('focusout', function (e) {
    var el = e.target;
    if (el.tagName === 'INPUT' && el.type === 'tel' && digits(el.value).length === 0) el.value = '';
  });

  /* ═══ ФОРМА ЗАЯВКИ — пока заглушка ═══ */
  var form = $('#orderForm'), ok = $('#orderOk'), agree = $('#fAgree');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var valid = true;

    ['#fName', '#fPhone'].forEach(function (sel) {
      var f = $(sel), bad = sel === '#fPhone' ? digits(f.value).length < 10 : !f.value.trim();
      f.classList.toggle('is-error', bad);
      if (bad) valid = false;
    });
    agree.closest('.check').classList.toggle('is-error', !agree.checked);
    if (!agree.checked) valid = false;
    if (!valid) return;

    var payload = {
      form: 'FORM ' + state.form + ' / ' + state.name,
      size: state.size + ' см',
      set: state.set === 'head' ? 'Только изголовье' : 'Изголовье + основание',
      tone: state.tone,
      name: $('#fName').value.trim(),
      phone: $('#fPhone').value.trim(),
      comment: $('#fComment').value.trim()
    };
    console.log('Заявка 6Form:', payload); // ← сюда подключим Telegram / почту / CRM

    ok.hidden = false;
    form.querySelector('button[type="submit"]').textContent = 'Заявка отправлена';
    if (!reduced && window.gsap) gsap.from(ok, { opacity: 0, y: 10, duration: .5 });
  });

  /* ═══ МОДАЛКИ ═══ */
  var modal = $('#modal'), modalContent = $('#modalContent');
  var CONTENT = {
    fabrics: '<h3>Где посмотреть ткани</h3>' +
      '<ul>' +
      '<li><b>Шоурум 6Form · Artplay</b>Москва, ул. Нижняя Сыромятническая, 10, стр. 2, офис 625 — большая часть коллекции</li>' +
      '<li><b>Партнёрский шоурум №1</b>Адрес уточняется</li>' +
      '<li><b>Партнёрский шоурум №2</b>Адрес уточняется</li>' +
      '</ul>' +
      '<p class="modal__note">Список адресов и коллекций заполним по вашим данным — сейчас это заглушка.</p>',
    visit: '<h3>Записаться в шоурум</h3>' +
      '<p class="modal__note">Выберите удобные дату и время — мы подтвердим запись по телефону.</p>' +
      '<form onsubmit="return false">' +
      '<ul>' +
      '<li><b>Дата</b><input type="date"></li>' +
      '<li><b>Время</b><input type="time"></li>' +
      '<li><b>Телефон</b><input type="tel" inputmode="tel" placeholder="+7-(999)-999-9999"></li>' +
      '</ul>' +
      '<button class="btn btn--dark btn--wide" type="submit">Записаться</button>' +
      '</form>' +
      '<p class="modal__note" style="margin-top:16px">Здесь позже подключим сервис онлайн-записи с реальным календарём и свободными слотами.</p>'
  };

  $$('[data-modal]').forEach(function (t) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      modalContent.innerHTML = CONTENT[t.dataset.modal] || '';
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      if (!reduced && window.gsap) gsap.from('.modal__win', { y: 24, opacity: 0, duration: .5, ease: 'power2.out' });
    });
  });
  modal.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-close')) { modal.hidden = true; document.body.style.overflow = ''; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) { modal.hidden = true; document.body.style.overflow = ''; }
  });

  /* ═══ АНИМАЦИИ — сдержанно ═══ */
  if (reduced || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var EASE = 'power2.out';

  gsap.timeline({ delay: .15 })
    .from('.hero__label', { opacity: 0, y: 14, duration: .7, ease: EASE })
    .from('.hero__title .line', { yPercent: 108, duration: 1.05, stagger: .09, ease: 'power3.out' }, '-=.4')
    .from('.hero__sub, .hero__cta', { opacity: 0, y: 18, duration: .8, stagger: .1, ease: EASE }, '-=.55')
    .from('.hero__facts li', { opacity: 0, y: 16, duration: .7, stagger: .08, ease: EASE }, '-=.4')
    .from('.hero__bar', { opacity: 0, duration: .8, ease: EASE }, '-=.5');

  $$('[data-parallax]').forEach(function (img) {
    gsap.to(img, {
      yPercent: -10, ease: 'none',
      scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  function reveal(sel, opts) {
    $$(sel).forEach(function (el) {
      gsap.from(el, Object.assign({
        opacity: 0, y: 26, duration: .9, ease: EASE,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      }, opts || {}));
    });
  }

  reveal('.sec__head, .fabrics__lead > *, .quality__text > *, .faq__head > *, .sizes__steps > *', { duration: .8 });
  reveal('.acc__item', { y: 16, duration: .7 });
  reveal('.scheme, .showroom__img, .showroom__text > *, .quality__img');

  gsap.from('.fcard', {
    opacity: 0, y: 30, duration: .9, stagger: .07, ease: EASE,
    scrollTrigger: { trigger: '.forms__grid', start: 'top 84%' }
  });
  gsap.from('.fabrics__grid figure', {
    opacity: 0, y: 30, duration: 1, stagger: .1, ease: EASE,
    scrollTrigger: { trigger: '.fabrics__grid', start: 'top 86%' }
  });
  gsap.from('.swatch', {
    opacity: 0, scale: .6, duration: .5, stagger: .05, ease: 'back.out(2)',
    scrollTrigger: { trigger: '.swatches', start: 'top 92%' }
  });
  gsap.from('.sets__grid .set', {
    opacity: 0, y: 30, duration: .9, stagger: .12, ease: EASE,
    scrollTrigger: { trigger: '.sets__grid', start: 'top 86%' }
  });
  gsap.from('.interiors__inner .line', {
    yPercent: 108, duration: 1, stagger: .08, ease: 'power3.out',
    scrollTrigger: { trigger: '.interiors', start: 'top 62%' }
  });
  gsap.from('.gallery figure', {
    opacity: 0, duration: 1, stagger: .08, ease: EASE,
    scrollTrigger: { trigger: '.gallery', start: 'top 90%' }
  });
  gsap.from('.usp__item', {
    opacity: 0, y: 20, duration: .8, stagger: .08, ease: EASE,
    scrollTrigger: { trigger: '.usp', start: 'top 90%' }
  });
  gsap.from('.order__preview, .order__form', {
    opacity: 0, y: 30, duration: 1, stagger: .12, ease: EASE,
    scrollTrigger: { trigger: '.order', start: 'top 80%' }
  });
})();
