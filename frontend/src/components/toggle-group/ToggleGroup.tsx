import './ToggleGroup.scss';
import { DBButton, DBIcon, DBSection, DBTooltip } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ToggleGroupProps } from './ToggleGroup.interfaces';

export const ToggleGroup = <T extends string>({
	id,
	className,
	testId,
	options,
	value,
	onChange,
	selectedLabel,
	size = 'small'
}: ToggleGroupProps<T>) => {
	const rootElementClassName = clsx('toggle-group', className);

	return (
		<DBSection spacing="none" className={rootElementClassName} id={id} data-testid={testId}>
			<div className="toggle-group__select-type">
				{options.map((option) => (
					<DBButton
						key={option.value}
						size={size}
						type="button"
						noText
						variant={value === option.value ? 'filled' : 'ghost'}
						onClick={() => onChange(option.value)}
						className={value === option.value ? 'toggle-group--selected' : ''}
					>
						<DBIcon icon={option.icon} />
						<DBTooltip placement="bottom-start" showArrow={false}>
							{option.label}
						</DBTooltip>
					</DBButton>
				))}
			</div>

			<div>
				<strong>{selectedLabel}</strong>
			</div>
		</DBSection>
	);
};
