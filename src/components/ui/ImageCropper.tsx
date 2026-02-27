"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ImageCropperProps {
  /** Source image — File from input or blob URL */
  file: File;
  /** Called with the cropped image blob */
  onCrop: (croppedBlob: Blob) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Output size in px (default 400) */
  outputSize?: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.08;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ImageCropper({
  file,
  onCrop,
  onCancel,
  outputSize = 400,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Image transform state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState(320);

  // Pinch zoom state
  const lastPinchDist = useRef(0);

  /* -- Load image from File -- */
  useEffect(() => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      imgRef.current = img;
      // Initial zoom: fit image to canvas (cover the circle area)
      const circleR = canvasSize * 0.4; // circle radius = 40% of canvas
      const circleDiameter = circleR * 2;
      const scale = Math.max(circleDiameter / img.width, circleDiameter / img.height);
      setZoom(scale);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, canvasSize]);

  /* -- Responsive canvas size -- */
  useEffect(() => {
    const updateSize = () => {
      const w = Math.min(window.innerWidth - 48, 400);
      setCanvasSize(w);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  /* -- Draw -- */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const circleR = w * 0.4;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw image
    const imgW = img.width * zoom;
    const imgH = img.height * zoom;
    const imgX = cx - imgW / 2 + offset.x;
    const imgY = cy - imgH / 2 + offset.y;
    ctx.drawImage(img, imgX, imgY, imgW, imgH);

    // Dark overlay outside circle
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, w, h);

    // Cut out circle
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
    ctx.stroke();
  }, [zoom, offset]);

  useEffect(() => {
    if (imgLoaded) draw();
  }, [imgLoaded, draw]);

  /* -- Mouse drag -- */
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setDragging(false);

  /* -- Touch drag + pinch zoom -- */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragging) {
      setOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const scale = dist / lastPinchDist.current;
        setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * scale)));
      }
      lastPinchDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setDragging(false);
    lastPinchDist.current = 0;
  };

  /* -- Scroll zoom (native listener for passive: false) -- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta * z)));
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, []);

  /* -- Zoom slider -- */
  const handleZoomSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(e.target.value));
  };

  /* -- Crop & export -- */
  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = outputSize;
    offscreen.height = outputSize;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    // Calculate crop area
    const w = canvasSize;
    const cx = w / 2;
    const cy = w / 2;
    const circleR = w * 0.4;

    // Image position on the visible canvas
    const imgW = img.width * zoom;
    const imgH = img.height * zoom;
    const imgX = cx - imgW / 2 + offset.x;
    const imgY = cy - imgH / 2 + offset.y;

    // The crop square in canvas coords
    const cropX = cx - circleR;
    const cropY = cy - circleR;
    const cropSize = circleR * 2;

    // Map crop area back to source image coords
    const srcX = (cropX - imgX) / zoom;
    const srcY = (cropY - imgY) / zoom;
    const srcSize = cropSize / zoom;

    // Draw cropped region to output canvas
    ctx.drawImage(
      img,
      srcX,
      srcY,
      srcSize,
      srcSize,
      0,
      0,
      outputSize,
      outputSize
    );

    offscreen.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <div className="cropper-overlay" onClick={onCancel}>
      <div
        className="cropper-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cropper-header">
          <h3>Kadrowanie zdjecia</h3>
          <p>Przesun i przybliz zdjecie</p>
        </div>

        <div
          className="cropper-canvas-wrap"
          style={{ width: canvasSize, height: canvasSize }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: dragging ? "grabbing" : "grab",
              touchAction: "none",
              borderRadius: 8,
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="cropper-zoom-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <line x1="8" y1="11" x2="14" y2="11" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="range"
            className="cropper-zoom-slider"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={handleZoomSlider}
          />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Actions */}
        <div className="cropper-actions">
          <button
            type="button"
            className="cropper-btn cropper-btn--cancel"
            onClick={onCancel}
          >
            Anuluj
          </button>
          <button
            type="button"
            className="cropper-btn cropper-btn--save"
            onClick={handleCrop}
          >
            Zapisz zdjecie
          </button>
        </div>
      </div>
    </div>
  );
}
