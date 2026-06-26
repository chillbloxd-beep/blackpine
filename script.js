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
  const requestedPackage = params.get('package');
  if (requestedTopic && [...topicSelect.options].some((option) => option.value === requestedTopic)) {
    topicSelect.value = requestedTopic;
  }
  if (requestedPackage) {
    const messageField = document.querySelector('#message');
    const packageLabels = {
      'essential-security-review': 'Essential Security Review',
      'business-security-assessment': 'Business Security Assessment',
      'incident-readiness-review': 'Incident Readiness Review',
      'digital-risk-advisory': 'Digital Risk Advisory',
    };
    if (messageField && packageLabels[requestedPackage] && !messageField.value.trim()) {
      messageField.value = `Package interest: ${packageLabels[requestedPackage]}

`;
    }
  }
}



const contactForm = document.querySelector('#blackpine-contact-form');
if (contactForm) {
  const status = document.querySelector('#form-status');
  const fields = {
    fullName: document.querySelector('#full-name'),
    workEmail: document.querySelector('#work-email'),
    companyName: document.querySelector('#company-name'),
    phoneNumber: document.querySelector('#phone-number'),
    topic: document.querySelector('#inquiry-type'),
    businessType: document.querySelector('#business-type'),
    urgency: document.querySelector('#urgency'),
    preferredDate: document.querySelector('#preferred-date'),
    preferredWindow: document.querySelector('#preferred-window'),
    message: document.querySelector('#message'),
    consent: document.querySelector('#consent'),
  };

  const setError = (id, message) => {
    const error = document.querySelector(`#${id}-error`);
    if (error) error.textContent = message;
  };

  const clearErrors = () => {
    ['full-name', 'work-email', 'company-name', 'phone-number', 'inquiry-type', 'business-type', 'urgency', 'preferred-date', 'preferred-window', 'message', 'consent'].forEach((id) => setError(id, ''));
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
    if (!fields.businessType.value) { setError('business-type', 'Please choose a business type.'); isValid = false; }
    if (!fields.urgency.value) { setError('urgency', 'Please choose an urgency level.'); isValid = false; }
    if (!fields.preferredDate.value) { setError('preferred-date', 'Please choose a preferred consultation date.'); isValid = false; }
    if (!fields.preferredWindow.value) { setError('preferred-window', 'Please choose a preferred time window.'); isValid = false; }
    if (!fields.message.value.trim()) { setError('message', 'Please include a brief message.'); isValid = false; }
    if (!fields.consent.checked) { setError('consent', 'Please confirm that Blackpine may contact you about this inquiry.'); isValid = false; }

    if (!isValid) {
      status.classList.add('error');
      status.textContent = 'Please correct the highlighted fields before submitting.';
      return;
    }

    // Demo/local mode handler: no backend or live scheduling system is configured for this static site.
    // Production connection point: replace this block with a secure integration such as
    // Formspree, Resend, Supabase, Firebase, an Email API, Calendly, or Google Calendar
    // appointment scheduling. Until then, this is a booking request form, not a confirmed
    // appointment scheduler, and no data is sent or stored.
    status.classList.add('success');
    const isIncident = fields.topic.value === 'incident-response' || fields.urgency.value === 'active-incident';
    status.textContent = isIncident
      ? 'Your incident-related inquiry has been received. Please avoid changing, deleting, or overwriting relevant logs, emails, or account activity unless necessary for safety or business continuity.'
      : 'Thank you. Your inquiry has been received. Blackpine will respond within 1–2 business days.';
    contactForm.reset();
    status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

const talentForm = document.querySelector('#talent-network-form-element');
if (talentForm) {
  const status = document.querySelector('#talent-form-status');
  const setTalentError = (id, message) => {
    const error = document.querySelector(`#${id}-error`);
    if (error) error.textContent = message;
  };
  const clearTalentErrors = () => {
    ['talent-name', 'talent-email', 'talent-location', 'role-interest', 'experience-level', 'portfolio-link', 'talent-message'].forEach((id) => setTalentError(id, ''));
    status.className = 'form-status';
    status.textContent = '';
  };
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidOptionalUrl = (value) => {
    if (!value.trim()) return true;
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    } catch (_) {
      return false;
    }
  };

  talentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearTalentErrors();
    const fields = {
      name: document.querySelector('#talent-name'),
      email: document.querySelector('#talent-email'),
      location: document.querySelector('#talent-location'),
      role: document.querySelector('#role-interest'),
      experience: document.querySelector('#experience-level'),
      portfolio: document.querySelector('#portfolio-link'),
      message: document.querySelector('#talent-message'),
    };
    let isValid = true;
    if (!fields.name.value.trim()) { setTalentError('talent-name', 'Please enter your full name.'); isValid = false; }
    if (!fields.email.value.trim()) {
      setTalentError('talent-email', 'Please enter your email.');
      isValid = false;
    } else if (!isValidEmail(fields.email.value.trim())) {
      setTalentError('talent-email', 'Please enter a valid email address.');
      isValid = false;
    }
    if (!fields.location.value.trim()) { setTalentError('talent-location', 'Please enter your location.'); isValid = false; }
    if (!fields.role.value) { setTalentError('role-interest', 'Please select a role interest.'); isValid = false; }
    if (!fields.experience.value) { setTalentError('experience-level', 'Please select your experience level.'); isValid = false; }
    if (!isValidOptionalUrl(fields.portfolio.value)) { setTalentError('portfolio-link', 'Please enter a valid http or https link.'); isValid = false; }
    if (!fields.message.value.trim()) { setTalentError('talent-message', 'Please include a short message.'); isValid = false; }

    if (!isValid) {
      status.classList.add('error');
      status.textContent = 'Please correct the highlighted fields before submitting.';
      return;
    }

    // Demo/local mode handler: no recruiting backend is configured for this static site.
    // Production connection point: replace this block with a secure recruiting workflow,
    // database, or email/API endpoint before collecting talent network submissions.
    status.classList.add('success');
    status.textContent = 'Thank you for your interest. Your submission has been received. Blackpine will review talent network submissions when suitable opportunities become available.';
    talentForm.reset();
    status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}


const printChecklistButton = document.querySelector('#print-checklist');
if (printChecklistButton) {
  printChecklistButton.addEventListener('click', () => window.print());
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
