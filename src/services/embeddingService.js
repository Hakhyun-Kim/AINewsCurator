// In-browser text embeddings via Transformers.js (ONNX/WASM) — no API key,
// no server, works in the web app and the Electron build alike.
//
// Loaded at runtime from CDN with a webpackIgnore dynamic import because
// CRA 5 cannot bundle @xenova/transformers without ejecting. The model is
// downloaded once by the browser (~112 MB quantized) and cached.
const CDN_URL = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
// multilingual-e5-small: solid Korean + English retrieval quality at small size
const MODEL_ID = 'Xenova/multilingual-e5-small';

let extractorPromise = null;

async function getExtractor(onProgress) {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import(/* webpackIgnore: true */ CDN_URL);
      env.allowLocalModels = false;
      return pipeline('feature-extraction', MODEL_ID, {
        progress_callback: (p) => {
          if (onProgress && p.status === 'progress' && p.total) {
            onProgress(Math.round((p.loaded / p.total) * 100), p.file);
          }
        },
      });
    })().catch((err) => {
      extractorPromise = null; // allow retry after a failed load
      throw err;
    });
  }
  return extractorPromise;
}

async function embed(texts, onProgress) {
  const extractor = await getExtractor(onProgress);
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  const [n, dim] = output.dims;
  const vectors = [];
  for (let i = 0; i < n; i += 1) {
    vectors.push(output.data.slice(i * dim, (i + 1) * dim));
  }
  return vectors;
}

// E5-family models expect task prefixes on both sides of retrieval
export async function embedQuery(text, onProgress) {
  const vectors = await embed([`query: ${text}`], onProgress);
  return vectors[0];
}

export function embedPassages(texts, onProgress) {
  return embed(texts.map((t) => `passage: ${t}`), onProgress);
}

// vectors are L2-normalized, so cosine similarity is a plain dot product
export function cosine(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) dot += a[i] * b[i];
  return dot;
}
