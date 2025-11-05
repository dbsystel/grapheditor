import { deleteRelation } from 'src/utils/fetch/deleteRelation';
import { deleteRelations } from 'src/utils/fetch/deleteRelations';
import { getRelation } from 'src/utils/fetch/getRelation';
import { getRelations } from 'src/utils/fetch/getRelations';
import { getRelationsDefaultTypeNodes } from 'src/utils/fetch/getRelationsDefaultTypeNodes';
import { getRelationsTypes } from 'src/utils/fetch/getRelationsTypes';
import { getRelationsTypesNodes } from 'src/utils/fetch/getRelationsTypesNodes';
import { patchRelation } from 'src/utils/fetch/patchRelation';
import { patchRelations } from 'src/utils/fetch/patchRelations';
import { postRelation } from 'src/utils/fetch/postRelation';
import { postRelationDefaultTypeNode } from 'src/utils/fetch/postRelationDefaultTypeNode';
import { postRelations } from 'src/utils/fetch/postRelations';
import { postRelationsBulkFetch } from 'src/utils/fetch/postRelationsBulkFetch';
import { postRelationsByNodeIds } from 'src/utils/fetch/postRelationsByNodeIds';
import {
	deleteRelationsAndUpdateApplication,
	patchRelationsAndUpdateApplication
} from 'src/utils/helpers/relations';

export const relationsApi = {
	deleteRelation: deleteRelation,
	deleteRelations: deleteRelations,
	deleteRelationsAndUpdateApplication: deleteRelationsAndUpdateApplication,
	getRelation: getRelation,
	getRelations: getRelations,
	getRelationsDefaultTypeNodes: getRelationsDefaultTypeNodes,
	getRelationsTypes: getRelationsTypes,
	getRelationsTypesNodes: getRelationsTypesNodes,
	patchRelation: patchRelation,
	patchRelations: patchRelations,
	patchRelationsAndUpdateApplication: patchRelationsAndUpdateApplication,
	postRelation: postRelation,
	postRelations: postRelations,
	postRelationDefaultTypeNode: postRelationDefaultTypeNode,
	postRelationsByNodeIds: postRelationsByNodeIds,
	postRelationsBulkFetch: postRelationsBulkFetch
};
