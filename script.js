const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('#nav-links');

if (toggle && links) {
  const closeMenu = () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', anchor.getAttribute('href'));
  });
});

const topicSelect = document.querySelector('#inquiry-type');
if (topicSelect) {
  const params = new URLSearchParams(window.location.search);
  const requestedTopic = params.get('topic');
  if (requestedTopic && [...topicSelect.options].some((option) => option.value === requestedTopic)) {
    topicSelect.value = requestedTopic;
  }
}



const contactForm = document.querySelector('#blackpine-contact-form');
if (contactForm) {
  const status = document.querySelector('#form-status');
  const fields = {
    fullName: document.querySelector('#full-name'),
    workEmail: document.querySelector('#work-email'),
    companyName: document.querySelector('#company-name'),
    topic: document.querySelector('#inquiry-type'),
    message: document.querySelector('#message'),
    consent: document.querySelector('#consent'),
  };

  const setError = (id, message) => {
    const error = document.querySelector(`#${id}-error`);
    if (error) error.textContent = message;
  };

  const clearErrors = () => {
    ['full-name', 'work-email', 'company-name', 'inquiry-type', 'message', 'consent'].forEach((id) => setError(id, ''));
    status.className = 'form-status';
    status.textContent = '';
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();

    let isValid = true;
    if (!fields.fullName.value.trim()) { setError('full-name', 'Please enter your full name.'); isValid = false; }
    if (!fields.workEmail.value.trim()) {
      setError('work-email', 'Please enter your work email.');
      isValid = false;
    } else if (!isValidEmail(fields.workEmail.value.trim())) {
      setError('work-email', 'Please enter a valid email address.');
      isValid = false;
    }
    if (!fields.companyName.value.trim()) { setError('company-name', 'Please enter your company name.'); isValid = false; }
    if (!fields.topic.value) { setError('inquiry-type', 'Please choose an inquiry type.'); isValid = false; }
    if (!fields.message.value.trim()) { setError('message', 'Please include a brief message.'); isValid = false; }
    if (!fields.consent.checked) { setError('consent', 'Please confirm that Blackpine may contact you about this inquiry.'); isValid = false; }

    if (!isValid) {
      status.classList.add('error');
      status.textContent = 'Please correct the highlighted fields before submitting.';
      return;
    }

    // Demo/local mode placeholder handler: no backend is configured for this static site.
    // Production connection point: replace this block with a request to Formspree,
    // Resend, Supabase, Firebase, or a secure email/API endpoint. Do not collect or
    // store sensitive incident evidence in client-side code.
    status.classList.add('success');
    status.textContent = 'Thank you. Your inquiry has been received. Blackpine will respond within 1–2 business days.';
    contactForm.reset();
    status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
