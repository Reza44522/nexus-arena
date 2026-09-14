const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || '';
const GEMINI_MODELS = ['gemini-3.6-flash'];

function parseJSONSafe(text) {
  try {
    const m = String(text || '').match(/\{[\s\S]*\}/);
    if (!m) return null;
    return JSON.parse(m[0]);
  } catch (e) { return null; }
}
function extractContent(j) {
  if (!j) return '';
  if (typeof j === 'string') return j;
  if (Array.isArray(j)) return extractContent(j[0]);
  if (j.choices && j.choices[0]) {
    const m = j.choices[0].message || j.choices[0];
    if (m && typeof m.content === 'string') return m.content;
  }
  if (j.candidates && j.candidates[0]) {
    const parts = j.candidates[0]?.content?.parts;
    if (parts && parts[0] && typeof parts[0].text === 'string') return parts[0].text;
  }
  if (typeof j.content === 'string') return j.content;
  return '';
}
function gibScore(t) {
  const s = String(t || '').trim();
  if (!s) return 3;
  let bad = 0;
  const words = s.split(/\s+/).filter(Boolean);
  const avgWord = words.length ? s.replace(/\s/g, '').length / words.length : s.length;
  if (avgWord > 18) bad++;
  if (words.length <= 2 && s.length > 60) bad++;
  const vowels = (s.match(/[aeiouآاایوههویي]/gi) || []).length;
  const letters = (s.match(/[a-zا-ی]/gi) || []).length;
  if (letters > 10 && vowels / letters < 0.18) bad++;
  if (!/\s/.test(s) && s.length > 40) bad++;
  const hasFa = /[ا-ی]/.test(s);
  const hasEnWord = /\b[a-zA-Z]{3,}\b/.test(s);
  if (!hasFa && !hasEnWord) bad++;
  return bad;
}
const isGib = (t) => gibScore(t) >= 2;

const JUDGE_SYSTEM =
  'You are the supreme war-simulation judge of a Persian strategy game. Produce a FULL battle report. ' +
  'Reply ONLY with valid JSON in this exact shape: ' +
  '{"sa":0-100,"sd":0-100,"att":"...","def":"...","pub":"...","report":{' +
  '"title":"...","phases":[{"name":"فاز ۱ — ...","att":"...","def":"...","winner":"att|def|draw"},{"name":"فاز ۲ — ...","att":"...","def":"...","winner":"att|def|draw"},{"name":"فاز ۳ — ...","att":"...","def":"...","winner":"att|def|draw"}],' +
  '"turning":"...","mvp":"...","casualties":{"att":"...","def":"..."},' +
  '"myStrengths":["...","...","..."],"myWeaknesses":["...","...","..."],' +
  '"lessons":["...","...","..."]}} ' +
  'Rules: sa/sd are scenario quality scores. All report texts MUST be in Persian. phases = exactly 3 battle phases describing what attacker and defender did in each and who gained the upper hand. turning = the decisive turning point. mvp = the single most impactful action of the battle. casualties = short loss estimate per side. myStrengths/myWeaknesses = exactly 3 bullet items each about the HUMAN PLAYER side. lessons = 3 actionable coaching tips for the player. ' +
  'CRITICAL: If a scenario is gibberish or unreadable, its score MUST be 0-5 and its analysis must say in Persian that the scenario was unreadable and rejected. Never invent tactical meaning for nonsense text.';

async function callGemini(system, user, temp = 0.4) {
  if (!GEMINI_KEY) { console.warn('[WarAI] ❌ کلید جمینای در .env.local نیست'); return null; }
  for (const model of GEMINI_MODELS) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 30000);
      const r = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GEMINI_KEY },
        body: JSON.stringify({ model, temperature: temp, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      if (!r.ok) { console.warn('[WarAI]', model, '→', r.status); continue; }
      const j = await r.json();
      const content = extractContent(j);
      if (content) { console.log('[WarAI] ✅ Gemini OK:', model); return content; }
    } catch (e) { console.warn('[WarAI]', model, '→ NETWORK:', e.message); }
  }
  return null;
}

export async function analyzeWar({ attName, defName, attScenario, defScenario, attCommit, defCommit, playerSide }) {
  const gibA = isGib(attScenario);
  const gibD = isGib(defScenario);
  const note =
    (gibA ? 'SYSTEM NOTE: The ATTACKER scenario is UNREADABLE GIBBERISH. ' : '') +
    (gibD ? 'SYSTEM NOTE: The DEFENDER scenario is UNREADABLE GIBBERISH. ' : '') +
    `SYSTEM NOTE: The HUMAN PLAYER controls the ${playerSide === 'att' ? 'ATTACKER' : 'DEFENDER'} side; the other side is the opponent. myStrengths/myWeaknesses/lessons must refer to the HUMAN PLAYER side. `;
  const content = await callGemini(
    JUDGE_SYSTEM,
    note +
    `Attacker: ${attName} (commit ${attCommit}%) scenario: ${attScenario}\n` +
    `Defender: ${defName} (commit ${defCommit}%) scenario: ${defScenario}`,
    0.4
  );
  const p = parseJSONSafe(content);
  if (!p || p.sa === undefined || p.sd === undefined) return null;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, Number(n) || 0));
  let sa = clamp(p.sa, 0, 100);
  let sd = clamp(p.sd, 0, 100);
  let att = String(p.att || '');
  let def = String(p.def || '');
  const TAG = '⚠️ سناریوی ارسالی این فرمانده ناخوانا و نامعتبر است و به‌عنوان برنامهٔ عملیاتی پذیرفته نشد؛ امتیاز سناریو حداقل شد. ';
  if (gibA) { sa = Math.min(sa, 5); att = TAG + att; }
  if (gibD) { sd = Math.min(sd, 5); def = TAG + def; }
  return { sa, sd, att: att.slice(0, 600), def: def.slice(0, 600), pub: String(p.pub || '').slice(0, 300), report: p.report || null };
}

export async function pingAI(prompt, fallback) {
  const p = typeof prompt === 'string' ? prompt : JSON.stringify(prompt || {});
  const fb = typeof fallback === 'string' ? fallback : '📡 گزارش میدانی: درگیری‌های مرزی ادامه دارد؛ فرماندهان آماده‌باش باشند.';
  const content = await callGemini('You are a war-news announcer for a Persian strategy game. Reply with ONLY one short Persian sentence (max 40 words).', p, 0.7);
  return (content || '').trim() || fb;
}