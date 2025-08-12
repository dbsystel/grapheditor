import './NetworkGraphStyleUpload.scss';
import { DBInput } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { nodesApi } from 'src/utils/api/nodes';
import { processPerspective } from 'src/utils/helpers/nodes';
import { usePostStyleUpload } from 'src/utils/hooks/usePostStyleUpload';
import { NetworkGraphStyleUploadProps } from './NetworkGraphStyleUpload.interfaces';

export const NetworkGraphStyleUpload = ({
	onSuccess,
	id,
	className,
	testId
}: NetworkGraphStyleUploadProps) => {
	const { t } = useTranslation();
	const uploadButtonRef = useRef<HTMLInputElement>(null);
	const rootElementClassName = clsx('network-graph__style-upload', className);
	const searchStore = useSearchStore((store) => store);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const { setIsLoading, perspectiveId } = useGraphStore((state) => state);

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
		}
	});

	const localOnFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			const uploadedFile = event.target.files[0];

			addNotification({
				title: t('notifications_info_grass_file_upload'),
				type: 'informational'
			});

			searchStore.setStyle(uploadedFile.name);

			setIsLoading(true);
			reFetch({ file: uploadedFile });
		}
	};

	return (
		<DBInput
			ref={uploadButtonRef}
			type="file"
			label={t('file_upload_grass_button_label')}
			onChange={localOnFileChange}
			disabled={isPostStyleLoading}
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			validMessage=""
			invalidMessage=""
		/>
	);
};
