/**
 * nn-conntent/scripts/lib/field-consumers.mjs
 *
 * Which module reads each registry field. The point is to make dead and phantom fields fail
 * CI (design A11, capability video-field-registry "Every Field Is Read And Every Read Is
 * Defined"): a registry field with no consumer is dead, and a consumer naming a field the
 * blueprint does not declare is phantom.
 *
 * Three buckets, all explicit:
 *   FIELD_CONSUMERS      the current engine reads the field (module names only);
 *   PLANNED_CONSUMERS    the field exists in V_0-15-0 and a named later slice reads it;
 *   IGNORED_BY_DESIGN    the field is annotation, never engine input, with its reason.
 *
 * Each slice deletes its `PLANNED_CONSUMERS` entries when it lands, so an entry that
 * outlives its slice is a visible lie.
 */

/** Fields the current engine reads, with the module that reads them. */
export const FIELD_CONSUMERS = {
  title: ['scene-compiler.mjs'],
  presets: ['lib/presets.mjs'],
  voice: ['lib/tts-options.mjs'],
  voice_model: ['lib/tts-options.mjs'],
  voice_speed: ['lib/tts-options.mjs'],
  voice_emotion: ['lib/tts-options.mjs'],
  avatar: ['lib/avatar-jobs.mjs'],
  avatar_model: ['lib/avatar-jobs.mjs', 'asset-cost-estimator.mjs'],
  avatar_resolution: ['lib/avatar-jobs.mjs', 'lib/avatar-request.mjs'],
  image_model: ['asset-cost-estimator.mjs', 'video-engine-cli.mjs'],
  background_audio: ['scene-compiler.mjs'],
  background_audio_volume: ['scene-compiler.mjs'],
  transition: ['scene-compiler.mjs', 'lib/frame-tokens.mjs'],
  frame: ['scene-compiler.mjs', 'lib/frame-tokens.mjs'],
  components: ['scene-compiler.mjs'],
  sounds: ['video-engine-cli.mjs'],
  fit: ['scene-compiler.mjs'],
  type: ['scene-compiler.mjs'],
  asset: ['scene-compiler.mjs'],
  prompt: ['scene-compiler.mjs', 'lib/image-options.mjs'],
  text: ['scene-compiler.mjs'],
  position: ['scene-compiler.mjs'],
  enter_animation: ['scene-compiler.mjs'],
  exit_animation: ['scene-compiler.mjs'],
  z_index: ['scene-compiler.mjs'],
  output_formats: ['scene-compiler.mjs'],
};

/**
 * Fields declared by V_0-15-0 whose consumer lands in a named later slice. Each slice must
 * delete its entries here when it lands.
 */
export const PLANNED_CONSUMERS = {
  kind: '4',
  review: '7a',
  for: '7a',
  role: '4',
  narration: '4',
  max_duration: '4',
  variants: '4',
  fixed: '4',
  chrome: '4',
  watermark: '4',
  cta: '4',
  bumper: '4',
  music: '4',
  language: '4',
  budget: '7a',
  daily_budget: '7a',
  script_review: '7a',
  status: '7a',
  script: '7a',
  master: '7a',
  published_url: '7a',
  thumbnail: '7a',
  description: '10',
  intro: '5',
  style: '5',
  source: '5',
  placement: '5',
  timing: '5',
  image_size: '5',
  name: '3a',
  api_base: '3a',
  provider: '3a',
  api_id: '3a',
  capability: '3a',
  controls: '3a',
  sizes: '3a',
  adapter: '3a',
  price: '3b',
  price_unit: '3b',
  price_date: '3b',
  price_source: '3b',
  stale_after_days: '3b',
  allowed: '3a',
  voice_id: '3a',
};

/** Fields that are annotation by design: never engine input, so never a phantom. */
export const IGNORED_BY_DESIGN = {
  tags: 'classification label read by the console and the docs, never by the engine',
};

/**
 * @param {{ fields: Record<string, unknown> }} registry
 * @returns {{ dead: string[], phantom: string[], ignored: string[] }}
 */
export function auditConsumers(registry) {
  const declared = new Set(Object.keys(registry.fields || {}));
  const dead = [];
  const phantom = [];
  for (const field of declared) {
    if (!FIELD_CONSUMERS[field] && !PLANNED_CONSUMERS[field] && !IGNORED_BY_DESIGN[field]) dead.push(field);
  }
  for (const field of [...Object.keys(FIELD_CONSUMERS), ...Object.keys(PLANNED_CONSUMERS), ...Object.keys(IGNORED_BY_DESIGN)]) {
    if (!declared.has(field)) phantom.push(field);
  }
  return { dead, phantom, ignored: Object.keys(IGNORED_BY_DESIGN).sort() };
}

/** Consumers of one field: real module(s), the slice that will read it, or the design reason. */
export function consumerOf(field) {
  if (FIELD_CONSUMERS[field]) return { kind: 'module', modules: FIELD_CONSUMERS[field] };
  if (PLANNED_CONSUMERS[field]) return { kind: 'slice', slice: PLANNED_CONSUMERS[field] };
  if (IGNORED_BY_DESIGN[field]) return { kind: 'ignored', reason: IGNORED_BY_DESIGN[field] };
  return null;
}
