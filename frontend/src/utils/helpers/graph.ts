import { Cartesian2D, Cartesian3D, Wgs8422D, Wgs8423D } from 'src/models/graph';
import { isNumber, isObject } from 'src/utils/helpers/general';

export const isCartesian2D = (obj: unknown): obj is Cartesian2D => {
	return isObject(obj) && 'x' in obj && isNumber(obj.x) && 'y' in obj && isNumber(obj.y);
};

export const isCartesian3D = (obj: unknown): obj is Cartesian3D => {
	return isCartesian2D(obj) && 'z' in obj && isNumber(obj.z);
};

export const isWgs8422D = (obj: unknown): obj is Wgs8422D => {
	return (
		isObject(obj) &&
		'longitude' in obj &&
		isNumber(obj.longitude) &&
		'latitude' in obj &&
		isNumber(obj.latitude)
	);
};

export const isWgs8423D = (obj: unknown): obj is Wgs8423D => {
	return isWgs8422D(obj) && 'height' in obj && isNumber(obj.height);
};
