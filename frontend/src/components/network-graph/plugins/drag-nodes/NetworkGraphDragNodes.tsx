import { useEffect, useRef } from 'react';
import { Coordinates } from 'sigma/types';
import { preventSigmaCameraMovement } from 'src/components/network-graph/helpers';
import { NodeDragEvent, StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';
import { useItemsStore } from 'src/stores/items';
import { GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX } from 'src/utils/constants';
import { useDebounce } from 'src/utils/hooks/useDebounce';

/**
 * Enables dragging of the highlighted/selected node(s) around the graph.
 *
 * On top of plain dragging, this also implements "edge auto-panning": while
 * dragging, if the dragged node(s) get close to the edge of the graph
 * container, the camera automatically pans in that direction (faster the
 * closer to/further past the edge), allowing the user to keep dragging
 * beyond what is currently visible without letting go of the mouse.
 *
 * High-level flow per drag:
 * 1. "nodeDragPreparation" (state manager "before" callback) - runs once when
 *    the drag starts, highlights the grabbed node and records starting
 *    coordinates.
 * 2. "mouseMoveBody" (state manager callback) - runs on every real mouse
 *    move, moves the highlighted node(s) by the pointer's graph-space delta,
 *    and asks "updateAutoPan" to (re)start the auto-pan loop if needed.
 * 3. "autoPanTick" - a "requestAnimationFrame" loop that keeps panning the
 *    camera (and keeping the dragged node(s) glued to the cursor) for as
 *    long as the drag is still near an edge, independently of whether the
 *    mouse itself is moving.
 * 4. The loop/drag is stopped on mouseup, or defensively on window blur/tab
 *    visibility change in case a real mouseup event never reaches sigma.
 */
export const NetworkGraphDragNodes = () => {
	const { unHighlightNodes, isNodeHighlighted, highlightNode, sigma } = useGraphStore(
		(store) => store
	);
	const setNodePosition = useItemsStore((store) => store.setNodePosition);
	// last graph-space coordinates of the cursor, used to compute per-move deltas
	const previousCoordinatesRef = useRef<Coordinates>({ x: 0, y: 0 });
	// last known drag event (holds the cursor's viewport/pixel coordinates), kept
	// around so the RAF auto-pan loop can keep operating even when the mouse
	// itself isn't moving (e.g. held still at the edge of the container)
	const lastDragEventRef = useRef<NodeDragEvent | null>(null);
	// id returned by requestAnimationFrame for the currently running auto-pan
	// loop, or null when no loop is scheduled
	const autoPanFrameRef = useRef<number | null>(null);
	const delayedCallback = useDebounce(200);

	useEffect(() => {
		// enable node dragging: highlight/prepare on drag start, move on every
		// subsequent mouse move while the drag is active
		StateManager.getInstance().subscribe('nodeDrag', {
			beforeCallback: nodeDragPreparation,
			callback: mouseMoveBody
		});

		// stop auto-panning as soon as the drag ends
		StateManager.getInstance().subscribe('mouseUp', stopAutoPan);

		// Safety net: if the drag ends abnormally (mouseup fired outside the
		// window/tab, tab loses focus, browser switches away, etc.) the sigma
		// mouse captor might never emit 'mouseup', leaving the auto-pan RAF
		// loop running forever and silently drifting the camera. Stop it
		// whenever the window loses focus/visibility.
		window.addEventListener('blur', stopAutoPan);
		document.addEventListener('visibilitychange', stopAutoPan);

		return () => {
			StateManager.getInstance().unsubscribe('nodeDrag', mouseMoveBody);
			StateManager.getInstance().unsubscribe('mouseUp', stopAutoPan);
			window.removeEventListener('blur', stopAutoPan);
			document.removeEventListener('visibilitychange', stopAutoPan);
			stopAutoPan();
		};
	}, []);

	/**
	 * Move every currently highlighted (dragged) node by the given graph-space
	 * delta, keeping their relative positions to each other intact. Used both
	 * for regular mouse-driven drag movement and for the auto-pan loop, which
	 * needs to keep the dragged node(s) glued to the cursor while the camera
	 * pans underneath them.
	 *
	 * Node position updates are split into two parts for performance reasons:
	 * - the sigma graph attributes are updated immediately (synchronously) so
	 *   the drag feels instant/responsive
	 * - the debounced "setNodePosition" (item store) update is delayed, since
	 *   it's more expensive (e.g. persisting/propagating the change) and
	 *   doesn't need to happen on every single frame
	 */
	const moveNodesBy = (delta: Coordinates) => {
		const graph = sigma.getGraph();

		useGraphStore.getState().highlightedNodeIds.forEach((nodeId) => {
			const currentX = graph.getNodeAttribute(nodeId, 'x');
			const currentY = graph.getNodeAttribute(nodeId, 'y');

			// immediate update of sigma's internal graph so the rendered
			// position moves right away
			useGraphStore.getState().setNodePosition(nodeId, {
				x: (currentX || 0) + delta.x,
				y: (currentY || 0) + delta.y
			});

			// debounced update of the item store so we don't spam it on every
			// single mouse-move/animation frame
			delayedCallback(() => {
				setNodePosition(nodeId, {
					x: graph.getNodeAttribute(nodeId, 'x'),
					y: graph.getNodeAttribute(nodeId, 'y')
				});
			});
		});
	};

	/**
	 * Main drag handler, invoked by the state manager on every real mouse move
	 * while a node is being dragged ("nodeDrag" state).
	 *
	 * Moves the highlighted node(s) by the difference between the previous and
	 * current cursor graph-space position, prevents sigma's own default camera
	 * drag behavior (we're dragging nodes, not the camera), and lets
	 * "updateAutoPan" decide whether the cursor is close enough to an edge to
	 * (re)start the auto-pan loop.
	 */
	const mouseMoveBody = (event: NodeDragEvent) => {
		lastDragEventRef.current = event;

		const previousPosition = previousCoordinatesRef.current;
		const currentPosition = sigma.viewportToGraph(event);

		moveNodesBy({
			x: currentPosition.x - previousPosition.x,
			y: currentPosition.y - previousPosition.y
		});

		previousCoordinatesRef.current = currentPosition;

		// this is a node drag, not a camera/stage drag - stop sigma from also
		// panning the camera on its own in response to this mouse move
		preventSigmaCameraMovement(event);

		updateAutoPan();
	};

	/**
	 * Runs once, right when a drag starts (state manager "before" callback for
	 * the "nodeDrag" state). Highlights the grabbed node - preserving the rest
	 * of an existing multi-selection if the grabbed node is already part of
	 * it - and records the cursor's starting graph-space position as the
	 * baseline for the first "mouseMoveBody"/"autoPanTick" delta calculation.
	 */
	const nodeDragPreparation = (event: NodeDragEvent) => {
		// defensively stop any leftover auto-pan loop from a previous drag that
		// may not have ended cleanly (see blur/visibilitychange safety net above)
		stopAutoPan();

		if (!isNodeHighlighted(event.nodeId)) {
			unHighlightNodes();
		}

		highlightNode(event.nodeId);

		previousCoordinatesRef.current = sigma.viewportToGraph(event);
		lastDragEventRef.current = event;
	};

	/**
	 * Compute the on-screen (viewport pixel) bounding box of every node that's
	 * currently part of the drag (i.e. the highlighted/selected group).
	 *
	 * This is used instead of just the cursor position so that edge
	 * auto-panning reacts correctly to multi-node drags: with a group
	 * selection, some nodes can already be past the container edge while the
	 * cursor (over the specific node that was grabbed) is still comfortably
	 * inside the viewport, or vice versa.
	 *
	 * Returns "null" if there is nothing to compute a bounding box from - i.e.
	 * no nodes are currently highlighted, or none of the highlighted ids are
	 * (still) present in the graph. Callers treat "null" as "no panning
	 * needed".
	 */
	const getDraggedGroupViewportBoundingBox = () => {
		const highlightedNodeIds = useGraphStore.getState().highlightedNodeIds;

		// nothing highlighted - nothing to compute, bail out immediately
		if (!highlightedNodeIds.size) {
			return null;
		}

		const graph = sigma.getGraph();

		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;

		highlightedNodeIds.forEach((nodeId) => {
			if (!graph.hasNode(nodeId)) {
				return;
			}

			// project the node's graph-space position to viewport pixels so it
			// can be compared against the container's pixel dimensions/edges
			const { x, y } = sigma.graphToViewport({
				x: graph.getNodeAttribute(nodeId, 'x'),
				y: graph.getNodeAttribute(nodeId, 'y')
			});

			minX = Math.min(minX, x);
			maxX = Math.max(maxX, x);
			minY = Math.min(minY, y);
			maxY = Math.max(maxY, y);
		});

		// all highlighted node ids were stale/no longer in the graph (edge case)
		if (minX === Infinity) {
			return null;
		}

		return { minX, maxX, minY, maxY };
	};

	/**
	 * Determine the desired camera pan speed (in screen pixels per animation
	 * frame, one value per axis) based on how far past the edge threshold the
	 * dragged group's bounding box reaches.
	 *
	 * The speed ramps up linearly the further the group is pushed past the
	 * threshold (0 right at the threshold, up to the user-configurable
	 * `autoPanSpeed` graph store value - defaults to `GRAPH_AUTO_PAN_MAX_SPEED_PX`
	 * - once the edge of the group reaches/exceeds the container edge itself),
	 * giving a smoother, more controllable auto-pan than an abrupt on/off
	 * toggle.
	 *
	 * Reads `autoPanSpeed` via `useGraphStore.getState()` (instead of
	 * subscribing to it reactively) so the RAF loop always picks up the latest
	 * value, even though `autoPanTick`/`mouseMoveBody` are captured once as
	 * closures when the drag starts.
	 *
	 * Returns "{ x: 0, y: 0 }" when no panning is currently needed on either
	 * axis, which callers use as the signal to stop the auto-pan loop.
	 */
	const computeEdgePanSpeed = () => {
		const boundingBox = getDraggedGroupViewportBoundingBox();

		if (!boundingBox) {
			return { x: 0, y: 0 };
		}

		const autoPanSpeed = useGraphStore.getState().autoPanSpeed;
		const rect = sigma.getContainer().getBoundingClientRect();
		let panX = 0;
		let panY = 0;

		// Guard against a "runaway" auto-pan: if the dragged group's bounding
		// box is wider/taller than the viewport itself, both edges can be past
		// their respective thresholds at the same time. Since nodes stay glued
		// to the cursor while panning, this condition would never resolve and
		// the camera would drift in one direction forever. Skip panning on an
		// axis entirely once the group no longer fits within the viewport.
		if (boundingBox.maxX - boundingBox.minX < rect.width) {
			if (boundingBox.minX < GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX) {
				// group's left edge is inside the left threshold zone -> pan left
				// (negative x), faster the closer to (or past) the edge
				const ratio =
					(GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX - boundingBox.minX) /
					GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX;
				panX = -autoPanSpeed * Math.min(Math.max(ratio, 0), 1);
			} else if (boundingBox.maxX > rect.width - GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX) {
				// group's right edge is inside the right threshold zone -> pan right
				const ratio =
					(boundingBox.maxX - (rect.width - GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX)) /
					GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX;
				panX = autoPanSpeed * Math.min(Math.max(ratio, 0), 1);
			}
		}

		if (boundingBox.maxY - boundingBox.minY < rect.height) {
			if (boundingBox.minY < GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX) {
				// group's top edge is inside the top threshold zone -> pan up
				const ratio =
					(GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX - boundingBox.minY) /
					GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX;
				panY = -autoPanSpeed * Math.min(Math.max(ratio, 0), 1);
			} else if (boundingBox.maxY > rect.height - GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX) {
				// group's bottom edge is inside the bottom threshold zone -> pan down
				const ratio =
					(boundingBox.maxY - (rect.height - GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX)) /
					GRAPH_AUTO_PAN_BOUNDARIES_THRESHOLD_PX;
				panY = autoPanSpeed * Math.min(Math.max(ratio, 0), 1);
			}
		}

		return { x: panX, y: panY };
	};

	/**
	 * Kick off the auto-pan RAF loop (idempotent thanks to the
	 * "autoPanFrameRef" gate - calling this while a loop is already running is
	 * a no-op). Called on every real mouse move during a drag; the loop itself
	 * ("autoPanTick") determines each frame, on its own, whether panning is
	 * still needed and stops itself when it isn't - this avoids computing the
	 * edge pan speed twice for the same instant (once here, once in the tick).
	 */
	const updateAutoPan = () => {
		if (autoPanFrameRef.current === null) {
			autoPanFrameRef.current = requestAnimationFrame(autoPanTick);
		}
	};

	/**
	 * One iteration of the auto-pan "requestAnimationFrame" loop.
	 *
	 * On every frame:
	 * 1. Recomputes the current pan speed; if none is needed anymore (cursor/
	 *    group moved back away from the edges, or the drag ended), stops the
	 *    loop by clearing "autoPanFrameRef" and returning without scheduling
	 *    another frame.
	 * 2. Otherwise, pans the camera by the desired amount, converting the
	 *    screen-pixel pan speed into the camera's own coordinate space via
	 *    "viewportToFramedGraph" (see inline note below for why this
	 *    conversion - and not "viewportToGraph" - is required).
	 * 3. Since the cursor itself hasn't moved (no real mouse event happened
	 *    between frames), panning the camera changes which graph point now
	 *    sits under the cursor. The dragged node(s) are moved by that same
	 *    delta so they stay visually glued to the cursor while the camera
	 *    pans underneath them - this is what makes the drag feel continuous.
	 * 4. Schedules the next frame.
	 */
	const autoPanTick = () => {
		const event = lastDragEventRef.current;
		const { x: panX, y: panY } = computeEdgePanSpeed();

		if (!event || (panX === 0 && panY === 0)) {
			autoPanFrameRef.current = null;
			return;
		}

		// Translate the desired screen-space pan into a *framed graph* space
		// camera delta. NOTE: camera.x / camera.y live in the "framed graph"
		// coordinate space (see sigma's viewportToFramedGraph / graphToViewport),
		// NOT the raw graph/node coordinate space returned by viewportToGraph.
		// Mixing the two causes huge, incorrect camera jumps.
		const framedA = sigma.viewportToFramedGraph({ x: event.x, y: event.y });
		const framedB = sigma.viewportToFramedGraph({ x: event.x + panX, y: event.y + panY });

		const camera = sigma.getCamera();
		camera.setState({
			...camera.getState(),
			x: camera.x + (framedB.x - framedA.x),
			y: camera.y + (framedB.y - framedA.y)
		});

		// Keep the dragged node(s) glued to the cursor: since the camera moved,
		// the graph point under the same screen pixel changed too. Node
		// coordinates are in raw graph space, so viewportToGraph is correct here.
		const newGraphPosition = sigma.viewportToGraph(event);
		const previousPosition = previousCoordinatesRef.current;

		moveNodesBy({
			x: newGraphPosition.x - previousPosition.x,
			y: newGraphPosition.y - previousPosition.y
		});

		previousCoordinatesRef.current = newGraphPosition;

		// keep the loop going for as long as panning is still needed
		autoPanFrameRef.current = requestAnimationFrame(autoPanTick);
	};

	/**
	 * Cancel the auto-pan RAF loop, if one is currently scheduled, and reset
	 * the tracking ref. Safe to call at any time, including when no loop is
	 * running (no-op in that case). Invoked on drag end ("mouseUp"), on
	 * window blur/tab visibility change (abnormal drag termination safety
	 * net), on component unmount, and defensively at the start of every new
	 * drag.
	 */
	const stopAutoPan = () => {
		if (autoPanFrameRef.current !== null) {
			cancelAnimationFrame(autoPanFrameRef.current);
			autoPanFrameRef.current = null;
		}
	};

	return null;
};
