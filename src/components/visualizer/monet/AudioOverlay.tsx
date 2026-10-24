import React, { useEffect, useRef } from 'react';
import type { AudioBands, MonetAudioStyle, Theme } from '../../../types';
import { colorWithAlpha } from '../colorMix';
import { createMonetSpectrumSampler, MONET_AUDIO_BAR_COUNT } from './monetSpectrumSampler';

// src/components/visualizer/monet/AudioOverlay.tsx
// Renders the bottom audio rail for Monet with a lightweight canvas loop in player mode and a static placeholder in preview mode.
interface AudioOverlayProps {
    audioPower: AudioBands['bass'];
    audioBands: AudioBands;
    theme: Theme;
    mode: MonetAudioStyle;
    staticMode?: boolean;
    isPreviewMode?: boolean;
}

const BAR_COUNT = MONET_AUDIO_BAR_COUNT;

const drawStaticBars = (context: CanvasRenderingContext2D, width: number, height: number, theme: Theme, mode: MonetAudioStyle) => {
    context.clearRect(0, 0, width, height);
    context.strokeStyle = colorWithAlpha(theme.primaryColor, 0.96);
    context.fillStyle = colorWithAlpha(theme.primaryColor, 0.9);
    context.lineWidth = 1.5;
    context.lineCap = 'round';

    if (mode === 'line') {
        const points: { x: number; y: number }[] = [];
        for (let index = 0; index < BAR_COUNT; index += 1) {
            const x = (index / (BAR_COUNT - 1)) * width;
            const spectrumIndex = index / (BAR_COUNT - 1);
            const envelope = Math.sin(spectrumIndex * Math.PI);
            const val = 0.12 + (Math.sin(index * 0.35) * 0.5 + 0.5) * 0.42;
            const y = height - (height * val * envelope);
            points.push({ x, y });
        }

        const drawCurve = (ctx: CanvasRenderingContext2D) => {
            if (points.length === 0) return;
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 0; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        };

        // Fill area under the curve
        context.beginPath();
        drawCurve(context);
        context.lineTo(width, height);
        context.lineTo(0, height);
        context.closePath();
        const fillGradient = context.createLinearGradient(0, 0, 0, height);
        fillGradient.addColorStop(0, colorWithAlpha(theme.primaryColor, 0.24));
        fillGradient.addColorStop(1, colorWithAlpha(theme.primaryColor, 0.0));
        context.fillStyle = fillGradient;
        context.fill();

        // Stroke curve
        context.beginPath();
        drawCurve(context);
        context.strokeStyle = colorWithAlpha(theme.primaryColor, 0.96);
        context.lineWidth = 2.0;
        context.stroke();
        return;
    }

    const gap = width / BAR_COUNT;
    for (let index = 0; index < BAR_COUNT; index += 1) {
        const spectrumIndex = index / (BAR_COUNT - 1);
        const envelope = Math.sin(spectrumIndex * Math.PI);
        const val = 0.12 + (Math.sin(index * 0.35) * 0.5 + 0.5) * 0.42;
        const barHeight = height * (0.02 + val * 0.8 * envelope);
        const x = index * gap + gap * 0.14;
        context.fillRect(x, height - barHeight, Math.max(1.35, gap * 0.34), barHeight);
    }
};

