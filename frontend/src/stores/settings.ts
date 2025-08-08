import { APP_LANGUAGES } from 'src/utils/constants';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SettingsStore = {
	// the autoconnect functionality will be manually added where needed due to the fact at the moment
	// we are not sure where exactly should it be used
	isAutoconnectEnabled: boolean;
	setIsAutoconnectEnabled: (isEnabled: boolean) => void;
	theme: AppTheme;
	setTheme: (theme: AppTheme) => void;
	language: AppLanguage;
	setLanguage: (language: AppLanguage) => void;
	resetButExclude: (excludeKeys: Array<keyof InitialState>) => void;
	reset: () => void;
};

export type AppTheme = 'light' | 'dark';
export type AppLanguage = (typeof APP_LANGUAGES)[number];

type InitialState = Omit<
	SettingsStore,
	'setIsAutoconnectEnabled' | 'setTheme' | 'setLanguage' | 'resetButExclude' | 'reset'
>;

const getInitialState: () => InitialState = () => {
	return {
		isAutoconnectEnabled: true,
		theme: 'light',
		language: 'de'
	};
};

/**
 * Store for keeping track of different settings.
 */
export const useSettingsStore = create<SettingsStore>()(
	persist(
		(set) => {
			return {
				...getInitialState(),
				setIsAutoconnectEnabled: (isEnabled) => {
					set({ isAutoconnectEnabled: isEnabled });
				},
				setTheme: (theme) => {
					set({ theme: theme });
				},
				setLanguage: (language) => {
					set({ language: language });
				},
				reset: () => {
					set(getInitialState());
				},
				resetButExclude: (excludeKeys) => {
					const state: Partial<InitialState> = getInitialState();

					excludeKeys.forEach((key) => {
						delete state[key];
					});

					set(state);
				}
			};
		},
		{
			name: '_app_settings', // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => window.localStorage) // (optional) by default, 'localStorage' is used
		}
	)
);
