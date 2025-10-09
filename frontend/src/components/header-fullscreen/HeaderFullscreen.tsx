import { DBButton } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { useState } from 'react';
import { toggleFullscreen } from 'src/utils/helpers/general';
import { useOnFullscreenChange } from 'src/utils/hooks/useOnFullscreenChange';
import { HeaderFullscreenProps } from './HeaderFullscreen.interfaces';

export const HeaderFullscreen = ({ id, className, testId }: HeaderFullscreenProps) => {
	const [isFullscreen, setIsFullscreen] = useState(false);
	const rootElementClassName = clsx('header-fullscreen', className);

	useOnFullscreenChange((isCurrentScreenFullscreen) => {
		setIsFullscreen(isCurrentScreenFullscreen);
	});

	const onClick = () => {
		toggleFullscreen(!isFullscreen);
	};

	const icon = isFullscreen ? 'fullscreen_exit' : 'fullscreen';

	return (
		<DBButton
			id={id}
			className={rootElementClassName}
			data-testid={testId}
			icon={icon}
			onClick={onClick}
			variant="ghost"
			noText
		/>
	);
};
