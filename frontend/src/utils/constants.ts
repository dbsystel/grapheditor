import { ItemPropertyType } from 'src/models/item';

export const GLOBAL_SEARCH_PARAMETER_KEY = 'q';
export const GLOBAL_SEARCH_TYPE_KEY = 'type';
export const GLOBAL_SEARCH_PRESENTATION_KEY = 'presentation';
export const GLOBAL_SEARCH_ALGORITHM_KEY = 'algorithm';
export const GLOBAL_SEARCH_CYPHER_QUERY_DEFAULT_SEARCH_VALUE =
	'match (a) where not a:Perspective__tech_ optional match (a)-[r]->(b) where not  b:Perspective__tech_ and  type(r) <> "pos__tech_" return * limit 300';
export const GLOBAL_SEARCH_FULL_TEXT_DEFAULT_SEARCH_VALUE = '';

export const GLOBAL_SEARCH_TYPE_VALUE_CYPHER_QUERY = 'cypher-query';
export const GLOBAL_SEARCH_TYPE_VALUE_FULL_TEXT = 'full-text';
export const GLOBAL_SEARCH_TYPE_VALUE_PERSPECTIVES = 'perspectives';
export const GLOBAL_SEARCH_TYPE_VALUE_PARA_QUERIES = 'para-queries';
export const GLOBAL_SEARCH_TYPE_VALUE_PARALLAX = 'parallax';

export const GRAPH_PRESENTATION_GRAPH = 'graph';
export const GRAPH_PRESENTATION_OBJECT_TABLE = 'object-table';
export const GRAPH_PRESENTATION_RESULT_TABLE = 'result-table';

export const GRAPH_LAYOUT_GRAPH_STYLESHEET = 'graph-styleheet';
export const GRAPH_LAYOUT_FORCE_ATLAS_2 = 'force-atlas-2';
export const GRAPH_LAYOUT_FORCE = 'force';
export const GRAPH_LAYOUT_RANDOM = 'random';
export const GRAPH_LAYOUT_PERSPECTIVE = 'perspective';
export const GRAPH_LAYOUT_NOVERLAP = 'noverlap';

export const GRAPH_STYLE_DEFAULT_VALUE = 'Default';

export const ITEM_PROPERTY_TYPES: Array<ItemPropertyType> = [
	'boolean',
	'date',
	'duration',
	'float',
	'integer',
	'list_boolean',
	'list_date',
	'list_duration',
	'list_float',
	'list_integer',
	'list_local_datetime',
	'list_local_time',
	'list_point',
	'list_string',
	'list_zoned_time',
	'local_datetime',
	'local_time',
	'point',
	'string',
	'zoned_time'
];

// temporary allow only the next 3 types
export const ALLOWED_ITEM_PROPERTY_TYPES: Array<ItemPropertyType> = [
	'boolean',
	'float',
	'integer',
	'string'
];

export const ALLOWED_ITEM_PROPERTY_TYPE_OPTIONS = ALLOWED_ITEM_PROPERTY_TYPES.map((type) => {
	return {
		value: type
	};
});

/**
 * Use regular object rather than enum due to better IDEA support.
 *
 * CR_ML_3
 */
export const GraphEditorType = Object.freeze({
	CODE: 'Code__tech_',
	CYPHER: 'Cypher__tech_',
	FIELD: 'Field__tech_',
	HEAD: 'Head__tech_',
	TAIL: 'Tail__tech_',
	LITERAL: 'Literal__tech_',
	NAMESPACE: 'Namespace__tech_',
	META_ID: 'MetaId__tech_',
	META_LABEL: 'MetaLabel__tech_',
	// relation type
	META_RELATION: 'MetaRelation__tech_',
	META_PROPERTY: 'MetaProperty__tech_',
	RESTRICTION: 'Restriction__tech_',
	SOURCE: 'Source__tech_'
});

export const GraphEditorTypeSimplified = Object.freeze({
	CODE: 'Code',
	CYPHER: 'Cypher',
	FIELD: 'Field',
	HEAD: 'Head',
	TAIL: 'Tail',
	LITERAL: 'Literal',
	NAMESPACE: 'Namespace',
	META_ID: 'MetaId',
	META_LABEL: 'MetaLabel',
	// relation type
	META_RELATION: 'MetaRelation',
	META_PROPERTY: 'MetaProperty',
	RESTRICTION: 'Restriction',
	SOURCE: 'Source'
});

export const NOTIFICATIONS_AUTOCLOSE_MILLISECONDS = 7000;

export const DB_COLOR = '#ec0016';

export const GRAPH_DEFAULT_NODE_COLOR = 'gray';
export const GRAPH_DEFAULT_NODE_SIZE = 50;
export const GRAPH_DEFAULT_NODE_SCALE_FACTOR = 0.5;
export const GRAPH_DEFAULT_NODE_BORDER_COLOR = '#000000';
export const GRAPH_DEFAULT_NODE_LABEL_SIZE = 6;
export const GRAPH_DEFAULT_NODE_LABEL_COLOR = '#000000';
export const GRAPH_DEFAULT_NODE_LABEL_FONT = 'Arial';
export const GRAPH_DEFAULT_NODE_LABEL_WEIGHT = 'normal';
export const GRAPH_DEFAULT_NODE_BORDER_WIDTH = 5;
export const GRAPH_DEFAULT_EDGE_COLOR = '#cccccc';
export const GRAPH_DEFAULT_EDGE_SIZE = 2;
export const GRAPH_DEFAULT_EDGE_SCALE_FACTOR = 0.5;
export const GRAPH_DEFAULT_EDGE_LABEL_SIZE = 6;
export const GRAPH_DEFAULT_EDGE_LABEL_COLOR = '#000000';
export const GRAPH_DEFAULT_EDGE_LABEL_BACKGROUND_COLOR = '#ffffff';
export const GRAPH_DEFAULT_EDGE_LABEL_PADDING = 3;
export const GRAPH_DEFAULT_EDGE_LABEL_FONT = 'Arial';
export const GRAPH_DEFAULT_EDGE_LABEL_WEIGHT = 'normal';
export const GRAPH_DEFAULT_EDGE_MIN_THICKNESS = 1.2;
export const GRAPH_DEFAULT_ZOOMING_RATIO = 2.0;
export const GRAPH_DEFAULT_LABEL_LIGHT_COLOR = '#ffffff';
export const GRAPH_DEFAULT_LABEL_DARK_COLOR = '#000000';
export const GRAPH_DEFAULT_LABEL_RENDERED_SIZE_THRESHOLD = 0;

export const GRAPH_SELECTED_EDGE_COLOR = DB_COLOR;
export const GRAPH_HIDE_ALL_LABELS_THRESHOLD = 1000;
export const GRAPH_HIDE_LABEL_BOX_SPACING = 2; // in px
export const GRAPH_ARROW_HEAD_LENGTH_TO_THICKNESS_RATIO = 5;
export const GRAPH_ARROW_HEAD_WIDENESS_TO_THICKNESS_RATIO = 3.5;
export const GRAPH_RENDER_HTML_LABELS_THRESHOLD = 200;
export const GRAPH_FIT_TO_VIEWPORT_MIN_ZOOM = 0.3; // higher number means greater zoom-out

export const ITEM_OVERVIEW_TIMEOUT_MILLISECONDS = 700;

export const NOT_AVAILABLE_SIGN = 'N/A';

export const APP_LANGUAGES = Object.freeze<['en', 'de', 'cimode']>(['en', 'de', 'cimode']);
export const APP_STORAGE_KEY_PREFIX = '_app_';
