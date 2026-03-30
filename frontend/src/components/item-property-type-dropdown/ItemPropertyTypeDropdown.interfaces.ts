import { DBSelect } from '@db-ux/react-core-components';
import { ComponentProps } from 'react';
import {
	ItemPropertyType,
	ItemPropertyTypeNonList,
	ItemPropertyTypeWithListSubtypes
} from 'src/models/item';
import { GlobalComponentProps } from 'src/types/components';

export type ItemPropertyTypeDropdownProps =
	| ItemPropertyTypeDropdownExcludeListOptions
	| ItemPropertyTypeDropdownIncludeListOptions;

type ItemPropertyTypeDropdownBase = GlobalComponentProps &
	Omit<ComponentProps<typeof DBSelect>, 'onChange' | 'value'> & {
		isDisabled?: boolean;
	};

type ItemPropertyTypeDropdownExcludeListOptions = ItemPropertyTypeDropdownBase & {
	value?: ItemPropertyTypeNonList;
	shouldExcludeListTypes: true;
	onChange?: (newType: ItemPropertyTypeNonList) => void;
};

type ItemPropertyTypeDropdownIncludeListOptions = ItemPropertyTypeDropdownBase & {
	value?: ItemPropertyTypeWithListSubtypes;
	shouldExcludeListTypes?: false;
	onChange?: (
		// when list subtypes are included, always provide what is selected, type and subtype (if applicable)
		value: ItemPropertyTypeWithListSubtypes,
		newType: ItemPropertyType,
		subType?: ItemPropertyTypeNonList
	) => void;
};
