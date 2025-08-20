import './Header.scss';
import { DBButton, DBDivider, DBSection, DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DatabaseMenu } from 'src/components/database-menu/DatabaseMenu';
import { GlobalSearch } from 'src/components/global-search/GlobalSearch';
import { GlobalSearchRef } from 'src/components/global-search/GlobalSearch.interfaces';
import { HeaderPerspectivePopover } from 'src/components/header/perspective-popover/HeaderPerspectivePopover';
import { HeaderFullscreen } from 'src/components/header-fullscreen/HeaderFullscreen';
import { HeaderGraphOptions } from 'src/components/header-graph-options/HeaderGraphOptions';
import { HeaderSettings } from 'src/components/header-settings/HeaderSettings';
import { Logout } from 'src/components/logout/Logout';
import { PerspectiveFinder } from 'src/components/perspective-finder/PerspectiveFinder';
import { ToggleGroup } from 'src/components/toggle-group/ToggleGroup';
import { useSearchStore } from 'src/stores/search';
import { useSettingsStore } from 'src/stores/settings';
import { isAppSupportedLanguage, setApplicationTheme } from 'src/utils/helpers/general';
import { HeaderProps } from './Header.interfaces';

export const Header = ({ id, className, testId }: HeaderProps) => {
	const rootElementClassName = clsx('header', 'db-bg-color-lvl-1', className);
	const searchType = useSearchStore((store) => store.type);
	const theme = useSettingsStore((store) => store.theme);
	const language = useSettingsStore((store) => store.language);
	const setLanguage = useSettingsStore((store) => store.setLanguage);
	const { t, i18n } = useTranslation();
	const globalSearchRef = useRef<GlobalSearchRef>({ triggerSearch: () => {} });

	// Depending on which SearchType the user selected we show a different component
	const isFullTextOrCypherQuery = searchType === 'full-text' || searchType === 'cypher-query';
	const isPerspective = searchType === 'perspectives';

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

	const triggerSearch = () => {
		if (globalSearchRef.current) {
			globalSearchRef.current.triggerSearch();
		}
	};

	return (
		<DBSection spacing="none" className={rootElementClassName} id={id} data-testid={testId}>
			<div className="header__control-line">
				<div>
					<ToggleGroup />
					<DBDivider variant="vertical" emphasis="weak" className="header__divider" />
					{isFullTextOrCypherQuery && (
						<DBButton
							variant="ghost"
							icon="play"
							className="header__search-button"
							onClick={triggerSearch}
						>
							Start
						</DBButton>
					)}

					{isPerspective && <HeaderPerspectivePopover />}

					<HeaderGraphOptions />
				</div>
				<div className="header__data-base-controls">
					<DatabaseMenu />

					<DBDivider variant="vertical" emphasis="weak" className="header__divider" />

					<HeaderSettings />

					<HeaderFullscreen />

					<DBButton
						icon={theme === 'light' ? 'sun' : 'moon'}
						onClick={toggleTheme}
						variant="ghost"
						className="db-density-functional"
						type="button"
						noText
						data-testid="header_theme_toggle_button"
					/>
					<DBSelect
						className="header__select"
						value={language}
						onChange={onLanguageChange}
						options={[{ value: 'de' }, { value: 'en' }]}
						variant="floating"
						label={t('language_selection_title')}
					/>
					<Logout />
				</div>
			</div>

			<div className="header__search-line">
				{isFullTextOrCypherQuery && <GlobalSearch ref={globalSearchRef} />}
				{isPerspective && <PerspectiveFinder />}
			</div>
		</DBSection>
	);
};
