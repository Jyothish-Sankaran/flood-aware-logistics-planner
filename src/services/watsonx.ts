import { CargoCategory } from '../scenario/scenario';
import { classifyCargoText, CargoClassificationResult } from '../engines/cargoClassifier';

const PROXY_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WATSONX_PROXY_URL) ||
  'http://localhost:3001';

/**
 * Attempts NLP classification using watsonx.ai Granite proxy with strict 3-second timeout and automatic fallback.
 */
export async function queryWatsonxClassify(
  text: string
): Promise<CargoClassificationResult> {
  const fallback = classifyCargoText(text);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${PROXY_URL}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server status ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.data?.category) {
      return {
        ...fallback,
        category: data.data.category as CargoCategory,
        sourceBadge: 'watsonx.ai Granite',
        reasoning: `Classified via IBM watsonx.ai Granite. Priority: ${data.data.primaryPriority || fallback.primaryPriority}`,
      };
    }

    return fallback;
  } catch (err: unknown) {
    // Graceful fallback to rule-based template
    return fallback;
  }
}
