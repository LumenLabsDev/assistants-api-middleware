/**
 * List of supported model identifiers.
 */
export const SUPPORTED_MODELS = [
  'gpt-4o',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-4.1',
  'gpt-4.1-nano',
  'gpt-4.1-mini',
] as const;

/**
 * Union type of supported model strings.
 */
export type SupportedModel = typeof SUPPORTED_MODELS[number];

/**
 * Normalize an optional model string to a supported model.
 * Falls back to a default when model is undefined or unsupported.
 * @param model Optional model string.
 * @param fallback Model to use when input is invalid; defaults to 'gpt-4o'.
 * @returns Supported model identifier.
 */
export function normalizeModel(model: string | undefined, fallback: SupportedModel = 'gpt-4o'): SupportedModel {
  if (!model) return fallback;
  return (SUPPORTED_MODELS as readonly string[]).includes(model) ? (model as SupportedModel) : fallback;
}


