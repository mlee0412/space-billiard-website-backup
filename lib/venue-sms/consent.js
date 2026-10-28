import { createHash, createHmac } from 'node:crypto';

export const VERSION = 'SPACE-SMS-2026-10-27-v1';
// ISOLATED PREVIEW DERIVATIVE: never ship this origin policy to production.
export const VENUES = Object.freeze({
  "billiards": {
    "name": "Space Billiard",
    "origins": [
      "https://space-sms-validation-20261027.vercel.app"
    ],
    "phone": "(212) 239-4166"
  }
});
export function consentText(venue) {
  const name = VENUES[venue]?.name;
  if (!name) throw new Error('Unknown venue');
  return {
    transactional: `I agree to receive texts from ${name} about my inquiries, reservations, and customer service. This choice is optional and is not required to contact us or book. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help.`,
    marketing: `I agree to receive recurring promotional texts from ${name}, including offers and events. Consent is optional and is not a condition of purchase or booking. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help.`,
  };
}
export class IntakeError extends Error { constructor(status, code) { super(code); this.status = status; } }
const fail = (status, code) => { throw new IntakeError(status, code); };
export function adult21(dob, now) {
  if (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const date = new Date(`${dob}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dob) return false;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [y, m, d] = today.split('-').map(Number);
  const [by, bm, bd] = dob.split('-').map(Number);
  const age = y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
  return age >= 21 && age <= 120;
}
export function normalize(body, origin, now) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'object_body_required');
  if (typeof body.venue !== 'string' || !Object.hasOwn(VENUES, body.venue)) fail(403, 'venue_origin_not_allowed');
  const venue = VENUES[body.venue];
  if (!venue || !venue.origins.includes(origin)) fail(403, 'venue_origin_not_allowed');
  if (body.version !== VERSION) fail(409, 'refresh_consent_text');
  if (typeof body.transactional !== 'boolean' || typeof body.marketing !== 'boolean') fail(400, 'explicit_boolean_choices_required');
  if (!body.transactional && !body.marketing) return { noConsent: true };
  if (!adult21(body.dob, now)) fail(400, 'sms_enrollment_requires_age_21');
  if (typeof body.phone !== 'string' || body.phone.length > 32) fail(400, 'valid_us_phone_required');
  const rawPhone = typeof body.phone === 'string' ? body.phone.replace(/[\s().-]/g, '') : '';
  const phone = /^\d{10}$/.test(rawPhone) ? `+1${rawPhone}` : /^1\d{10}$/.test(rawPhone) ? `+${rawPhone}` : rawPhone;
  if (!/^\+1[2-9]\d{2}[2-9]\d{6}$/.test(phone)) fail(400, 'valid_us_phone_required');
  if (typeof body.submissionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.submissionId || '')) fail(400, 'submission_id_required');
  const texts = consentText(body.venue);
  const record = {
    venue: body.venue, phone, transactional: body.transactional, marketing: body.marketing,
    version: VERSION, consentTexts: texts, sourceUrl: `${origin}/sms-preferences/`,
    privacyUrl: `${origin}/privacy-policy/`, termsUrl: `${origin}/terms-of-use/`,
    ageEligibility: { minimumAge: 21, eligible: true, method: 'self_reported_dob_server_calculated', verifiedIdentity: false },
    state: 'recorded_not_enabled_for_sending',
  };
  const canonical = JSON.stringify(record);
  return { submissionId: body.submissionId.toLowerCase(), record, canonical, payloadHash: createHash('sha256').update(canonical).digest('hex') };
}

// A public collector is not authenticated by CORS. Challenge proof, trusted
// platform IP, durable abuse limits and idempotency are mandatory dependencies.
// It never verifies phone ownership, subscribes in Bird, or sends messages.
export function createHandler({ repository, verifyChallenge, clientIp, rateSecret, enabled = false, now = () => new Date() }) {
  return async (req, res) => {
    const reply = (code, data) => res.status(code).json(data);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin');
    try {
      const origin = req.headers.origin;
      if (!Object.values(VENUES).some(v => v.origins.includes(origin))) fail(403, 'origin_not_allowed');
      res.setHeader('Access-Control-Allow-Origin', origin);
      if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); return res.status(204).end(); }
      if (req.method !== 'POST') fail(405, 'post_required');
      if (!enabled || !repository || !verifyChallenge || !clientIp || !rateSecret) fail(503, 'enrollment_not_enabled');
      if ((req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/json') fail(415, 'json_required');
      if (Number(req.headers['content-length']) > 8000) fail(413, 'request_too_large');
      if (Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8') > 8000) fail(413, 'request_too_large');
      const input = normalize(req.body, origin, now());
      // No consent is not an opt-in, not an opt-out and not a stored receipt.
      // Existing booking/contact channels remain available unchanged.
      if (input.noConsent) return reply(200, { ok: true, status: 'no_enrollment_requested', stored: false });
      const ip = clientIp(req);
      if (!ip) fail(503, 'trusted_ip_unavailable');
      const digest = value => createHmac('sha256', rateSecret).update(value).digest('hex');
      if (!await repository.consumeRate(`ip:${digest(ip)}`, 20, 3600)) fail(429, 'rate_limit');
      const challenge = await verifyChallenge({ token: req.body.challengeToken, origin, action: 'sms_enrollment', ip });
      if (!challenge) fail(403, 'challenge_failed');
      if (!await repository.consumeRate(`phone:${digest(input.record.phone)}`, 5, 3600)) fail(429, 'rate_limit');
      const receipt = await repository.persist(input);
      if (!receipt?.id || !receipt?.recordedAt) throw new Error('Durable receipt missing');
      return reply(200, { ok: true, status: 'preferences_recorded', reference: receipt.id, recordedAt: receipt.recordedAt, duplicate: Boolean(receipt.duplicate), sendingEnabled: false });
    } catch (error) {
      const code = error instanceof IntakeError ? error.status : 503;
      return reply(code, { ok: false, error: error instanceof IntakeError ? error.message : 'could_not_record_preferences' });
    }
  };
}
