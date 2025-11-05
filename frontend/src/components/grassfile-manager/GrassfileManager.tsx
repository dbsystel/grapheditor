import './GrassfileManager.scss';
import { DBSelect } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GrassFileManagerStyleUpload } from 'src/components/grassfile-manager/style-upload/GrassfileManagerStyleUpload';
import { Loading } from 'src/components/loading/Loading';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { MenuButtonOption } from 'src/components/menu-button/MenuButton.interfaces';
import { Modal } from 'src/components/modal/Modal';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { useSearchStore } from 'src/stores/search';
import { nodesApi } from 'src/utils/api/nodes';
import { searchApi } from 'src/utils/api/search';
import { GRAPH_STYLE_DEFAULT_VALUE } from 'src/utils/constants';
import { processPerspective } from 'src/utils/helpers/nodes';
import { useDeleteStyle } from 'src/utils/hooks/useDeleteStyle';
import { useGetStyleCurrent } from 'src/utils/hooks/useGetStyleCurrent';
import { useGetStyleReset } from 'src/utils/hooks/useGetStyleReset';
import { useGetStyles } from 'src/utils/hooks/useGetStyles';
import { usePostStyleCurrent } from 'src/utils/hooks/usePostStyleCurrent';
import { GrassfileManagerProps } from './GrassfileManager.interfaces';

