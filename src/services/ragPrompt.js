// Shared prompt builder for the generation step of the RAG loop, so the
// cloud (OpenAI) and local (WebLLM) backends stay grounded identically.

function buildContext(articles) {
  return articles
    .map((a, i) => {
      const body = [a.title, a.description].filter(Boolean).join(' — ');
      return `[${i + 1}] ${body}\n    source: ${a.source || 'unknown'} | ${a.url || ''}`;
    })
    .join('\n');
}

// Returns OpenAI-style chat messages that both backends accept unchanged.
export function buildRagMessages(query, articles, language = 'en') {
  const langLine =
    language === 'ko'
      ? 'Respond in Korean.'
      : 'Respond in the same language as the question.';

  const system = [
    'You are a news assistant answering questions strictly from a provided set of articles.',
    'Rules:',
    '- Use ONLY the numbered articles below. Do not use outside knowledge.',
    '- Cite the articles you rely on with bracketed numbers like [1], [2].',
    '- If the articles do not contain the answer, say so plainly; do not speculate.',
    '- Be concise: 2-4 sentences.',
    langLine,
  ].join('\n');

  const user = `Question: ${query}\n\nArticles:\n${buildContext(articles)}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
