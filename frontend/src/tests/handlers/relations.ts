import { http, HttpResponse } from 'msw';
import { testRelations } from 'src/tests/data/relations';
import { endpoints } from 'src/utils/endpoints';

const host = 'http://localhost:4999/api';

export const successfulRelationsHandlers = [
	http.get(host + endpoints.getRelationsPath(), () => {
		// Note that you DON'T have to stringify the JSON!
		return HttpResponse.json(testRelations);
	}),

	http.get(host + endpoints.getRelationsTypesPath(), () => {
		const types = [
			...new Set(
				testRelations.map((relation) => {
					return relation.type;
				})
			)
		];

		// Note that you DON'T have to stringify the JSON!
		return HttpResponse.json({
			types: types
		});
	}),

	...testRelations.map((relation) => {
		return http.get(
			host +
				endpoints.getRelationPath({
					relationId: relation.id
				}),
			() => {
				// Note that you DON'T have to stringify the JSON!
				return HttpResponse.json(relation);
			}
		);
	}),

	...testRelations.map((relation) => {
		return http.delete(
			host +
				endpoints.getRelationPath({
					relationId: relation.id
				}),
			() => {
				// Note that you DON'T have to stringify the JSON!
				return HttpResponse.json({
					message: 'Deleted 1 relations',
					num_deleted: 1
				});
			}
		);
	})
];
