import { CreateEdgeSelfLoopProgramOptions } from './factory';

export default function getFragmentShader({ arrowHead }: CreateEdgeSelfLoopProgramOptions) {
	const hasArrowHead = arrowHead?.extremity === 'target' || arrowHead?.extremity === 'both';

	// language=GLSL
	const SHADER = /*glsl*/ `
precision highp float;

varying vec4 v_color;
varying float v_thickness;
varying float v_feather;
// Two quadratic Bézier segments: (cpA, cpB, cpC) and (cpC, cpD, cpE)
varying vec2 v_cpA;
varying vec2 v_cpB;
varying vec2 v_cpC;
varying vec2 v_cpD;
varying vec2 v_cpE;
${
	hasArrowHead
		? `
varying float v_targetSize;
varying vec2 v_targetPoint;`
		: ''
}
${
	arrowHead
		? `
uniform float u_lengthToThicknessRatio;
uniform float u_widenessToThicknessRatio;`
		: ''
}

float det(vec2 a, vec2 b) {
  return a.x * b.y - b.x * a.y;
}

vec2 getDistanceVector(vec2 b0, vec2 b1, vec2 b2) {
  float a = det(b0, b2), b = 2.0 * det(b1, b0), d = 2.0 * det(b2, b1);
  float f = b * d - a * a;
  vec2 d21 = b2 - b1, d10 = b1 - b0, d20 = b2 - b0;
  vec2 gf = 2.0 * (b * d21 + d * d10 + a * d20);
  gf = vec2(gf.y, -gf.x);
  vec2 pp = -f * gf / dot(gf, gf);
  vec2 d0p = b0 - pp;
  float ap = det(d0p, d20), bp = 2.0 * det(d10, d0p);
  float t = clamp((ap + bp) / (2.0 * a + b + d), 0.0, 1.0);
  return mix(mix(b0, b1, t), mix(b1, b2, t), t);
}

float distToQuadraticBezierCurve(vec2 p, vec2 b0, vec2 b1, vec2 b2) {
  return length(getDistanceVector(b0 - p, b1 - p, b2 - p));
}

float distToSquareBorder(vec2 p, vec2 center, float size) {
  vec2 d = abs(p - center) - vec2(size, size);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

void main(void) {
  // Distance to the closer of the two Bézier segments
  float dist1 = distToQuadraticBezierCurve(gl_FragCoord.xy, v_cpA, v_cpB, v_cpC);
  float dist2 = distToQuadraticBezierCurve(gl_FragCoord.xy, v_cpC, v_cpD, v_cpE);
  float dist = min(dist1, dist2);
  float thickness = v_thickness;

${
	hasArrowHead
		? `
  // Arrow head at the loop end (right-middle of node)
  float distToTarget = distToSquareBorder(gl_FragCoord.xy, v_cpE, v_targetSize);
  float targetArrowLength = v_targetSize + thickness * u_lengthToThicknessRatio;
  distToTarget = distToTarget + v_targetSize;

  if (distToTarget < targetArrowLength) {
    thickness = (distToTarget - v_targetSize) / (targetArrowLength - v_targetSize) * u_widenessToThicknessRatio * thickness;
  }`
		: ''
}

  float halfThickness = thickness / 2.0;
  if (dist < halfThickness) {
    #ifdef PICKING_MODE
    gl_FragColor = v_color;
    #else
    float t = smoothstep(
      halfThickness - v_feather,
      halfThickness,
      dist
    );

    gl_FragColor = mix(v_color, transparent, t);
    #endif
  } else {
    gl_FragColor = transparent;
  }
}
`;

	return SHADER;
}
