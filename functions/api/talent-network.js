const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS_MESSAGE = 'Thank you for your interest. Your submission has been received. Blackpine will review talent network submissions when suitable opportunities become available.';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

const value = (formData, key) => String(formData.get(key) || '').trim();
const hasValue = (formData, key) => Boolean(value(formData, key));

const isOptionalUrl = (input) => {
  if (!input) return true;
  try {
    const url = new URL(input);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (_) {
    return false;
  }
};

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
  if (!hasValue(formData, 'fullName')) errors.push('fullName');
  if (!hasValue(formData, 'email') || !EMAIL_RE.test(value(formData, 'email'))) errors.push('email');
  if (!hasValue(formData, 'roleInterest')) errors.push('roleInterest');
  if (!hasValue(formData, 'experienceLevel')) errors.push('experienceLevel');
  if (!hasValue(formData, 'message')) errors.push('message');
  if (!isOptionalUrl(value(formData, 'portfolioLink'))) errors.push('portfolioLink');
  if (!isOptionalUrl(value(formData, 'resumeLink'))) errors.push('resumeLink');
  return errors;
}

function buildTalentEmail(formData) {
  return [
    'New Blackpine talent network submission',
    '',
    `Full name: ${value(formData, 'fullName')}`,
    `Email: ${value(formData, 'email')}`,
    `Location: ${value(formData, 'location') || 'Not provided'}`,
    `Role interest: ${value(formData, 'roleInterest')}`,
    `Experience level: ${value(formData, 'experienceLevel')}`,
    `LinkedIn / portfolio: ${value(formData, 'portfolioLink') || 'Not provided'}`,
    `Resume / portfolio: ${value(formData, 'resumeLink') || 'Not provided'}`,
    '',
    'Message:',
    value(formData, 'message'),
  ].join('\n');
}

async function sendEmail(env, { subject, replyTo, text }) {
  // Required Cloudflare environment variables: EMAIL_PROVIDER_API_KEY (or RESEND_API_KEY),
  // FORM_FROM_EMAIL, and CAREERS_TO_EMAIL. Do not commit provider secrets to source code.
  const apiKey = env.RESEND_API_KEY || env.EMAIL_PROVIDER_API_KEY;
  const from = env.FORM_FROM_EMAIL;
  const to = env.CAREERS_TO_EMAIL;
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
    subject: `Blackpine talent network: ${value(formData, 'roleInterest')}`,
    replyTo: value(formData, 'email'),
    text: buildTalentEmail(formData),
  });
  if (!delivery.ok) return json({ success: false, message: delivery.message }, delivery.status);

  return json({ success: true, message: SUCCESS_MESSAGE });
}
