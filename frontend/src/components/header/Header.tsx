import './Header.scss';
import { DBButton, DBDivider, DBSection } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef } from 'react';
import { DatabaseMenu } from 'src/components/database-menu/DatabaseMenu';
import { GlobalSearch } from 'src/components/global-search/GlobalSearch';
import { GlobalSearchRef } from 'src/components/global-search/GlobalSearch.interfaces';
import { HeaderPerspectivePopover } from 'src/components/header/perspective-popover/HeaderPerspectivePopover';
import { HeaderFullscreen } from 'src/components/header-fullscreen/HeaderFullscreen';
import { HeaderSettings } from 'src/components/header-settings/HeaderSettings';
import { Logo } from 'src/components/logo/Logo';
import { ParaQueries } from 'src/components/para-queries/ParaQueries';
import { PerspectiveFinder } from 'src/components/perspective-finder/PerspectiveFinder';
import { SearchOptions } from 'src/components/search-options/SearchOptions';
import { useSearchStore } from 'src/stores/search';
import {
	GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT,
	GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE
} from 'src/utils/constants';
import { goToApplicationView, goToHomepageView, isHomepageView } from 'src/utils/helpers/general';
import { HeaderProps } from './Header.interfaces';

export const Header = ({ id, className, testId }: HeaderProps) => {
	const rootElementClassName = clsx('header', className);
	const searchType = useSearchStore((store) => store.type);
	const globalSearchRef = useRef<GlobalSearchRef>({ triggerSearch: () => {} });

	const triggerSearch = () => {
		if (isHomepageView()) {
			goToApplicationView();
		}
		globalSearchRef.current.triggerSearch();
	};

	// Depending on which SearchType the user selected we show a different component
	const isFullTextOrCypherQuery =
		searchType === GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT ||
		searchType === GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY;
	const isPerspective = searchType === GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE;
	const isParaQueries = searchType === GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY;

	return (
		<DBSection spacing="none" className={rootElementClassName} id={id} data-testid={testId}>
			<div className="header__control-line">
				<div className="header__block">
					<Logo className="header__logo" onClick={goToHomepageView} />
					<SearchOptions />
					<DBDivider variant="vertical" emphasis="weak" className="header__divider" />
					{(isFullTextOrCypherQuery || isParaQueries) && (
						<DBButton
							variant="brand"
							icon="play"
							className="header__search-button"
							onClick={triggerSearch}
						>
							Start
						</DBButton>
					)}

					{isPerspective && <HeaderPerspectivePopover />}
				</div>
				<div className="header__block">
					<DatabaseMenu />

					<DBDivider variant="vertical" emphasis="weak" className="header__divider" />

					<HeaderSettings />

					<HeaderFullscreen />
				</div>
			</div>

			<div className="header__search-line">
				{isFullTextOrCypherQuery && <GlobalSearch searchFunctionRef={globalSearchRef} />}
				{isPerspective && <PerspectiveFinder />}
				{isParaQueries && <ParaQueries searchFunctionRef={globalSearchRef} />}
			</div>
		</DBSection>
	);
};
