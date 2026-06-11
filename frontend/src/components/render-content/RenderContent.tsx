import './RenderContent.scss';
import clsx from 'clsx';
import { Fragment, ReactNode } from 'react';
import { ItemInfo } from 'src/components/item-info/ItemInfo';
import { ItemPropertyValue } from 'src/components/item-property-value/ItemPropertyValue';
import { ItemPropertyWidgetNotSupported } from 'src/components/item-property-widget/not-supported/ItemPropertyWidgetNotSupported';
import { useItemsStore } from 'src/stores/items';
import { NOT_AVAILABLE_SIGN } from 'src/utils/constants';
import { isObject, isPrimitive, isString } from 'src/utils/helpers/general';
import {
	isItemProperty,
	isItemPropertyDynamic,
	isItemPropertyDynamicValid,
	isItemPropertyValid
} from 'src/utils/helpers/items';
import { isNode } from 'src/utils/helpers/nodes';
import { isRelation } from 'src/utils/helpers/relations';
import { idFormatter } from 'src/utils/id-formatter';
import { RenderContentProps } from './RenderContent.interfaces';

export const RenderContent = ({
	content,
	id,
	className,
	testId
}: RenderContentProps): ReactNode => {
	const rootElementClassName = clsx('render-content', className);

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{renderContentBody(content)}
		</div>
	);
};

const renderContentBody = (content: unknown) => {
	const getStoreItem = useItemsStore((store) => store.getStoreItem);
	let contentToRender: ReactNode = null;

	// if content type is primitive
	if (isPrimitive(content)) {
		if (content === '' || content === null) {
			const cellContent = content === '' ? '""' : 'null';

			contentToRender = cellContent;
		} else if (isString(content)) {
			contentToRender = idFormatter.parseIdToName(content);
		} else {
			contentToRender = content;
		}
	}
	// if content type is object
	else if (isObject(content)) {
		// if relation or node
		if (isRelation(content) || isNode(content)) {
			const item = getStoreItem(content.id);

			if (item) {
				contentToRender = <ItemInfo item={item} />;
			} else {
				contentToRender = NOT_AVAILABLE_SIGN;
			}
		}
		// if item property (or at least looks like one)
		else if (
			isItemProperty(content) &&
			isItemPropertyValid(content) &&
			// list should be handled via "renderContentBody" due to its visual style (the "ItemPropertyWidgetList" component's output
			// is not visually nice)
			content.type !== 'list'
		) {
			return <ItemPropertyValue property={content} />;
		} else if (isItemPropertyDynamic(content) && isItemPropertyDynamicValid(content)) {
			return renderContentBody(content.value);
		} else if (isItemProperty(content) && !isItemPropertyValid(content)) {
			return <ItemPropertyWidgetNotSupported defaultValue={content} />;
		}
		// some other object (record), loop through entries
		else {
			let index = 0;
			const objectEntries = Object.entries(content);
			const objectContent: Array<ReactNode> = ['{'];

			for (const [key, value] of objectEntries) {
				objectContent.push(
					<span key={key}>
						{key}:&nbsp;{renderContentBody(value)}
					</span>
				);

				if (index + 1 < objectEntries.length) {
					objectContent.push(', ');
				}

				index++;
			}
			objectContent.push('}');

			return objectContent;
		}
	}
	// array, loop through it
	else if (Array.isArray(content)) {
		const finalContent: Array<ReactNode> = ['['];

		content.forEach((contentItem, index) => {
			finalContent.push(<Fragment key={index}>{renderContentBody(contentItem)}</Fragment>);

			if (index < content.length - 1) {
				finalContent.push(', ');
			}
		});

		finalContent.push(']');

		return finalContent;
	}

	// not sure what it is, just render a formatted JSON string
	else {
		contentToRender = <pre>{JSON.stringify(content, null, 2)}</pre>;
	}

	return contentToRender;
};
