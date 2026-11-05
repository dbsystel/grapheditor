import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
/**
 * For now, we can bundle translations with the rest of the app. If/when
 * they become big (e.g. bigger than 150kb combined), consider loading them outside the app bundle.
 */
import translationDE from 'src/assets/locales/de/translation.json' with { type: 'json' };
import translationEN from 'src/assets/locales/en/translation.json' with { type: 'json' };
import { useSettingsStore } from 'src/stores/settings';

// the translations
const resources = {
	en: {
		translation: translationEN
	},
	de: {
		translation: translationDE
	}
};

/**
 * In the browser, a relative loadPath resolves against window.location and gets proxied to the
 * backend (dev: vite proxy, prod: apache) - that's the normal case. This module is however also
 * imported directly into the E2E suite's Node.js process (src/tests/e2e-setup.ts), where there is
 * no window/location to resolve a relative URL against, so the fetch would never succeed there.
 * Use an absolute URL pointing directly at the e2e backend in that case instead, so both the real
 * app and the E2E suite's i18n fixture consistently apply the same backend-provided overrides.
 */
const loadPath =
	typeof window === 'undefined'
		? `http://localhost:${process.env.E2E_GUI_PORT || '5000'}/api/files/{{ns}}-{{lng}}.json`
		: 'api/files/{{ns}}-{{lng}}.json';

const supportedLanguages = ['de', 'en'];

i18n.use(Backend)
	// init i18next
	// for all options read: https://www.i18next.com/overview/configuration-options
	// detect user language
	// learn more: https://github.com/i18next/i18next-browser-languageDetector
	.use(LanguageDetector)
	// pass the i18n instance to react-i18next.
	.use(initReactI18next)
	// fetch translation files from backend
	// learn more: https://github.com/i18next/i18next-http-backend
	.init({
		resources: resources,
		debug: false,
		fallbackLng: 'en',
		supportedLngs: supportedLanguages,
		keySeparator: false,
		backend: {
			loadPath: loadPath
		},
		interpolation: {
			escapeValue: false // not needed for react as it escapes by default
		},
		react: {
			useSuspense: false
		},
		lng: useSettingsStore.getState().language,
		// LanguageDetector options
		// learn more: https://github.com/i18next/i18next-browser-languageDetector?tab=readme-ov-file#detector-options
		detection: {
			caches: []
		}
	});

// load translation files to override local translation files
i18n.reloadResources(supportedLanguages);

export type I18nType = typeof i18n;

export default i18n;
