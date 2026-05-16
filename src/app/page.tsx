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
        <button
          className="action-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={18} />
          Upload Video
        </button>
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

          <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Use higher Resolution Density for more detail, it will affect performance depending on your GPU.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
