import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Undo2, Volume2, Eye, EyeOff, Sparkles, CheckCircle2, Grid } from 'lucide-react';
import { CharacterItem } from '../types/japanese';
import { speakJapanese, playStrokeSound, playSuccessChime } from '../utils/audio';

interface WritingCanvasProps {
  item: CharacterItem;
  onMasteredStroke?: (accuracy: number) => void;
}

interface Stroke {
  points: { x: number; y: number }[];
}

export const WritingCanvas: React.FC<WritingCanvasProps> = ({ item, onMasteredStroke }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [guideMode, setGuideMode] = useState<'solid' | 'faint' | 'hidden'>('faint');
  const [showStrokeNumbers, setShowStrokeNumbers] = useState(true);
  const [isDemonstrating, setIsDemonstrating] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0); // 0 to 1
  const [demoStrokeIndex, setDemoStrokeIndex] = useState(0);
  const [evaluation, setEvaluation] = useState<{ score: number; message: string; pass: boolean } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const CANVAS_SIZE = 360;

  // Render everything to canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);

    // 1. Draw Kanji Practice Box Grid
    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'; // slate-400 with opacity
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);

      // Vertical center line
      ctx.beginPath();
      ctx.moveTo(CANVAS_SIZE / 2, 0);
      ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
      ctx.stroke();

      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_SIZE / 2);
      ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
      ctx.stroke();

      // Diagonals (traditional '米' shape)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE);
      ctx.moveTo(CANVAS_SIZE, 0);
      ctx.lineTo(0, CANVAS_SIZE);
      ctx.stroke();

      // Outer border
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, CANVAS_SIZE - 8, CANVAS_SIZE - 8);
      ctx.restore();
    }

    // 2. Draw Ghost Guide
    if (guideMode !== 'hidden' && !isDemonstrating) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${CANVAS_SIZE * 0.72}px 'Zen Maru Gothic', 'Noto Sans JP', sans-serif`;

      if (guideMode === 'solid') {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
      }
      ctx.fillText(item.character, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);
      ctx.restore();
    }

    // 3. Draw User Strokes
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38bdf8'; // sky-400 vibrant brush
    ctx.lineWidth = 12;

    const allStrokes = [...strokes];
    if (currentStroke.length > 0) {
      allStrokes.push({ points: currentStroke });
    }

    for (const stroke of allStrokes) {
      if (stroke.points.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const p1 = stroke.points[i - 1];
        const p2 = stroke.points[i];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      const lastPoint = stroke.points[stroke.points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Draw Stroke Order Numbers & Animation Demo
    if (showStrokeNumbers && item.strokes && item.strokes.length > 0 && !isDemonstrating) {
      ctx.save();
      item.strokes.forEach((s, idx) => {
        // Approximate start point from path
        const match = s.path.match(/M\s+([\d.]+)\s+([\d.]+)/);
        if (match) {
          const x = (parseFloat(match[1]) / 100) * CANVAS_SIZE;
          const y = (parseFloat(match[2]) / 100) * CANVAS_SIZE;

          // Number bubble
          ctx.beginPath();
          ctx.arc(x, y, 11, 0, Math.PI * 2);
          ctx.fillStyle = '#6366f1'; // indigo-500
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((idx + 1).toString(), x, y);
        }
      });
      ctx.restore();
    }
  }, [showGrid, guideMode, showStrokeNumbers, isDemonstrating, strokes, currentStroke, item]);

  // Canvas resize / DPI setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;
    redraw();
  }, [redraw]);

  // Redraw when dependencies change
  useEffect(() => {
    redraw();
  }, [redraw, strokes, currentStroke, showGrid, guideMode, isDemonstrating]);

  // Reset when character item changes
  useEffect(() => {
    setStrokes([]);
    setCurrentStroke([]);
    setEvaluation(null);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsDemonstrating(false);
  }, [item.id]);

  // Pointer & Touch coordinate helper
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDemonstrating) return;
    const point = getCanvasCoords(e);
    setIsDrawing(true);
    setCurrentStroke([point]);
    playStrokeSound();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || isDemonstrating) return;
    const point = getCanvasCoords(e);
    setCurrentStroke((prev) => [...prev, point]);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, { points: currentStroke }]);
    }
    setCurrentStroke([]);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setEvaluation(null);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, prev.length - 1));
    setEvaluation(null);
  };

  // Evaluate Accuracy
  const evaluateWriting = () => {
    if (strokes.length === 0) {
      setEvaluation({
        score: 0,
        message: 'Draw the character on the canvas first!',
        pass: false,
      });
      return;
    }

    const expectedStrokes = item.strokeCount;
    const strokeDiff = Math.abs(strokes.length - expectedStrokes);
    
    // Calculate drawn pixel coverage on offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = 100;
    offscreen.height = 100;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Draw reference
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 75px 'Zen Maru Gothic', 'Noto Sans JP', sans-serif`;
    ctx.fillText(item.character, 50, 55);
    const refImg = ctx.getImageData(0, 0, 100, 100).data;

    // Clear and draw user strokes
    ctx.clearRect(0, 0, 100, 100);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';

    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue;
      ctx.beginPath();
      const p0 = stroke.points[0];
      ctx.moveTo((p0.x / CANVAS_SIZE) * 100, (p0.y / CANVAS_SIZE) * 100);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo((p.x / CANVAS_SIZE) * 100, (p.y / CANVAS_SIZE) * 100);
      }
      ctx.stroke();
    }
    const userImg = ctx.getImageData(0, 0, 100, 100).data;

    let overlap = 0;
    let refCount = 0;
    let userCount = 0;

    for (let i = 3; i < refImg.length; i += 4) {
      const isRef = refImg[i] > 50;
      const isUser = userImg[i] > 50;
      if (isRef) refCount++;
      if (isUser) userCount++;
      if (isRef && isUser) overlap++;
    }

    const overlapRatio = refCount > 0 ? overlap / refCount : 0;
    const penalty = strokeDiff * 6;
    const baseScore = Math.min(100, Math.round(overlapRatio * 105) - penalty);
    const finalScore = Math.max(30, Math.min(99, baseScore + (strokeDiff === 0 ? 8 : 0)));

    const passed = finalScore >= 70 && strokeDiff <= 1;

    let message = 'Keep practicing stroke order and balance!';
    if (finalScore >= 90) {
      message = 'Sensational! Perfect stroke order and balance!';
    } else if (finalScore >= 80) {
      message = 'Great job! Very clean character formation!';
    } else if (passed) {
      message = 'Good effort! Recognizable with solid structure.';
    } else if (strokeDiff > 1) {
      message = `Stroke count mismatch: drawn ${strokes.length}, target ${expectedStrokes} strokes.`;
    }

    setEvaluation({
      score: finalScore,
      message,
      pass: passed,
    });

    if (passed) {
      playSuccessChime();
      if (onMasteredStroke) {
        onMasteredStroke(finalScore);
      }
    }
  };

  // Animated Stroke Order Demonstration
  const runDemoAnimation = () => {
    if (!item.strokes || item.strokes.length === 0) return;
    setIsDemonstrating(true);
    setStrokes([]);
    setEvaluation(null);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let strokeIdx = 0;
    let progress = 0;
    const dpr = window.devicePixelRatio || 1;

    const step = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // Redraw practice grid
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_SIZE / 2, 0);
      ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
      ctx.moveTo(0, CANVAS_SIZE / 2);
      ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
      ctx.stroke();
      ctx.restore();

      // Render completed strokes
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#818cf8'; // indigo-400
      ctx.lineWidth = 12;

      for (let i = 0; i < strokeIdx; i++) {
        const s = item.strokes![i];
        const p2d = new Path2D();
        const scaledPath = scaleSvgPath(s.path, CANVAS_SIZE);
        const pathObj = new Path2D(scaledPath);
        ctx.stroke(pathObj);
      }

      // Render active animated stroke
      if (strokeIdx < item.strokes!.length) {
        const currentStrokeData = item.strokes![strokeIdx];
        const scaledPath = scaleSvgPath(currentStrokeData.path, CANVAS_SIZE);
        const activePath = new Path2D(scaledPath);

        ctx.strokeStyle = '#ec4899'; // pink-500 for active brush
        ctx.lineWidth = 14;
        ctx.setLineDash([progress * 250, 500]);
        ctx.stroke(activePath);
      }
      ctx.restore();

      progress += 0.045;
      if (progress >= 1.0) {
        progress = 0;
        strokeIdx++;
        playStrokeSound();
      }

      if (strokeIdx < item.strokes!.length) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setIsDemonstrating(false);
        playSuccessChime();
        redraw();
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  // Helper to scale SVG path from 100x100 to canvas size
  function scaleSvgPath(pathStr: string, size: number): string {
    const scale = size / 100;
    return pathStr.replace(/([0-9.]+)/g, (match) => {
      const val = parseFloat(match);
      return (val * scale).toFixed(1);
    });
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Top Character Title & Controls */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-extrabold text-indigo-400 font-['Zen_Maru_Gothic']">
            {item.character}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">{item.romaji}</div>
            <div className="text-xs text-slate-400 capitalize">{item.meaning}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => speakJapanese(item.character)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Listen Pronunciation"
            aria-label="Listen Pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setGuideMode((prev) => (prev === 'faint' ? 'solid' : prev === 'solid' ? 'hidden' : 'faint'))
            }
            className={`p-2 rounded-xl transition ${
              guideMode !== 'hidden'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
            title={`Guide Mode: ${guideMode}`}
            aria-label="Toggle Guide Mode"
          >
            {guideMode === 'hidden' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`p-2 rounded-xl transition ${
              showGrid ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle Grid Lines"
            aria-label="Toggle Grid Lines"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={runDemoAnimation}
            disabled={isDemonstrating}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-semibold hover:brightness-110 transition disabled:opacity-50"
            title="Watch stroke order demonstration"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Demo</span>
          </button>
        </div>
      </div>

      {/* Canvas Drawing Surface */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950/80 shadow-2xl touch-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="cursor-crosshair touch-none select-none block"
          style={{ width: `${CANVAS_SIZE}px`, height: `${CANVAS_SIZE}px` }}
        />

        {/* Floating stroke counter badge */}
        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700 text-xs font-medium text-slate-300">
          Strokes: <span className="font-bold text-indigo-400">{strokes.length}</span> / {item.strokeCount}
        </div>
      </div>

      {/* Drawing Actions & Evaluation Bar */}
      <div className="flex items-center justify-between w-full mt-3 px-2 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0 || isDemonstrating}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition disabled:opacity-40"
            title="Undo last stroke"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            onClick={handleClear}
            disabled={strokes.length === 0 || isDemonstrating}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition disabled:opacity-40"
            title="Clear canvas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        <button
          onClick={evaluateWriting}
          disabled={strokes.length === 0 || isDemonstrating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition disabled:opacity-40"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Check Accuracy</span>
        </button>
      </div>

      {/* Feedback banner */}
      {evaluation && (
        <div
          className={`w-full mt-3 p-3 rounded-xl border flex items-start gap-3 transition-all ${
            evaluation.pass
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/60 border-amber-500/50 text-amber-200'
          }`}
        >
          <CheckCircle2
            className={`w-5 h-5 shrink-0 mt-0.5 ${evaluation.pass ? 'text-emerald-400' : 'text-amber-400'}`}
          />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              {evaluation.pass ? 'Stroke Passed!' : 'Needs Practice'} • Score: {evaluation.score}%
            </div>
            <div className="text-xs mt-0.5 text-slate-300">{evaluation.message}</div>
          </div>
        </div>
      )}

      {/* Mnemonic Hint */}
      {item.mnemonic && (
        <div className="w-full mt-3 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">💡 Mnemonic: </span>
          {item.mnemonic}
        </div>
      )}
    </div>
  );
};
