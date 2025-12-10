import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
/**
 * For now, we can bundle translations with the rest of the app. If/when
 * they become big (e.g. bigger than 150kb combined), consider loading them outside the app bundle.
 */
import translationDE from 'src/assets/locales/de/translation.json';
import translationEN from 'src/assets/locales/en/translation.json';
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
			loadPath: 'api/files/{{ns}}-{{lng}}.json'
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

export default i18n;
