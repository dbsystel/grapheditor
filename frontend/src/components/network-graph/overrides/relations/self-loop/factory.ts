import { Attributes } from 'graphology-types';
import { EdgeProgram, EdgeProgramType, ProgramInfo } from 'sigma/rendering';
import { EdgeDisplayData, NodeDisplayData, RenderParams } from 'sigma/types';
import { floatColor } from 'sigma/utils';
import { drawSelfLoopLabel } from './edge-labels';
import getFragmentShader from './shader-frag';
import getVertexShader from './shader-vert';

const { UNSIGNED_BYTE, FLOAT } = WebGLRenderingContext;

export const DEFAULT_SELF_LOOP_CURVATURE = 0;

export type CreateEdgeSelfLoopProgramOptions = {
	arrowHead: null | {
		extremity: 'target' | 'source' | 'both';
		lengthToThicknessRatio: number;
		widenessToThicknessRatio: number;
	};
	/**
	 * Name of the edge attribute holding the curvature value.
	 * Each self-loop on the same node should have a different curvature so they fan out.
	 * Default: 'curvature'
	 */
	curvatureAttribute?: string;
	/** Default curvature when the attribute is missing. Default: 0 */
	defaultCurvature?: number;
};

const DEFAULT_EDGE_SELF_LOOP_PROGRAM_OPTIONS: CreateEdgeSelfLoopProgramOptions = {
	arrowHead: null,
	curvatureAttribute: 'curvature',
	defaultCurvature: DEFAULT_SELF_LOOP_CURVATURE
};

/**
 * Custom self-loop relation renderer. Draws a circular loop above a node
 * for edges where the source and target are the same node.
 * Rendered as a quadratic Bézier curve with an elevated control point.
 */
export default function createEdgeSelfLoopProgram<
	N extends Attributes = Attributes,
	E extends Attributes = Attributes,
	G extends Attributes = Attributes
>(inputOptions?: Partial<CreateEdgeSelfLoopProgramOptions>): EdgeProgramType<N, E, G> {
	const options = {
		...DEFAULT_EDGE_SELF_LOOP_PROGRAM_OPTIONS,
		...inputOptions
	} satisfies CreateEdgeSelfLoopProgramOptions;

	const { arrowHead, curvatureAttribute } = options;
	const hasArrowHead = arrowHead?.extremity === 'target' || arrowHead?.extremity === 'both';
	const UNIFORMS = [
		'u_matrix',
		'u_sizeRatio',
		'u_dimensions',
		'u_pixelRatio',
		'u_feather',
		'u_minEdgeThickness',
		...(arrowHead ? ['u_lengthToThicknessRatio', 'u_widenessToThicknessRatio'] : [])
	] as const;

	return class EdgeSelfLoopProgram extends EdgeProgram<(typeof UNIFORMS)[number], N, E, G> {
		drawLabel = drawSelfLoopLabel<N, E, G>(options);

		getDefinition() {
			return {
				VERTICES: 6,
				VERTEX_SHADER_SOURCE: getVertexShader(options),
				FRAGMENT_SHADER_SOURCE: getFragmentShader(options),
				METHOD: WebGLRenderingContext.TRIANGLES,
				UNIFORMS,
				ATTRIBUTES: [
					{ name: 'a_source', size: 2, type: FLOAT },
					{ name: 'a_target', size: 2, type: FLOAT },
					{ name: 'a_sourceSize', size: 1, type: FLOAT },
					...(hasArrowHead ? [{ name: 'a_targetSize', size: 1, type: FLOAT }] : []),
					{ name: 'a_thickness', size: 1, type: FLOAT },
					{ name: 'a_curvature', size: 1, type: FLOAT },
					{ name: 'a_color', size: 4, type: UNSIGNED_BYTE, normalized: true },
					{ name: 'a_id', size: 4, type: UNSIGNED_BYTE, normalized: true }
				],
				CONSTANT_ATTRIBUTES: [
					{ name: 'a_current', size: 1, type: FLOAT },
					{ name: 'a_direction', size: 1, type: FLOAT }
				],
				CONSTANT_DATA: [
					[0, 1],
					[0, -1],
					[1, 1],
					[0, -1],
					[1, 1],
					[1, -1]
				]
			};
		}

		processVisibleItem(
			edgeIndex: number,
			startIndex: number,
			sourceData: NodeDisplayData,
			targetData: NodeDisplayData,
			data: EdgeDisplayData
		) {
			const thickness = data.size || 1;
			const x1 = sourceData.x;
			const y1 = sourceData.y;
			const x2 = targetData.x;
			const y2 = targetData.y;
			const color = floatColor(data.color);
			const curvature = data[curvatureAttribute as 'size'] ?? DEFAULT_SELF_LOOP_CURVATURE;

			const array = this.array;

			array[startIndex++] = x1;
			array[startIndex++] = y1;
			array[startIndex++] = x2;
			array[startIndex++] = y2;
			array[startIndex++] = sourceData.size;
			if (hasArrowHead) array[startIndex++] = targetData.size;
			array[startIndex++] = thickness;
			array[startIndex++] = curvature;
			array[startIndex++] = color;
			array[startIndex++] = edgeIndex;
		}

		setUniforms(params: RenderParams, { gl, uniformLocations }: ProgramInfo): void {
			const {
				u_matrix,
				u_pixelRatio,
				u_feather,
				u_sizeRatio,
				u_dimensions,
				u_minEdgeThickness
			} = uniformLocations;

			gl.uniformMatrix3fv(u_matrix, false, params.matrix);
			gl.uniform1f(u_pixelRatio, params.pixelRatio);
			gl.uniform1f(u_sizeRatio, params.sizeRatio);
			gl.uniform1f(u_feather, params.antiAliasingFeather);
			gl.uniform2f(
				u_dimensions,
				params.width * params.pixelRatio,
				params.height * params.pixelRatio
			);
			gl.uniform1f(u_minEdgeThickness, params.minEdgeThickness);

			if (arrowHead) {
				const { u_lengthToThicknessRatio, u_widenessToThicknessRatio } = uniformLocations;

				gl.uniform1f(u_lengthToThicknessRatio, arrowHead.lengthToThicknessRatio);
				gl.uniform1f(u_widenessToThicknessRatio, arrowHead.widenessToThicknessRatio);
			}
		}
	};
}
