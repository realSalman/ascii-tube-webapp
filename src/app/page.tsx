"use client";

import React, { ChangeEvent, useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Upload,
  SlidersHorizontal
} from 'lucide-react';

const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);
import { useAsciiPlayer } from '@/hooks/useAsciiPlayer';
import { DETAILED_CHAR_SET, DEFAULT_CHAR_SET } from '@/utils/ascii-converter';

export default function Home() {
  const {
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
  } = useAsciiPlayer();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seek(pos * duration);
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      handleVolumeChange(0);
      setIsMuted(true);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyM') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      handleFileUpload(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          ASCII<span>TUBE</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="action-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} />
            Upload Video
          </button>
          <a
            href="https://github.com/realSalman/ascii-tube-webapp"
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn"
            style={{ padding: '8px', background: 'rgba(255, 255, 255, 1)' }}
            title="View on GitHub"
          >
            <GithubIcon size={20} />
          </a>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="video/*"
          onChange={onFileChange}
        />
      </header>

      <main className="main-content">
        <section className="video-section">
          <div
            className={`player-container ${!isPlaying ? 'paused' : ''}`}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            {!hasVideo && (
              <div className="empty-state">
                <Upload size={64} strokeWidth={1.5} />
                <p>Drag and drop or click to upload a video</p>
                <button
                  className="action-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </button>
              </div>
            )}

            <canvas
              ref={gpuCanvasRef}
              className="player-canvas"
              style={{ display: hasVideo ? 'block' : 'none' }}
              onClick={togglePlay}
            />

            {hasVideo && (
              <div className="player-overlay">
                {!isPlaying && (
                  <div className="central-play-trigger" onClick={togglePlay}>
                    <Play size={48} fill="white" />
                  </div>
                )}
                <div className="controls-wrapper">
                  <div
                    className="progress-bar-container"
                    ref={progressBarRef}
                    onClick={handleProgressBarClick}
                  >
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                      <div className="progress-bar-handle" />
                    </div>
                  </div>

                  <div className="controls-main">
                    <div className="controls-left">
                      <button className="control-btn" onClick={togglePlay}>
                        {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                      </button>

                      <div className="volume-container">
                        <button className="control-btn" onClick={toggleMute}>
                          {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="volume-slider"
                        />
                      </div>

                      <div className="time-display">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>

                    <div className="controls-right">
                      <button className="control-btn" onClick={() => {
                        if (gpuCanvasRef.current?.requestFullscreen) {
                          gpuCanvasRef.current.requestFullscreen();
                        }
                      }}>
                        <Maximize size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              style={{ display: 'none' }}
              loop
              playsInline
            />
          </div>

          <div style={{ padding: '8px 0' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', wordBreak: 'break-word' }}>
              {hasVideo ? ` ${videoTitle}` : ''}
            </h1>
          </div>
        </section>

        <aside className="sidebar">
          <div className="setting-group">
            <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={18} />
              Render Settings
            </h2>
          </div>

          <div className="setting-group">
            <div className="setting-label">
              <span>Resolution Density</span>
              <span className="setting-value">{options.width}x{options.height}</span>
            </div>
            <input
              type="range"
              min="10"
              max="240"
              value={options.width}
              onChange={(e) => {
                const newWidth = parseInt(e.target.value);
                if (videoRef.current) {
                  const video = videoRef.current;
                  const aspectRatio = video.videoWidth / video.videoHeight;
                  const charAspectRatio = 0.55;
                  const newHeight = Math.floor(newWidth / aspectRatio / charAspectRatio);
                  setOptions({
                    ...options,
                    width: newWidth,
                    height: newHeight
                  });
                }
              }}
            />
          </div>

          <div className="setting-group">
            <div className="setting-label">
              <span>Exposure</span>
              <span className="setting-value">{options.brightness}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={options.brightness}
              onChange={(e) => setOptions({ ...options, brightness: parseInt(e.target.value) })}
            />
          </div>

          <div className="setting-group">
            <div className="setting-label">
              <span>Clarity (Contrast)</span>
              <span className="setting-value">{options.contrast}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="400"
              value={options.contrast}
              onChange={(e) => setOptions({ ...options, contrast: parseInt(e.target.value) })}
            />
          </div>

          <div className="setting-group">
            <div className="setting-label">
              <span>Glyph Set</span>
            </div>
            <select
              className="glass-select"
              value={options.charSet}
              onChange={(e) => setOptions({ ...options, charSet: e.target.value })}
            >
              <option value={DEFAULT_CHAR_SET}>Standard</option>
              <option value={DETAILED_CHAR_SET}>Detailed</option>
              <option value="01">Binary</option>
              <option value="█ ">Pixel</option>
            </select>
          </div>

          <div style={{ marginTop: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Use higher Resolution Density for more detail, it will affect performance depending on your GPU.
              </p>
            </div>

            <a
              href="https://github.com/realSalman/ascii-tube-webapp"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <GithubIcon size={14} />
              Star on GitHub
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}
