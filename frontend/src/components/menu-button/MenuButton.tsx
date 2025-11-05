import { DBButton, DBCard, DBIcon, DBPopover } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ReactNode, useState } from 'react';
import { useOutsideClick } from 'src/utils/hooks/useOutsideClick';
import {
	MenuButtonOption,
	MenuButtonOptionsContentProps,
	MenuButtonProps
} from './MenuButton.interfaces';
import './MenuButton.scss';

// TODO refactor when design is done
export const MenuButton = ({
	optionsPlacement,
	buttonSize,
	id,
	className,
	options,
	icon,
	testId
}: MenuButtonProps) => {
	const rootElementClassName = clsx('menu-button', className);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const rootElementRef = useOutsideClick<HTMLDivElement>({
		callback: () => {
			setIsMenuOpen(false);
		}
	});
	const buttonIcon = icon || 'more_vertical';

	const handleOptionClick = (option: MenuButtonOption) => {
		option.onClick?.();

		setIsMenuOpen(false);
	};

	return (
		<DBPopover
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			ref={rootElementRef}
			spacing="none"
			placement={optionsPlacement}
			open={isMenuOpen}
			trigger={
				<DBButton
					className={className}
					icon={buttonIcon}
					type="button"
					size={buttonSize}
					noText
					variant="ghost"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					disabled={false}
				/>
			}
		>
			<OptionsContent options={options} onOptionClick={handleOptionClick} />
		</DBPopover>
	);
};

const MenuButtonWithSubMenu = ({
	option: { options, onClick, icon, title, optionsPlacement, buttonSize, shouldRenderTitleAsIs }
}: {
	option: MenuButtonOption;
}) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const rootElementRef = useOutsideClick<HTMLDivElement>({
		callback: () => {
			setIsMenuOpen(false);
		}
	});

	const localOnClick = () => {
		setIsMenuOpen(!isMenuOpen);

		if (onClick) {
			onClick();
		}
	};

	if (!options) {
		if (shouldRenderTitleAsIs) {
			return title;
		}

		return (
			<DBButton icon={icon} type="button" size="small" variant="ghost" onClick={onClick}>
				{title}
			</DBButton>
		);
	} else {
		let titleContent: ReactNode = (
			<>
				{title} <DBIcon icon="chevron_right" />
			</>
		);

		if (!shouldRenderTitleAsIs) {
			titleContent = (
				<DBButton
					icon={icon}
					type="button"
					size={buttonSize}
					variant="ghost"
					onClick={localOnClick}
				>
					{titleContent}
				</DBButton>
			);
		}

		return (
			<DBPopover
				ref={rootElementRef}
				spacing="none"
				placement={optionsPlacement}
				open={isMenuOpen}
				trigger={titleContent}
			>
				<OptionsContent options={options} />
			</DBPopover>
		);
	}
};

const OptionsContent = ({ options, onOptionClick }: MenuButtonOptionsContentProps) => {
	return (
		<DBCard spacing="none">
			{options.map((option, index) => {
				if (option.options) {
					return <MenuButtonWithSubMenu key={index.toString()} option={option} />;
				} else {
					if (option.shouldRenderTitleAsIs) {
						return option.title;
					}

					return (
						<DBButton
							icon={option.icon}
							type="button"
							size={option.buttonSize}
							variant="ghost"
							onClick={() => onOptionClick?.(option)}
							disabled={option.isDisabled}
							key={index.toString()}
						>
							{option.title}
						</DBButton>
					);
				}
			})}
		</DBCard>
	);
};
