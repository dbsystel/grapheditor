import './NetworkGraphNodeRelationMouseover.scss';
import { AttributeUpdatePayload } from 'graphology-types';
import { CSSProperties, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SigmaEdgeEventPayload, SigmaNodeEventPayload } from 'sigma/types';
import { ItemOverviewPopover } from 'src/components/item-overview-popover/ItemOverviewPopover';
import { GraphEditorSigmaNodeAttributes } from 'src/components/network-graph/NetworkGraph.interfaces';
import { StateManager } from 'src/components/network-graph/state-manager';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { useGraphStore } from 'src/stores/graph';
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
	const tooltipRef = useRef<HTMLDivElement | null>(null);
	const hoveredItemId = useRef('');

	useEffect(() => {
		StateManager.getInstance().on('NODE_TOOLTIP', onItemTooltip);
		StateManager.getInstance().on('NODE_LEAVE', onLeaveItem);
		StateManager.getInstance().on('NODE_CLICK', resetTooltipRender);
		StateManager.getInstance().on('NODE_CONTEXT_MENU', resetTooltipRender);

		StateManager.getInstance().on('RELATION_TOOLTIP', onItemTooltip);
		StateManager.getInstance().on('RELATION_LEAVE', onLeaveItem);
		StateManager.getInstance().on('RELATION_CLICK', resetTooltipRender);
		StateManager.getInstance().on('RELATION_CONTEXT_MENU', resetTooltipRender);

		return () => {
			StateManager.getInstance().off('NODE_TOOLTIP', onItemTooltip);
			StateManager.getInstance().off('NODE_LEAVE', onLeaveItem);
			StateManager.getInstance().off('NODE_CLICK', resetTooltipRender);
			StateManager.getInstance().off('NODE_CONTEXT_MENU', resetTooltipRender);

			StateManager.getInstance().off('RELATION_TOOLTIP', onItemTooltip);
			StateManager.getInstance().off('RELATION_LEAVE', onLeaveItem);
			StateManager.getInstance().off('RELATION_CLICK', resetTooltipRender);
			StateManager.getInstance().off('RELATION_CONTEXT_MENU', resetTooltipRender);
		};
	}, []);

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

		window.setTimeout(() => {
			if (!hoveredItemId.current) {
				setSelectedGraphItem(null);
			}
		}, 50);
	};

	const resetTooltipRender = () => {
		hoveredItemId.current = '';
		setSelectedGraphItem(null);
	};

	const onTooltipParentMouseEnter = () => {
		if (selectedGraphItem) {
			hoveredItemId.current = selectedGraphItem.item.id;
		}
	};

	const onTooltipParentMouseLeave = () => {
		resetTooltipRender();
	};

	const tooltipParentStyle: CSSProperties = {
		top: selectedGraphItem?.y + 'px',
		left: selectedGraphItem?.x + 'px'
	};

	return createPortal(
		<div
			className="network-graph__node-relation-mouseover"
			onMouseEnter={onTooltipParentMouseEnter}
			onMouseLeave={onTooltipParentMouseLeave}
			ref={tooltipRef}
			style={tooltipParentStyle}
		>
			{selectedGraphItem && (
				<ItemOverviewPopover
					item={selectedGraphItem.item}
					popoverRef={tooltipRef.current}
					popoverOffset={selectedGraphItem.offset}
				/>
			)}
		</div>,
		sigma.getContainer()
	);
};
