import { ElementHandle, Page } from '@playwright/test';

const NODE_LABEL_CONTAINER_SELECTOR = '.network-graph__node-label-container';

export type StableNodeLabelOptions = {
	/** only consider node labels whose text content includes this substring; defaults to the first rendered node label */
	textFilter?: string;
	timeout?: number;
	polling?: number;
};

/**
 * Waits until a network graph node's HTML label stops changing position across consecutive
 * polls, then returns a handle to it.
 *
 * Sigma.js hit-tests mouse clicks purely by coordinates against its own internally tracked node
 * positions, not by which DOM element is visually under the cursor. Since the force-directed
 * layout (and/or a camera auto-fit) can keep repositioning nodes for a while after the graph
 * loads/updates, reading a node's screen position too early and clicking shortly after can end up
 * landing on a completely different node that has since drifted into that same pixel. Waiting for
 * the position to be stable across repeated polls avoids that race condition.
 */
export async function waitForStableNodeLabel(
	page: Page,
	{ textFilter, timeout = 30000, polling = 300 }: StableNodeLabelOptions = {}
): Promise<ElementHandle<HTMLElement>> {
	const stableNodeHandle = await page.waitForFunction(
		({ selector, textFilter }) => {
			const nodes = Array.from(document.querySelectorAll(selector));
			const node = textFilter
				? nodes.find((candidate) => candidate.textContent?.includes(textFilter))
				: nodes.at(0);

			if (!node || !(node instanceof HTMLElement) || node.style.left === '') {
				return false;
			}

			const currentLeft = node.style.left;
			const currentTop = node.style.top;

			// store previous "left" and "top" value for comparison with current "left" and "top" values
			const previousLeft = node.getAttribute('data-previous-left');
			const previousTop = node.getAttribute('data-previous-top');

			node.setAttribute('data-previous-left', currentLeft);
			node.setAttribute('data-previous-top', currentTop);

			if (previousLeft === currentLeft && previousTop === currentTop) {
				node.removeAttribute('data-previous-left');
				node.removeAttribute('data-previous-top');

				return node;
			} else {
				return null;
			}
		},
		{ selector: NODE_LABEL_CONTAINER_SELECTOR, textFilter },
		{
			timeout,
			// graph seems to render twice in e2e, where nodes are differently positioned on each render
			polling
		}
	);

	const elementHandle = stableNodeHandle.asElement() as ElementHandle<HTMLElement> | null;

	if (!elementHandle) {
		throw new Error('Could not resolve a stable node label element');
	}

	return elementHandle;
}

/**
 * Same as "waitForStableNodeLabel", but directly returns the node label's bounding box.
 */
export async function getStableNodeBoundingBox(page: Page, options?: StableNodeLabelOptions) {
	const elementHandle = await waitForStableNodeLabel(page, options);
	const boundingBox = await elementHandle.boundingBox();

	if (!boundingBox) {
		throw new Error('Could not compute node bounding box');
	}

	return boundingBox;
}

/**
 * Waits for a node's label to stabilize, then clicks its center on the underlying sigma canvas.
 * The HTML label itself has no click handler, but sigma hit-tests by coordinates against its own
 * container, so clicking through the label's position still selects the right node.
 */
export async function clickStableNode(page: Page, options?: StableNodeLabelOptions) {
	const boundingBox = await getStableNodeBoundingBox(page, options);

	await page.mouse.click(
		boundingBox.x + boundingBox.width / 2,
		boundingBox.y + boundingBox.height / 2
	);

	return boundingBox;
}
