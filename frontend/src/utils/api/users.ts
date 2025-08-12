import { getLogin } from 'src/utils/fetch/getLogin';
import { postLogin } from 'src/utils/fetch/postLogin';
import { postLogout } from 'src/utils/fetch/postLogout';

export const usersApi = {
	getLogin: getLogin,
	postLogin: postLogin,
	postLogout: postLogout
};
