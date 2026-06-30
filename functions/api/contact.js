const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS_MESSAGE = 'Thank you. Your inquiry has been received. Blackpine Cybersecurity Inc. will review your message and respond within 1–2 business days.';
const INCIDENT_NOTE = 'Please avoid deleting or overwriting relevant logs, emails, or account activity unless necessary for safety or business continuity.';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

const value = (formData, key) => String(formData.get(key) || '').trim();
const hasValue = (formData, key) => Boolean(value(formData, key));

async function verifyTurnstile(token, secret, request) {
  if (!secret) return { ok: false, message: 'Turnstile verification is not configured.' };
  if (!token) return { ok: false, message: 'Please complete the security check and try again.' };

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.append('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!response.ok) return { ok: false, message: 'Security check could not be verified.' };
  const result = await response.json();
  return result.success ? { ok: true } : { ok: false, message: 'Security check failed. Please try again.' };
}

function validate(formData) {
  const errors = [];
  const inquiryType = value(formData, 'inquiryType');
  if (!hasValue(formData, 'fullName')) errors.push('fullName');
  if (!hasValue(formData, 'workEmail') || !EMAIL_RE.test(value(formData, 'workEmail'))) errors.push('workEmail');
  if (inquiryType !== 'careers-talent-network' && !hasValue(formData, 'companyName')) errors.push('companyName');
  if (!inquiryType) errors.push('inquiryType');
  if (!hasValue(formData, 'businessType')) errors.push('businessType');
  if (!hasValue(formData, 'urgency')) errors.push('urgency');
  if (!hasValue(formData, 'preferredDate')) errors.push('preferredDate');
  if (!hasValue(formData, 'preferredWindow')) errors.push('preferredWindow');
  if (!hasValue(formData, 'message')) errors.push('message');
  if (!hasValue(formData, 'consent')) errors.push('consent');

  if (inquiryType === 'incident-response') {
    ['incidentActive', 'affectedSystem', 'passwordsChanged', 'evidencePreserved'].forEach((field) => {
      if (!hasValue(formData, field)) errors.push(field);
    });
  }

  if (inquiryType === 'security-assessment' && formData.getAll('assessmentReview').filter(Boolean).length === 0) {
    errors.push('assessmentReview');
  }

  return errors;
}

function buildContactEmail(formData) {
  const assessmentReview = formData.getAll('assessmentReview').filter(Boolean).join(', ') || 'Not provided';
  return [
    'New Blackpine contact inquiry',
    '',
    `Full name: ${value(formData, 'fullName')}`,
    `Work email: ${value(formData, 'workEmail')}`,
    `Company: ${value(formData, 'companyName') || 'Not provided'}`,
    `Phone: ${value(formData, 'phoneNumber') || 'Not provided'}`,
    `Inquiry type: ${value(formData, 'inquiryType')}`,
    `Package interest: ${value(formData, 'packageInterest') || 'Not provided'}`,
    `Business type: ${value(formData, 'businessType')}`,
    `Urgency: ${value(formData, 'urgency')}`,
    `Preferred date: ${value(formData, 'preferredDate')}`,
    `Preferred window: ${value(formData, 'preferredWindow')}`,
    `Incident active: ${value(formData, 'incidentActive') || 'Not provided'}`,
    `Affected system: ${value(formData, 'affectedSystem') || 'Not provided'}`,
    `Passwords changed: ${value(formData, 'passwordsChanged') || 'Not provided'}`,
    `Evidence preserved: ${value(formData, 'evidencePreserved') || 'Not provided'}`,
    `Assessment review: ${assessmentReview}`,
    '',
    'Message:',
    value(formData, 'message'),
  ].join('\n');
}

async function sendEmail(env, { subject, replyTo, text }) {
  // Required Cloudflare environment variables: EMAIL_PROVIDER_API_KEY (or RESEND_API_KEY),
  // FORM_FROM_EMAIL, and CONTACT_TO_EMAIL. Do not commit provider secrets to source code.
  const apiKey = env.RESEND_API_KEY || env.EMAIL_PROVIDER_API_KEY;
  const from = env.FORM_FROM_EMAIL;
  const to = env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to) {
    return { ok: false, status: 503, message: 'Form delivery is not configured.' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, reply_to: replyTo, text }),
  });

  if (!response.ok) return { ok: false, status: 502, message: 'Form delivery is temporarily unavailable.' };
  return { ok: true };
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed.' }, 405);

  const formData = await request.formData();
  if (value(formData, 'bot-field')) return json({ success: true, message: SUCCESS_MESSAGE });

  const validationErrors = validate(formData);
  if (validationErrors.length) return json({ success: false, message: 'Please review the form and try again.' }, 400);

  const turnstile = await verifyTurnstile(value(formData, 'cf-turnstile-response'), env.TURNSTILE_SECRET_KEY, request);
  if (!turnstile.ok) return json({ success: false, message: turnstile.message }, 400);

  const delivery = await sendEmail(env, {
    subject: `Blackpine inquiry: ${value(formData, 'inquiryType')}`,
    replyTo: value(formData, 'workEmail'),
    text: buildContactEmail(formData),
  });
  if (!delivery.ok) return json({ success: false, message: delivery.message }, delivery.status);

  const isIncident = value(formData, 'inquiryType') === 'incident-response' || value(formData, 'urgency') === 'active-incident';
  return json({ success: true, message: isIncident ? `${SUCCESS_MESSAGE} ${INCIDENT_NOTE}` : SUCCESS_MESSAGE });
}
