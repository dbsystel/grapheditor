import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import translationDE from 'src/assets/locales/de/translation.json';
/**
 * For now, we can bundle translations with the rest of the app. If/when
 * they become big (e.g. bigger than 150kb combined), consider loading them outside the app bundle.
 */
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

i18n
	// detect user language
	// learn more: https://github.com/i18next/i18next-browser-languageDetector
	.use(LanguageDetector)
	// pass the i18n instance to react-i18next.
	.use(initReactI18next)
	// init i18next
	// for all options read: https://www.i18next.com/overview/configuration-options
	.init({
		resources: resources,
		debug: false,
		fallbackLng: 'en',
		supportedLngs: ['de', 'en'],
		keySeparator: false,
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

export default i18n;
