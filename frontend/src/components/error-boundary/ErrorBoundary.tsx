import './ErrorBoundary.scss';
import { DBButton, DBIcon, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import React, { Component } from 'react';
import i18n from 'src/i18n';
import { ErrorBoundaryProps, ErrorBoundaryState } from './ErrorBoundary.interfaces';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false
		};
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	reload = () => {
		this.setState({ hasError: false });
	};

	render() {
		const rootElementClassName = clsx('error-boundary', this.props.className);

		if (this.state.hasError) {
			return (
				<div id={this.props.id} className={rootElementClassName}>
					<DBIcon icon="exclamation_mark_circle" />
					{i18n.t('something_went_wrong')}
					<DBButton
						type="button"
						onClick={this.reload}
						icon="circular_arrows"
						noText={true}
						variant="ghost"
					>
						<DBTooltip showArrow={false} width="fixed" animation={false}>
							{i18n.t('reload_block_warning_message')}
						</DBTooltip>
					</DBButton>
				</div>
			);
		}

		return this.props.children;
	}
}
