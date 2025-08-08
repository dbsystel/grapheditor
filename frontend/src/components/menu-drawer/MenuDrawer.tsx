import { DBDrawer } from '@db-ux/react-core-components';
import { useState } from 'react';

export const MenuDrawer = () => {
	const [open, setOpen] = useState<boolean>(false);
	return (
		<DBDrawer
			open={open}
			direction="left"
			onClose={() => {
				setOpen(false);
			}}
			drawerHeader={<header>Optional drawer header</header>}
		>
			My Drawer content
		</DBDrawer>
	);
};
