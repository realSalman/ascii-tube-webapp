import { useRef, useState, useEffect, useCallback } from 'react';
import { AsciiOptions, DETAILED_CHAR_SET } from '@/utils/ascii-converter';
import {
  createShader, createProgram, createAsciiAtlas,
  VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE
} from '@/utils/webgl-renderer';

export function useAsciiPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const gpuCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [hasVideo, setHasVideo] = useState(false);
  const [options, setOptions] = useState<AsciiOptions>({
    width: 40,
    height: 20,
    contrast: 200,
    brightness: 100,
    inverted: false,
    charSet: DETAILED_CHAR_SET
  });

  // WebGL State
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texturesRef = useRef<{ video: WebGLTexture | null; ascii: WebGLTexture | null }>({ video: null, ascii: null });

  const initWebGL = useCallback(() => {
    const canvas = gpuCanvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) return;
    glRef.current = gl;

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;
    programRef.current = program;
    gl.useProgram(program);

    // Setup Quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Setup Textures
    texturesRef.current.video = gl.createTexture();
    texturesRef.current.ascii = gl.createTexture();

    // Init ASCII texture
    const atlas = createAsciiAtlas(options.charSet);
    gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.ascii);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }, [options.charSet]);

  const processFrame = useCallback(() => {
    if (!videoRef.current || !gpuCanvasRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    const gl = glRef.current;
    const program = programRef.current;
    const canvas = gpuCanvasRef.current;
    if (!gl || !program || !canvas) {
      initWebGL();
      return;
    }

    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Update Video Texture
    gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.video);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoRef.current);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Set Uniforms
    const uGrid = gl.getUniformLocation(program, 'u_gridSize');
    const uCharCount = gl.getUniformLocation(program, 'u_charCount');
    const uExp = gl.getUniformLocation(program, 'u_exposure');
    const uCla = gl.getUniformLocation(program, 'u_clarity');
    const uVid = gl.getUniformLocation(program, 'u_video');
    const uAsc = gl.getUniformLocation(program, 'u_ascii');

    gl.uniform2f(uGrid, options.width, options.height);
    gl.uniform1f(uCharCount, options.charSet.length);
    gl.uniform1f(uExp, options.brightness);
    gl.uniform1f(uCla, options.contrast);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.video);
    gl.uniform1i(uVid, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texturesRef.current.ascii);
    gl.uniform1i(uAsc, 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (isPlaying) requestAnimationFrame(processFrame);
  }, [options, isPlaying, initWebGL]);

  useEffect(() => {
    if (isPlaying) {
      const frameId = requestAnimationFrame(processFrame);
      return () => cancelAnimationFrame(frameId);
    }
  }, [isPlaying, processFrame]);

  useEffect(() => {
    initWebGL();
  }, [options.charSet, initWebGL]);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoTitle, setVideoTitle] = useState("");

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setCurrentTime(video.currentTime);
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('durationchange', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('durationchange', updateDuration);
    };
  }, [hasVideo]);

  const handleFileUpload = (file: File) => {
    if (videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.muted = false;
      videoRef.current.volume = volume;
      setVideoTitle(file.name);
      videoRef.current.onloadedmetadata = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        setDuration(video.duration);
        const aspectRatio = video.videoWidth / video.videoHeight;
        const charAspectRatio = 0.55;
        const newHeight = Math.floor(options.width / aspectRatio / charAspectRatio);

        setOptions(prev => ({ ...prev, height: newHeight }));

        if (gpuCanvasRef.current) {
          gpuCanvasRef.current.width = 1200;
          gpuCanvasRef.current.height = 1200 / aspectRatio;
          initWebGL();
        }
      };

      videoRef.current.load();
      setIsPlaying(false);
      setHasVideo(true);
    }
  };

  return {
    videoRef,
    gpuCanvasRef,
    isPlaying,
    hasVideo,
    volume,
    currentTime,
    duration,
    videoTitle,
    options,
    setOptions,
    togglePlay,
    handleVolumeChange,
    handleFileUpload,
    seek
  };
}
