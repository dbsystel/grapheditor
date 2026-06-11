import { useApplicationStore } from 'src/stores/application';
import { useClipboardStore } from 'src/stores/clipboard';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useDrawerStore } from 'src/stores/drawer';
import { useExpandNodeStore } from 'src/stores/expand-node';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { useParallaxStore } from 'src/stores/parallax';
import { usePerspectiveStore } from 'src/stores/perspective';
import { useSearchStore } from 'src/stores/search';
import { AppLanguage, AppTheme, useSettingsStore } from 'src/stores/settings';
import { APP_LANGUAGES } from 'src/utils/constants';
import { eventBus } from 'src/utils/event-bus';

export const resetApplicationStates = () => {
	// reset almost all application states (all but login and database stores)
	useSearchStore.getState().setResult({ data: null, type: '' });
	useClipboardStore.getState().reset();
	useContextMenuStore.getState().reset();
	useDrawerStore.getState().reset();
	// exclude persisted keys
	useGraphStore.getState().resetButExclude(['zoomFactor']);
	useItemsStore.getState().reset();
	useParallaxStore.getState().reset();
	useApplicationStore.getState().reset();
	usePerspectiveStore.getState().reset();
	useExpandNodeStore.getState().reset();
	// other reset logic if needed
	eventBus.reset();
};

export const goToHomepageView = () => {
	useApplicationStore.getState().setIsHomepageView(true);
};

export const isHomepageView = () => {
	return useApplicationStore.getState().isHomepageView;
};

export const goToApplicationView = () => {
	useApplicationStore.getState().setIsHomepageView(false);
};

export const setApplicationTheme = (theme: AppTheme) => {
	// assign the color scheme to the body element in order to cover elements injected
	// to the body element via React.portal (or similar).
	document.body.dataset.mode = theme;

	useSettingsStore.getState().setTheme(theme);
};

export const isApplicationSupportedLanguage = (value: unknown): value is AppLanguage => {
	let languageIsSupported = false;

	APP_LANGUAGES.forEach((language) => {
		if (language === value) {
			languageIsSupported = true;
		}
	});

	return languageIsSupported;
};
