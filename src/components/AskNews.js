import React, { useState } from 'react';
import { Sparkles, Search, ExternalLink, Settings, KeyRound } from 'lucide-react';
import ragService from '../services/ragService';
import {
  generateGroundedAnswer,
  getApiKey,
  setApiKey,
  getModel,
  setModel,
  DEFAULT_MODEL,
} from '../services/llmService';

function AskNews({ articles, darkMode, language }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(getApiKey());
  const [modelInput, setModelInput] = useState(getModel());
  const [keySaved, setKeySaved] = useState(false);

  const t = (en, ko) => (language === 'ko' ? ko : en);

  const saveSettings = () => {
    setApiKey(keyInput);
    setModel(modelInput);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 1500);
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim() || busy || articles.length === 0) return;

    setBusy(true);
    setResults(null);
    setAnswer(null);
    setStatus(t('Preparing on-device embedding model…', '온디바이스 임베딩 모델 준비 중…'));
    try {
      // 1) Retrieve — embeddings + cosine over today's articles (on device).
      const hits = await ragService.ask(query, articles, 5, (pct, file) =>
        setStatus(
          `${t('Downloading embedding model', '임베딩 모델 다운로드 중')} ${pct}% (${file})`
        )
      );
      setResults(hits);

      // 2) Generate — if a key is set, ask the LLM to answer grounded on the
      //    retrieved articles; otherwise stop at retrieval (still useful).
      if (getApiKey()) {
        setStatus(t('Generating grounded answer…', '근거 기반 답변 생성 중…'));
        try {
          const text = await generateGroundedAnswer(
            query,
            hits.map((h) => h.article),
            { language }
          );
          setAnswer(text);
        } catch (genErr) {
          console.error('Generation failed:', genErr);
          const msg =
            genErr.code === 'BAD_KEY'
              ? t('OpenAI rejected the API key. Check it in Settings.', 'OpenAI가 API 키를 거부했습니다. 설정에서 확인하세요.')
              : t('Answer generation failed — showing retrieved sources only.', '답변 생성에 실패했습니다 — 검색된 출처만 표시합니다.');
          setAnswer({ error: msg });
        }
      }
      setStatus(null);
    } catch (error) {
      console.error('Semantic search failed:', error);
      setStatus(t('Semantic search failed — see console.', '시맨틱 검색에 실패했습니다 — 콘솔을 확인하세요.'));
    } finally {
      setBusy(false);
    }
  };

  const hasKey = Boolean(getApiKey());

  return (
    <section
      className={`rounded-lg border p-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">
            {t('Ask the News — RAG', '뉴스에 질문하기 — RAG')}
          </h2>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              hasKey
                ? 'bg-green-100 text-green-700'
                : darkMode
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {hasKey
              ? t('retrieve + generate', '검색 + 생성')
              : t('retrieve only', '검색 전용')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={t('Settings', '설정')}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {showSettings && (
        <div
          className={`rounded-md border p-4 mb-4 ${
            darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <KeyRound className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">
              {t('OpenAI API key (optional)', 'OpenAI API 키 (선택)')}
            </span>
          </div>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-..."
            className={`w-full px-3 py-2 rounded-md border text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder={DEFAULT_MODEL}
            className={`w-full px-3 py-2 rounded-md border text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={saveSettings}
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {keySaved ? t('Saved ✓', '저장됨 ✓') : t('Save', '저장')}
            </button>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t(
                'Stored only in your browser (localStorage). Enables generated answers on top of retrieval.',
                '브라우저(localStorage)에만 저장됩니다. 검색 위에 생성형 답변을 추가합니다.'
              )}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleAsk} className="flex space-x-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(
            'e.g. What moved the markets today?',
            '예: 오늘 증시에 영향 준 소식은?'
          )}
          className={`flex-1 px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className={`px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 ${
            busy || !query.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Search className={`h-4 w-4 ${busy ? 'animate-pulse' : ''}`} />
          <span>{t('Ask', '질문')}</span>
        </button>
      </form>

      <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {t(
          'Retrieval runs in your browser: multilingual-e5-small embeddings via Transformers.js — no key, cached after first load. Add an OpenAI key in Settings to also generate a grounded answer (retrieve → augment → generate).',
          '검색은 브라우저에서 동작합니다: Transformers.js 기반 multilingual-e5-small 임베딩 — 키 불필요, 최초 로드 후 캐시. 설정에서 OpenAI 키를 넣으면 근거 기반 답변까지 생성합니다 (검색 → 증강 → 생성).'
        )}
      </p>

      {status && (
        <div className={`mt-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {status}
        </div>
      )}

      {answer && (
        <div
          className={`mt-4 rounded-md border p-4 ${
            darkMode ? 'border-blue-900/50 bg-blue-950/30' : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">
              {t('Generated answer (grounded)', '생성된 답변 (근거 기반)')}
            </span>
          </div>
          {answer.error ? (
            <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
              {answer.error}
            </p>
          ) : (
            <p className={`text-sm whitespace-pre-line ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {answer}
            </p>
          )}
        </div>
      )}

      {results && (
        <div className="mt-4 space-y-3">
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {t(
              answer && !answer.error
                ? 'Sources — the retrieved articles the answer is grounded on:'
                : 'Grounded digest — every line links to its source:',
              answer && !answer.error
                ? '출처 — 답변의 근거가 된 검색 기사:'
                : '근거 기반 다이제스트 — 모든 항목은 원문으로 연결됩니다:'
            )}
          </p>
          {results.map(({ article, score }, i) => (
            <div
              key={article.id}
              className={`rounded-md border p-3 ${
                darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-baseline justify-between space-x-3">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <span>
                    [{i + 1}] {article.title}
                  </span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
                <span className={`text-xs whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('similarity', '유사도')} {(score * 100).toFixed(0)}%
                </span>
              </div>
              {article.description && (
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {article.description.length > 180
                    ? `${article.description.slice(0, 180)}…`
                    : article.description}
                </p>
              )}
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {article.source}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AskNews;
