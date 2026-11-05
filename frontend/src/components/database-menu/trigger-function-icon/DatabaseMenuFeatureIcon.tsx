import './DatabaseMenuFeatureIcon.scss';
import { DBIcon, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useDatabaseFeatures } from 'src/utils/hooks/useDatabaseFeatures';
import { DatabaseMenuFeatureIconProps } from './DatabaseMenuFeatureIcon.interfaces';

/**
 * Icon indicating whether the current database supports a specific feature.
 * Color is green when the feature is present, grey otherwise.
 */
export const DatabaseMenuFeatureIcon = ({
	id,
	className,
	testId
}: DatabaseMenuFeatureIconProps) => {
	const { hasFunctions, hasTriggers } = useDatabaseFeatures();
	const { t } = useTranslation();
	const tooltipText =
		hasFunctions && hasTriggers
			? t('database_feature_icon_tooltip_functions_and_triggers_available')
			: hasFunctions
				? t('database_feature_icon_tooltip_functions_only_available')
				: hasTriggers
					? t('database_feature_icon_tooltip_triggers_only_available')
					: t('database_feature_icon_tooltip_no_functions_no_triggers_available');

	const rootElementClassName = clsx('database-feature-icon', className, {
		'database-feature-icon--inactive': !(hasFunctions && hasTriggers)
	});

	return (
		<DBIcon
			icon="information_circle"
			id={id}
			data-testid={testId}
			className={rootElementClassName}
		>
			<DBTooltip>{tooltipText}</DBTooltip>
		</DBIcon>
	);
};
