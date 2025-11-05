import { useEffect } from 'react';
import { SigmaStageEventPayload } from 'sigma/types';
import { getMouseViewportCoordinates } from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useContextMenuStore } from 'src/stores/context-menu';

export const NetworkGraphCanvasContextMenu = () => {
	useEffect(() => {
		StateManager.getInstance().on('STAGE_CONTEXT_MENU', onStageContextMenu);

		return () => {
			StateManager.getInstance().off('STAGE_CONTEXT_MENU', onStageContextMenu);
		};
	}, []);

	const onStageContextMenu = (event: SigmaStageEventPayload) => {
		const { x, y } = getMouseViewportCoordinates(event);

		useContextMenuStore.getState().open({
			type: 'graph-canvas',
			event: event,
			x: x,
			y: y
		});
	};

	return null;
};
