import { GraphEditorTypeSimplified } from 'src/utils/constants';
import { getFirstRegExpGroup } from 'src/utils/helpers/general';

interface IdFormatterParameters {
	separator: string;
}

/**
 * A helper class to help us out formatting and parsing the new way of handling IDs.
 */
class IdFormatter {
	separator: string;

	constructor(parameters: IdFormatterParameters) {
		const { separator } = parameters;

		this.separator = separator;
	}

	/**
	 * Method to take a prefix, a regular ID and glue them together with the "separator" property.
	 * E.g. formatId("unknown", "test") will return "unknown::test".
	 */
	formatId(prefix: string, id: string) {
		return prefix + this.separator + id;
	}

	/**
	 * Method to take an ID, and split it with the "separator" property.
	 * E.g. parseId("MetaLabel__tech_::test") will return "test".
	 */
	parseId(id: string) {
		return id.split(this.separator)[1] || id;
	}

	/**
	 * Method to take a string ID and return a name.
	 * E.g. parseIdToName("MetaProperty::name__dummy_") will return "name".
	 */
	parseIdToName(id: string) {
		const nameMatch = getFirstRegExpGroup(/::(.*)/gim, id);

		return nameMatch || id;
	}

	/**
	 * Method to take a string and return a name.
	 * E.g. parseIdToName("MetaProperty__dummy_") will return "MetaProperty".
	 */
	parseStringToName(string: string) {
		const nameMatch = getFirstRegExpGroup(/(.*(?=__))/gim, string);

		return nameMatch || string;
	}

	/**
	 * Method to take an Meta object type, a name and optionally a namespace, and glue everything
	 * together following a specific format.
	 * E.g. formatObjectId("MetaProperty", "name", "tech") will return "MetaProperty::name__tech_".
	 */
	formatObjectId(
		type: (typeof GraphEditorTypeSimplified)[keyof typeof GraphEditorTypeSimplified],
		name: string,
		namespace?: string
	) {
		return type + this.separator + name + (namespace ? this.formatNamespace(namespace) : '');
	}

	formatNamespace(namespace: string) {
		return '__' + namespace + '_';
	}
}

export const idFormatter = new IdFormatter({
	separator: '::'
});
