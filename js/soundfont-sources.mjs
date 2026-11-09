export const DEFAULT_SOUNDFONT = 'FatBoy';
export const DEFAULT_SOUNDFONT_URL = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/{sf}/{name}-{fmt}.js';
const RAW_URL = 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/{sf}/{name}-{fmt}.js';
const LEGACY_URL = 'https://gleitz.github.io/midi-js-soundfonts/{sf}/{name}-{fmt}.js';

export function soundfontSources(name, bank, format, template = DEFAULT_SOUNDFONT_URL) {
  // Custom hosts stay under the user's control; only mirror the known public bank.
  const templates = [DEFAULT_SOUNDFONT_URL, RAW_URL, LEGACY_URL].includes(template)
    ? [template, DEFAULT_SOUNDFONT_URL, RAW_URL, LEGACY_URL] : [template];
  return [...new Set(templates)].map(t => t.replaceAll('{sf}', encodeURIComponent(bank))
    .replaceAll('{name}', encodeURIComponent(name)).replaceAll('{fmt}', format));
}

export async function loadSoundfontFromSources(urls, load, timeoutMs = 25000) {
  const failures = [];
  for (const url of urls) {
    let timer, expired = false;
    try {
      const pending = Promise.resolve().then(() => load(url)).then(instrument => {
        if (expired) { instrument.stop?.(); instrument.out?.disconnect(); }
        return instrument;
      });
      return await Promise.race([pending, new Promise((_, reject) => {
        timer = setTimeout(() => { expired = true; reject(new Error('Download timed out')); }, timeoutMs);
      })]);
    } catch (error) { failures.push(error.message); }
    finally { clearTimeout(timer); }
  }
  throw new Error(`Soundfont unavailable: ${failures.join('; ')}`);
}
