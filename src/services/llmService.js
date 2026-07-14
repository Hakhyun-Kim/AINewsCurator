// Generation half of the RAG loop: given a question and the articles the
// retriever already selected, ask an OpenAI model to write a grounded answer
// that cites its sources by number. The model is instructed to use ONLY the
// supplied articles, so the answer stays anchored to today's news.
//
// The API key is user-supplied and lives only in the browser (localStorage);
// it is never bundled, logged, or sent anywhere except api.openai.com.
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
export const DEFAULT_MODEL = 'gpt-4o-mini';

const KEY_STORAGE = 'openai_api_key';
const MODEL_STORAGE = 'openai_model';

export const getApiKey = () => localStorage.getItem(KEY_STORAGE) || '';
export const setApiKey = (v) => localStorage.setItem(KEY_STORAGE, v.trim());
export const getModel = () => localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
export const setModel = (v) => localStorage.setItem(MODEL_STORAGE, (v || '').trim() || DEFAULT_MODEL);

function buildContext(articles) {
  return articles
    .map((a, i) => {
      const body = [a.title, a.description].filter(Boolean).join(' — ');
      return `[${i + 1}] ${body}\n    source: ${a.source || 'unknown'} | ${a.url || ''}`;
    })
    .join('\n');
}

// articles: the retrieved top-k, already ranked by the embedding search.
// Returns the model's grounded answer as a string.
export async function generateGroundedAnswer(query, articles, { language = 'en' } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const err = new Error('NO_API_KEY');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const langLine =
    language === 'ko'
      ? 'Respond in Korean.'
      : 'Respond in the same language as the question.';

  const system = [
    'You are a news assistant answering questions strictly from a provided set of articles.',
    'Rules:',
    '- Use ONLY the numbered articles below. Do not use outside knowledge.',
    '- Cite the articles you rely on with bracketed numbers like [1], [2].',
    "- If the articles do not contain the answer, say so plainly; do not speculate.",
    '- Be concise: 2-4 sentences.',
    langLine,
  ].join('\n');

  const user = `Question: ${query}\n\nArticles:\n${buildContext(articles)}`;

  let response;
  try {
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getModel(),
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
  } catch (networkErr) {
    const err = new Error('Network error calling OpenAI');
    err.code = 'NETWORK';
    err.cause = networkErr;
    throw err;
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.error?.message || detail;
    } catch (_) {
      /* keep the status-code detail */
    }
    const err = new Error(detail);
    err.code = response.status === 401 ? 'BAD_KEY' : 'API_ERROR';
    throw err;
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}
