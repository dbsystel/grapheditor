import { http, HttpResponse } from 'msw';
import { Node, NodeConnection, NodeConnections, NodeId } from 'src/models/node';
import { TEST_HOST } from 'src/tests/constants';
import { getTestNodesLabels, getTestNodesProperties, testNodes } from 'src/tests/data/nodes';
import { testRelations } from 'src/tests/data/relations';
import { endpoints } from 'src/utils/endpoints';
import { isObject } from 'src/utils/helpers/general';

const nodeMap = new Map<string, Node>();

testNodes.forEach((node) => {
	nodeMap.set(node.id, node);
});

export const resolveNodeConnections = (nodeId: string): NodeConnections => {
	const connections: Array<NodeConnection> = [];

	testRelations.forEach((relation) => {
		if (relation.source_id === nodeId) {
			const targetNode = nodeMap.get(relation.target_id);

			if (targetNode) {
				connections.push({
					direction: 'outgoing',
					neighbor: targetNode,
					relation: relation
				});
			}
		} else if (relation.target_id === nodeId) {
			const sourceNode = nodeMap.get(relation.source_id);

			if (sourceNode) {
				connections.push({
					direction: 'incoming',
					neighbor: sourceNode,
					relation: relation
				});
			}
		}
	});

	return {
		relations: connections
	};
};

export const successfulNodeHandlers = [
	http.get(TEST_HOST + endpoints.getNodesPath(), () => {
		// Note that you DON'T have to stringify the JSON!
		return HttpResponse.json(testNodes);
	}),

	http.get(TEST_HOST + endpoints.getNodesPropertiesPath(), () => {
		return HttpResponse.json({ properties: getTestNodesProperties() });
	}),

	...testNodes.map((node) => {
		return http.post(
			TEST_HOST +
				endpoints.getNodeConnectionsPath({
					nodeId: node.id
				}),
			() => {
				// Note that you DON'T have to stringify the JSON!
				return HttpResponse.json(resolveNodeConnections(node.id));
			}
		);
	}),

	...testNodes.map((node) => {
		return http.get(
			TEST_HOST +
				endpoints.getNodePath({
					nodeId: node.id
				}),
			() => {
				// Note that you DON'T have to stringify the JSON!
				return HttpResponse.json(node);
			}
		);
	}),

	http.post<{ ids: Array<NodeId> }, { ids: Array<NodeId> }>(
		TEST_HOST + endpoints.getNodesBulkFetchPath(),
		async ({ request }) => {
			const requestBody: { ids: Array<NodeId> } = await request.clone().json();
			const serverNodes: Array<Node> = [];

			testNodes.forEach((testNode) => {
				if (requestBody.ids.includes(testNode.id)) {
					serverNodes.push(testNode);
				}
			});

			return HttpResponse.json({ nodes: serverNodes });
		}
	),

	...testNodes.map((node) => {
		return http.patch(
			TEST_HOST +
				endpoints.getNodePath({
					nodeId: node.id
				}),
			async ({ request }) => {
				// Read the intercepted request body as JSON.
				const body = await request.json();

				// Note that you DON'T have to stringify the JSON!
				return HttpResponse.json(Object.assign({}, node, body));
			}
		);
	}),

	...testNodes.map((node) => {
		return http.delete(
			TEST_HOST +
				endpoints.getNodePath({
					nodeId: node.id
				}),
			() => {
				// Note that you DON'T have to stringify the JSON!
				return HttpResponse.json({
					message: 'Deleted 1 nodes',
					num_deleted: 1
				});
			}
		);
	}),

	http.get(TEST_HOST + endpoints.getNodesLabelsPath(), () => {
		return HttpResponse.json({
			labels: getTestNodesLabels()
		});
	}),

	http.delete(TEST_HOST + endpoints.getNodesBulkDeletePath(), async ({ request }) => {
		const body = await request.clone().json();
		const idsToDelete =
			isObject(body) && 'ids' in body && Array.isArray(body.ids) ? body.ids : [];

		return HttpResponse.json({
			message: `Deleted ${idsToDelete.length} nodes`,
			num_deleted: idsToDelete.length
		});
	})
];