const AudioOverlay: React.FC<AudioOverlayProps> = ({
    audioPower,
    audioBands,
    theme,
    mode,
    staticMode = false,
    isPreviewMode = false,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        let frameId = 0;
        let canvasWidth = 0;
        let canvasHeight = 0;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
            const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
            canvasWidth = rect.width;
            canvasHeight = rect.height;
            if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
                canvas.width = nextWidth;
                canvas.height = nextHeight;
            }
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        // Both gradients depend only on the canvas size and the theme colour (fixed for this effect
        // run), so they are rebuilt when the size changes rather than on every frame.
        let gradientSize = '';
        let inkGradient: CanvasGradient | null = null;
        let areaGradient: CanvasGradient | null = null;
        const resolveGradients = (width: number, height: number) => {
            const size = `${width}x${height}`;
            if (size !== gradientSize || !inkGradient || !areaGradient) {
                gradientSize = size;
                const primaryInk = colorWithAlpha(theme.primaryColor, 0.94);
                const softInk = colorWithAlpha(theme.primaryColor, 0.72);
                inkGradient = context.createLinearGradient(0, 0, width, 0);
                inkGradient.addColorStop(0, softInk);
                inkGradient.addColorStop(0.5, primaryInk);
                inkGradient.addColorStop(1, softInk);
                areaGradient = context.createLinearGradient(0, 0, 0, height);
                areaGradient.addColorStop(0, colorWithAlpha(theme.primaryColor, 0.24));
                areaGradient.addColorStop(1, colorWithAlpha(theme.primaryColor, 0.0));
            }
            return { gradient: inkGradient, fillGradient: areaGradient };
        };

        const sampleSpectrum = createMonetSpectrumSampler();
        const points = Array.from({ length: BAR_COUNT }, () => ({ x: 0, y: 0 }));
        const bands = [0, 0, 0, 0, 0];

        const draw = (now: number) => {
            const width = canvasWidth;
            const height = canvasHeight;
            if (width <= 0 || height <= 0) {
                return;
            }

            context.clearRect(0, 0, width, height);
            bands[0] = audioBands.bass.get() / 255;
            bands[1] = audioBands.lowMid.get() / 255;
            bands[2] = audioBands.mid.get() / 255;
            bands[3] = audioBands.vocal.get() / 255;
            bands[4] = audioBands.treble.get() / 255;
            const sampled = sampleSpectrum(audioBands.spectrum?.get(), bands);
            const energy = Math.min(1, Math.max(0.08, audioPower.get() / 255));
            const { gradient, fillGradient } = resolveGradients(width, height);
            context.fillStyle = gradient;
            context.strokeStyle = gradient;
            context.lineWidth = 1.5;
            context.lineCap = 'round';

            if (mode === 'line') {
                for (let index = 0; index < BAR_COUNT; index += 1) {
                    const x = (index / (BAR_COUNT - 1)) * width;
                    const spectrumIndex = index / (BAR_COUNT - 1);
                    const band = sampled[index];
                    const wave =
                        Math.sin(index * 0.24 + now * 0.004) * 0.08 +
                        Math.sin(index * 0.68 + now * 0.0028) * 0.05;
                    
                    const envelope = Math.sin(spectrumIndex * Math.PI);
                    const amplitude = energy * 0.04 + band * 0.8 + wave * 0.04;
                    const y = height - Math.max(0, height * amplitude * envelope);
                    points[index].x = x;
                    points[index].y = y;
                }

                const drawCurve = (ctx: CanvasRenderingContext2D) => {
                    if (points.length === 0) return;
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 0; i < points.length - 1; i++) {
                        const xc = (points[i].x + points[i + 1].x) / 2;
                        const yc = (points[i].y + points[i + 1].y) / 2;
                        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
                    }
                    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
                };

                // Fill area under the curve
                context.beginPath();
                drawCurve(context);
                context.lineTo(width, height);
                context.lineTo(0, height);
                context.closePath();
                context.fillStyle = fillGradient;
                context.fill();

                // Stroke top curve
                context.beginPath();
                drawCurve(context);
                context.strokeStyle = gradient;
                context.lineWidth = 2.0;
                context.stroke();
            } else {
                const gap = width / BAR_COUNT;
                for (let index = 0; index < BAR_COUNT; index += 1) {
                    const spectrumIndex = index / (BAR_COUNT - 1);
                    const band = sampled[index];
                    const pulse = Math.sin(index * 0.45 + now * 0.006) * 0.5 + 0.5;
                    
                    const envelope = Math.sin(spectrumIndex * Math.PI);
                    const barHeight = height * (0.02 + (energy * 0.04 + band * 0.82 + pulse * 0.02) * envelope);
                    const x = index * gap + gap * 0.14;
                    context.fillRect(x, height - barHeight, Math.max(1.35, gap * 0.34), barHeight);
                }
            }
        };

        const isStatic = staticMode || isPreviewMode;
        const loop = (now: number) => {
            frameId = 0;
            draw(now);
            syncLoop();
        };
        // Only the drawing loop sleeps; playback and the shared audio graph keep running.
        const syncLoop = () => {
            const visible = document.visibilityState !== 'hidden' && canvasWidth > 0 && canvasHeight > 0;
            if (!visible || isStatic) {
                window.cancelAnimationFrame(frameId);
                frameId = 0;
            } else if (!frameId) {
                frameId = window.requestAnimationFrame(loop);
            }
        };
        const handleResize = () => {
            resizeCanvas();
            if (isStatic && canvasWidth > 0 && canvasHeight > 0) {
                drawStaticBars(context, canvasWidth, canvasHeight, theme, mode);
            }
            syncLoop();
        };
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(handleResize);
        observer?.observe(canvas);
        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', syncLoop);
        handleResize();
        return () => {
            window.cancelAnimationFrame(frameId);
            observer?.disconnect();
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', syncLoop);
        };

    }, [audioBands, audioPower, isPreviewMode, mode, staticMode, theme]);

    return <canvas ref={canvasRef} className="h-full w-full" />;
};

export default AudioOverlay;
