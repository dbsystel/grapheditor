import './NetworkGraph.scss';
import clsx from 'clsx';
import { useCallback, useEffect, useRef } from 'react';
import { LoadGraph } from 'src/components/network-graph/LoadGraph';
import { NetworkGraphSearch } from 'src/components/network-graph/modules/search/NetworkGraphSearch';
import { NetworkGraphContainer } from 'src/components/network-graph/NetworkGraphContainer';
import { NetworkGraphAutoConnectNode } from 'src/components/network-graph/plugins/auto-connect-node/NetworkGraphAutoConnectNode';
import { NetworkGraphCanvasContextMenu } from 'src/components/network-graph/plugins/canvas-context-menu/NetworkGraphCanvasContextMenu';
import { NetworkGraphDragNodes } from 'src/components/network-graph/plugins/drag-nodes/NetworkGraphDragNodes';
import { NetworkGraphNodeClick } from 'src/components/network-graph/plugins/node-click/NetworkGraphNodeClick';
import { NetworkGraphNodeContextMenu } from 'src/components/network-graph/plugins/node-context-menu/NetworkGraphNodeContextMenu';
import { NetworkGraphNodeHtmlLabel } from 'src/components/network-graph/plugins/node-html-label/NetworkGraphNodeHtmlLabel';
import { NetworkGraphNodeRelationMouseover } from 'src/components/network-graph/plugins/node-relation-mouseover/NetworkGraphNodeRelationMouseover';
import { NetworkGraphQuickNode } from 'src/components/network-graph/plugins/quick-node/NetworkGraphQuickNode';
import { NetworkGraphQuickZoomFactor } from 'src/components/network-graph/plugins/quick-zoom-factor/NetworkGraphQuickZoomFactor';
import { NetworkGraphRelationClick } from 'src/components/network-graph/plugins/relation-click/NetworkGraphRelationClick';
import { NetworkGraphRelationContextMenu } from 'src/components/network-graph/plugins/relation-context-menu/NetworkGraphRelationContextMenu';
import { NetworkGraphScale } from 'src/components/network-graph/plugins/scale/NetworkGraphScale';
import { NetworkGraphSelectionTool } from 'src/components/network-graph/plugins/selection-tool/NetworkGraphSelectionTool';
import i18n from 'src/i18n';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { checkBrowserRenderingCapabilities } from 'src/utils/helpers/browser';
import { NetworkGraphProps } from './NetworkGraph.interfaces';

/**
 * Functional component responsible for rendering a network graph using Sigma.js.
 * It supports 2 layouts: random and Force Atlas 2. The random layout is more performant,
 * but the Force Atlas 2 layout renders nodes and relations in a more understandable form.
 *
 * Inside the component you'll find some custom "plugins". The idea behind these plugins
 * is to have different UI interactions in standalone components, where each plugin is
 * fully responsible for its functionality, (ideally) without being influenced by other plugins.
 *
 * At the moment, the graph provides some of the UI controls such as zoom in/out, fit to bounds and fullscreen.
 * Additionally, there is a node search field which focuses selected node.
 * Additionally, it is possible to multi-select nodes ba holding left SHIFT and
 * moving a mouse around the graph. This will create a rectangle element which
 * will select all nodes inside it.
 *
 * NOTE: Enable hardware acceleration option in your browser in order for WebGL to work.
 *
 * NOTE: lasso example (can be used instead of the rectangle selection)
 * https://codepen.io/cranes/pen/GvobwB.
 */

export const NetworkGraph = ({ id, className, testId }: NetworkGraphProps) => {
	const isLoading = useGraphStore((store) => store.isLoading);
	const isRenderingCapabilitiesWarningShown = useGraphStore(
		(store) => store.isRenderingCapabilitiesWarningShown
	);
	const rootElementSize = useRef({ width: -1 });
	const observerRef = useRef(
		new ResizeObserver(function (mutations) {
			const observerSize = mutations.at(0)?.contentBoxSize.at(0);

			if (observerSize) {
				// initial render
				if (rootElementSize.current.width === -1) {
					rootElementSize.current.width = observerSize.inlineSize;
				}
				// refresh graph only if its width has changed (ignore height changes)
				else if (rootElementSize.current.width !== observerSize.inlineSize) {
					rootElementSize.current.width = observerSize.inlineSize;

					if (useGraphStore.getState().isGraphRendered) {
						useGraphStore.getState().sigma.refresh();
					}
				}
			}
		})
	);
	const rootElementClassName = clsx(
		'network-graph',
		isLoading && 'network-graph--is-loading',
		className
	);

	const onRefChange = useCallback((element: HTMLDivElement | null) => {
		if (element) {
			observerRef.current.observe(element);
		} else {
			observerRef.current.disconnect();
		}
	}, []);

	useEffect(() => {
		// TODO this probably needs to be checked only once
		const renderingCapabilities = checkBrowserRenderingCapabilities();

		if (renderingCapabilities.softwareRendering && !isRenderingCapabilitiesWarningShown) {
			useGraphStore.getState().setIsRenderingCapabilitiesWarningShown(true);

			useNotificationsStore.getState().addNotification({
				title: i18n.t(
					'notifications_warning_rendering_capabilities_software_rendering_fallback_used_title'
				),
				description: i18n.t(
					'notifications_warning_rendering_capabilities_software_rendering_fallback_used_description'
				),
				type: 'warning',
				autoCloseAfterMilliseconds: 0,
				isClosable: true
			});
		}
	}, []);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId} ref={onRefChange}>
			<div className="network-graph__top-widget">
				<NetworkGraphSearch />
			</div>
			<NetworkGraphContainer>
				{/* Plugins */}
				<NetworkGraphAutoConnectNode />
				<NetworkGraphSelectionTool />
				<NetworkGraphDragNodes />
				<NetworkGraphNodeClick />
				<NetworkGraphRelationClick />
				<NetworkGraphNodeRelationMouseover />
				<NetworkGraphQuickNode />
				<NetworkGraphScale />
				<NetworkGraphNodeContextMenu />
				<NetworkGraphQuickZoomFactor />
				<NetworkGraphNodeHtmlLabel />
				<NetworkGraphCanvasContextMenu />
				<NetworkGraphRelationContextMenu />

				<LoadGraph />
			</NetworkGraphContainer>
		</div>
	);
};
