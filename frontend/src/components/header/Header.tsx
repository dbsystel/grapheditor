import './Header.scss';
import { DBButton, DBDivider, DBSection, DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef } from 'react';
import { DatabaseMenu } from 'src/components/database-menu/DatabaseMenu';
import { GlobalSearch } from 'src/components/global-search/GlobalSearch';
import { GlobalSearchRef } from 'src/components/global-search/GlobalSearch.interfaces';
import { HeaderPerspectivePopover } from 'src/components/header/perspective-popover/HeaderPerspectivePopover';
import { HeaderFullscreen } from 'src/components/header-fullscreen/HeaderFullscreen';
import { HeaderSettings } from 'src/components/header-settings/HeaderSettings';
import { PerspectiveFinder } from 'src/components/perspective-finder/PerspectiveFinder';
import { ToggleGroup } from 'src/components/toggle-group/ToggleGroup';
import { useSearchStore } from 'src/stores/search';
import { HeaderProps } from './Header.interfaces';

export const Header = ({ id, className, testId }: HeaderProps) => {
	const rootElementClassName = clsx('header', 'db-bg-color-lvl-1', className);
	const searchType = useSearchStore((store) => store.type);
	const globalSearchRef = useRef<GlobalSearchRef>({ triggerSearch: () => {} });

	// Depending on which SearchType the user selected we show a different component
	const isFullTextOrCypherQuery = searchType === 'full-text' || searchType === 'cypher-query';
	const isPerspective = searchType === 'perspectives';

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
				</div>
				<div className="header__data-base-controls">
					<DatabaseMenu />

					<DBDivider variant="vertical" emphasis="weak" className="header__divider" />

					<HeaderSettings />

					<HeaderFullscreen />
				</div>
			</div>

			<div className="header__search-line">
				{isFullTextOrCypherQuery && <GlobalSearch ref={globalSearchRef} />}
				{isPerspective && <PerspectiveFinder />}
			</div>
		</DBSection>
	);
};
