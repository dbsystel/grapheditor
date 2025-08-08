import { Attributes } from 'graphology-types';
import { EdgeProgram, EdgeProgramType, ProgramInfo } from 'sigma/rendering';
import { EdgeDisplayData, NodeDisplayData, RenderParams } from 'sigma/types';
import { floatColor } from 'sigma/utils';
import getFragmentShader from 'src/components/network-graph/overrides/relations/straight/shader-frag';
import getVertexShader from 'src/components/network-graph/overrides/relations/straight/shader-vert';

const { UNSIGNED_BYTE, FLOAT } = WebGLRenderingContext;

export type CreateEdgeClampedProgramOptions = {
	arrowHead: null | {
		extremity: 'target' | 'source' | 'both';
		lengthToThicknessRatio: number;
		widenessToThicknessRatio: number;
	};
};

const DEFAULT_EDGE_CLAMPED_PROGRAM_OPTIONS: CreateEdgeClampedProgramOptions = {
	arrowHead: null
};

/**
 * Custom straight relation rendered. It supports square nodes.
 * Sigma.js has a different approach when it comes to straight relation renderer, but for us
 * it was easier to basically clone the curved one, and adjust it to be straight, than to
 * overwrite multiple files from multiple directories.
 */
export default function createEdgeClampedProgram<
	N extends Attributes = Attributes,
	E extends Attributes = Attributes,
	G extends Attributes = Attributes
>(inputOptions?: Partial<CreateEdgeClampedProgramOptions>): EdgeProgramType<N, E, G> {
	const options = {
		...DEFAULT_EDGE_CLAMPED_PROGRAM_OPTIONS,
		...inputOptions
	};

	const { arrowHead } = options;
	const hasTargetArrowHead = arrowHead?.extremity === 'target' || arrowHead?.extremity === 'both';
	const hasSourceArrowHead = arrowHead?.extremity === 'source' || arrowHead?.extremity === 'both';
	const UNIFORMS = [
		'u_matrix',
		'u_sizeRatio',
		'u_dimensions',
		'u_pixelRatio',
		'u_feather',
		'u_minEdgeThickness',
		...(arrowHead ? ['u_lengthToThicknessRatio', 'u_widenessToThicknessRatio'] : [])
	] as const;

	return class EdgeClampedProgram<
		N extends Attributes = Attributes,
		E extends Attributes = Attributes,
		G extends Attributes = Attributes
	> extends EdgeProgram<(typeof UNIFORMS)[number], N, E, G> {
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
					...(hasTargetArrowHead ? [{ name: 'a_targetSize', size: 1, type: FLOAT }] : []),
					...(hasSourceArrowHead ? [{ name: 'a_sourceSize', size: 1, type: FLOAT }] : []),
					{ name: 'a_thickness', size: 1, type: FLOAT },
					{ name: 'a_color', size: 4, type: UNSIGNED_BYTE, normalized: true },
					{ name: 'a_id', size: 4, type: UNSIGNED_BYTE, normalized: true }
				],
				CONSTANT_ATTRIBUTES: [
					{ name: 'a_current', size: 1, type: FLOAT }, // TODO: could optimize to bool
					{ name: 'a_direction', size: 1, type: FLOAT } // TODO: could optimize to byte
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

			const array = this.array;

			// First point
			array[startIndex++] = x1;
			array[startIndex++] = y1;
			array[startIndex++] = x2;
			array[startIndex++] = y2;
			if (hasTargetArrowHead) array[startIndex++] = targetData.size;
			if (hasSourceArrowHead) array[startIndex++] = sourceData.size;
			array[startIndex++] = thickness;
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
