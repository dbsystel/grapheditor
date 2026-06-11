import './LeftWidgetDebug.scss';
import { DBButton, DBCard, DBDivider, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StateManager } from 'src/components/network-graph/state-manager';
import { useGraphStore } from 'src/stores/graph';
import { useNotificationsStore } from 'src/stores/notifications';
import { downloadFile } from 'src/utils/helpers/general';
import { useGetBuildInfoBackend } from 'src/utils/hooks/useGetBuildInfoBackend';
import { useGetBuildInfoFrontend } from 'src/utils/hooks/useGetBuildInfoFrontend';
import { LeftWidgetDebugProps } from './LeftWidgetDebug.interfaces';

export const LeftWidgetDebug = ({ id, className, testId }: LeftWidgetDebugProps) => {
	const { t } = useTranslation();
	const rootElementClassName = clsx('left-widget__debug', className);
	const isSigmaReady = useGraphStore((store) => store.isSigmaReady);
	const [logsSize, setLogsSize] = useState('');
	const { response: buildInfoBackendResponse } = useGetBuildInfoBackend();
	const { response: buildInfoFrontendResponse } = useGetBuildInfoFrontend();

	useEffect(() => {
		if (isSigmaReady) {
			setLogsSize(StateManager.getInstance().logger.getFormattedLogsSize());

			const onAddLogUnsubscribe = StateManager.getInstance().logger.eventBus.subscribe(
				'addLog',
				() => {
					setLogsSize(StateManager.getInstance().logger.getFormattedLogsSize());
				}
			);

			return onAddLogUnsubscribe;
		}
	}, [isSigmaReady]);

	const resetLogs = () => {
		StateManager.getInstance().logger.reset();
		setLogsSize(StateManager.getInstance().logger.getFormattedLogsSize());
		useNotificationsStore.getState().addNotification({
			title: t('network_graph_settings_reset_state_logs_notification'),
			type: 'successful'
		});
	};

	const exportLogs = () => {
		downloadFile({
			content: StateManager.getInstance().logger.export(),
			mimeType: 'text/plain',
			name: 'graph-editor-state-transition-logs.txt'
		});
	};

	return (
		<div id={id} className={rootElementClassName} data-testid={testId}>
			{/* fake element, just to get label styling */}
			<div className="db-input">
				<label>Export</label>
			</div>
			<div className="left-widget__debug-block">
				<DBButton onClick={exportLogs}>
					{t('network_graph_settings_export_state_logs')}
				</DBButton>
				<DBButton onClick={resetLogs} icon="bin" noText={true}>
					<DBTooltip>
						{t('network_graph_settings_reset_state_logs_tooltip', {
							currentLogsSize: logsSize
						})}
					</DBTooltip>
				</DBButton>
			</div>

			<DBDivider />
			{/* fake element, just to get label styling */}
			<div className="db-input">
				<label>Version</label>
			</div>
			<div className="left-widget__debug-block">
				<p>Backend:</p>

				{buildInfoBackendResponse && (
					<>
						<p>{buildInfoBackendResponse.data.timestamp} </p>
						<DBCard>
							{buildInfoBackendResponse.data.commit.slice(0, 8)}
							<DBTooltip>Commit: {buildInfoBackendResponse.data.commit}</DBTooltip>
						</DBCard>
					</>
				)}
			</div>

			<div className="left-widget__debug-block">
				<p>Frontend:</p>

				{buildInfoFrontendResponse && (
					<>
						<p>{buildInfoFrontendResponse.data.timestamp}</p>
						<DBCard>
							{buildInfoFrontendResponse.data.commit.slice(0, 8)}
							<DBTooltip>Commit: {buildInfoFrontendResponse.data.commit}</DBTooltip>
						</DBCard>
					</>
				)}
			</div>
		</div>
	);
};
