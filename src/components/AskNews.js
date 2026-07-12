import React, { useState } from 'react';
import { Sparkles, Search, ExternalLink } from 'lucide-react';
import ragService from '../services/ragService';

function AskNews({ articles, darkMode, language }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);

  const t = (en, ko) => (language === 'ko' ? ko : en);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim() || busy || articles.length === 0) return;

    setBusy(true);
    setResults(null);
    setStatus(t('Preparing on-device embedding model…', '온디바이스 임베딩 모델 준비 중…'));
    try {
      const hits = await ragService.ask(query, articles, 5, (pct, file) =>
        setStatus(
          `${t('Downloading embedding model', '임베딩 모델 다운로드 중')} ${pct}% (${file})`
        )
      );
      setResults(hits);
      setStatus(null);
    } catch (error) {
      console.error('Semantic search failed:', error);
      setStatus(t('Semantic search failed — see console.', '시맨틱 검색에 실패했습니다 — 콘솔을 확인하세요.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={`rounded-lg border p-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold">
          {t('Ask the News — semantic search (RAG)', '뉴스에 질문하기 — 시맨틱 검색 (RAG)')}
        </h2>
      </div>

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
          'Runs entirely in your browser: multilingual-e5-small embeddings via Transformers.js — no API key, downloaded once (~112 MB) and cached.',
          '전부 브라우저 안에서 동작합니다: Transformers.js 기반 multilingual-e5-small 임베딩 — API 키 불필요, 최초 1회 다운로드(~112 MB) 후 캐시됩니다.'
        )}
      </p>

      {status && (
        <div className={`mt-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {status}
        </div>
      )}

      {results && (
        <div className="mt-4 space-y-3">
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {t(
              'Grounded digest — every line links to its source:',
              '근거 기반 다이제스트 — 모든 항목은 원문으로 연결됩니다:'
            )}
          </p>
          {results.map(({ article, score }) => (
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
                  <span>{article.title}</span>
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
