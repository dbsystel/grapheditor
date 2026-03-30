import './MenuButton.scss';
import { DBButton, DBCard, DBIcon, DBPopover } from '@db-ux/react-core-components';
import clsx from 'clsx';
import {
	createContext,
	PropsWithChildren,
	ReactNode,
	useContext,
	useEffect,
	useState
} from 'react';
import { useOutsideClick } from 'src/utils/hooks/useOutsideClick';
import {
	MenuButtonOption,
	MenuButtonOptionsContentProps,
	MenuButtonProps
} from './MenuButton.interfaces';

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

	const [isMenuOpenState, setIsMenuOpenState] = useState(false);
	const rootElementRef = useOutsideClick<HTMLDivElement>(
		{
			callback: () => {
				if (isMenuOpenState) {
					setIsMenuOpenState(false);
				}
			}
		},
		[isMenuOpenState]
	);
	const buttonIcon = icon || 'more_vertical';

	function setItMenuOpen(isOpen: boolean) {
		setIsMenuOpenState(isOpen);
	}

	return (
		<MenuButtonContext
			value={{
				setItMenuOpen: setItMenuOpen,
				isMenuOpen: isMenuOpenState
			}}
		>
			<DBPopover
				id={id}
				className={rootElementClassName}
				data-testid={testId}
				ref={rootElementRef}
				spacing="none"
				width="fixed"
				placement={optionsPlacement}
				open={isMenuOpenState}
				trigger={
					<DBButton
						className={className}
						icon={buttonIcon}
						type="button"
						size={buttonSize}
						noText
						variant="ghost"
						onClick={() => setIsMenuOpenState(!isMenuOpenState)}
						disabled={false}
					/>
				}
			>
				{isMenuOpenState && <OptionsContent options={options} />}
			</DBPopover>
		</MenuButtonContext>
	);
};

export const MenuButtonContext = createContext({
	isMenuOpen: false,
	setItMenuOpen: (isMenuOpen: boolean) => {}
});

const OptionsContent = ({
	options,
	handleMenuBlockOpenState
}: MenuButtonOptionsContentProps & { handleMenuBlockOpenState?: () => void }) => {
	return (
		<DBCard spacing="none">
			{options.map((option, index) => {
				if (option.options) {
					return <MenuButtonWithSubMenu key={index} option={option} />;
				} else {
					return (
						<MenuButtonSingleButton
							key={index}
							option={option}
							handleMenuBlockOpenState={handleMenuBlockOpenState}
						/>
					);
				}
			})}
		</DBCard>
	);
};

const MenuButtonWithSubMenu = ({ option }: { option: MenuButtonOption }) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const context = useContext(MenuButtonContext);
	const rootElementRef = useOutsideClick<HTMLDivElement>({
		callback: () => {
			setIsMenuOpen(false);
		}
	});

	useEffect(() => {
		if (!context.isMenuOpen) {
			setIsMenuOpen(false);
		}
	}, [context.isMenuOpen]);

	const localOnClick = () => {
		setIsMenuOpen(!isMenuOpen);

		if (option.onClick) {
			option.onClick();
		}
	};

	if (!option.options) {
		return <MenuButtonSingleButton option={option} />;
	} else {
		let titleContent: ReactNode = (
			<>
				{option.title} <DBIcon icon="chevron_right" />
			</>
		);

		if (!option.shouldRenderTitleAsIs) {
			titleContent = (
				<MenuButtonSingleButton option={option} handleMenuBlockOpenState={localOnClick}>
					{titleContent}
				</MenuButtonSingleButton>
			);
		}

		return (
			<DBPopover
				ref={rootElementRef}
				spacing="none"
				placement={option.optionsPlacement}
				open={isMenuOpen}
				trigger={titleContent}
			>
				<OptionsContent options={option.options} handleMenuBlockOpenState={localOnClick} />
			</DBPopover>
		);
	}
};

const MenuButtonSingleButton = ({
	option,
	children,
	handleMenuBlockOpenState
}: {
	option: MenuButtonOption;
	handleMenuBlockOpenState?: () => void;
} & PropsWithChildren) => {
	const context = useContext(MenuButtonContext);

	const localOnClick = () => {
		// handle parent menu open state
		if (handleMenuBlockOpenState) {
			handleMenuBlockOpenState();
		}

		// handle main menu open state
		if (option.closeMenuOnClick) {
			context.setItMenuOpen(false);
		}

		if (option.onClick) {
			option.onClick();
		}
	};

	if (option.shouldRenderTitleAsIs) {
		return option.title;
	}

	return (
		<DBButton
			icon={option.icon}
			type="button"
			size={option.buttonSize}
			variant="ghost"
			onClick={localOnClick}
			disabled={option.isDisabled}
		>
			{children || option.title}
		</DBButton>
	);
};
