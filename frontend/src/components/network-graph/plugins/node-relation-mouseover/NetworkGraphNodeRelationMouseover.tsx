import './NetworkGraphNodeRelationMouseover.scss';
import { AttributeUpdatePayload } from 'graphology-types';
import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SigmaEdgeEventPayload, SigmaNodeEventPayload } from 'sigma/types';
import { GraphEditorSigmaNodeAttributes } from 'src/components/network-graph/NetworkGraph.interfaces';
import { StateManager } from 'src/components/network-graph/state-manager';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useGraphStore } from 'src/stores/graph';
import { useItemOverviewPopoverStore } from 'src/stores/item-overview-popover';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';

export const NetworkGraphNodeRelationMouseover = () => {
	const { sigma } = useGraphStore((store) => store);
	const [selectedGraphItem, setSelectedGraphItem] = useState<null | {
		x: number;
		y: number;
		item: Node | Relation;
		offset: number;
	}>(null);

	useEffect(() => {
		StateManager.getInstance().subscribe('nodeTooltip', onItemTooltip);
		StateManager.getInstance().subscribe('nodeLeave', onLeaveItem);
		StateManager.getInstance().subscribe('nodeClick', resetTooltipRender);
		StateManager.getInstance().subscribe('nodeContextMenu', resetTooltipRender);
		StateManager.getInstance().subscribe('nodeDown', resetTooltipRender);

		StateManager.getInstance().subscribe('relationTooltip', onItemTooltip);
		StateManager.getInstance().subscribe('relationLeave', onLeaveItem);
		StateManager.getInstance().subscribe('relationClick', resetTooltipRender);
		StateManager.getInstance().subscribe('relationContextMenu', resetTooltipRender);

		return () => {
			StateManager.getInstance().unsubscribe('nodeTooltip', onItemTooltip);
			StateManager.getInstance().unsubscribe('nodeLeave', onLeaveItem);
			StateManager.getInstance().unsubscribe('nodeClick', resetTooltipRender);
			StateManager.getInstance().unsubscribe('nodeContextMenu', resetTooltipRender);
			StateManager.getInstance().unsubscribe('nodeDown', resetTooltipRender);

			StateManager.getInstance().unsubscribe('relationTooltip', onItemTooltip);
			StateManager.getInstance().unsubscribe('relationLeave', onLeaveItem);
			StateManager.getInstance().unsubscribe('relationClick', resetTooltipRender);
			StateManager.getInstance().unsubscribe('relationContextMenu', resetTooltipRender);
		};
	}, []);

	const onRefChange = useCallback(
		(element: HTMLDivElement | null) => {
			if (element && selectedGraphItem) {
				useItemOverviewPopoverStore.getState().registerOverview({
					triggerElement: element,
					item: selectedGraphItem.item,
					popoverOffset: selectedGraphItem.offset
				});
			}
		},
		[selectedGraphItem]
	);

	// disable tooltip if any node moved (we use either this approach or manually
	// do it via StateManager/Sigma/Graph events)
	const onNodeAttributesUpdated = (
		payload: AttributeUpdatePayload<GraphEditorSigmaNodeAttributes>
	) => {
		if (payload.type === 'set' && (payload.name === 'x' || payload.name === 'y')) {
			resetTooltipRender();

			sigma.getGraph().off('nodeAttributesUpdated', onNodeAttributesUpdated);
		}
	};

	const onItemTooltip = (eventPayload: SigmaNodeEventPayload | SigmaEdgeEventPayload) => {
		const isItemNode = 'node' in eventPayload;

		sigma.getGraph().on('nodeAttributesUpdated', onNodeAttributesUpdated);

		if (isItemNode) {
			const nodeAttributes = sigma.getGraph().getNodeAttributes(eventPayload.node);
			const node = nodeAttributes.data;

			if (isNode(node)) {
				const nodeViewportPosition = sigma.graphToViewport({
					x: nodeAttributes.x,
					y: nodeAttributes.y
				});

				const offset = nodeAttributes.size * sigma.scaleSize() + 10;

				setSelectedGraphItem({
					x: nodeViewportPosition.x,
					y: nodeViewportPosition.y,
					item: node,
					offset: offset
				});
			}
		} else {
			const edgeAttributes = sigma.getGraph().getEdgeAttributes(eventPayload.edge);
			const edge = edgeAttributes.data;

			if (isRelation(edge)) {
				setSelectedGraphItem({
					x: eventPayload.event.x,
					y: eventPayload.event.y,
					item: edge,
					offset: sigma.scaleSize() + 10
				});
			}
		}
	};

	const onLeaveItem = () => {
		sigma.getGraph().off('nodeAttributesUpdated', onNodeAttributesUpdated);

		useItemOverviewPopoverStore.getState().initializeMouseLeaveTimeout(() => {
			const currentlyHoveredOverview = useItemOverviewPopoverStore
				.getState()
				.getCurrentlyHoveredOverview();

			if (!currentlyHoveredOverview) {
				resetTooltipRender();
			}
		});
	};

	const resetTooltipRender = () => {
		setSelectedGraphItem(null);
		useItemOverviewPopoverStore.getState().reset();
	};

	const tooltipParentStyle: CSSProperties = selectedGraphItem
		? {
				top: selectedGraphItem.y + 'px',
				left: selectedGraphItem.x + 'px'
			}
		: {};

	if (selectedGraphItem) {
		return createPortal(
			<div
				className="network-graph__node-relation-mouseover"
				ref={onRefChange}
				style={tooltipParentStyle}
			/>,
			sigma.getContainer()
		);
	}

	return null;
};
