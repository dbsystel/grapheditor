import { GraphEditorTypeSimplified } from 'src/utils/constants';

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
	 * Method to take a string ID and return a name.
	 * E.g. parseIdToName("MetaProperty::name__dummy_") will return "name".
	 */
	parseIdToName(id: string, includeNamespace?: boolean) {
		const splitBySeparator = id.split(this.separator);
		const stringAfterSeparator = splitBySeparator.at(1);

		// if ID string doesn't contain a separator
		if (splitBySeparator.length === 1 || !stringAfterSeparator) {
			return id;
		}

		if (includeNamespace) {
			return stringAfterSeparator;
		}

		return stringAfterSeparator.split('__').at(0) || id;
	}

	/**
	 * Method to take an Meta object type, a name and optionally a namespace, and glue everything
	 * together following a specific format.
	 * E.g. formatSemanticId("MetaProperty", "name", "tech") will return "MetaProperty::name__tech_".
	 */
	formatSemanticId(
		type: (typeof GraphEditorTypeSimplified)[keyof typeof GraphEditorTypeSimplified],
		name: string,
		namespace?: string
	) {
		return type + this.separator + name + (namespace ? this.formatNamespace(namespace) : '');
	}

	formatNamespace(namespace: string) {
		return '__' + namespace + '_';
	}

	isValidSemanticId(id: string) {
		const splitBySeparator = id.split(this.separator);

		// no need to check for namespace, it is optional
		return splitBySeparator.length === 2;
	}
}

export const idFormatter = new IdFormatter({
	separator: '::'
});

(window as any).idFormatter = idFormatter;
