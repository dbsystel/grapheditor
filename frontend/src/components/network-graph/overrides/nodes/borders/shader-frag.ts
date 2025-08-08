import { numberToGLSLFloat } from 'sigma/rendering';
import { CreateNodeBorderProgramOptions, DEFAULT_BORDER_SIZE_MODE, NodeBorderSize } from './utils';

export default function getFragmentShader({ borders }: CreateNodeBorderProgramOptions) {
	const fillCounts = numberToGLSLFloat(borders.filter(({ size }) => 'fill' in size).length);

	// language=GLSL
	const SHADER = /*glsl*/ `
precision highp float;

varying vec2 v_diffVector;
varying float v_halfSize;

#ifdef PICKING_MODE
varying vec4 v_color;
#else
// For normal mode, we use the border colors defined in the program:
${borders
	.flatMap(({ size }, i) => ('attribute' in size ? [`varying float v_borderSize_${i + 1};`] : []))
	.join('\n')}
${borders
	.flatMap(({ color }, i) =>
		'attribute' in color
			? [`varying vec4 v_borderColor_${i + 1};`]
			: 'value' in color
				? [`uniform vec4 u_borderColor_${i + 1};`]
				: []
	)
	.join('\n')}
#endif


uniform float u_correctionRatio;

const float bias = 255.0 / 254.0;
const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

void main(void) {
  vec2 dist = abs(v_diffVector);
  float aaBorder = 2.0 * u_correctionRatio;
  float borderSize_0 = v_halfSize;

  // No antialiasing for picking mode:
  #ifdef PICKING_MODE
  if (dist.x > v_halfSize || dist.y > v_halfSize)
    gl_FragColor = transparent;
  else {
    gl_FragColor = v_color;
    gl_FragColor.a *= bias;
  }
  #else
  // Sizes:
${borders
	.flatMap(({ size }, i) => {
		if ('fill' in size) return [];

		size = size as Exclude<NodeBorderSize, { fill: true }>;
		const value = 'attribute' in size ? `v_borderSize_${i + 1}` : numberToGLSLFloat(size.value);
		const factor =
			(size.mode || DEFAULT_BORDER_SIZE_MODE) === 'pixels'
				? 'u_correctionRatio'
				: 'v_halfSize';
		return [`  float borderSize_${i + 1} = ${factor} * ${value};`];
	})
	.join('\n')}
  // Now, let's split the remaining space between "fill" borders:
  float fillBorderSize = (v_halfSize - (${borders
		.flatMap(({ size }, i) => (!('fill' in size) ? [`borderSize_${i + 1}`] : []))
		.join(' + ')})) / ${fillCounts};
${borders
	.flatMap(({ size }, i) =>
		'fill' in size ? [`  float borderSize_${i + 1} = fillBorderSize;`] : []
	)
	.join('\n')}

  // Finally, normalize all border sizes:
  float adjustedBorderSize_0 = v_halfSize;
${borders
	.map(
		(_, i) =>
			`  float adjustedBorderSize_${i + 1} = adjustedBorderSize_${i} - borderSize_${i + 1};`
	)
	.join('\n')}

  // Colors:
  vec4 borderColor_0 = transparent;
${borders
	.map(({ color }, i) => {
		const res: string[] = [];
		if ('attribute' in color) {
			res.push(`  vec4 borderColor_${i + 1} = v_borderColor_${i + 1};`);
		} else if ('transparent' in color) {
			res.push(`  vec4 borderColor_${i + 1} = vec4(0.0, 0.0, 0.0, 0.0);`);
		} else {
			res.push(`  vec4 borderColor_${i + 1} = u_borderColor_${i + 1};`);
		}

		res.push(`  borderColor_${i + 1}.a *= bias;`);
		res.push(
			`  if (borderSize_${i + 1} <= 1.0 * u_correctionRatio) { borderColor_${
				i + 1
			} = borderColor_${i}; }`
		);

		return res.join('\n');
	})
	.join('\n')}
  if (dist.x > adjustedBorderSize_0 || dist.y > adjustedBorderSize_0) {
    gl_FragColor = borderColor_0;
  } else ${borders
		.map(
			(
				_,
				i
			) => `if (dist.x > adjustedBorderSize_${i} - aaBorder || dist.y > adjustedBorderSize_${i} - aaBorder) {
    float alpha = max(dist.x - (adjustedBorderSize_${i} - aaBorder), dist.y - (adjustedBorderSize_${i} - aaBorder)) / aaBorder;
    gl_FragColor = mix(borderColor_${i + 1}, borderColor_${i}, alpha);
  } else if (dist.x > adjustedBorderSize_${i + 1} || dist.y > adjustedBorderSize_${i + 1}) {
    gl_FragColor = borderColor_${i + 1};
  } else `
		)
		.join('')} { /* Nothing to add here */ }
  #endif
}
`;

	return SHADER;
}
