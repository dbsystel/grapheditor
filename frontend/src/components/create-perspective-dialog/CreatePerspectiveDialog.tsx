import './CreatePerspectiveDialog.scss';
import { DBButton, DBInfotext, DBInput, DBTextarea } from '@db-ux/react-core-components';
import { SemanticType } from '@db-ux/react-core-components/dist/shared/model';
import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Modal } from 'src/components/modal/Modal';
import { useNotificationsStore } from 'src/stores/notifications';
import { usePerspectiveStore } from 'src/stores/perspective';
import { api } from 'src/utils/api/api';
import { preparePerspectiveDataAndRefreshNodesPosition } from 'src/utils/helpers/perspectives';
import { useDebounce } from 'src/utils/hooks/useDebounce';
import { useGetPerspective } from 'src/utils/hooks/useGetPerspective';
import { usePostPerspective } from 'src/utils/hooks/usePostPerspective';
import { usePutPerspective } from 'src/utils/hooks/usePutPerspective';
import {
	CreatePerspectiveDialogForm,
	CreatePerspectiveDialogProps
} from './CreatePerspectiveDialog.interfaces';

export const CreatePerspectiveDialog = ({
	onSuccess,
	id,
	className,
	testId,
	closeFunction,
	isEditMode = false
}: CreatePerspectiveDialogProps) => {
	const rootElementClassName = clsx('create-perspective-dialog', className);
	const { t } = useTranslation();
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const isLoading = usePerspectiveStore((store) => store.isLoading);
	const setIsLoading = usePerspectiveStore((store) => store.setIsLoading);
	const perspective = usePerspectiveStore((store) => store.perspective);
	const setPerspective = usePerspectiveStore((store) => store.setPerspective);
	const [duplicatePerspectiveNameInfo, setDuplicatePerspectiveNameInfo] = useState<{
		text: string;
		semantic: SemanticType;
	}>({
		text: '',
		semantic: 'informational'
	});
	const { control, handleSubmit, reset, setValue } = useForm<CreatePerspectiveDialogForm>({
		mode: 'onSubmit',
		reValidateMode: 'onChange',
		defaultValues: {
			name: '',
			description: ''
		}
	});
	const delayedCallback = useDebounce(500);

	const { reFetch: postPerspective } = usePostPerspective({
		name: '',
		description: '',
		nodePositions: {},
		relationIds: [],
		onSuccess: async () => {
			if (onSuccess) {
				onSuccess();
			}

			addNotification({
				title: t('notifications_success_perspective_create'),
				type: 'successful'
			});
		},
		onFinally: () => {
			closeFunction();
			setIsLoading(false);
		}
	});

	const { reFetch: putPerspective } = usePutPerspective({
		perspectiveId: perspective?.id || '',
		perspectiveName: perspective?.name || '',
		perspectiveDescription: perspective?.description || '',
		nodePositions: {},
		relationIds: [],
		onSuccess: async (response) => {
			setPerspective(response.data);

			if (onSuccess) {
				onSuccess();
			}

			addNotification({
				title: t('notifications_success_perspective_update'),
				type: 'successful'
			});
		},
		onFinally: () => {
			closeFunction();
			setIsLoading(false);
		}
	});

	useGetPerspective(
		{
			executeImmediately: !!perspective?.id && isEditMode,
			perspectiveId: perspective?.id || '',
			onSuccess: (response) => {
				if (isEditMode) {
					reset({
						name: response.data.name,
						description: response.data.description || ''
					});
				}
			}
		},
		[perspective, isEditMode, reset]
	);

	const validationFunction = (value: string) => {
		if (value.trim().length === 0) {
			return t('validation_required');
		}
		return true;
	};

	const validationRules = {
		validate: validationFunction
	};

	const createPerspective = async (formData: CreatePerspectiveDialogForm) => {
		const { nodePositions, relationIds } = preparePerspectiveDataAndRefreshNodesPosition();

		if (!isEditMode) {
			if (!Object.keys(nodePositions).length) {
				addNotification({
					title: t('notifications_warning_perspective_create_no_nodes'),
					type: 'warning'
				});

				return;
			}

			if (formData.name) {
				setIsLoading(true);

				postPerspective({
					name: formData.name,
					description: formData.description || '',
					nodePositions: nodePositions,
					relationIds: relationIds
				});
			}
		} else if (isEditMode && perspective) {
			setIsLoading(true);

			putPerspective({
				perspectiveId: perspective.id,
				perspectiveName: formData.name,
				perspectiveDescription: formData.description || '',
				nodePositions: nodePositions,
				relationIds: relationIds
			});
		}
	};

	const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
		setValue('name', event.target.value.trim());

		delayedCallback(() => {
			const perspectiveName = event.target.value.trim();

			api.nodes.fetch.getNodesPerspectivesNodes().then((response) => {
				let perspectiveNameExists = false;

				for (let i = 0, l = response.data.length; i < l; i++) {
					const perspectiveNode = response.data[i];

					if (perspectiveNode.title === perspectiveName) {
						perspectiveNameExists = true;
						setDuplicatePerspectiveNameInfo({
							text: t('create_perspective_dialog_not_unique_name', {
								name: perspectiveName
							}),
							semantic: 'informational'
						});
						break;
					}
				}

				if (!perspectiveNameExists) {
					setDuplicatePerspectiveNameInfo({
						text: t('create_perspective_dialog_unique_name', { name: perspectiveName }),
						semantic: 'successful'
					});
				}
			});
		});
	};

	return (
		<Modal
			isOpen={true}
			headline={
				isEditMode
					? t('create_perspective_dialog_edit_perspective_title')
					: t('create_perspective_dialog_create_new_perspective_title')
			}
			description={
				isEditMode
					? t('create_perspective_dialog_edit_perspective_description')
					: t('create_perspective_dialog_create_new_perspective_description')
			}
			onClose={closeFunction}
		>
			<form onSubmit={handleSubmit(createPerspective)} className={rootElementClassName}>
				<div className="create-perspective-dialog__content">
					<Controller
						control={control}
						name="name"
						rules={validationRules}
						render={({ field: { onBlur }, fieldState: { error } }) => (
							<DBInput
								required
								label={t(
									'create_perspective_dialog_create_new_perspective_label_title'
								)}
								placeholder={t(
									'create_perspective_dialog_create_new_perspective_placeholder_title'
								)}
								onBlur={onBlur}
								onChange={onNameChange}
								disabled={isLoading}
								invalidMessage={error?.message || undefined}
								validation={error ? 'invalid' : undefined}
								data-testid="create_perspective_title_input"
							/>
						)}
					/>
					{duplicatePerspectiveNameInfo.text && (
						<DBInfotext
							className="create-perspective-dialog__info-text"
							semantic={duplicatePerspectiveNameInfo.semantic}
							text={duplicatePerspectiveNameInfo.text}
						/>
					)}
					<Controller
						control={control}
						name="description"
						render={({ field: { value, onBlur, onChange } }) => (
							<DBTextarea
								className="create-perspective-dialog__description"
								label={t(
									'create_perspective_dialog_create_new_perspective_label_description'
								)}
								placeholder={t(
									'create_perspective_dialog_create_new_perspective_placeholder_description'
								)}
								onBlur={onBlur}
								value={value}
								onChange={onChange}
								disabled={isLoading}
							/>
						)}
					/>
				</div>
				<div className="create-perspective-dialog__buttons">
					<DBButton
						onClick={closeFunction}
						variant="ghost"
						disabled={isLoading}
						icon="cross"
					>
						{t('create_perspective_dialog_create_new_perspective_stop_button')}
					</DBButton>

					<DBButton
						type="submit"
						id={id}
						data-testid={testId}
						disabled={isLoading}
						icon="check"
						variant="brand"
					>
						{isEditMode
							? t('create_perspective_dialog_edit_perspective_save_button')
							: t('create_perspective_dialog_create_new_perspective_save_button')}
					</DBButton>
				</div>
			</form>
		</Modal>
	);
};
