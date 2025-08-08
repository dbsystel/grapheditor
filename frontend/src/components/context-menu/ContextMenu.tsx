import './ContextMenu.scss';
import { DBButton } from '@db-ux/react-core-components';
import { CSSProperties, Fragment, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loading } from 'src/components/loading/Loading';
import { Modal } from 'src/components/modal/Modal';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useOutsideClick } from 'src/utils/hooks/useOutsideClick';
import { usePostContextMenuActions } from 'src/utils/hooks/usePostContextMenuActions';
import { ContextMenuOption, ContextMenuState } from './ContextMenu.interfaces';
import { filterContextMenuOptions } from './helpers';

export const ContextMenu = () => {
	const { t } = useTranslation();
	const { isOpen, x, y, nodeIds, relationIds, getOptions, close, onClose } = useContextMenuStore(
		(store) => store
	);
	const [contextMenuCustomContent, setContextMenuCustomContent] = useState<ReactNode>(null);
	const [contextMenuOptions, setContextMenuOptions] = useState<ContextMenuState>({
		internal: {},
		fromServer: []
	});

	const { reFetch, isLoading } = usePostContextMenuActions(
		{
			executeImmediately: false,
			nodeIds: nodeIds,
			relationIds: relationIds,
			onSuccess: (data) => {
				setContextMenuOptions({
					internal: getOptions(),
					fromServer: data.data.actions
				});
			}
		},
		[nodeIds, relationIds]
	);

	const refContextMenu = useOutsideClick<HTMLDivElement>({
		callback: () => {
			// it might be the order should be reversed, but for now
			// this seems to be working fine
			close();
		}
	});

	useEffect(() => {
		if (isOpen) {
			reFetch();
		} else {
			setContextMenuOptions({ internal: {}, fromServer: [] });
			setContextMenuCustomContent(null);
			StateManager.getInstance().resetState();
			if (onClose) {
				onClose();
			}
		}
	}, [isOpen]);

	const onOptionClick = (option: ContextMenuOption) => {
		if (option.onClick) {
			option.onClick();
		} else if (option.subMenuRenderer) {
			const goBackFunction = () => {
				setContextMenuCustomContent(null);
			};

			const customContent = option.subMenuRenderer(goBackFunction);
			setContextMenuCustomContent(customContent);
		}
	};

	const contextMenuStyle: CSSProperties = {
		top: y,
		left: x,
		position: 'fixed'
	};

	const filteredOptions: Array<ContextMenuOption> = filterContextMenuOptions(contextMenuOptions);

	if (!isOpen) {
		return null;
	}

	return (
		<Modal isOpen={true} className="context-menu-modal" backdrop="none">
			<div
				className="context-menu-modal__content"
				style={contextMenuStyle}
				ref={refContextMenu}
			>
				<Loading isLoading={isLoading} renderChildrenWhileLoading={false}>
					{contextMenuCustomContent}
					{!contextMenuCustomContent && (
						<ul className="context-menu-modal__list">
							{filteredOptions.length === 0 && (
								<p>{t('context_menu_no_options_to_render')}</p>
							)}

							{filteredOptions.map((option, index) => {
								return (
									<li key={index}>
										<DBButton
											className="context-menu-modal__button"
											variant="ghost"
											size="small"
											onClick={() => {
												onOptionClick(option);
											}}
										>
											{option.label}
										</DBButton>
										{renderOptions(option.options)}
									</li>
								);
							})}
						</ul>
					)}
				</Loading>
			</div>
		</Modal>
	);
};

const renderOptions = (options?: Array<ContextMenuOption> | undefined) => {
	if (!options) {
		return null;
	}

	return (
		<div className="context-menu-modal__list-options">
			{options.map((option, index) => {
				return (
					<Fragment key={option.label + index}>
						<DBButton
							className="context-menu-modal__button"
							variant="ghost"
							size="small"
							onClick={option.onClick}
						>
							{option.label}
						</DBButton>
						{renderOptions(option.options)}
					</Fragment>
				);
			})}
		</div>
	);
};
