// =====================================================================
// БЛЕКУСЕМ — landing page interactions
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- mobile menu ---------------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------- service picker: chips + hidden select ---------------- */
  const serviceSelect = document.getElementById('service');
  let serviceChips = [];

  const setService = (value) => {
    if (!serviceSelect) return;
    const match = [...serviceSelect.options].find((opt) => opt.value === value);
    if (!match) return;
    serviceSelect.value = value;
    serviceChips.forEach((chip) => {
      const selected = chip.dataset.value === value;
      chip.classList.toggle('is-selected', selected);
      chip.setAttribute('aria-pressed', String(selected));
    });
  };

  // re-run after CMS content rebuilds the chip markup (renderServices),
  // so the new chips get the same click behaviour as the static ones
  function bindServiceChips() {
    serviceChips = [...document.querySelectorAll('.service-chip')];
    serviceChips.forEach((chip) => {
      chip.addEventListener('click', () => setService(chip.dataset.value));
    });
  }
  bindServiceChips();

  // re-run after CMS content rebuilds the service cards, so new buttons
  // get the same prefill-and-scroll behaviour as the static ones
  function bindServiceArrows() {
    document.querySelectorAll('.service-arrow').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.service-card');
        const serviceName = card?.dataset.service;
        if (serviceName) setService(serviceName);
        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }
  bindServiceArrows();

  // also support ?service=... in the URL, in case a card links directly
  const params = new URLSearchParams(window.location.search);
  const preselected = params.get('service');
  if (preselected) setService(preselected);

  /* ---------------- booking form validation ---------------- */
  const form = document.getElementById('bookingForm');
  const formNote = document.getElementById('formNote');

  const fields = {
    name: { input: document.getElementById('name'), error: document.getElementById('nameError'), message: "Вкажіть, будь ласка, ваше ім'я" },
    phone: { input: document.getElementById('phone'), error: document.getElementById('phoneError'), message: 'Вкажіть телефон або Telegram-нік' },
    service: { input: document.getElementById('service'), error: document.getElementById('serviceError'), message: 'Оберіть послугу' },
  };

  function validateField(key) {
    const { input, error, message } = fields[key];
    const value = input.value.trim();
    const row = input.closest('.form-row');
    let isValid = value.length > 0;

    if (key === 'phone' && isValid) {
      // accept phone numbers or telegram handles
      const phonePattern = /^(\+?\d[\d\s()-]{6,}|@[\w]{4,})$/;
      isValid = phonePattern.test(value);
      if (!isValid) fields.phone.message = 'Введіть коректний номер телефону або @username';
    }

    if (isValid) {
      row.classList.remove('invalid');
      error.textContent = '';
      input.setAttribute('aria-invalid', 'false');
    } else {
      row.classList.add('invalid');
      error.textContent = message;
      input.setAttribute('aria-invalid', 'true');
    }
    return isValid;
  }

  Object.keys(fields).forEach(key => {
    fields[key].input.addEventListener('blur', () => validateField(key));
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const results = Object.keys(fields).map(validateField);
      const allValid = results.every(Boolean);

      if (!allValid) {
        formNote.textContent = 'Будь ласка, заповніть обов’язкові поля.';
        formNote.style.color = '#C0334A';
        return;
      }

      const data = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        service: document.getElementById('service').value,
        breed: document.getElementById('breed').value.trim(),
        notes: document.getElementById('notes').value.trim(),
      };

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      fetch('/.netlify/functions/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then((res) => {
          if (!res.ok) throw new Error('bad response');
          formNote.textContent = 'Дякуємо! Ваша заявка надіслана, ми зв’яжемось з вами найближчим часом.';
          formNote.style.color = '#3A1420';
          form.reset();
        })
        .catch(() => {
          formNote.textContent = 'Не вдалося надіслати заявку. Спробуйте, будь ласка, ще раз або зателефонуйте нам.';
          formNote.style.color = '#C0334A';
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* ---------------- scroll animations (GSAP + ScrollTrigger) ---------------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {

      /* hero: one orchestrated load-in moment */
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-arch', { y: 60, autoAlpha: 0, duration: 1.1, ease: 'power2.out' })
        .from('.hero-arch-clip img', { y: 90, duration: 1.1, ease: 'power2.out' }, '-=0.9')
        .from('.hero-stage .eyebrow', { y: 14, autoAlpha: 0, duration: 0.6 }, '-=0.8')
        /* headline lines rise out of their masks one after another */
        .from('.hero-line-inner', { yPercent: 110, duration: 0.9, stagger: 0.16 }, '-=0.5')
        .from('.hero-sub', { y: 16, autoAlpha: 0, duration: 0.6 }, '-=0.45')
        .from('.hero-bottom', { y: 18, autoAlpha: 0, duration: 0.6 }, '-=0.4');

      /* section headings: soft fade-up */
      gsap.utils.toArray('.section-head, .quote, .philosophy-text, .booking-info, .map-info').forEach((el) => {
        gsap.from(el, {
          y: 30,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 82%', once: true },
        });
      });

      /* gold eyebrow lines draw themselves in */
      gsap.utils.toArray('.eyebrow span').forEach((line) => {
        gsap.from(line, {
          scaleX: 0,
          duration: 0.9,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: line, start: 'top 88%', once: true },
        });
      });

      /* service cards: rise + settle in a staircase cascade */
      ScrollTrigger.batch('.service-card', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.from(batch, {
            y: 90,
            autoAlpha: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.14,
            overwrite: true,
          }),
      });

      /* single team spotlight + gallery tiles + stat rows fade in */
      gsap.from('.team-single', {
        y: 40,
        autoAlpha: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.team-single', start: 'top 85%', once: true },
      });

      ScrollTrigger.batch(
        '.mosaic-item, .number-item',
        {
          start: 'top 86%',
          once: true,
          onEnter: (batch) =>
            gsap.from(batch, {
              y: 34,
              autoAlpha: 0,
              duration: 0.7,
              ease: 'power2.out',
              stagger: 0.09,
              overwrite: true,
            }),
        }
      );

      /* booking form + map embed slide in gently */
      gsap.utils.toArray('.booking-form, .map-embed, .philosophy-photo').forEach((el) => {
        gsap.from(el, {
          y: 40,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 84%', once: true },
        });
      });
    });
  }

  /* ---------------- reviews arc carousel ----------------
     cards fan out from the centered one: rotate + lift by how far
     each card's center sits from the track's center, like a spread deck.
     Wrapped in a function so it can be re-run after CMS content
     replaces the cards (see initCMSContent below). */
  function initReviewsCarousel() {
    const reviewsTrack = document.getElementById('reviewsTrack');
    if (!reviewsTrack) return;

    const slides = [...reviewsTrack.querySelectorAll('.review-card')];
    const MAX_ANGLE = 12;   // degrees at full displacement
    const LIFT = 34;        // px the side cards rise/rotate away from
    const MIN_SCALE = 0.86;
    const MIN_OPACITY = 0.55;
    const CENTER_DEADZONE = 0.06; // within this, snap perfectly upright

    let ticking = false;

    const updateArc = () => {
      const trackRect = reviewsTrack.getBoundingClientRect();
      const trackCenter = trackRect.left + trackRect.width / 2;
      let closest = null;
      let closestDist = Infinity;

      slides.forEach((slide) => {
        const rect = slide.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const delta = (slideCenter - trackCenter) / (trackRect.width / 2);
        const clamped = Math.max(-1, Math.min(1, delta));

        const dist = Math.abs(slideCenter - trackCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closest = slide;
        }

        // the centered card always sits perfectly upright — no residual
        // tilt from sub-pixel rounding — everything else fans out
        const isDead = Math.abs(clamped) < CENTER_DEADZONE;
        const angle = isDead ? 0 : clamped * MAX_ANGLE;
        const lift = isDead ? 0 : Math.abs(clamped) * LIFT;
        const scale = isDead ? 1 : 1 - Math.abs(clamped) * (1 - MIN_SCALE);
        const opacity = isDead ? 1 : 1 - Math.abs(clamped) * (1 - MIN_OPACITY);

        slide.style.transform = `translateY(${lift}px) rotate(${angle}deg) scale(${scale})`;
        slide.style.opacity = String(opacity);
      });

      slides.forEach((slide) => slide.classList.toggle('is-active', slide === closest));
      ticking = false;
    };

    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateArc);
      }
    };

    reviewsTrack.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    updateArc();

    const scrollByCard = (dir) => {
      const card = slides[0];
      if (!card) return;
      const step = card.getBoundingClientRect().width + 18;
      reviewsTrack.scrollBy({ left: dir * step, behavior: 'smooth' });
    };

    document.getElementById('reviewsPrev')?.addEventListener('click', () => scrollByCard(-1));
    document.getElementById('reviewsNext')?.addEventListener('click', () => scrollByCard(1));
  }

  initReviewsCarousel();

  /* ---------------- header shadow on scroll ---------------- */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.style.boxShadow = '0 4px 20px rgba(74,21,38,0.08)';
      } else {
        header.style.boxShadow = 'none';
      }
    }, { passive: true });
  }

  /* ---------------- CMS content (Decap CMS via /content/*.json) ----------------
     Progressive enhancement only: the HTML above already has real content
     hardcoded, so the page works even if this fetch fails (e.g. opened
     straight from disk as file://, where fetch is blocked by the browser).
     Once live on Netlify, these fetches succeed and swap in whatever the
     client last saved in /admin. */
  const escapeHTML = (str) =>
    String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  async function fetchJSON(path) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null; // offline / opened via file:// / not deployed yet
    }
  }

  // fills the `<span></span>TEXT<span></span>` eyebrow (keeping the two
  // decorative line spans intact) and the "Plain <em>Accent</em>" title
  // inside whatever root element is passed in
  function setEyebrowTitle(root, eyebrowText, titlePlain, titleAccent) {
    if (!root) return;
    const eyebrow = root.querySelector('.eyebrow');
    const title = root.querySelector('.section-title');
    if (eyebrow && eyebrowText) {
      eyebrow.innerHTML = `<span></span>${escapeHTML(eyebrowText)}<span></span>`;
    }
    if (title && (titlePlain || titleAccent)) {
      title.innerHTML = `${escapeHTML(titlePlain)} <em>${escapeHTML(titleAccent)}</em>`;
    }
  }

  function setList(listEl, items) {
    if (!listEl || !items?.length) return;
    const hasCheck = listEl.classList.contains('booking-perks');
    listEl.innerHTML = items
      .map((text) => (hasCheck
        ? `<li><span class="check">✓</span> ${escapeHTML(text)}</li>`
        : `<li>${escapeHTML(text)}</li>`))
      .join('');
  }

  function renderSiteTexts(site) {
    if (!site) return;

    if (site.hero) {
      const eyebrow = document.querySelector('.hero-stage .eyebrow');
      if (eyebrow && site.hero.eyebrow) eyebrow.textContent = site.hero.eyebrow;

      const lines = document.querySelectorAll('.hero-line-inner');
      if (lines[0] && site.hero.titleLine1) lines[0].textContent = site.hero.titleLine1;
      if (lines[1] && (site.hero.titleLine2 || site.hero.titleAccent)) {
        lines[1].innerHTML = `${escapeHTML(site.hero.titleLine2)} <em>${escapeHTML(site.hero.titleAccent)}</em>`;
      }

      const sub = document.querySelector('.hero-sub');
      if (sub && site.hero.subtitle) sub.textContent = site.hero.subtitle;

      setList(document.getElementById('heroPerksLeft'), site.hero.perksLeft);
      setList(document.getElementById('heroPerksRight'), site.hero.perksRight);
    }

    if (site.numbers) {
      const items = document.querySelectorAll('.number-item');
      const map = ['years', 'clients', 'recommend', 'services'];
      items.forEach((item, i) => {
        const key = map[i];
        if (!key) return;
        const value = item.querySelector('.number-value');
        const label = item.querySelector('.number-label');
        if (value && site.numbers[key]) value.textContent = site.numbers[key];
        if (label && site.numbers[`${key}Label`]) label.textContent = site.numbers[`${key}Label`];
      });
    }

    if (site.servicesSection) {
      const s = site.servicesSection;
      setEyebrowTitle(document.querySelector('.services .section-head'), s.eyebrow, s.title, s.titleAccent);
    }

    if (site.quote) {
      const quoteText = document.querySelector('.quote-text');
      const quoteAuthor = document.querySelector('.quote-author');
      if (quoteText && site.quote.text) quoteText.textContent = site.quote.text;
      if (quoteAuthor && site.quote.author) quoteAuthor.textContent = site.quote.author;
    }

    if (site.gallerySection) {
      const g = site.gallerySection;
      setEyebrowTitle(document.querySelector('.about > .section-head'), g.eyebrow, g.title, g.titleAccent);
    }

    if (site.philosophy) {
      const p = site.philosophy;
      setEyebrowTitle(document.querySelector('.philosophy-text'), p.eyebrow, p.title, p.titleAccent);
      const body = document.getElementById('philosophyBody');
      const photo = document.querySelector('.philosophy-photo img');
      if (body && p.body) body.textContent = p.body;
      if (photo && p.photo) photo.src = p.photo;
    }

    if (site.teamSection) {
      const t = site.teamSection;
      setEyebrowTitle(document.querySelector('.team .section-head'), t.eyebrow, t.title, t.titleAccent);
    }

    if (site.reviewsSection) {
      const r = site.reviewsSection;
      setEyebrowTitle(document.querySelector('.reviews .section-head'), r.eyebrow, r.title, r.titleAccent);
    }

    if (site.mapSection) {
      const m = site.mapSection;
      setEyebrowTitle(document.querySelector('.map-info'), m.eyebrow, m.title, m.titleAccent);
    }

    if (site.bookingSection) {
      const b = site.bookingSection;
      setEyebrowTitle(document.querySelector('.booking-info'), b.eyebrow, b.title, b.titleAccent);
      setList(document.getElementById('bookingPerks'), b.perks);
    }

    if (site.footer) {
      const slogan = document.querySelector('.footer-slogan');
      if (slogan && (site.footer.slogan || site.footer.sloganAccent)) {
        slogan.innerHTML = `${escapeHTML(site.footer.slogan)} <em>${escapeHTML(site.footer.sloganAccent)}</em>`;
      }
    }

    if (site.contacts) {
      const c = site.contacts;
      document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
        if (c.phoneHref) a.href = `tel:+${c.phoneHref.replace(/\D/g, '')}`;
        if (c.phone) a.textContent = c.phone;
      });
      const address = document.getElementById('cmsAddress');
      const schedule = document.getElementById('cmsSchedule');
      const parking = document.getElementById('cmsParking');
      if (address && c.address) address.textContent = c.address;
      if (schedule && c.schedule) schedule.textContent = c.schedule;
      if (parking && c.parking) parking.textContent = c.parking;

      const footerAddress = document.getElementById('footerAddress');
      const footerSchedule = document.getElementById('footerSchedule');
      if (footerAddress && c.address) footerAddress.textContent = c.address;
      if (footerSchedule && c.schedule) footerSchedule.textContent = c.schedule;

      const socialMap = { instagram: c.instagram, telegram: c.telegram, tiktok: c.tiktok };
      Object.entries(socialMap).forEach(([key, href]) => {
        if (!href) return;
        document.querySelectorAll(`[data-social="${key}"]`).forEach((a) => { a.href = href; });
      });
    }
  }

  function renderTeam(data) {
    const list = document.getElementById('teamList');
    if (!list || !data?.items?.length) return;

    // one shared heading (never per-card) — it's absolutely positioned
    // behind the cards (see .team-bigname in style.css), so card count
    // doesn't need any special handling here
    const cards = data.items.map((member) => `
      <div class="team-single">
        <div class="team-photo-frame">
          <img src="${escapeHTML(member.photo)}" alt="${escapeHTML(member.name)} — ${escapeHTML(member.role)}, БЛЕКУСЕМ">
          <span class="team-badge">
            <strong>${escapeHTML(member.name)}</strong>
            <span>${escapeHTML(member.role)}</span>
          </span>
        </div>
      </div>
    `).join('');

    list.innerHTML = `${cards}<span class="team-bigname" aria-hidden="true">Майстри</span>`;
  }

  function renderGallery(data) {
    const grid = document.getElementById('mosaicGrid');
    if (!grid || !data?.items?.length) return;

    grid.innerHTML = data.items.map((tile) => `
      <div class="mosaic-item">
        <img src="${escapeHTML(tile.image)}" alt="${escapeHTML(tile.alt)}">
        <div class="mosaic-overlay"><span>${escapeHTML(tile.caption)}</span></div>
      </div>
    `).join('');
  }

  function renderServices(data) {
    const grid = document.querySelector('.services-grid');
    if (!grid || !data?.items?.length) return;

    grid.innerHTML = data.items.map((service, i) => {
      const num = i + 1;
      const first = service.name.charAt(0);
      const rest = escapeHTML(service.name.slice(1));
      const darkClass = service.featured ? ' service-card--dark' : '';
      return `
        <article class="service-card${darkClass}" data-service="${escapeHTML(service.name)}">
          <span class="service-num" aria-hidden="true">${num}</span>
          <h3 class="service-name"><span class="accent">${escapeHTML(first)}</span>${rest}</h3>
          <p>${escapeHTML(service.description)}</p>
          <div class="service-foot">
            <span class="service-price">${escapeHTML(service.price)}</span>
            <button class="service-arrow" aria-label="Записатись на ${escapeHTML(service.name)}">Записатись</button>
          </div>
        </article>`;
    }).join('');

    bindServiceArrows();

    // keep the booking form's chip picker in sync with whatever
    // services the client has in the CMS, so they're never two
    // separately-maintained lists
    const chipsContainer = document.querySelector('.service-chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = data.items.map((service) => `
        <button type="button" class="service-chip" data-value="${escapeHTML(service.name)}" aria-pressed="false">${escapeHTML(service.name)}</button>
      `).join('');

      const select = document.getElementById('service');
      if (select) {
        const placeholder = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (placeholder) select.appendChild(placeholder);
        data.items.forEach((service) => {
          const opt = document.createElement('option');
          opt.value = service.name;
          opt.textContent = `${service.name} — ${service.price}`;
          select.appendChild(opt);
        });
      }

      bindServiceChips();
    }
  }

  function renderReviews(data) {
    const track = document.getElementById('reviewsTrack');
    if (!track || !data?.items?.length) return;

    track.innerHTML = data.items.map((r) => `
      <article class="review-card">
        <div class="split-photo">
          <img src="${escapeHTML(r.beforeImage)}" alt="${escapeHTML(r.beforeAlt)}">
          <img src="${escapeHTML(r.afterImage)}" alt="${escapeHTML(r.afterAlt)}">
          <span class="split-line" aria-hidden="true"></span>
          <span class="split-tag left">До</span>
          <span class="split-tag right">Після</span>
        </div>
        <div class="review-body">
          <div class="stars" role="img" aria-label="Оцінка ${r.stars} з 5 зірок">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
          <p>«${escapeHTML(r.text)}»</p>
          <span class="review-author">— ${escapeHTML(r.author)}</span>
        </div>
      </article>
    `).join('');

    initReviewsCarousel();
  }

  (async function initCMSContent() {
    const [site, services, reviews, team, gallery] = await Promise.all([
      fetchJSON('content/site.json'),
      fetchJSON('content/services.json'),
      fetchJSON('content/reviews.json'),
      fetchJSON('content/team.json'),
      fetchJSON('content/gallery.json'),
    ]);
    renderSiteTexts(site);
    renderServices(services);
    renderReviews(reviews);
    renderTeam(team);
    renderGallery(gallery);

    // renderServices just rebuilt the <select>/chips from scratch, which
    // would silently drop a service chosen via ?service=... before the
    // CMS fetch resolved — reapply it now that the options exist again
    if (preselected) setService(preselected);
  })();

});
