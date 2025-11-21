import './CreatePerspectiveDialog.scss';
import { DBButton, DBInput, DBTextarea } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Modal } from 'src/components/modal/Modal';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { preparePerspectiveDataAndRefreshNodesPosition } from 'src/utils/helpers/perspectives';
import { usePostPerspective } from 'src/utils/hooks/usePostPerspective';
import {
	CreatePerspectiveDialogForm,
	CreatePerspectiveDialogProps
} from './CreatePerspectiveDialog.interfaces';

export const CreatePerspectiveDialog = ({
	onSuccess,
	id,
	className,
	testId,
	closeFunction
}: CreatePerspectiveDialogProps) => {
	const rootElementClassName = clsx('create-perspective-dialog', className);
	const { t } = useTranslation();
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const isLoading = useGraphStore((store) => store.isLoading);
	const setIsLoading = useGraphStore((store) => store.setIsLoading);
	const { control, handleSubmit } = useForm<CreatePerspectiveDialogForm>({
		mode: 'onSubmit',
		reValidateMode: 'onChange',
		defaultValues: {
			name: '',
			description: ''
		}
	});

	const { reFetch } = usePostPerspective({
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

	const validationFunction = (value: string) => {
		if (value.trim().length === 0) {
			return t('validation_required');
		}
		return true;
	};

	const validationRules = {
		validate: validationFunction
	};

	const createPerspective = (formData: CreatePerspectiveDialogForm) => {
		const { nodePositions, relationIds } = preparePerspectiveDataAndRefreshNodesPosition();

		if (!Object.keys(nodePositions).length) {
			addNotification({
				title: t('notifications_warning_perspective_create_no_nodes'),
				type: 'warning'
			});

			return;
		}

		if (formData.name) {
			setIsLoading(true);

			reFetch({
				name: formData.name,
				description: formData.description || '',
				nodePositions: nodePositions,
				relationIds: relationIds
			});
		}
	};

	return (
		<Modal
			isOpen={true}
			headline={t('header_create_new_perspective_title')}
			description={t('header_create_new_perspective_description')}
			onClose={closeFunction}
		>
			<form onSubmit={handleSubmit(createPerspective)} className={rootElementClassName}>
				<div className="create-perspective-dialog__input">
					<Controller
						control={control}
						name="name"
						rules={validationRules}
						render={({ field: { value, onBlur, onChange }, fieldState: { error } }) => (
							<DBInput
								required
								label={t('header_create_new_perspective_label_title')}
								placeholder={t('header_create_new_perspective_placeholder_title')}
								onBlur={onBlur}
								onChange={onChange}
								disabled={isLoading}
								invalidMessage={error?.message || undefined}
								validation={error ? 'invalid' : undefined}
								value={value}
								data-testid="create_perspective_title_input"
							/>
						)}
					/>

					<Controller
						control={control}
						name="description"
						render={({ field: { value, onBlur, onChange } }) => (
							<DBTextarea
								label={t('header_create_new_perspective_label_description')}
								placeholder={t(
									'header_create_new_perspective_placeholder_description'
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
						{t('header_create_new_perspective_stop_button')}
					</DBButton>
					<DBButton
						type="submit"
						id={id}
						data-testid={testId}
						disabled={isLoading}
						icon="check"
						variant="brand"
					>
						{t('header_create_new_perspective_save_button')}
					</DBButton>
				</div>
			</form>
		</Modal>
	);
};
