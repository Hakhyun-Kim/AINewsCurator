import { embedQuery, embedPassages, cosine } from './embeddingService';

// Minimal RAG over the currently loaded articles: an in-memory vector index
// (embeddings computed on device) plus cosine-similarity retrieval. The
// "generation" step is extractive and fully grounded — every line of the
// digest links back to its source article.
class RagService {
  constructor() {
    this.index = new Map(); // article.id -> { article, vector }
  }

  articleText(article) {
    return [article.title, article.description]
      .filter(Boolean)
      .join(' — ')
      .slice(0, 512);
  }

  async indexArticles(articles, onProgress) {
    const pending = articles.filter((a) => a && a.id && !this.index.has(a.id));
    if (pending.length > 0) {
      const vectors = await embedPassages(
        pending.map((a) => this.articleText(a)),
        onProgress
      );
      pending.forEach((article, i) => {
        this.index.set(article.id, { article, vector: vectors[i] });
      });
    }
    return this.index.size;
  }

  async ask(query, articles, k = 5, onProgress) {
    await this.indexArticles(articles, onProgress);
    const queryVector = await embedQuery(query, onProgress);
    const visibleIds = new Set(articles.map((a) => a.id));
    return [...this.index.values()]
      .filter(({ article }) => visibleIds.has(article.id))
      .map(({ article, vector }) => ({ article, score: cosine(queryVector, vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

export default new RagService();
