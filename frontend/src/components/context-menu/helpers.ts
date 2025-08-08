import { ContextMenuOption, ContextMenuState } from './ContextMenu.interfaces';

export const filterContextMenuOptions = (contextMenuState: ContextMenuState) => {
	const filteredOptions: Array<ContextMenuOption> = [];
	contextMenuState.fromServer.forEach((contextMenuOption) => {
		const action = contextMenuOption.action;

		if (contextMenuOption.enabled && action in contextMenuState.internal) {
			const selectedAction = contextMenuState.internal[action];

			if (
				selectedAction &&
				(selectedAction.shouldRender === undefined || selectedAction.shouldRender())
			) {
				filteredOptions.push(selectedAction);
			}
		}
	});

	return filteredOptions;
};
