import { NetworkGraphNodeLabelsDefault } from 'src/components/network-graph/modules/node-labels-default/NetworkGraphNodeLabelsDefault';
import { NetworkGraphRelationTypeDefault } from 'src/components/network-graph/modules/relation-type-default/NetworkGraphRelationTypeDefault';

export const LeftWidgetNewItemSettings = () => {
	return (
		<>
			<NetworkGraphNodeLabelsDefault />
			<NetworkGraphRelationTypeDefault />
		</>
	);
};
