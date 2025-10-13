import './EditSaveButtons.scss';
import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { EditSaveButtonProps } from './EditSaveButtons.interfaces';

export const EditSaveButtons = ({
	headline,
	id,
	className,
	testId,
	isEditMode,
	isEditable,
	onEditClick,
	onSaveClick,
	onUndoClick
}: EditSaveButtonProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('edit-save-buttons', className);

	const toggleEdit = (event: MouseEvent) => {
		event.stopPropagation();
		onEditClick();
	};

	const saveChanges = (event: MouseEvent) => {
		event.stopPropagation();
		onSaveClick();
	};

	const undoChanges = (event: MouseEvent) => {
		event.stopPropagation();
		onUndoClick();
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			<p>{headline}</p>

			<div className="edit-save-buttons__buttons">
			{isEditable ? (!isEditMode ? (
					<DBButton onClick={toggleEdit} variant="ghost" size="small" icon="pen">
						{t('edit_save_buttons_edit')}
					</DBButton>
				) : (
					<div className="edit-save-buttons__edit-buttons">
						<DBButton onClick={undoChanges} variant="ghost" size="small" icon="cross">
							{t('edit_save_buttons_cancel')}
						</DBButton>

						<DBButton
							onClick={saveChanges}
							variant="brand"
							size="small"
							icon="check"
							className="edit-save-buttons__save-button"
						>
							{t('edit_save_buttons_save')}
						</DBButton>
					</div>
				)) : ''}	
				
			</div>
		</div>
	);
};
