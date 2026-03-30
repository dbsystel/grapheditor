import { CreateEdgeSelfLoopProgramOptions } from './factory';

export default function getVertexShader({ arrowHead }: CreateEdgeSelfLoopProgramOptions) {
	const hasArrowHead = arrowHead?.extremity === 'target' || arrowHead?.extremity === 'both';

	// language=GLSL
	const SHADER = /*glsl*/ `
attribute vec4 a_id;
attribute vec4 a_color;
attribute float a_direction;
attribute float a_thickness;
attribute vec2 a_source;
attribute vec2 a_target;
attribute float a_current;
attribute float a_curvature;
attribute float a_sourceSize;
${hasArrowHead ? 'attribute float a_targetSize;\n' : ''}

uniform mat3 u_matrix;
uniform float u_sizeRatio;
uniform float u_pixelRatio;
uniform vec2 u_dimensions;
uniform float u_minEdgeThickness;
uniform float u_feather;
${
	arrowHead
		? `
uniform float u_widenessToThicknessRatio;`
		: ''
}

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

const float bias = 255.0 / 254.0;
const float epsilon = 0.7;

vec2 clipspaceToViewport(vec2 pos, vec2 dimensions) {
  return vec2(
    (pos.x + 1.0) * dimensions.x / 2.0,
    (pos.y + 1.0) * dimensions.y / 2.0
  );
}

vec2 viewportToClipspace(vec2 pos, vec2 dimensions) {
  return vec2(
    pos.x / dimensions.x * 2.0 - 1.0,
    pos.y / dimensions.y * 2.0 - 1.0
  );
}

void main() {
  float minThickness = u_minEdgeThickness;

  vec2 source = (u_matrix * vec3(a_source, 1)).xy;
  vec2 viewportSource = clipspaceToViewport(source, u_dimensions);

  // Self-loop: two quadratic Bézier segments forming a loop above the node.
  // Both start (A) and end (E) are at the horizontal middle of the node's top side.
  // Segment 1: A -> B -> C (left half of the loop)
  // Segment 2: C -> D -> E (right half of the loop)
  float curvatureScale = 1.0 + abs(a_curvature) * 4.0;
  float scaledRadius = 30.0 * u_pixelRatio / u_sizeRatio * curvatureScale;

  // Node half-size in viewport pixels (square node).
  // With v_targetSize = 0, the arrow tip reaches exactly topCenter,
  // so nodeSize must be the full visual half-side of the square.
  float nodeSize = a_sourceSize * u_pixelRatio / u_sizeRatio;

  // A and E = top-center of the node (same point)
  vec2 topCenter = viewportSource + vec2(0.0, nodeSize);
  vec2 cpA = topCenter;
  vec2 cpE = topCenter;
  // C = apex of the loop, directly above
  vec2 cpC = viewportSource + vec2(0.0, nodeSize + scaledRadius);
  // B = control point pulling segment 1 to the left
  vec2 cpB = viewportSource + vec2(-scaledRadius, nodeSize + scaledRadius);
  // D = control point pulling segment 2 to the right
  vec2 cpD = viewportSource + vec2( scaledRadius, nodeSize + scaledRadius);

  // Both endpoints are the same, so viewportPosition = topCenter
  vec2 viewportPosition = topCenter;

  float curveThickness = max(minThickness, a_thickness / u_sizeRatio);
  v_thickness = curveThickness * u_pixelRatio;
  v_feather = u_feather;

  v_cpA = cpA;
  v_cpB = cpB;
  v_cpC = cpC;
  v_cpD = cpD;
  v_cpE = cpE;

  // Bounding box: the loop spans from topCenter (cpA/cpE) up to cpC (the apex).
  // Center the quad vertically at the midpoint of this range so the stroke at
  // the start/end point is not clipped.
  float edgeThickness = ${
		arrowHead ? 'curveThickness * u_widenessToThicknessRatio' : 'curveThickness'
  } + epsilon;
  float loopHeight = scaledRadius + edgeThickness * 2.0;
  float loopWidth = scaledRadius + edgeThickness;

  // Center of the bounding box: midway between topCenter and the loop apex
  vec2 bbCenter = viewportSource + vec2(0.0, nodeSize + scaledRadius * 0.5);

  // Offset position: expand from bbCenter outward to cover the loop
  vec2 viewportOffsetPosition = bbCenter
    + vec2(loopWidth * (2.0 * max(0.0, 1.0 - a_current) - 1.0), 0.0)
    + vec2(0.0, loopHeight * 0.5 * a_direction);

  vec2 position = viewportToClipspace(viewportOffsetPosition, u_dimensions);
  gl_Position = vec4(position, 0, 1);

${
	hasArrowHead
		? `
  // For self-loops, the curve already starts/ends at the node border (topCenter).
  // Set v_targetSize to 0 so the arrow head is not clipped by a phantom square —
  // otherwise distToSquareBorder creates a gap equal to v_targetSize before the endpoint.
  v_targetSize = 0.0;
  v_targetPoint = cpE;
`
		: ''
}

  #ifdef PICKING_MODE
  v_color = a_id;
  #else
  v_color = a_color;
  #endif

  v_color.a *= bias;
}
`;
	return SHADER;
}
