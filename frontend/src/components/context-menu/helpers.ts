import { ContextMenuOption, ContextMenuState } from './ContextMenu.interfaces';

export const filterContextMenuOptions = (contextMenuState: ContextMenuState) => {
	const filteredOptions: Array<ContextMenuOption> = [];

	contextMenuState.fromServer.forEach((contextMenuOption) => {
		const action = contextMenuOption.action;

		if (contextMenuOption.enabled && action in contextMenuState.internal) {
			const selectedAction = contextMenuState.internal[action];
			const shouldRenderFiltered = filterByShouldRenderRecursively(selectedAction);

			if (shouldRenderFiltered) {
				filteredOptions.push(shouldRenderFiltered);
			}
		}
	});

	return filteredOptions;
};

const filterByShouldRenderRecursively = (
	option: ContextMenuOption | undefined
): ContextMenuOption | null => {
	if (!option) {
		return null;
	}

	if (option.shouldRender !== undefined && !option.shouldRender()) {
		return null;
	}

	const filteredOption: ContextMenuOption = { ...option };

	if (option.options) {
		filteredOption.options = option.options
			.map((contextOption) => filterByShouldRenderRecursively(contextOption))
			.filter((contextOption) => contextOption !== null);
	}

	return filteredOption;
};
