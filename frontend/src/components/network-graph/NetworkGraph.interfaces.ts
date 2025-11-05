import { Attributes } from 'graphology-types';
import Sigma from 'sigma';
import { Node } from 'src/models/node';
import { Relation } from 'src/models/relation';
import { GlobalComponentProps } from 'src/types/components';

export type NetworkGraphProps = GlobalComponentProps;

export type GraphEditorSigmaNodeAttributes = Attributes & { data: Node };
export type GraphEditorSigmaRelationAttributes = Attributes & { data: Relation };

export type GraphEditorSigma = Sigma<
	GraphEditorSigmaNodeAttributes,
	GraphEditorSigmaRelationAttributes,
	Attributes
>;
