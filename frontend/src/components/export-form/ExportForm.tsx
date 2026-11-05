import './ExportForm.scss';
import {
	DBBadge,
	DBButton,
	DBCard,
	DBInput,
	DBRadio,
	DBSelect
} from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { TextareaAutosize } from 'src/components/textarea-autosize/TextareaAutosize';
import { StoppableRequest } from 'src/models/stoppable-request';
import { useImportExportStore } from 'src/stores/import-export';
import { useNotificationsStore } from 'src/stores/notifications';
import { api } from 'src/utils/api/api';
import { downloadFile, isCancelError, parseError } from 'src/utils/helpers/general';
import { buildExportPayload, getNodeAndRelationIdsToExport } from 'src/utils/helpers/import-export';
import {
	cancelStoppableRequest,
	createStoppableRequestConfiguration
} from 'src/utils/helpers/stoppable-request';
import { generateExportDownloadUrl } from 'src/utils/helpers/transfer';
import { ExportFormFormData, ExportFormProps } from './ExportForm.interfaces';

export const ExportForm = ({ id, className, testId, onSuccess }: ExportFormProps) => {
	const { t } = useTranslation();
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const [isExporting, setIsExporting] = useState(false);
	const defaultNodeMode = useImportExportStore((store) => store.defaultNodeMode);
	const defaultRelationMode = useImportExportStore((store) => store.defaultRelationMode);
	const defaultCypherQuery = useImportExportStore((store) => store.defaultCypherQuery);
	const closeExportModal = useImportExportStore((store) => store.close);
	const stoppableRequestRef = useRef<StoppableRequest | null>(null);
	const { control, handleSubmit, watch, register } = useForm<ExportFormFormData>({
		mode: 'onSubmit',
		reValidateMode: 'onChange',
		defaultValues: {
			nodeMode: defaultNodeMode,
			relationMode: defaultRelationMode,
			cypherQuery: defaultCypherQuery,
			filename: 'export',
			extension: 'jsonl'
		}
	});
	const selectedNodeMode = watch('nodeMode');
	const selectedRelationMode = watch('relationMode');
	const idsToExport = getNodeAndRelationIdsToExport(selectedNodeMode, selectedRelationMode);
	const isSubmitDisabled =
		(selectedNodeMode !== 'cypher' &&
			idsToExport.nodeIds.length === 0 &&
			idsToExport.relationIds.length === 0) ||
		isExporting;
	const rootElementClassName = clsx('export-form', className);

	const onSubmit = async (formData: ExportFormFormData) => {
		setIsExporting(true);

		try {
			const exportPayload = buildExportPayload({
				formData: formData,
				nodeIds: idsToExport.nodeIds,
				relationIds: idsToExport.relationIds
			});

			// notify immediately since the backend may take a while to prepare the export (depending
			// on its size) before the download can start
			addNotification({
				title: t('notifications_info_export_preparation'),
				type: 'informational'
			});

			const stoppableRequest = createStoppableRequestConfiguration();
			stoppableRequestRef.current = stoppableRequest;

			const response = await api.transfer.fetch.postTransferExport({
				configuration: exportPayload,
				stoppableRequest: stoppableRequest
			});

			const downloadUrl = generateExportDownloadUrl({
				url: response.data.download_url,
				filename: formData.filename,
				extension: formData.extension
			});

			downloadFile({
				url: downloadUrl
			});

			addNotification({
				title: t('notifications_info_export_title'),
				type: 'informational'
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
				title: t('notifications_failure_export_description'),
				description: parseError(error),
				type: 'critical'
			});
		} finally {
			stoppableRequestRef.current = null;
			setIsExporting(false);
		}
	};

	const cancelExport = () => {
		if (stoppableRequestRef.current) {
			cancelStoppableRequest(stoppableRequestRef.current);
		}

		setIsExporting(false);
	};

	return (
		<form
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			onSubmit={handleSubmit(onSubmit)}
		>
			{selectedNodeMode !== 'cypher' && (
				<>
					<DBCard spacing="medium">
						<fieldset className="export-form__mode">
							<legend>{t('export_form_node_mode_label')}</legend>
							<Controller
								control={control}
								name="nodeMode"
								render={({ field: { value, onChange } }) => (
									<>
										<DBRadio
											name="mode"
											value="all_loaded"
											checked={value === 'all_loaded'}
											disabled={isExporting}
											onChange={() => onChange('all_loaded')}
										>
											{t('export_form_node_mode_all_loaded')}
										</DBRadio>
										<DBRadio
											name="mode"
											value="all_selected"
											checked={value === 'all_selected'}
											disabled={isExporting}
											onChange={() => onChange('all_selected')}
										>
											{t('export_form_node_mode_selection')}
										</DBRadio>
									</>
								)}
							/>
						</fieldset>
						<DBBadge className="export-form__number-of-elements">
							{idsToExport.nodeIds.length} {t('export_form_node_mode_nodes')}
						</DBBadge>
					</DBCard>

					<DBCard spacing="medium">
						<fieldset className="export-form__mode">
							<legend>{t('export_form_relation_mode_label')}</legend>
							<Controller
								control={control}
								name="relationMode"
								render={({ field: { value, onChange } }) => (
									<>
										<DBRadio
											name="relationMode"
											value="none"
											checked={value === 'none'}
											disabled={isExporting}
											onChange={() => onChange('none')}
										>
											{t('export_form_relation_mode_none')}
										</DBRadio>
										<DBRadio
											name="relationMode"
											value="between_selected_nodes"
											checked={value === 'between_selected_nodes'}
											disabled={isExporting}
											onChange={() => onChange('between_selected_nodes')}
										>
											{t('export_form_relation_mode_between_selected_nodes')}
										</DBRadio>
										<DBRadio
											name="relationMode"
											value="between_exported_nodes"
											checked={value === 'between_exported_nodes'}
											disabled={isExporting}
											onChange={() => onChange('between_exported_nodes')}
										>
											{t('export_form_relation_mode_between_exported_nodes')}
										</DBRadio>
									</>
								)}
							/>
						</fieldset>
						<DBBadge className="export-form__number-of-elements">
							{idsToExport.relationIds.length}
							{selectedRelationMode === 'between_exported_nodes' &&
							idsToExport.nodeIds.length
								? '+'
								: ''}{' '}
							{t('export_form_relation_mode_relations')}
						</DBBadge>
					</DBCard>
				</>
			)}

			{selectedNodeMode === 'cypher' && (
				<Controller
					control={control}
					name="cypherQuery"
					rules={{
						required: t('export_form_cypher_required')
					}}
					render={({ field: { onChange, value } }) => (
						<TextareaAutosize
							value={value}
							onChange={onChange}
							autoComplete="off"
							autoCorrect="off"
							autoCapitalize="off"
							spellCheck={false}
							data-density="functional"
							label=""
							resize="none"
							aria-label="Globalsearch"
						/>
					)}
				/>
			)}

			<DBCard spacing="medium">
				<DBSelect
					{...register('extension')}
					label={t('export_form_file_format')}
					options={[
						{
							label: '*.jsonl',
							value: 'jsonl'
						}
					]}
				/>

				<DBInput
					{...register('filename')}
					label={t('export_form_file_name')}
					type="text"
					placeholder="export.jsonl"
				/>
			</DBCard>

			<div className="export-form__buttons">
				<DBButton
					variant="ghost"
					type="button"
					onClick={isExporting ? cancelExport : closeExportModal}
				>
					{t('export_form_cancel_button')}
				</DBButton>
				<DBButton type="submit" variant="brand" disabled={isSubmitDisabled}>
					{t('export_form_submit_button')}
				</DBButton>
			</div>
		</form>
	);
};
