export type Cartesian2D = {
	x: number;
	y: number;
};

export type Cartesian3D = Cartesian2D & {
	z: number;
};

export type Wgs8422D = {
	longitude: number;
	latitude: number;
};

export type Wgs8423D = Wgs8422D & {
	height: number;
};
