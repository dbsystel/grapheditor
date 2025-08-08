import './HeaderSettings.scss';
import { DBCheckbox, DBLink } from '@db-ux/react-core-components';
import clsx from 'clsx';
import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { MenuButton } from 'src/components/menu-button/MenuButton';
import { MenuButtonOption } from 'src/components/menu-button/MenuButton.interfaces';
import { useSettingsStore } from 'src/stores/settings';
import { HeaderSettingsProps } from './HeaderSettings.interfaces';

export const HeaderSettings = ({ id, className, testId }: HeaderSettingsProps) => {
	const { t } = useTranslation();
	const setIsAutoconnectEnabled = useSettingsStore((store) => store.setIsAutoconnectEnabled);
	const isAutoconnectEnabled = useSettingsStore((store) => store.isAutoconnectEnabled);
	const rootElementClassName = clsx('header-settings', className);

	const onAutoconnectToggle = (event: ChangeEvent<HTMLInputElement>) => {
		setIsAutoconnectEnabled(event.target.checked);
	};

	const options: Array<MenuButtonOption> = [
		{
			title: (
				<div
					key="header-settings__autoconnect"
					className="menu-button__option header-settings__autoconnect"
				>
					<DBCheckbox onChange={onAutoconnectToggle} checked={isAutoconnectEnabled}>
						{t('autoconnect_label')} <br />({t('autoconnect_info_message')})
					</DBCheckbox>
				</div>
			),
			shouldRenderTitleAsIs: true
		},
		{
			title: (
				<div key="header-settings__source_code" className="menu-button__option">
					{t('application_source_code')}:&nbsp;
					<DBLink href="https://github.com/dbsystel/grapheditor" target="_blank">
						GitHub
					</DBLink>
				</div>
			),
			shouldRenderTitleAsIs: true
		},
		{
			title: (
				<div key="header-settings__license" className="menu-button__option">
					{t('application_license')}:&nbsp;
					<DBLink href="https://www.gnu.org/licenses/agpl-3.0.txt" target="_blank">
						AGPL 3.0
					</DBLink>
				</div>
			),
			shouldRenderTitleAsIs: true
		}
	];

	return (
		<MenuButton
			id={id}
			className={rootElementClassName}
			testId={testId}
			icon="gear_wheel"
			optionsPlacement="bottom-end"
			options={options}
		/>
	);
};
