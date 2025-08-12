import { getStyleCurrent } from 'src/utils/fetch/getStyleCurrent';
import { getStyleReset } from 'src/utils/fetch/getStyleReset';
import { getStyles } from 'src/utils/fetch/getStyles';
import { postStyleCurrent } from 'src/utils/fetch/postStyleCurrent';
import { postStyleUpload } from 'src/utils/fetch/postStyleUpload';

export const stylesApi = {
	getStyleCurrent: getStyleCurrent,
	getStyleReset: getStyleReset,
	getStyles: getStyles,
	postStyleCurrent: postStyleCurrent,
	postStyleUpload: postStyleUpload
};