export const GrassfileManager = ({ id, className, testId }: GrassfileManagerProps) => {
	const rootElementClassName = clsx('grassfile_manager', className);
	const [styles, setStyles] = useState<Array<string>>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { t } = useTranslation();
	const searchStore = useSearchStore((store) => store);
	const addNotification = useNotificationsStore((store) => store.addNotification);
	const perspectiveId = useGraphStore((store) => store.perspectiveId);
	const setIsLoading = useGraphStore((state) => state.setIsLoading);
	const isLoading = useGraphStore((state) => state.isLoading);
	const isDefaultStyleSelected = searchStore.style === GRAPH_STYLE_DEFAULT_VALUE;
	const onStyleSuccess = () => {
		searchApi.executeSearch();
	};

	const { reFetch: getCurrentStyle } = useGetStyleCurrent({
		onSuccess: (response) => {
			const currentStyle = response.data.filename || GRAPH_STYLE_DEFAULT_VALUE;
			searchStore.setStyle(currentStyle);
		},
		executeImmediately: true
	});

	const { reFetch, isLoading: isPostStyleLoading } = usePostStyleCurrent({
		filename: '',
		onSuccess: async () => {
			addNotification({
				title: t('notifications_success_grass_file_change'),
				type: 'successful'
			});

			if (perspectiveId) {
				nodesApi
					.getPerspective({ perspectiveId: perspectiveId })
					.then((response) => processPerspective(response.data));
			} else {
				searchApi.executeSearch();
			}
		},
		onError: (error) => {
			addNotification({
				title: t('notifications_failure_grass_file_change'),
				description: error.message,
				type: 'critical'
			});
		},
		onFinally: () => {
			setIsLoading(false);
		}
	});

	const { reFetch: reFetchStyles } = useGetStyles({
		onSuccess: (response) => {
			setStyles(response.data.filenames);

			getCurrentStyle();

			if (searchStore.newlyUploadedStyle) {
				searchStore.setNewlyUploadedStyle('');
			}
		},
		onFinally: () => {
			setIsLoading(false);
		},
		executeImmediately: true,
		waitBeforeReFetch: true
	});

	const { reFetch: executeDeleteStyle, isLoading: isDeleting } = useDeleteStyle({
		grassFileName: searchStore.style,
		onSuccess: (response) => {
			if (response.data.includes('deleted')) {
				addNotification({
					title: 'Style erfolgreich gelöscht',
					type: 'successful'
				});

				searchStore.setStyle(GRAPH_STYLE_DEFAULT_VALUE);
				reFetch({ filename: '' });

				reFetchStyles();
			} else {
				addNotification({
					title: 'Style konnte nicht gelöscht werden',
					description: response.data,
					type: 'warning'
				});
			}
		},
		onError: (error) => {
			addNotification({
				title: 'Fehler beim Löschen des Styles',
				description: error.message,
				type: 'critical'
			});
		},
		executeImmediately: false
	});

	const { isLoading: isResetting, reFetch: executeStyleReset } = useGetStyleReset({
		onSuccess: async () => {
			if (onStyleSuccess) {
				onStyleSuccess();
			}

			addNotification({
				title: t('notifications_info_grass_file_reset_success'),
				type: 'successful'
			});

			searchStore.setResetStyles(true);

			if (perspectiveId) {
				nodesApi
					.getPerspective({ perspectiveId: perspectiveId })
					.then((response) => processPerspective(response.data));
			}
		},
		onError: (error) => {
			addNotification({
				title: t('notifications_info_grass_file_reset_failure'),
				description: error.message,
				type: 'critical'
			});
		},
		onFinally: () => {
			setIsLoading(false);
		}
	});

	useEffect(() => {
		if (searchStore.newlyUploadedStyle || searchStore.resetStyles) {
			reFetchStyles();
			searchStore.setResetStyles(false);
		}
	}, [searchStore.newlyUploadedStyle, searchStore.resetStyles, searchStore.style]);

	const styleOptions = [
		{
			value: GRAPH_STYLE_DEFAULT_VALUE,
			key: GRAPH_STYLE_DEFAULT_VALUE,
			label: GRAPH_STYLE_DEFAULT_VALUE
		},
		...styles.map((filename) => {
			return { value: filename, label: filename, key: filename };
		})
	];

	const onStyleChange = (event: ChangeEvent<HTMLSelectElement>) => {
		const newStyle = event.target.value;

		if (newStyle === GRAPH_STYLE_DEFAULT_VALUE) {
			reFetch({ filename: '' });
			searchStore.setStyle(newStyle);
		} else {
			reFetch({ filename: newStyle });
			searchStore.setStyle(newStyle);
		}

		setIsLoading(true);
	};

	const toggleModal = () => {
		setIsModalOpen(!isModalOpen);
	};

	const closeModal = () => {
		setIsModalOpen(false);
	};

	const deleteStyle = () => {
		if (isDefaultStyleSelected || isDeleting) {
			return;
		}

		const confirmDelete = window.confirm(
			t('grassfile_manager_confirm_delete_style_message', { styleName: searchStore.style })
		);

		if (confirmDelete) {
			executeDeleteStyle();
		}
	};

	const resetGrassFile = () => {
		setIsLoading(true);
		executeStyleReset();
	};

	const menuOptions: Array<MenuButtonOption> = [
		{
			title: t('grassfile_manager_upload_new_style'),
			onClick: toggleModal
		},
		{
			title: t('grassfile_manager_delete_selected_style'),
			onClick: () => {
				deleteStyle();
			},
			isDisabled: isDefaultStyleSelected || styles.length === 0
		},
		{
			title: t('grassfile_manager_delete_user_styles'),
			onClick: () => {
				resetGrassFile();
			},
			isDisabled: isResetting || styles.length === 0
		}
	];

	return (
		<>
			<div className={rootElementClassName} id={id} data-testid={testId}>
				<DBSelect
					value={searchStore.style}
					label={t('grassfile_manager_file_label')}
					options={styleOptions}
					onChange={onStyleChange}
					disabled={isPostStyleLoading}
				/>
				<Loading isLoading={isLoading} renderChildrenWhileLoading={false}>
					<MenuButton
						optionsPlacement="bottom-start"
						buttonSize="medium"
						options={menuOptions}
					/>
				</Loading>
			</div>

			{isModalOpen && (
				<Modal
					isOpen={true}
					className="grassfile-manager__modal"
					headline={t('grassfile_manager_file_upload_title')}
					description={t('grassfile_manager_file_upload_description')}
					onClose={closeModal}
				>
					<GrassFileManagerStyleUpload onSuccess={onStyleSuccess} onClose={closeModal} />
				</Modal>
			)}
		</>
	);
};
