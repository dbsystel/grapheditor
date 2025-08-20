import './HeaderPerspectivePopover.scss';
import { DBButton, DBCard, DBDivider, DBPopover } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreatePerspectiveDialog } from 'src/components/create-perspective-dialog/CreatePerspectiveDialog';
import { HeaderPerspectiveDeleteButton } from 'src/components/header/perspective-delete-button/HeaderPerspectiveDeleteButton';
import { HeaderPerspectiveSaveButton } from 'src/components/header/perspective-save-button/HeaderPerspectiveSaveButton';
import { useGraphStore } from 'src/stores/graph';
import { useOutsideClick } from 'src/utils/hooks/useOutsideClick';
import { HeaderPerspectivePopoverProps } from './HeaderPerspectivePopover.interfaces';

export const HeaderPerspectivePopover = ({
	id,
	className,
	testId
}: HeaderPerspectivePopoverProps) => {
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
	const [isCreatePerspectiveOpen, setIsCreatePerspectiveOpen] = useState<boolean>(false);
	const perspectiveId = useGraphStore((store) => store.perspectiveId);
	const { t } = useTranslation();
	const rootElementClassName = clsx('header__perspective-popover', className);

	// Ref for OutsideClick
	const popoverRef = useOutsideClick<HTMLDivElement>({
		callback: () => setIsMenuOpen(false)
	});

	const toggleManagePerspectiveMenu = () => setIsMenuOpen((open) => !open);

	const toggleCreatePerspectiveDialog = () => {
		setIsCreatePerspectiveOpen((open) => !open);

		if (!isCreatePerspectiveOpen) {
			setIsMenuOpen(false);
		}
	};

	return (
		<DBPopover
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			open={isMenuOpen}
			placement="bottom-start"
			ref={popoverRef}
			trigger={
				<DBButton
					variant="ghost"
					className="header__search-button"
					onClick={toggleManagePerspectiveMenu}
					data-testid="header_perspective_menu_button"
				>
					{t('header_manage_perspectives')}
				</DBButton>
			}
		>
			<DBCard spacing="none" className="header__perspective-card">
				<DBButton
					variant="ghost"
					width="full"
					onClick={toggleCreatePerspectiveDialog}
					type="button"
				>
					{t('header_create_new_perspective')}
				</DBButton>

				{!!perspectiveId && (
					<>
						<HeaderPerspectiveSaveButton
							perspectiveId={perspectiveId}
							closeMenuFunction={toggleManagePerspectiveMenu}
						/>
						<DBDivider className="header__perspective-divider" />
						<HeaderPerspectiveDeleteButton
							perspectiveId={perspectiveId}
							closeMenuFunction={toggleManagePerspectiveMenu}
						/>
					</>
				)}

				{isCreatePerspectiveOpen && (
					<CreatePerspectiveDialog closeFunction={toggleCreatePerspectiveDialog} />
				)}
			</DBCard>
		</DBPopover>
	);
};
