import { APP_LANGUAGES, APP_STORAGE_KEY_PREFIX } from 'src/utils/constants';
import { clone } from 'src/utils/helpers/general';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SettingsStore = {
	// the autoconnect functionality will be manually added where needed due to the fact at the moment
	// we are not sure where exactly should it be used
	isAutoconnectEnabled: boolean;
	setIsAutoconnectEnabled: (isEnabled: boolean) => void;
	// theme
	theme: AppTheme;
	setTheme: (theme: AppTheme) => void;
	// language
	language: AppLanguage;
	setLanguage: (language: AppLanguage) => void;
	// sidebars
	sidebarWidth: SettingsSidebarWidth;
	getSidebarWidth: (
		sidebar: string
	) => SettingsSidebarWidth[keyof SettingsSidebarWidth] | undefined;
	setSidebarWidth: (sidebar: string, width: string) => void;
	// default open sections
	defaultOpenSections: Record<SettingsSectionsLocation, SettingsItemsDrawerSections>;
	toggleDefaultOpenSection: (
		location: SettingsSectionsLocation,
		section: SettingsItemsDrawerSectionName,
		isOpen: boolean
	) => void;
	getItemsDrawerDefaultOpenSectionsIndexes: (
		location: SettingsSectionsLocation,
		sections: SettingsItemsDrawerSections
	) => Array<number>;
	// reset
	resetButExclude: (excludeKeys: Array<keyof InitialState>) => void;
	reset: () => void;
};

export type AppTheme = 'light' | 'dark';
export type AppLanguage = (typeof APP_LANGUAGES)[number];
type SettingsSidebarWidth = Record<string, string>;

export type SettingsSectionsLocation = 'itemsDrawer' | 'mouseover';
type SettingsItemsDrawerSectionName =
	| 'node-description'
	| 'node-labels'
	| 'node-properties'
	| 'node-relations'
	| 'relation-relation'
	| 'relation-type'
	| 'relation-properties';
type SettingsItemsDrawerSections = Array<SettingsItemsDrawerSectionName>;

type InitialState = Omit<
	SettingsStore,
	| 'setIsAutoconnectEnabled'
	| 'setTheme'
	| 'setLanguage'
	| 'getSidebarWidth'
	| 'setSidebarWidth'
	| 'toggleDefaultOpenSection'
	| 'getItemsDrawerDefaultOpenSectionsIndexes'
	| 'resetButExclude'
	| 'reset'
>;

const getInitialState: () => InitialState = () => {
	return {
		isAutoconnectEnabled: true,
		theme: 'light',
		language: 'de',
		sidebarWidth: {},
		defaultOpenSections: {
			itemsDrawer: [
				'node-description',
				'node-labels',
				'node-properties',
				'node-relations',
				'relation-relation',
				'relation-type',
				'relation-properties'
			],
			mouseover: [
				'node-description',
				'node-labels',
				'node-properties',
				'node-relations',
				'relation-relation',
				'relation-type',
				'relation-properties'
			]
		}
	};
};

/**
 * Store for keeping track of different settings.
 */
export const useSettingsStore = create<SettingsStore>()(
	persist(
		(set, get) => {
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
				getSidebarWidth: (sidebar) => {
					return get().sidebarWidth[sidebar];
				},
				setSidebarWidth: (sidebar, width) => {
					const sidebarWidthMap = get().sidebarWidth;

					sidebarWidthMap[sidebar] = width;

					set({
						sidebarWidth: { ...sidebarWidthMap }
					});
				},
				toggleDefaultOpenSection: (location, section, isOpen) => {
					let openSectionsClone = clone(get().defaultOpenSections[location]);

					// fix for DBAccordionItem showing isOpen=true when toggeling although it is already open by default
					// by its parent component DBAccordion
					if (isOpen && !openSectionsClone.includes(section)) {
						openSectionsClone.push(section);
					} else if (!isOpen) {
						openSectionsClone = openSectionsClone.filter(
							(openSection) => openSection !== section
						);
					}

					set({
						defaultOpenSections: {
							...get().defaultOpenSections,
							[location]: openSectionsClone
						}
					});
				},
				getItemsDrawerDefaultOpenSectionsIndexes: (location, sections) => {
					const defaultOpenSections = get().defaultOpenSections[location];

					return sections.map((section, index) => {
						return defaultOpenSections.includes(section) ? index : -1;
					});
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
			name: APP_STORAGE_KEY_PREFIX + 'settings', // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => window.localStorage) // (optional) by default, 'localStorage' is used
		}
	)
);
