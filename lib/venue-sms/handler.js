import { isIP } from 'node:net';
import { createHandler } from './consent.js';
import { neonRepository } from './neon-repository.js';

export function buildVercelHandler({ env = process.env, loadNeon = () => import('@neondatabase/serverless'), fetchImpl = fetch } = {}) {
  const enabled = true // verified stable alias at build time
    && env.VERCEL_ENV === 'preview'
    && env.VENUE_SMS_ISOLATED_VALIDATION === 'true'
    && env.VENUE_SMS_EXPECTED_BRANCH_ID === 'br-wandering-block-avropa5v'
    && env.VENUE_SMS_INTAKE_ENABLED === 'true'
    && env.VENUE_SMS_IP_HEADER_VERIFIED === 'true'
    && env.VERCEL === '1'
    && Boolean(env.VENUE_SMS_DATABASE_URL)
    && Boolean(env.VENUE_SMS_TURNSTILE_SECRET_KEY)
    && typeof env.VENUE_SMS_RATE_HMAC_SECRET === 'string' && env.VENUE_SMS_RATE_HMAC_SECRET.length >= 32;
  let repositoryPromise;
  const getRepository = () => repositoryPromise ||= loadNeon().then(({neon}) => neonRepository(neon(env.VENUE_SMS_DATABASE_URL)));
  return createHandler({enabled, rateSecret:env.VENUE_SMS_RATE_HMAC_SECRET,
    repository:{consumeRate:async(...args)=>(await getRepository()).consumeRate(...args),persist:async input=>(await getRepository()).persist(input)},
    clientIp: req => {const value=req.headers['x-vercel-forwarded-for'];return typeof value==='string' && isIP(value) ? value : null;},
    verifyChallenge:async({token,origin,action,ip})=>{
      if(typeof token!=='string'||token.length<10||token.length>2048)return false;
      const response=await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
        method:'POST',body:new URLSearchParams({secret:env.VENUE_SMS_TURNSTILE_SECRET_KEY,response:token,remoteip:ip}),signal:AbortSignal.timeout(8000)
      });
      if(!response.ok)return false;
      const proof=await response.json();
      return proof.success===true && proof.hostname===new URL(origin).hostname && proof.action===action;
    }
  });
}
// No generic DATABASE_URL fallback. No logging of request body, DOB or secrets.
export default async function handler(req,res){return buildVercelHandler()(req,res);}
