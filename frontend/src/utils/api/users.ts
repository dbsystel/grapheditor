import { getLogin } from 'src/utils/fetch/getLogin';
import { postLogin } from 'src/utils/fetch/postLogin';
import { postLoginSSO } from 'src/utils/fetch/postLoginSSO';
import { postLogout } from 'src/utils/fetch/postLogout';

export const usersApi = {
	fetch: {
		getLogin: getLogin,
		postLogin: postLogin,
		postLoginSSO: postLoginSSO,
		postLogout: postLogout
	}
};
