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

  /* ---------------- pre-fill service from service cards ---------------- */
  const serviceSelect = document.getElementById('service');

  document.querySelectorAll('.service-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.service-card');
      const serviceName = card?.dataset.service;
      if (serviceName && serviceSelect) {
        serviceSelect.value = serviceName;
      }
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // also support ?service=... in the URL, in case a card links directly
  const params = new URLSearchParams(window.location.search);
  const preselected = params.get('service');
  if (preselected && serviceSelect) {
    const match = [...serviceSelect.options].find(opt => opt.value === preselected);
    if (match) serviceSelect.value = preselected;
  }

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
        formNote.style.color = '#E48A9A';
        return;
      }

      const data = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        service: document.getElementById('service').value,
        breed: document.getElementById('breed').value.trim(),
        notes: document.getElementById('notes').value.trim(),
      };

      // ---------------------------------------------------------------
      // TODO: інтеграція з Telegram-ботом.
      // Коли бот буде готовий, замінити блок нижче на запит виду:
      //
      // fetch('https://api.telegram.org/bot<BOT_TOKEN>/sendMessage', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     chat_id: '<CHAT_ID>',
      //     text: `Нова заявка: ${data.name}, ${data.phone}, ${data.service}`
      //   })
      // });
      //
      // або відправити data на власний backend-ендпоінт, який вже
      // передасть заявку в Telegram-бот.
      // ---------------------------------------------------------------
      console.log('Заявка на запис:', data);

      formNote.textContent = 'Дякуємо! Ваша заявка надіслана, ми зв’яжемось з вами найближчим часом.';
      formNote.style.color = '#C9A24E';
      form.reset();
    });
  }

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

});
