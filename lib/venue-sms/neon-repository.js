import { IntakeError } from './consent.js';
// Restricted role calls two fixed SECURITY DEFINER entrypoints; no table rights.
export function neonRepository(sql) {
  return {
    async consumeRate(key, limit, seconds) {
      const rows = await sql.query('select venue_sms.take_rate($1,$2,$3) as allowed', [key,limit,seconds]);
      return rows[0]?.allowed === true;
    },
    async persist({ submissionId, record, canonical, payloadHash }) {
      try {
        const rows = await sql.query('select * from venue_sms.record_event($1,$2::uuid,$3,$4,$5::jsonb)', [record.venue,submissionId,payloadHash,canonical,JSON.stringify(record)]);
        const row=rows[0];
        if (!row?.receipt_id || !row?.recorded_at) throw new Error('Missing durable receipt');
        return {id:row.receipt_id, recordedAt:row.recorded_at, duplicate:row.duplicate === true};
      } catch(error) {
        if (error.code === 'P0001' && error.message === 'submission_id_reused_with_different_choices') throw new IntakeError(409,'submission_id_reused_with_different_choices');
        throw new Error('Consent persistence failed'); // never leak SQL/customer data
      }
    },
  };
}
