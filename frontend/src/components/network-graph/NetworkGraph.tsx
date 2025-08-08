import './NetworkGraph.scss';
import clsx from 'clsx';
import { LoadGraph } from 'src/components/network-graph/LoadGraph';
import { NetworkGraphNodeLabelsDefault } from 'src/components/network-graph/modules/node-labels-default/NetworkGraphNodeLabelsDefault';
import { NetworkGraphPerspectiveSave } from 'src/components/network-graph/modules/perspective-save/NetworkGraphPerspectiveSave';
import { NetworkGraphPerspectiveSaveAs } from 'src/components/network-graph/modules/perspective-save-as/NetworkGraphPerspectiveSaveAs';
import { NetworkGraphRelationTypeDefault } from 'src/components/network-graph/modules/relation-type-default/NetworkGraphRelationTypeDefault';
import { NetworkGraphSearch } from 'src/components/network-graph/modules/search/NetworkGraphSearch';
import { NetworkGraphStyleReset } from 'src/components/network-graph/modules/style-reset/NetworkGraphStyleReset';
import { NetworkGraphStyleUpload } from 'src/components/network-graph/modules/style-upload/NetworkGraphStyleUpload';
import { NetworkGraphZoomFactor } from 'src/components/network-graph/modules/zoom-factor/NetworkGraphZoomFactor';
import { NetworkGraphContainer } from 'src/components/network-graph/NetworkGraphContainer';
import { NetworkGraphAutoConnectNode } from 'src/components/network-graph/plugins/auto-connect-node/NetworkGraphAutoConnectNode';
import { NetworkGraphCanvasContextMenu } from 'src/components/network-graph/plugins/canvas-context-menu/NetworkGraphCanvasContextMenu';
import { NetworkGraphDragNodes } from 'src/components/network-graph/plugins/drag-nodes/NetworkGraphDragNodes';
import { NetworkGraphRelationContextMenu } from 'src/components/network-graph/plugins/NetworkGraphRelationContextMenu';
import { NetworkGraphNodeClick } from 'src/components/network-graph/plugins/node-click/NetworkGraphNodeClick';
import { NetworkGraphNodeContextMenu } from 'src/components/network-graph/plugins/node-context-menu/NetworkGraphNodeContextMenu';
import { NetworkGraphNodeHtmlLabel } from 'src/components/network-graph/plugins/node-html-label/NetworkGraphNodeHtmlLabel';
import { NetworkGraphNodeRelationMouseover } from 'src/components/network-graph/plugins/node-relation-mouseover/NetworkGraphNodeRelationMouseover';
import { NetworkGraphQuickNode } from 'src/components/network-graph/plugins/quick-node/NetworkGraphQuickNode';
import { NetworkGraphQuickZoomFactor } from 'src/components/network-graph/plugins/quick-zoom-factor/NetworkGraphQuickZoomFactor';
import { NetworkGraphRelationClick } from 'src/components/network-graph/plugins/relation-click/NetworkGraphRelationClick';
import { NetworkGraphScale } from 'src/components/network-graph/plugins/scale/NetworkGraphScale';
import { NetworkGraphSelectionTool } from 'src/components/network-graph/plugins/selection-tool/NetworkGraphSelectionTool';
import { useGraphStore } from 'src/stores/graph';
import { useSearchStore } from 'src/stores/search';
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
	const { isLoading } = useGraphStore((state) => state);
	const rootElementClassName = clsx(
		'network-graph',
		isLoading && 'network-graph--is-loading',
		className
	);

	const onStyleSuccess = () => {
		useSearchStore.getState().executeSearch();
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<NetworkGraphContainer>
				{/* Modules */}
				<div className="network-graph__options">
					<NetworkGraphStyleUpload onSuccess={onStyleSuccess} />
					<NetworkGraphStyleReset onSuccess={onStyleSuccess} />
					<NetworkGraphPerspectiveSave />
					<NetworkGraphPerspectiveSaveAs />
					<NetworkGraphNodeLabelsDefault />
					<NetworkGraphRelationTypeDefault />
					<NetworkGraphZoomFactor />
				</div>

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

				<NetworkGraphSearch />

				<LoadGraph />
			</NetworkGraphContainer>
		</div>
	);
};
