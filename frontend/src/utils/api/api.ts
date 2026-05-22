import { buildInfoBackend } from './buildInfoBackend';
import { buildInfoFrontend } from './buildInfoFrontend';
import { contextMenuApi } from './contextMenu';
import { databasesApi } from './databases';
import { itemsApi } from './items';
import { metaForMetaApi } from './metaForMeta';
import { nodesApi } from './nodes';
import { parallaxApi } from './parallax';
import { paraQueriesApi } from './paraQueries';
import { perspectivesApi } from './perspectives';
import { relationsApi } from './relations';
import { searchApi } from './search';
import { stylesApi } from './styles';
import { usersApi } from './users';

export const api = {
	contextMenu: contextMenuApi,
	databases: databasesApi,
	items: itemsApi,
	metaForMeta: metaForMetaApi,
	nodes: nodesApi,
	parallax: parallaxApi,
	paraQueries: paraQueriesApi,
	perspectives: perspectivesApi,
	relations: relationsApi,
	search: searchApi,
	styles: stylesApi,
	users: usersApi,
	buildInfoBackend: buildInfoBackend,
	buildInfoFrontend: buildInfoFrontend
};
