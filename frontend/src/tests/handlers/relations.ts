import { http, HttpResponse } from 'msw';
import { TEST_HOST } from 'src/tests/constants';
import { testRelations } from 'src/tests/data/relations';
import { endpoints } from 'src/utils/endpoints';

export const successfulRelationsHandlers = [
	http.get(TEST_HOST + endpoints.getRelationsPath(), () => {
		// Note that you DON'T have to stringify the JSON!
		return HttpResponse.json(testRelations);
	}),

	http.get(TEST_HOST + endpoints.getRelationsTypesPath(), () => {
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
			TEST_HOST +
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
			TEST_HOST +
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
