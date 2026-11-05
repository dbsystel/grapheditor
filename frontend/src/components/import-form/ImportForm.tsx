import './ImportForm.scss';
import { DBButton, DBCard, DBInput, DBRadio } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StoppableRequest } from 'src/models/stoppable-request';
import { useImportExportStore } from 'src/stores/import-export';
import { useNotificationsStore } from 'src/stores/notifications';
import { api } from 'src/utils/api/api';
import { isCancelError, parseError } from 'src/utils/helpers/general';
import {
	cancelStoppableRequest,
	createStoppableRequestConfiguration
} from 'src/utils/helpers/stoppable-request';
import { ImportFormFormData, ImportFormProps } from './ImportForm.interfaces';

export const ImportForm = ({ id, className, testId, onSuccess }: ImportFormProps) => {
	const { t } = useTranslation();
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const closeImportModal = useImportExportStore((store) => store.close);
	const [isImporting, setIsImporting] = useState(false);
	const stoppableRequestRef = useRef<StoppableRequest | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { control, handleSubmit } = useForm<ImportFormFormData>({
		mode: 'onChange',
		reValidateMode: 'onChange',
		defaultValues: {
			file: null,
			strategy: 'overwrite'
		}
	});
	const rootElementClassName = clsx('import-form', className);

	const onSubmit = async (formData: ImportFormFormData) => {
		if (!formData.file) {
			return;
		}

		setIsImporting(true);

		try {
			const stoppableRequest = createStoppableRequestConfiguration();
			stoppableRequestRef.current = stoppableRequest;

			const response = await api.transfer.fetch.postTransferImport({
				configuration: {
					file: formData.file,
					strategy: formData.strategy
				},
				stoppableRequest: stoppableRequest
			});
			const { nodes_imported, relations_imported } = response.data;

			addNotification({
				title: t('import_form_success_title'),
				description: t('import_form_success_description', {
					nodes: nodes_imported,
					relations: relations_imported
				}),
				type: 'successful'
			});

			if (onSuccess) {
				onSuccess();
			}
		} catch (error) {
			if (isCancelError(error)) {
				// user-initiated cancel - skip the error notification
				return;
			}

			addNotification({
				title: t('import_form_error_title'),
				description: parseError(error),
				type: 'critical'
			});
		} finally {
			setIsImporting(false);
		}
	};

	const cancelImport = () => {
		if (stoppableRequestRef.current) {
			cancelStoppableRequest(stoppableRequestRef.current);
		}

		setIsImporting(false);
	};

	return (
		<form
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			onSubmit={handleSubmit(onSubmit)}
			aria-label={t('import_form_title')}
		>
			<DBCard spacing="medium">
				<Controller
					control={control}
					name="file"
					rules={{
						validate: (file) => {
							if (!file) {
								return t('validation_file_required');
							}
							// file.type for .jsonl files is "", so we need to validate against the file.name instead
							// of the file.type
							if (!file.name.toLowerCase().endsWith('.jsonl')) {
								return t('validation_wrong_file_type');
							}
							return true;
						}
					}}
					render={({ field: { onBlur, onChange }, fieldState: { error } }) => (
						<DBInput
							ref={fileInputRef}
							type="file"
							accept=".jsonl"
							label={t('import_form_file_label')}
							className="import-form__file-input"
							data-density="functional"
							validMessage=""
							disabled={isImporting}
							validation={error ? 'invalid' : undefined}
							invalidMessage={error?.message ?? ''}
							onBlur={onBlur}
							onChange={(e: ChangeEvent<HTMLInputElement>) => {
								console.log(e.target.files);
								onChange(e.target.files?.[0] ?? null);
							}}
						/>
					)}
				/>
			</DBCard>

			<DBCard spacing="medium">
				<fieldset className="import-form__strategy">
					<legend>{t('import_form_strategy_label')}</legend>
					<Controller
						control={control}
						name="strategy"
						render={({ field: { value, onChange } }) => (
							<>
								<DBRadio
									name="strategy"
									value="create_new"
									checked={value === 'create_new'}
									onChange={() => onChange('create_new')}
									disabled={isImporting}
								>
									{t('import_form_strategy_create_new')}
								</DBRadio>
								<DBRadio
									name="strategy"
									value="overwrite"
									checked={value === 'overwrite'}
									onChange={() => onChange('overwrite')}
									disabled={isImporting}
								>
									{t('import_form_strategy_overwrite')}
								</DBRadio>
							</>
						)}
					/>
				</fieldset>
			</DBCard>

			<div className="import-form__buttons">
				<DBButton
					variant="ghost"
					type="button"
					onClick={isImporting ? cancelImport : closeImportModal}
				>
					{t('import_form_cancel_button')}
				</DBButton>
				<DBButton type="submit" variant="brand" disabled={isImporting}>
					{isImporting ? t('import_form_importing') : t('import_form_submit_button')}
				</DBButton>
			</div>
		</form>
	);
};
