import './EditSaveBlock.scss';
import { DBAccordionItem } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { EditSaveButtons } from 'src/components/edit-save-buttons/EditSaveButtons';
import { ErrorBoundary } from 'src/components/error-boundary/ErrorBoundary';
import { EditSaveBlockProps } from './EditSaveBlock.interfaces';

export const EditSaveBlock = ({
	children,
	isEditable = true,
	isEditMode,
	headline,
	onEditClick,
	onSaveClick,
	onUndoClick,
	id,
	className,
	testId
}: EditSaveBlockProps) => {
	const rootElementClassName = clsx('edit-save-block', className, {
		'edit-save-block--edit-mode': isEditMode
	});

	return (
		<DBAccordionItem
			id={id}
			className={rootElementClassName}
			headline={
				<EditSaveButtons
					headline={headline}
					isEditMode={isEditMode}
					isEditable={isEditable}
					onEditClick={onEditClick}
					onSaveClick={onSaveClick}
					onUndoClick={onUndoClick}
				/>
			}
			data-testid={testId}
		>
			<ErrorBoundary>{children}</ErrorBoundary>
		</DBAccordionItem>
	);
};
