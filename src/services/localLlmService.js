// Local generation half of the RAG loop: runs a small instruct model fully
// in the browser via WebLLM (WebGPU) — no API key, no server, no account.
// This is the keyless default; the OpenAI path (llmService.js) is the optional
// higher-quality tier. Same grounded prompt as the cloud path (ragPrompt.js).
import { buildRagMessages } from './ragPrompt';

const CDN_URL = 'https://esm.run/@mlc-ai/web-llm';
// Qwen2.5-1.5B: strong multilingual (incl. Korean) at a browser-friendly size;
// q4f32_1 avoids the shader-f16 requirement, so it runs on more GPUs.
export const DEFAULT_LOCAL_MODEL = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';

let enginePromise = null;
let loadedModel = null;

export function webgpuAvailable() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

async function getEngine(model, onProgress) {
  if (enginePromise && loadedModel === model) return enginePromise;
  loadedModel = model;
  enginePromise = (async () => {
    const webllm = await import(/* webpackIgnore: true */ CDN_URL);
    return webllm.CreateMLCEngine(model, {
      initProgressCallback: (report) => {
        // report.text is a human string; report.progress is 0..1
        if (onProgress) onProgress(report.text || '', report.progress);
      },
    });
  })().catch((err) => {
    enginePromise = null; // allow retry after a failed load
    loadedModel = null;
    throw err;
  });
  return enginePromise;
}

// Downloads/initializes the model weights (first call only) without generating.
export function warmUpLocal(model = DEFAULT_LOCAL_MODEL, onProgress) {
  return getEngine(model, onProgress);
}

export async function generateGroundedAnswerLocal(
  query,
  articles,
  { language = 'en', model = DEFAULT_LOCAL_MODEL, onProgress } = {}
) {
  if (!webgpuAvailable()) {
    const err = new Error('WebGPU is not available in this browser');
    err.code = 'NO_WEBGPU';
    throw err;
  }

  const engine = await getEngine(model, onProgress);
  const messages = buildRagMessages(query, articles, language);

  const reply = await engine.chat.completions.create({
    messages,
    temperature: 0.2,
    max_tokens: 400,
  });

  return reply?.choices?.[0]?.message?.content?.trim() || '';
}
