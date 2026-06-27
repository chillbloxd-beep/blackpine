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

// Forms submit to Netlify Forms in production. Netlify requires matching hidden
// static forms for detection; email notifications are configured in the Netlify
// dashboard. Cloudflare Email Routing handles domain email separately.
const submitNetlifyForm = async (form) => {
  const formData = new FormData(form);
  const encoded = new URLSearchParams();
  formData.forEach((value, key) => encoded.append(key, value));
  return fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encoded.toString(),
  });
};

const topicSelect = document.querySelector('#inquiry-type');
if (topicSelect) {
  const params = new URLSearchParams(window.location.search);
  let requestedTopic = params.get('inquiry') || params.get('topic');
  const requestedPackage = params.get('package');
  const packageSelect = document.querySelector('#package-interest');
  const inquiryAliases = { consultation: 'general-consultation' };
  const packageTopics = {
    'essential-review': 'security-assessment',
    'essential-security-review': 'security-assessment',
    'business-security-assessment': 'security-assessment',
    'incident-readiness-review': 'incident-response',
    'digital-risk-advisory': 'digital-risk-advisory',
  };
  requestedTopic = inquiryAliases[requestedTopic] || requestedTopic || packageTopics[requestedPackage];
  if (requestedTopic && [...topicSelect.options].some((option) => option.value === requestedTopic)) {
    topicSelect.value = requestedTopic;
  }
  if (requestedPackage) {
    if (packageSelect && [...packageSelect.options].some((option) => option.value === requestedPackage)) {
      packageSelect.value = requestedPackage;
    }
    const messageField = document.querySelector('#message');
    const packageLabels = {
      'essential-review': 'Essential Security Review',
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
  topicSelect.dispatchEvent(new Event('change', { bubbles: true }));
}



const contactForm = document.querySelector('#blackpine-contact-form');
if (contactForm) {
  const status = document.querySelector('#form-status');
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const incidentFields = document.querySelector('#incident-fields');
  const assessmentFields = document.querySelector('#assessment-fields');
  const careersNote = document.querySelector('#careers-note');
  const fields = {
    fullName: document.querySelector('#full-name'),
    workEmail: document.querySelector('#work-email'),
    companyName: document.querySelector('#company-name'),
    phoneNumber: document.querySelector('#phone-number'),
    topic: document.querySelector('#inquiry-type'),
    packageInterest: document.querySelector('#package-interest'),
    businessType: document.querySelector('#business-type'),
    urgency: document.querySelector('#urgency'),
    preferredDate: document.querySelector('#preferred-date'),
    preferredWindow: document.querySelector('#preferred-window'),
    message: document.querySelector('#message'),
    consent: document.querySelector('#consent'),
    incidentActive: document.querySelector('#incident-active'),
    affectedSystem: document.querySelector('#affected-system'),
    passwordsChanged: document.querySelector('#passwords-changed'),
    evidencePreserved: document.querySelector('#evidence-preserved'),
  };

  const setError = (id, message) => {
    const error = document.querySelector(`#${id}-error`);
    if (error) error.textContent = message;
    const control = document.querySelector(`#${id}`) || (id === 'assessment-review' ? assessmentFields : null);
    if (control) {
      if (message) {
        control.setAttribute('aria-invalid', 'true');
        const describedBy = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
        describedBy.add(`${id}-error`);
        control.setAttribute('aria-describedby', [...describedBy].join(' '));
      } else {
        control.removeAttribute('aria-invalid');
      }
    }
  };

  const clearErrors = () => {
    ['full-name', 'work-email', 'company-name', 'phone-number', 'inquiry-type', 'package-interest', 'business-type', 'urgency', 'preferred-date', 'preferred-window', 'incident-active', 'affected-system', 'passwords-changed', 'evidence-preserved', 'assessment-review', 'message', 'consent'].forEach((id) => setError(id, ''));
    status.className = 'form-status';
    status.textContent = '';
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showConditionalFields = () => {
    const selected = fields.topic.value;
    const isIncident = selected === 'incident-response';
    const isAssessment = selected === 'security-assessment';
    if (incidentFields) incidentFields.hidden = !isIncident;
    if (assessmentFields) assessmentFields.hidden = !isAssessment;
    if (careersNote) careersNote.hidden = selected !== 'careers-talent-network';
  };

  fields.topic.addEventListener('change', showConditionalFields);
  showConditionalFields();

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
    if (fields.topic.value !== 'careers-talent-network' && !fields.companyName.value.trim()) { setError('company-name', 'Please enter your company name.'); isValid = false; }
    if (!fields.topic.value) { setError('inquiry-type', 'Please choose an inquiry type.'); isValid = false; }
    if (!fields.businessType.value) { setError('business-type', 'Please choose a business type.'); isValid = false; }
    if (!fields.urgency.value) { setError('urgency', 'Please choose an urgency level.'); isValid = false; }
    if (!fields.preferredDate.value) { setError('preferred-date', 'Please choose a preferred consultation date.'); isValid = false; }
    if (!fields.preferredWindow.value) { setError('preferred-window', 'Please choose a preferred time window.'); isValid = false; }
    if (fields.topic.value === 'incident-response') {
      if (!fields.incidentActive.value) { setError('incident-active', 'Please indicate whether the issue appears active.'); isValid = false; }
      if (!fields.affectedSystem.value.trim()) { setError('affected-system', 'Please describe the affected system or account.'); isValid = false; }
      if (!fields.passwordsChanged.value) { setError('passwords-changed', 'Please indicate whether passwords have been changed.'); isValid = false; }
      if (!fields.evidencePreserved.value) { setError('evidence-preserved', 'Please indicate whether relevant activity has been preserved.'); isValid = false; }
    }
    if (fields.topic.value === 'security-assessment') {
      const selectedAssessmentItems = contactForm.querySelectorAll('input[name="assessmentReview"]:checked');
      if (!selectedAssessmentItems.length) {
        setError('assessment-review', 'Please choose at least one review area.');
        isValid = false;
      }
    }
    if (!fields.message.value.trim()) { setError('message', 'Please include a brief message.'); isValid = false; }
    if (!fields.consent.checked) { setError('consent', 'Please confirm that Blackpine may contact you about this inquiry.'); isValid = false; }

    if (!isValid) {
      status.classList.add('error');
      status.textContent = 'Please correct the highlighted fields before submitting.';
      return;
    }

    if (contactForm.elements['bot-field']?.value) {
      status.className = 'form-status success';
      status.textContent = 'Thank you. Your inquiry has been received. Blackpine Cybersecurity Inc. will review your message and respond within 1–2 business days.';
      contactForm.reset();
      showConditionalFields();
      return;
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting request…';
    }
    status.classList.add('submitting');
    status.textContent = 'Submitting your request…';
    submitNetlifyForm(contactForm)
      .then((response) => {
        if (!response.ok) throw new Error('Form submission failed');
      status.className = 'form-status success';
      const isIncident = fields.topic.value === 'incident-response' || fields.urgency.value === 'active-incident';
      status.textContent = isIncident
        ? 'Thank you. Your inquiry has been received. Blackpine Cybersecurity Inc. will review your message and respond within 1–2 business days. Please avoid deleting or overwriting relevant logs, emails, or account activity unless necessary for safety or business continuity.'
        : 'Thank you. Your inquiry has been received. Blackpine Cybersecurity Inc. will review your message and respond within 1–2 business days.';
      contactForm.reset();
      showConditionalFields();
      })
      .catch(() => {
        status.className = 'form-status error';
        status.textContent = 'We could not submit your message at this time. Please try again later or contact Blackpine directly by email.';
      })
      .finally(() => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit booking request';
      }
      status.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
  });
}

const talentForm = document.querySelector('#talent-network-form-element');
if (talentForm) {
  const status = document.querySelector('#talent-form-status');
  const setTalentError = (id, message) => {
    const error = document.querySelector(`#${id}-error`);
    if (error) error.textContent = message;
    const control = document.querySelector(`#${id}`);
    if (control) {
      if (message) {
        control.setAttribute('aria-invalid', 'true');
        const describedBy = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
        describedBy.add(`${id}-error`);
        control.setAttribute('aria-describedby', [...describedBy].join(' '));
      } else {
        control.removeAttribute('aria-invalid');
      }
    }
  };
  const clearTalentErrors = () => {
    ['talent-name', 'talent-email', 'talent-location', 'role-interest', 'experience-level', 'linkedin-link', 'portfolio-link', 'talent-message'].forEach((id) => setTalentError(id, ''));
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
      linkedIn: document.querySelector('#linkedin-link'),
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
    if (!fields.role.value) { setTalentError('role-interest', 'Please select a role interest.'); isValid = false; }
    if (!fields.experience.value) { setTalentError('experience-level', 'Please select your experience level.'); isValid = false; }
    if (!isValidOptionalUrl(fields.linkedIn.value)) { setTalentError('linkedin-link', 'Please enter a valid http or https link.'); isValid = false; }
    if (!isValidOptionalUrl(fields.portfolio.value)) { setTalentError('portfolio-link', 'Please enter a valid http or https link.'); isValid = false; }
    if (!fields.message.value.trim()) { setTalentError('talent-message', 'Please include a short message.'); isValid = false; }

    if (!isValid) {
      status.classList.add('error');
      status.textContent = 'Please correct the highlighted fields before submitting.';
      return;
    }

    if (talentForm.elements['bot-field']?.value) {
      status.className = 'form-status success';
      status.textContent = 'Thank you for your interest. Your submission has been received. Blackpine will review talent network submissions when suitable opportunities become available.';
      talentForm.reset();
      return;
    }

    const submitButton = talentForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting interest…';
    }
    status.classList.add('submitting');
    status.textContent = 'Submitting your interest…';
    submitNetlifyForm(talentForm)
      .then((response) => {
        if (!response.ok) throw new Error('Form submission failed');
        status.className = 'form-status success';
        status.textContent = 'Thank you for your interest. Your submission has been received. Blackpine will review talent network submissions when suitable opportunities become available.';
        talentForm.reset();
      })
      .catch(() => {
        status.className = 'form-status error';
        status.textContent = 'We could not submit your message at this time. Please try again later or contact Blackpine directly by email.';
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Submit expression of interest';
        }
        status.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
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
