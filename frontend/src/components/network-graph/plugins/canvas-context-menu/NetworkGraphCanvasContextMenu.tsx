import { useEffect } from 'react';
import { SigmaEventPayload } from 'sigma/types';
import { getMouseViewportCoordinates } from 'src/components/network-graph/helpers';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useContextMenuStore } from 'src/stores/context-menu';

export const NetworkGraphCanvasContextMenu = () => {
	useEffect(() => {
		StateManager.getInstance().on('STAGE_CONTEXT_MENU', onStateContextMenu);

		return () => {
			StateManager.getInstance().off('STAGE_CONTEXT_MENU', onStateContextMenu);
		};
	}, []);

	const onStateContextMenu = (event: SigmaEventPayload) => {
		const { x, y } = getMouseViewportCoordinates(event);

		useContextMenuStore.getState().open({
			type: 'graph-canvas',
			x: x,
			y: y
		});
	};

	return null;
};
