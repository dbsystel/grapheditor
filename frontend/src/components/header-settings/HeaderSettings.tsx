import './HeaderSettings.scss';
import { DBButton, DBCheckbox, DBLink, DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { MenuButtonOption } from 'src/components/menu-button/MenuButton.interfaces';
import { useSettingsStore } from 'src/stores/settings';
import { HeaderSettingsProps } from './HeaderSettings.interfaces';
import { HeaderFullscreen } from 'src/components/header-fullscreen/HeaderFullscreen';
import { isAppSupportedLanguage, setApplicationTheme } from 'src/utils/helpers/general';
import { GlobalSearchRef } from 'src/components/global-search/GlobalSearch.interfaces';
import { Logout } from 'src/components/logout/Logout';

export const HeaderSettings = ({ id, className, testId }: HeaderSettingsProps) => {
	const { t, i18n } = useTranslation();
	const setIsAutoconnectEnabled = useSettingsStore((store) => store.setIsAutoconnectEnabled);
	const isAutoconnectEnabled = useSettingsStore((store) => store.isAutoconnectEnabled);
	const language = useSettingsStore((store) => store.language);
	const setLanguage = useSettingsStore((store) => store.setLanguage);
	const theme = useSettingsStore((store) => store.theme);
	const rootElementClassName = clsx('header-settings', className);

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

	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'dark' : 'light';

		setApplicationTheme(newTheme);
	};

	const options: Array<MenuButtonOption> = [
		{
			title: (
				<div
					key="header-settings__autoconnect"
					className="menu-button__option header-settings__autoconnect"
				>
					<DBCheckbox onChange={onAutoconnectToggle} checked={isAutoconnectEnabled}>
						{t('autoconnect_label')} <br />({t('autoconnect_info_message')})
					</DBCheckbox>
				</div>
			),
			shouldRenderTitleAsIs: true
		},
		{
			title: (
				<DBButton
					key="header-settings__theme"
					icon={theme === 'light' ? 'sun' : 'moon'}
					onClick={toggleTheme}
					variant="ghost"
					className="db-density-functional"
					type="button"
					noText
					data-testid="header_theme_toggle_button"
				/>
			),
			shouldRenderTitleAsIs: true
		},
		{
			title: (
				<DBSelect
					key="header-settings__language"
					className="header__select"
					value={language}
					onChange={onLanguageChange}
					options={[{ value: 'de' }, { value: 'en' }]}
					variant="floating"
					label={t('language_selection_title')}
				/>
			),
			shouldRenderTitleAsIs: true
		},
		{
			title: <Logout key="header-settings__logout" />,
			shouldRenderTitleAsIs: true
		},
		{
			title: (
				<div key="header-settings__source_code" className="menu-button__option">
					{t('application_source_code')}:&nbsp;
					<DBLink href="https://github.com/dbsystel/grapheditor" target="_blank">
						GitHub
					</DBLink>
				</div>
			),
			shouldRenderTitleAsIs: true
		},
		{
			title: (
				<div key="header-settings__license" className="menu-button__option">
					{t('application_license')}:&nbsp;
					<DBLink href="https://www.gnu.org/licenses/agpl-3.0.txt" target="_blank">
						AGPL 3.0
					</DBLink>
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
