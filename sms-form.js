/* Reusable accessible form logic. Config is generated from server consent text.
   Endpoint/site key intentionally blank until parent verifies live wiring. */
const config = JSON.parse(document.getElementById('sms-config').textContent);
const form = document.getElementById('sms-form');
const result = document.getElementById('result');
const button = form.querySelector('button[type=submit]');
let submissionId = crypto.randomUUID();
let lastPayload = '';
function selected() { return form.elements.transactional.checked || form.elements.marketing.checked; }
function update() {
  for (const name of ['phone','dob']) { form.elements[name].required = selected(); form.elements[name].disabled = !selected(); }
}
form.addEventListener('change',update); update();
form.addEventListener('submit', async event => {
  event.preventDefault(); result.textContent='';
  if (!selected()) { result.textContent='No SMS enrollment requested. You can still contact us or book using the links above.'; return; }
  if (!config.endpoint || !config.siteKey) { result.textContent='SMS enrollment is not available yet. You can still contact us or book.'; return; }
  const choices = {venue:config.venue, version:config.version, phone:form.elements.phone.value, dob:form.elements.dob.value,transactional:form.elements.transactional.checked,marketing:form.elements.marketing.checked};
  const signature = JSON.stringify(choices);
  if (lastPayload && signature !== lastPayload) submissionId=crypto.randomUUID();
  lastPayload=signature;
  const challengeToken = form.querySelector('[name=cf-turnstile-response]')?.value;
  if (!challengeToken) { result.textContent='Please complete the security check.'; return; }
  button.disabled=true;
  try {
    const response=await fetch(config.endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({...choices,submissionId,challengeToken})});
    const body=await response.json();
    if (!response.ok || body.status!=='preferences_recorded' || !body.reference) throw new Error('not recorded');
    result.textContent=`Your choices were recorded. Reference: ${body.reference}. No text has been sent; messaging activation is pending.`;
    form.elements.dob.value=''; // never persist DOB locally or in logs
  } catch { result.textContent='We could not confirm that your choices were recorded. Please retry or contact the venue. Do not assume you are enrolled.'; }
  finally { button.disabled=false; window.turnstile?.reset(); }
});
