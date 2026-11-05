import { useEffect } from 'react';
import { SigmaEdgeEventPayload } from 'sigma/types';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';

/**
 * This plugin toggles the highlight state of a relation when it is clicked while
 * holding CTRL. The decision which gesture this is (plain click vs. highlight
 * toggle) is made by the StateManager, so this plugin only reacts to the
 * dedicated "relationHighlightToggle" event.
 */
export const NetworkGraphRelationHighlightToggle = () => {
	const toggleRelationHighlight = useGraphStore((store) => store.toggleRelationHighlight);

	useEffect(() => {
		StateManager.getInstance().subscribe('relationHighlightToggle', onRelationHighlightToggle);

		return () => {
			StateManager.getInstance().unsubscribe(
				'relationHighlightToggle',
				onRelationHighlightToggle
			);
		};
	}, []);

	const onRelationHighlightToggle = (eventPayload: SigmaEdgeEventPayload) => {
		toggleRelationHighlight(eventPayload.edge);
	};

	return null;
};
