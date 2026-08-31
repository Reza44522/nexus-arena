import { supabase } from './supabase';

const clamp = (n) => Math.max(0, Math.min(100, isNaN(n) ? 0 : n));

export async function getAISettings() {
  const { data } = await supabase.from('ai_settings').select('*').eq('id', 1).maybeSingle();
  return {
    provider: data?.provider || 'local',
    api_key: (data?.api_key || '').trim(),
    model: (data?.model || '').trim(),
  };
}

function buildPrompt(i) {
  return `تو «ژنرال هوش مصنوعی تاکتیکی» یک بازی جنگ استراتژیک هستی. دو فرمانده سناریوی حمله و دفاع نوشته‌اند. با معیارهای عمق تاکتیکی، تنوع یگان‌ها، لجستیک، پدافند، ضدحمله، غافلگیری و واقع‌گرایی نظامی قضاوت کن.
فقط و فقط یک JSON معتبر برگردان (بدون هیچ متن اضافه):
{"att_score": <عدد 0-100>, "def_score": <عدد 0-100>, "att_analysis": "<تحلیل 2-3 جمله‌ای فارسی فرمانده اول>", "def_analysis": "<تحلیل 2-3 جمله‌ای فارسی فرمانده دوم>", "public": "<یک جمله خبری فارسی درباره برنده و دلیل اصلی>"}

فرمانده اول: ${i.attName} (تعهد تجهیزات ${i.attCommit}٪)
سناریوی فرمانده اول: ${i.attScenario}

فرمانده دوم: ${i.defName} (تعهد تجهیزات ${i.defCommit}٪)
سناریوی فرمانده دوم: ${i.defScenario}`;
}

const TEST_PROMPT = 'فقط یک JSON تست برگردان: {"att_score":70,"def_score":60,"att_analysis":"تست اتصال موفق","def_analysis":"تست اتصال موفق","public":"✅ اتصال برقرار است"}';

function parse(text) {
  const m = (text || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    return {
      sa: clamp(Number(j.att_score)),
      sd: clamp(Number(j.def_score)),
      att: String(j.att_analysis || ''),
      def: String(j.def_analysis || ''),
      pub: String(j.public || ''),
    };
  } catch {
    return null;
  }
}

function extractText(provider, body) {
  if (provider === 'gemini') return body?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return body?.choices?.[0]?.message?.content || '';
}

const COMPAT = {
  bazaarlink: { base: 'https://api.bazaarlink.ai/v1', models: ['gpt-4o-mini', 'qwen-plus', 'qwen-max'] },
  grok: { base: 'https://api.x.ai/v1', models: ['grok-3-mini', 'grok-3', 'grok-4'] },
  zai: { base: 'https://api.z.ai/api/paas/v4', models: ['glm-4.5-flash', 'glm-4.5-air', 'glm-4.7', 'glm-4.6', 'glm-4.5'] },
  deepseek: { base: 'https://api.deepseek.com', models: ['deepseek-chat', 'deepseek-reasoner'] },
  openai: { base: 'https://api.openai.com/v1', models: ['gpt-4o-mini', 'gpt-4o'] },
  qwen: { base: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', models: ['qwen-plus', 'qwen-turbo', 'qwen3.7-max'] },
  groq: { base: 'https://api.groq.com/openai/v1', models: ['llama-3.1-8b-instant'] },
  openrouter: { base: 'https://openrouter.ai/api/v1', models: ['meta-llama/llama-3.1-8b-instruct'] },
};

async function directCall(provider, model, key, prompt) {
  if (provider === 'gemini') {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} — ` + (await r.text()).slice(0, 160));
    return extractText('gemini', await r.json());
  }
  const c = COMPAT[provider];
  const r = await fetch(c.base + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} — ` + (await r.text()).slice(0, 160));
  return extractText(provider, await r.json());
}

async function serverProxy(prompt) {
  try {
    const { data: id, error } = await supabase.rpc('ai_start', { p_prompt: prompt });
    if (error) return { err: 'RPC ai_start: ' + error.message };
    if (id == null) return { err: 'ai_start=null (کلید خالی یا pg_net غیرفعال)' };
    for (let i = 0; i < 16; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const { data, error: e2 } = await supabase.rpc('ai_poll', { p_id: id });
      if (e2) return { err: 'RPC ai_poll: ' + e2.message };
      if (data?.state === 'done') {
        if (data.code >= 200 && data.code < 300) return { body: data.body };
        return { err: `proxy HTTP ${data.code}: ` + JSON.stringify(data.body).slice(0, 160) };
      }
      if (data?.state === 'error') return { err: 'proxy: ' + (data.detail || 'خطای شبکه سرور') };
    }
    return { err: 'proxy timeout (24 ثانیه)' };
  } catch (e) {
    return { err: String(e?.message || e) };
  }
}

export async function analyzeWar(input, withDetail = false) {
  const s = await getAISettings();
  const fail = (d) => (withDetail ? { ok: false, detail: d } : null);

  if (s.provider === 'local') return fail('روی موتور داخلی تنظیم شده');
  if (!s.api_key) return fail('کلید API ذخیره نشده');

  const prompt = withDetail ? TEST_PROMPT : buildPrompt(input);
  let text = '';
  let proxyErr = '';

  if (s.provider === 'gemini') {
    for (const m of s.model ? [s.model] : ['gemini-3.6-flash', 'gemini-2.5-flash']) {
      try { text = await directCall('gemini', m, s.api_key, prompt); break; }
      catch (e) { console.warn('🤖 [gemini/' + m + ']', e.message); }
    }
  } else if (COMPAT[s.provider]) {
    for (const m of s.model ? [s.model] : COMPAT[s.provider].models) {
      try { text = await directCall(s.provider, m, s.api_key, prompt); break; }
      catch (e) { console.warn('🤖 [' + s.provider + '/' + m + ']', e.message); }
    }
  } else {
    return fail('پرووایدر ناشناخته: ' + s.provider);
  }

  if (!text) {
    const pr = await serverProxy(prompt);
    if (pr.body) text = extractText(s.provider, pr.body);
    else proxyErr = pr.err;
  }

  const parsed = parse(text);
  if (!parsed) {
    return fail(text ? 'پاسخ JSON نبود: ' + text.slice(0, 100) : 'سرور: ' + (proxyErr || 'نامشخص'));
  }
  return withDetail ? { ok: true, ...parsed } : parsed;
}

export const pingAI = () => analyzeWar(null, true);