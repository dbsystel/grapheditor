import { calculateBoundingBoxCenterByCoordinates } from 'src/components/network-graph/helpers';
import i18n from 'src/i18n';
import { Cartesian2D } from 'src/models/graph';
import { NodeId } from 'src/models/node';
import { useContextMenuStore } from 'src/stores/context-menu';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { GRAPH_CONTEXT_MENU_LAYOUT_DISTANCE_BETWEEN_NODES } from 'src/utils/constants';

// TODO currently we don't scale values, check if that is ok (the applyLayoutToFollowingNodesAction's
//  logic scales values, discuss in team which approach to take)
export const applyLayoutAction = (
	direction:
		| 'horizontal'
		| 'vertical'
		| 'horizontal-spread'
		| 'vertical-spread'
		| 'horizontal-center'
		| 'vertical-center'
		| 'top'
		| 'right'
		| 'bottom'
		| 'left'
		| 'top-align'
		| 'right-align'
		| 'bottom-align'
		| 'left-align'
) => {
	const nodeIds = useContextMenuStore.getState().nodeIds;
	const triggerItem = useContextMenuStore.getState().triggerItem;
	const sigma = useGraphStore.getState().sigma;
	const graph = sigma.getGraph();
	const nodeData: Array<{ id: NodeId; size: number } & Cartesian2D> = [];
	let sizeSum = 0;

	nodeIds.forEach((nodeId) => {
		const x = graph.getNodeAttribute(nodeId, 'x');
		const y = graph.getNodeAttribute(nodeId, 'y');
		const size = graph.getNodeAttribute(nodeId, 'size');

		sizeSum += size;

		nodeData.push({
			id: nodeId,
			size: size,
			x: x,
			y: y
		});
	});

	if (direction.endsWith('-center')) {
		/**
		 * Horizontal/vertical center (`*-center`)
		 * ---------------------------------------
		 * Align all selected nodes to a single coordinate value on one axis:
		 * - `horizontal-center` => update all `x` values
		 * - `vertical-center`   => update all `y` values
		 *
		 * The target coordinate is the midpoint between the minimum and maximum
		 * coordinate among selected nodes on the chosen axis:
		 *   midpoint = (min + max) / 2
		 *
		 * Based on PowerPoint.
		 * This keeps centering independent from selection order and node count.
		 */
		const coordinate = direction === 'horizontal-center' ? 'x' : 'y';

		if (direction === 'horizontal-center') {
			// sort ascending by "x"
			nodeData.sort((a, b) => a.x - b.x);
		} else {
			// sort ascending by "y"
			nodeData.sort((a, b) => a.y - b.y);
		}

		const newCoordinateValue =
			(nodeData[0][coordinate] + nodeData[nodeData.length - 1][coordinate]) / 2;

		nodeData.forEach((nodeEntry) => {
			graph.setNodeAttribute(nodeEntry.id, coordinate, newCoordinateValue);
		});
	} else if (direction.endsWith('-spread')) {
		/**
		 * Horizontal/vertical spread (`*-spread`)
		 * ---------------------------------------
		 * Keep the lowest and highest node positions on the chosen axis and distribute
		 * nodes between them with equal spacing. Based on PowerPoint.
		 *
		 * Steps:
		 * 1) Sort nodes by the selected axis (`x` for horizontal, `y` for vertical).
		 * 2) Compute:
		 *      step = (max - min) / (count - 1)
		 * 3) Reposition only interior nodes (index 1..count-2):
		 *      value = min + index * step
		 *
		 * Endpoints stay unchanged; overlap is allowed when span is zero.
		 */
		if (direction === 'horizontal-spread') {
			// sort ascending by "x"
			nodeData.sort((a, b) => a.x - b.x);
		} else {
			// sort ascending by "y"
			nodeData.sort((a, b) => a.y - b.y);
		}

		const coordinate = direction === 'horizontal-spread' ? 'x' : 'y';
		const firstCoordinateValue = nodeData[0][coordinate];
		const step =
			(nodeData[nodeData.length - 1][coordinate] - firstCoordinateValue) /
			(nodeData.length - 1);

		nodeData.forEach((nodeEntry, index) => {
			if (index > 0 && index < nodeData.length - 1) {
				graph.setNodeAttribute(
					nodeEntry.id,
					coordinate,
					firstCoordinateValue + index * step
				);
			}
		});
	}
	// if top, right, bottom or left alignment
	else if (direction.endsWith('-align')) {
		/**
		 * Edge align (`*-align`)
		 * ----------------------
		 * Move all selected nodes to a shared edge coordinate, similar to presentation
		 * tools (e.g. PowerPoint):
		 * - `top-align` / `bottom-align` => align `y`
		 * - `left-align` / `right-align` => align `x`
		 *
		 * The reference coordinate is taken from the extreme node on the requested side
		 * (found by sorting by the corresponding axis/direction).
		 */
		// implemented based on PowerPoint alignment option logic
		if (direction === 'top-align') {
			// sort descending by "y"
			nodeData.sort((a, b) => b.y - a.y);
		} else if (direction === 'right-align') {
			// sort descending by "x"
			nodeData.sort((a, b) => b.x - a.x);
		} else if (direction === 'bottom-align') {
			// sort ascending by "y"
			nodeData.sort((a, b) => a.y - b.y);
		} else {
			// sort ascending by "x"
			nodeData.sort((a, b) => a.x - b.x);
		}

		const referenceCoordinates = nodeData.at(0);

		if (referenceCoordinates) {
			nodeData.forEach((nodeEntry) => {
				if (direction === 'top-align' || direction === 'bottom-align') {
					graph.setNodeAttribute(nodeEntry.id, 'y', referenceCoordinates.y);
				} else {
					graph.setNodeAttribute(nodeEntry.id, 'x', referenceCoordinates.x);
				}
			});
		} else {
			useNotificationsStore.getState().addNotification({
				title: i18n.t('context_menu_apply_layout_no_reference_data'),
				type: 'warning'
			});
		}
	}
	// if horizontal or vertical alignment
	else if (direction === 'horizontal' || direction === 'vertical') {
		/**
		 * Linear layout (`horizontal` / `vertical`)
		 * -----------------------------------------
		 * Arrange selected nodes in a line centered around the bounding-box center.
		 * Node size and a fixed gap are both respected so neighboring nodes keep
		 * consistent spacing.
		 *
		 * Algorithm:
		 * 1) Sort by active axis.
		 * 2) Compute geometric center from selected coordinates.
		 * 3) Place first node at start point left/below center.
		 * 4) For each next node, advance by:
		 *      current.size + gap + next.size
		 *
		 * This creates center-to-center spacing that accounts for node radii.
		 */
		if (direction === 'horizontal') {
			nodeData.sort((a, b) => a.x - b.x);
		} else {
			nodeData.sort((a, b) => a.y - b.y);
		}

		const center = calculateBoundingBoxCenterByCoordinates(nodeData);

		const startPointValue = direction === 'horizontal' ? center.x : center.y;
		let pointValue =
			startPointValue -
			sizeSum -
			(GRAPH_CONTEXT_MENU_LAYOUT_DISTANCE_BETWEEN_NODES / 2) * (nodeIds.length - 1);

		nodeData.forEach((nodeEntry, index) => {
			if (direction === 'horizontal') {
				graph.mergeNodeAttributes(nodeEntry.id, { x: pointValue, y: center.y });
			} else {
				graph.mergeNodeAttributes(nodeEntry.id, { x: center.x, y: pointValue });
			}

			pointValue +=
				nodeEntry.size +
				GRAPH_CONTEXT_MENU_LAYOUT_DISTANCE_BETWEEN_NODES +
				(nodeData.at(index + 1)?.size || 0);
		});
	}
	// if top, right, bottom or left direction
	else if (triggerItem) {
		/**
		 * Direction from trigger (`top` / `right` / `bottom` / `left`)
		 * -------------------------------------------------------------
		 * Use the context-menu trigger node as an anchor and place other selected nodes
		 * on one axis outward from it in the requested direction.
		 *
		 * Behavior:
		 * - Axis: horizontal for left/right, vertical for top/bottom.
		 * - Sign: positive for right/top, negative for left/bottom.
		 * - Order: other nodes are sorted by Euclidean distance to the anchor.
		 * - Spacing: anchor size + gap + neighbor size, then repeated per node.
		 *
		 * Result: nodes form an ordered chain extending from the trigger node.
		 */
		const anchorX = graph.getNodeAttribute(triggerItem.id, 'x');
		const anchorY = graph.getNodeAttribute(triggerItem.id, 'y');

		const isHorizontalAxis = direction === 'left' || direction === 'right';
		const sign = direction === 'right' || direction === 'top' ? 1 : -1;

		const otherNodes = nodeData.filter((n) => n.id !== triggerItem.id);

		// sort by Euclidean ("air") distance
		otherNodes.sort((a, b) => {
			const distSqA = (a.x - anchorX) ** 2 + (a.y - anchorY) ** 2;
			const distSqB = (b.x - anchorX) ** 2 + (b.y - anchorY) ** 2;
			return distSqA - distSqB;
		});

		const triggerSize = graph.getNodeAttribute(triggerItem.id, 'size');
		let pointValue =
			(isHorizontalAxis ? anchorX : anchorY) +
			sign *
				(triggerSize +
					GRAPH_CONTEXT_MENU_LAYOUT_DISTANCE_BETWEEN_NODES +
					(otherNodes[0]?.size || 0));

		otherNodes.forEach((nodeEntry, index) => {
			if (isHorizontalAxis) {
				graph.mergeNodeAttributes(nodeEntry.id, { x: pointValue, y: anchorY });
			} else {
				graph.mergeNodeAttributes(nodeEntry.id, { x: anchorX, y: pointValue });
			}

			pointValue +=
				sign *
				(nodeEntry.size +
					GRAPH_CONTEXT_MENU_LAYOUT_DISTANCE_BETWEEN_NODES +
					(otherNodes.at(index + 1)?.size || 0));
		});
	}

	useContextMenuStore.getState().close();
};
