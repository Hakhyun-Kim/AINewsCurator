import React, { useState } from 'react';
import { Sparkles, Search, ExternalLink, Settings, KeyRound, Cpu } from 'lucide-react';
import ragService from '../services/ragService';
import {
  generateGroundedAnswer,
  getApiKey,
  setApiKey,
  getModel,
  setModel,
  DEFAULT_MODEL,
} from '../services/llmService';
import {
  generateGroundedAnswerLocal,
  webgpuAvailable,
  DEFAULT_LOCAL_MODEL,
} from '../services/localLlmService';

function AskNews({ articles, darkMode, language }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [engineLabel, setEngineLabel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(getApiKey());
  const [modelInput, setModelInput] = useState(getModel());
  const [keySaved, setKeySaved] = useState(false);

  const t = (en, ko) => (language === 'ko' ? ko : en);

  // Which generation tier will run: OpenAI if a key is set, else local WebLLM
  // if the browser has WebGPU, else retrieval only.
  const tier = getApiKey() ? 'openai' : webgpuAvailable() ? 'local' : 'none';

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
    setEngineLabel(null);
    setStatus(t('Preparing on-device embedding model…', '온디바이스 임베딩 모델 준비 중…'));
    try {
      // 1) Retrieve — embeddings + cosine over today's articles (on device).
      const hits = await ragService.ask(query, articles, 5, (pct, file) =>
        setStatus(`${t('Downloading embedding model', '임베딩 모델 다운로드 중')} ${pct}% (${file})`)
      );
      setResults(hits);
      const retrieved = hits.map((h) => h.article);

      // 2) Generate — pick the best available backend.
      if (tier === 'openai') {
        setStatus(t('Generating grounded answer (OpenAI)…', '근거 기반 답변 생성 중 (OpenAI)…'));
        try {
          const text = await generateGroundedAnswer(query, retrieved, { language });
          setAnswer(text);
          setEngineLabel(`OpenAI · ${getModel()}`);
        } catch (genErr) {
          console.error('OpenAI generation failed:', genErr);
          setAnswer({
            error:
              genErr.code === 'BAD_KEY'
                ? t('OpenAI rejected the API key. Check it in Settings.', 'OpenAI가 API 키를 거부했습니다. 설정에서 확인하세요.')
                : t('OpenAI generation failed — showing retrieved sources only.', 'OpenAI 생성 실패 — 검색된 출처만 표시합니다.'),
          });
        }
      } else if (tier === 'local') {
        setStatus(t('Loading local model (first run downloads ~1 GB)…', '로컬 모델 로딩 중 (최초 실행 시 ~1 GB 다운로드)…'));
        try {
          const text = await generateGroundedAnswerLocal(query, retrieved, {
            language,
            onProgress: (msg) => msg && setStatus(msg),
          });
          setAnswer(text);
          setEngineLabel(`${DEFAULT_LOCAL_MODEL} · ${t('local, in-browser', '로컬, 브라우저 내')}`);
        } catch (genErr) {
          console.error('Local generation failed:', genErr);
          setAnswer({
            error: t(
              'Local model failed to run — showing retrieved sources only. Add an OpenAI key in Settings for a cloud fallback.',
              '로컬 모델 실행 실패 — 검색된 출처만 표시합니다. 설정에서 OpenAI 키를 넣으면 클라우드로 대체됩니다.'
            ),
          });
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

  const badge =
    tier === 'openai'
      ? { text: t('generate: OpenAI', '생성: OpenAI'), cls: 'bg-green-100 text-green-700' }
      : tier === 'local'
      ? { text: t('generate: local', '생성: 로컬'), cls: 'bg-indigo-100 text-indigo-700' }
      : { text: t('retrieve only', '검색 전용'), cls: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600' };

  return (
    <section
      className={`rounded-lg border p-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">{t('Ask the News — RAG', '뉴스에 질문하기 — RAG')}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span>
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
              {t('OpenAI API key — optional, higher quality', 'OpenAI API 키 — 선택, 고품질')}
            </span>
          </div>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-..."
            className={`w-full px-3 py-2 rounded-md border text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder={DEFAULT_MODEL}
            className={`w-full px-3 py-2 rounded-md border text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
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
              {t('Stored only in your browser (localStorage).', '브라우저(localStorage)에만 저장됩니다.')}
            </span>
          </div>
          <div className={`mt-3 pt-3 border-t flex items-start space-x-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Cpu className="h-4 w-4 mt-0.5 text-indigo-500 flex-shrink-0" />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {webgpuAvailable()
                ? t(
                    `No key? Generation runs locally in your browser with ${DEFAULT_LOCAL_MODEL} via WebGPU — no account, no server. First run downloads the model (~1 GB) and caches it.`,
                    `키가 없으면 ${DEFAULT_LOCAL_MODEL} 모델이 WebGPU로 브라우저 안에서 로컬 생성합니다 — 계정·서버 불필요. 최초 실행 시 모델(~1 GB)을 받아 캐시합니다.`
                  )
                : t(
                    'This browser has no WebGPU, so local generation is unavailable — add an OpenAI key above, or use retrieval-only results.',
                    '이 브라우저는 WebGPU가 없어 로컬 생성이 불가합니다 — 위에 OpenAI 키를 넣거나 검색 전용 결과를 사용하세요.'
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
          placeholder={t('e.g. What moved the markets today?', '예: 오늘 증시에 영향 준 소식은?')}
          className={`flex-1 px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
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
          'Full RAG in your browser: multilingual-e5-small embeddings retrieve the articles (no key), then a model generates a grounded answer — a local WebGPU model by default, or OpenAI if you add a key in Settings.',
          '브라우저 안에서 완결되는 RAG: multilingual-e5-small 임베딩이 기사를 검색(키 불필요)하고, 모델이 근거 기반 답변을 생성합니다 — 기본은 로컬 WebGPU 모델, 설정에서 키를 넣으면 OpenAI.'
        )}
      </p>

      {status && (
        <div className={`mt-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{status}</div>
      )}

      {answer && (
        <div
          className={`mt-4 rounded-md border p-4 ${
            darkMode ? 'border-blue-900/50 bg-blue-950/30' : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{t('Generated answer (grounded)', '생성된 답변 (근거 기반)')}</span>
            </div>
            {engineLabel && !answer.error && (
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{engineLabel}</span>
            )}
          </div>
          {answer.error ? (
            <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{answer.error}</p>
          ) : (
            <p className={`text-sm whitespace-pre-line ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{answer}</p>
          )}
        </div>
      )}

      {results && (
        <div className="mt-4 space-y-3">
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {t(
              answer && !answer.error ? 'Sources — the retrieved articles the answer is grounded on:' : 'Grounded digest — every line links to its source:',
              answer && !answer.error ? '출처 — 답변의 근거가 된 검색 기사:' : '근거 기반 다이제스트 — 모든 항목은 원문으로 연결됩니다:'
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
                  {article.description.length > 180 ? `${article.description.slice(0, 180)}…` : article.description}
                </p>
              )}
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{article.source}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AskNews;
