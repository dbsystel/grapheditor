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
	 * Method to take a regular ID and return a short version of it.
	 * E.g. formatId("id::4:bb368931-775e-4eb9-a9fd-aaac3b6efc14:22") will return "4:bb36...:0".
	 */
	formatId = (id: string) => {
		const parts = id.split(':');
		if (parts.length !== 5 || parts[0] !== 'id' || parts[1] !== '') {
			return id;
		}
		const number = parts[2];
		const str = parts[3];
		const rest = parts[4];
		return `${number}:${str.slice(0, 4)}...:${rest}`;
	};

	/**
	 * Method to take a string (object's title or ID usually) and return a name.
	 * E.g. parseIdToName("MetaProperty::name__dummy_") will return "name__dummy".
	 * Initially, to include the namespace a flag was provided, but it was in team internally
	 * decided to always include the namespace. It was also decided to always use this method when
	 * rendering object's title or ID.
	 */
	parseIdToName(id: string) {
		const splitBySeparator = id.split(this.separator);
		const stringAfterSeparator = splitBySeparator.at(1);

		// if ID string doesn't contain a separator
		if (splitBySeparator.length === 1 || !stringAfterSeparator) {
			return id;
		}

		return stringAfterSeparator;
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
