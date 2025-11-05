import { DBInput, DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { nodesApi } from 'src/utils/api/nodes';
import { processPerspective } from 'src/utils/helpers/nodes';
import { usePostStyleUpload } from 'src/utils/hooks/usePostStyleUpload';
import {
	GrassfileManagerStyleUploadProps,
	GrassfileManagerUploadDialogForm
} from './GrassfileManagerStyleUpload.interfaces';
import './GrassfileManagerStyleUpload.scss';
import { Controller, useForm } from 'react-hook-form';

export const GrassFileManagerStyleUpload = ({
	onSuccess,
	id,
	className,
	testId,
	onClose
}: GrassfileManagerStyleUploadProps) => {
	const { t } = useTranslation();
	const uploadButtonRef = useRef<HTMLInputElement>(null);
	const rootElementClassName = clsx('grassfile_manager__style-upload', className);
	const searchStore = useSearchStore((store) => store);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { setIsLoading, perspectiveId, isLoading } = useGraphStore((state) => state);
	const { control, handleSubmit } = useForm<GrassfileManagerUploadDialogForm>({
		mode: 'onSubmit',
		reValidateMode: 'onChange',
		defaultValues: {
			file: null
		}
	});

	const { reFetch, isLoading: isPostStyleLoading } = usePostStyleUpload({
		file: new File([], 'placeholder'),
		onSuccess: async () => {
			if (onSuccess) {
				onSuccess();
			}

			addNotification({
				title: t('notifications_success_grass_file_upload'),
				type: 'successful'
			});

			const uploadedFileName = uploadButtonRef.current?.files?.[0]?.name || '';
			searchStore.setNewlyUploadedStyle(uploadedFileName);

			if (perspectiveId) {
				nodesApi
					.getPerspective({ perspectiveId: perspectiveId })
					.then((response) => processPerspective(response.data));
			}
		},
		onFinally: () => {
			const uploadButtonElement = uploadButtonRef.current;

			if (uploadButtonElement) {
				uploadButtonElement.value = '';
			}

			setIsLoading(false);
			onClose && onClose();
		}
	});

	const fileValidationFunction = (file: FileList | null) => {
		if (!file || file.length === 0) {
			return t('validation_file_required');
		}
		const fileName = file[0].name.toLowerCase();

		if (!fileName.endsWith('.grass')) {
			return t('validation_file_type_invalid');
		}

		return true;
	};

	const validationRules = {
		validate: fileValidationFunction
	};

	const onSubmitUpload = (formData: GrassfileManagerUploadDialogForm) => {
		if (formData.file && formData.file.length > 0) {
			const uploadedFile = formData.file[0];

			addNotification({
				title: t('notifications_info_grass_file_upload'),
				type: 'informational'
			});

			setIsLoading(true);
			reFetch({ file: uploadedFile });
			searchStore.setStyle(uploadedFile.name);
		}
	};

	useEffect(() => {
		const element = uploadButtonRef.current;

		if (element) {
			element.accept = '.grass';
		}
	}, []);

	return (
		<form
			onSubmit={handleSubmit(onSubmitUpload)}
			id={id}
			className={rootElementClassName}
			data-testid={testId}
		>
			<Controller
				control={control}
				name="file"
				rules={validationRules}
				render={({ field: { onBlur, onChange } }) => (
					<DBInput
						ref={uploadButtonRef}
						type="file"
						required
						label={t('file_upload_grass_button_label')}
						disabled={isPostStyleLoading}
						className="grassfile_manager__style-upload-input"
						validMessage=""
						invalidMessage=""
						onBlur={onBlur}
						onChange={(e: ChangeEvent<HTMLInputElement>) => {
							onChange(e.target.files);
						}}
					/>
				)}
			/>

			<div className="grassfile_manager__style-upload-buttons">
				<DBButton onClick={onClose} variant="ghost" disabled={isLoading} icon="cross">
					{t('cancel')}
				</DBButton>
				<DBButton type="submit" id={id} disabled={isLoading} icon="check" variant="brand">
					{t('upload')}
				</DBButton>
			</div>
		</form>
	);
};
