import axios from "axios";

const LIBRE_URL = process.env.LIBRE_URL || "http://localhost:5000";

/**
 * Detects the language of the given text.
 * @param {string} text
 * @returns {Promise<string>} ISO code, e.g. 'en', 'hi', 'fr'
 */
export async function detectLanguage(text) {
    const res = await axios.post(`${LIBRE_URL}/detect`, { q: text });
    return res.data[0]?.language;
}

/**
 * Translates text from sourceLang (or auto-detected) into targetLang.
 * @param {string} text       The text to translate
 * @param {string} targetLang The ISO code of the target language
 * @param {string} [sourceLang='auto'] Optional source language code
 * @returns {Promise<string>} The translated text
 */
export async function translateText(text, targetLang, sourceLang = "auto") {
    const res = await axios.post(`${LIBRE_URL}/translate`, {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text",
    });
    return res.data.translatedText;
}

// Optional: fetch supported language list
export async function getSupportedLanguages() {
    const res = await axios.get(`${LIBRE_URL}/languages`);
    return res.data; // [{ code: 'en', name: 'English' }, ...]
}
