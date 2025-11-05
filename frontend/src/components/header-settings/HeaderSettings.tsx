import './HeaderSettings.scss';
import { DBCheckbox, DBDivider, DBIcon, DBLink, DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Logout } from 'src/components/logout/Logout';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { MenuButtonOption } from 'src/components/menu-button/MenuButton.interfaces';
import { useSettingsStore } from 'src/stores/settings';
import { isAppSupportedLanguage, setApplicationTheme } from 'src/utils/helpers/general';
import { HeaderSettingsProps } from './HeaderSettings.interfaces';

export const HeaderSettings = ({ id, className, testId }: HeaderSettingsProps) => {
	const { t, i18n } = useTranslation();
	const setIsAutoconnectEnabled = useSettingsStore((store) => store.setIsAutoconnectEnabled);
	const isAutoconnectEnabled = useSettingsStore((store) => store.isAutoconnectEnabled);
	const language = useSettingsStore((store) => store.language);
	const setLanguage = useSettingsStore((store) => store.setLanguage);
	const theme = useSettingsStore((store) => store.theme);
	const rootElementClassName = clsx('header-settings', className);
	const themeOptions = [
		{ value: 'light', label: t('theme_light'), icon: 'sun' },
		{ value: 'dark', label: t('theme_dark'), icon: 'moon' }
	];
	const currentThemeIcon = theme === 'light' ? 'sun' : 'moon';

	const onAutoconnectToggle = (event: ChangeEvent<HTMLInputElement>) => {
		setIsAutoconnectEnabled(event.target.checked);
	};

	const onLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const languageValue = event.target.value;

		if (isAppSupportedLanguage(languageValue)) {
			i18n.changeLanguage(languageValue);
			setLanguage(languageValue);
		}
	};

	const onThemeChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const newTheme = event.target.value;

		if (newTheme === 'light' || newTheme === 'dark') {
			setApplicationTheme(newTheme);
		}
	};

	const options: Array<MenuButtonOption> = [
		{
			title: (
				<div key="header-settings__autoconnect" className=" header-settings__autoconnect">
					<DBCheckbox onChange={onAutoconnectToggle} checked={isAutoconnectEnabled}>
						{t('autoconnect_label')}
					</DBCheckbox>

					<p>
						<DBIcon icon="information_circle" /> {t('autoconnect_info_message')}
					</p>

					<DBDivider />
				</div>
			),
			shouldRenderTitleAsIs: true
		},
		{
			title: <h6 key="header-settings__settings_headline">{t('settings')}</h6>,
			shouldRenderTitleAsIs: true
		},
		{
			title: (
				<DBSelect
					key="header-settings__language_selection"
					value={language}
					onChange={onLanguageChange}
					options={[{ value: 'de' }, { value: 'en' }, { value: 'cimode' }]}
					label={t('language_selection_title')}
				/>
			),
			shouldRenderTitleAsIs: true
		},
		{
			title: (
				<div key="header-settings__theme_selection">
					<DBSelect
						value={theme}
						icon={currentThemeIcon}
						onChange={onThemeChange}
						options={themeOptions}
						label={t('mode_selection_title')}
					/>
					<DBDivider />
				</div>
			),
			shouldRenderTitleAsIs: true
		},
		{
			title: <h6 key="header-settings__links_headline">{t('links')}</h6>,
			shouldRenderTitleAsIs: true
		},
		{
			title: (
				<div key="header-settings__links">
					<div>
						{t('application_source_code')}:&nbsp;
						<DBLink href="https://github.com/dbsystel/grapheditor" target="_blank">
							GitHub
						</DBLink>
					</div>
					<div>
						{t('application_license')}:&nbsp;
						<DBLink href="https://www.gnu.org/licenses/agpl-3.0.txt" target="_blank">
							AGPL 3.0
						</DBLink>
					</div>
				</div>
			),
			shouldRenderTitleAsIs: true
		},
		{
			title: (
				<div key="header-settings__logout">
					<DBDivider />
					<Logout />
				</div>
			),
			shouldRenderTitleAsIs: true
		}
	];

	return (
		<MenuButton
			id={id}
			className={rootElementClassName}
			testId={testId}
			icon="gear_wheel"
			optionsPlacement="bottom-end"
			options={options}
		/>
	);
};
