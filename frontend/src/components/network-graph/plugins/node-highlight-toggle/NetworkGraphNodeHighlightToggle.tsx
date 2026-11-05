import { useEffect } from 'react';
import { SigmaNodeEventPayload } from 'sigma/types';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';

/**
 * This plugin toggles the highlight state of a node when it is clicked while
 * holding CTRL. The decision which gesture this is (plain click vs. highlight
 * toggle) is made by the StateManager, so this plugin only reacts to the
 * dedicated "nodeHighlightToggle" event.
 */
export const NetworkGraphNodeHighlightToggle = () => {
	const toggleNodeHighlight = useGraphStore((store) => store.toggleNodeHighlight);

	useEffect(() => {
		StateManager.getInstance().subscribe('nodeHighlightToggle', onNodeHighlightToggle);

		return () => {
			StateManager.getInstance().unsubscribe('nodeHighlightToggle', onNodeHighlightToggle);
		};
	}, []);

	const onNodeHighlightToggle = (eventPayload: SigmaNodeEventPayload) => {
		toggleNodeHighlight(eventPayload.node);
	};

	return null;
};
