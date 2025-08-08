import { Node } from './node';
import { Relation } from './relation';

export type Perspective = {
	id: PerspectiveId;
	name: string;
	nodes: Record<string, Node>;
	relations: Record<string, Relation>;
};

export type PerspectiveId = string;

export type NodePosition = {
	x: number;
	y: number;
	z: number;
};

export type NodePositions = Record<string, NodePosition>;
