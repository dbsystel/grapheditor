import './Header.scss';
import { DBButton, DBDivider, DBSection, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ApplicationLoadingIndicator } from 'src/components/application-loading-indicator/ApplicationLoadingIndicator';
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
import { useStoppableRequestsStore } from 'src/stores/stoppable-requests';
import {
	GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY,
	GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE
} from 'src/utils/constants';
import {
	goToApplicationView,
	goToHomepageView,
	isHomepageView
} from 'src/utils/helpers/application';
import { isCypherQueryOrFullText } from 'src/utils/helpers/search';
import { cancelStoppableRequest } from 'src/utils/helpers/stoppable-request';
import { useShallow } from 'zustand/react/shallow';
import { HeaderProps } from './Header.interfaces';

export const Header = ({ id, className, testId }: HeaderProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('header', className);
	const searchType = useSearchStore((store) => store.type);
	const globalSearchRef = useRef<GlobalSearchRef>({
		triggerSearch: () => {
			globalSearchRef.current.searchFunction();
			globalSearchRef.current.redirectToApplication();
		},
		searchFunction: () => {},
		redirectToApplication: () => {
			if (isHomepageView()) {
				goToApplicationView();
			}
		}
	});
	const globalSearchStoppableRequests = useStoppableRequestsStore(
		useShallow((store) => store.getAllStoppableRequestsByTags(['global-search']))
	);

	const stopRequest = () => {
		if (globalSearchStoppableRequests.length) {
			globalSearchStoppableRequests.forEach((globalSearchStoppableRequest) => {
				cancelStoppableRequest(globalSearchStoppableRequest);
			});
		}
	};

	const openCurrentUrlInNewTab = () => {
		window.open(location.href, '_blank');
	};

	// Depending on which SearchType the user selected we show a different component
	const isFullTextOrCypherQuery = isCypherQueryOrFullText(searchType);
	const isPerspective = searchType === GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVE;
	const isParaQueries = searchType === GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERY;
	const renderStartButton =
		(isFullTextOrCypherQuery || isParaQueries) && globalSearchStoppableRequests.length === 0;

	return (
		<DBSection spacing="none" className={rootElementClassName} id={id} data-testid={testId}>
			<div className="header__control-line">
				<div className="header__block">
					<Logo className="header__logo" onClick={goToHomepageView} />
					<SearchOptions />
					<DBDivider variant="vertical" emphasis="weak" className="header__divider" />
					{renderStartButton && (
						<DBButton
							variant="brand"
							icon="play"
							className="header__search-button"
							onClick={globalSearchRef.current.triggerSearch}
						>
							{t('header_start_button')}
						</DBButton>
					)}
					{!!globalSearchStoppableRequests.length && (
						<DBButton
							variant="brand"
							icon="square"
							className="header__stop-button"
							onClick={stopRequest}
						>
							{t('header_stop_button')}
						</DBButton>
					)}

					{isPerspective && <HeaderPerspectivePopover />}
				</div>
				<div className="header__block">
					<div className="header__block-info">
						<DBButton type="button" size="small" onClick={openCurrentUrlInNewTab}>
							{t('header_new_tab_button')}
							<DBTooltip>{t('header_new_tab_button_tooltip')}</DBTooltip>
						</DBButton>

						<ApplicationLoadingIndicator />

						<DatabaseMenu />
					</div>

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
