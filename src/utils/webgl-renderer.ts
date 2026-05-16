export const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

export const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
};

export const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_position * 0.5 + 0.5;
    v_texCoord.y = 1.0 - v_texCoord.y; // Flip Y for video
  }
`;

export const FRAGMENT_SHADER_SOURCE = `
  precision highp float;
  uniform sampler2D u_video;
  uniform sampler2D u_ascii;
  uniform vec2 u_gridSize;
  uniform float u_charCount;
  uniform float u_exposure;
  uniform float u_clarity;
  varying vec2 v_texCoord;

  void main() {
    // Determine the cell coordinates
    vec2 cellCoord = floor(v_texCoord * u_gridSize);
    vec2 uv = (cellCoord + 0.5) / u_gridSize;
    
    // Sample the video at the center of the cell
    vec4 color = texture2D(u_video, uv);
    
    // Calculate brightness (Luminance)
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    
    // Apply Exposure (reversed logic as requested)
    brightness -= u_exposure / 255.0;
    
    // Apply Clarity (Contrast)
    float factor = (259.0 * (u_clarity + 255.0)) / (255.0 * (259.0 - u_clarity));
    brightness = factor * (brightness - 0.5) + 0.5;
    brightness = clamp(brightness, 0.0, 1.0);
    
    // Pick the character from the atlas
    float charIndex = floor(brightness * (u_charCount - 1.0));
    
    // Calculate local UV within the cell for character sampling
    vec2 localUV = fract(v_texCoord * u_gridSize);
    
    // Sample the character atlas (atlas is horizontal: charCount x 1)
    vec2 asciiUV = vec2((charIndex + localUV.x) / u_charCount, localUV.y);
    float charMask = texture2D(u_ascii, asciiUV).r;
    
    if (charMask > 0.5) {
      gl_FragColor = color;
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }
`;

export function createAsciiAtlas(charSet: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const fontSize = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  canvas.width = fontSize * charSet.length;
  canvas.height = fontSize;
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  for (let i = 0; i < charSet.length; i++) {
    ctx.fillText(charSet[i], i * fontSize, 0);
  }

  return canvas;
}
