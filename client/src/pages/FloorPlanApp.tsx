/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Trash2, Eye, EyeOff, Download,
  Image as ImageIcon, Circle, Palette, FileText, RotateCw, Undo2, RefreshCw,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ===== 型定義 =====
type PaperSizeKey = 'a4-landscape' | 'a4-portrait';

interface PaperSize {
  name: string;
  width: number;
  height: number;
}

interface LabelColor {
  fill: string;
  border: string;
}

interface LabelShape {
  id: string;
  type: 'label';
  x: number;
  y: number;
  rotation: number;
  text: string;
  width: number;
  height: number;
  fillColor: string;
  borderColor: string;
  prefix: string;
}

interface ArrowShape {
  id: string;
  type: 'arrow';
  x: number;
  y: number;
  rotation: number;
  text: string;
  size: number;
}

interface ColorShape {
  id: string;
  type: 'color';
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  opacity: number;
}

interface CircleShape {
  id: string;
  type: 'circle';
  x: number;
  y: number;
  rotation: number;
  text: string;
  color: string;
  size: number;
}

interface BoxShape {
  id: string;
  type: 'box';
  x: number;
  y: number;
  rotation: number;
  text: string;
  width: number;
  height: number;
  borderStyle: 'none' | 'thin' | 'thick';
}

interface LineShape {
  id: string;
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight: 'thin' | 'thick';
  rotation?: number;
}

type Shape = LabelShape | ArrowShape | ColorShape | CircleShape | BoxShape | LineShape;

interface BgImage {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  offsetX?: number; // 位置調整X
  offsetY?: number; // 位置調整Y
}

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
  startShape: Shape;
  moved: boolean;
}

interface ResizeState {
  id: string;
  handle: string;
  startX: number;
  startY: number;
  startShape: Shape;
  moved: boolean;
}

interface LinePreview {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface BoxPreview {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  borderStyle: 'none' | 'thin' | 'thick';
}

// ===== メインコンポーネント =====
export default function FloorPlanApp() {
  const canvasRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const PAPER_SIZES: Record<PaperSizeKey, PaperSize> = {
    'a4-landscape': { name: 'A4 横', width: 1400, height: 990 },
    'a4-portrait':  { name: 'A4 縦', width: 990,  height: 1400 },
  };
  const [paperSize, setPaperSize] = useState<PaperSizeKey>('a4-landscape');
  const canvasSize = PAPER_SIZES[paperSize];

  const [gridSize, setGridSize] = useState(25);
  const [showGrid, setShowGrid] = useState(true);
  const [showBgImage, setShowBgImage] = useState(true); // 背景画像のON/OFF
  const [bgImage, setBgImage] = useState<BgImage | null>(null);
  const [bgOpacity, setBgOpacity] = useState(1.0);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // 背景画像の位置調整
  const [bgOffsetX, setBgOffsetX] = useState(0);
  const [bgOffsetY, setBgOffsetY] = useState(0);
  // 背景画像のドラッグ位置調整状態
  const [bgDragging, setBgDragging] = useState(false);
  const [bgDragStart, setBgDragStart] = useState<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  // PDF関連状態
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [showPdfPageSelector, setShowPdfPageSelector] = useState(false);

  // ラベルのパレット内90度回転トグル
  const [labelRotated, setLabelRotated] = useState<Record<string, boolean>>({}); // prefix -> 回転中か

  // トリミング機能
  const [trimMode, setTrimMode] = useState(false);
  const [trimStart, setTrimStart] = useState<{ x: number; y: number } | null>(null);
  const [trimRect, setTrimRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // exportPNG内で最新値を参照するためのref（useEffectではなく直接更新）
  const bgImageRef = useRef<BgImage | null>(null);
  const bgOpacityRef = useRef<number>(1.0);
  // setBgImageとbgImageRefを同時に更新するラッパー
  const updateBgImage = (img: BgImage | null) => {
    bgImageRef.current = img;
    setBgImage(img);
    if (!img) { setBgOffsetX(0); setBgOffsetY(0); }
  };
  const updateBgOpacity = (opacity: number) => {
    bgOpacityRef.current = opacity;
    setBgOpacity(opacity);
  };

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Shape[][]>([]);

  const [dragging, setDragging] = useState<DragState | null>(null);
  const [resizing, setResizing] = useState<ResizeState | null>(null);

  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);

  const [labelPrefixes, setLabelPrefixes] = useState<string[]>(['A', 'B', 'C']);
  const [labelCounters, setLabelCounters] = useState<Record<string, number>>({ A: 0, B: 0, C: 0 });
  const [labelLastSize, setLabelLastSize] = useState<Record<string, { width: number; height: number }>>({});
  const [labelCustomColors, setLabelCustomColors] = useState<Record<string, LabelColor>>({});
  const [arrowCounter, setArrowCounter] = useState(0);
  const [colorPickerPrefix, setColorPickerPrefix] = useState<string | null>(null);

  const LABEL_COLOR_PALETTE: LabelColor[] = [
    { fill: '#e8b4a0', border: '#a85a3e' },
    { fill: '#e8c2c2', border: '#a85a5a' },
    { fill: '#e8d4a0', border: '#a8843e' },
    { fill: '#bcd4a8', border: '#5e8240' },
    { fill: '#a8c4d4', border: '#3e6e84' },
    { fill: '#c8b4d4', border: '#6e4e84' },
    { fill: '#d4c0a8', border: '#7e6240' },
    { fill: '#a8d4c8', border: '#3e8474' },
    { fill: '#d4a8c4', border: '#84407a' },
    { fill: '#c0c0d4', border: '#5e5e84' },
    { fill: '#d4d0a8', border: '#7e7a40' },
    { fill: '#a8b4c0', border: '#3e5060' },
  ];

  const getLabelColor = (prefix: string): LabelColor => {
    if (labelCustomColors[prefix]) return labelCustomColors[prefix];
    const idx = labelPrefixes.indexOf(prefix);
    if (idx === -1) return { fill: '#ffffff', border: '#1f2937' };
    return LABEL_COLOR_PALETTE[idx % LABEL_COLOR_PALETTE.length];
  };

  const setLabelColor = (prefix: string, fill: string, border: string) => {
    setLabelCustomColors((prev) => ({ ...prev, [prefix]: { fill, border } }));
    pushHistory(shapes.map((s) =>
      s.type === 'label' && (s as LabelShape).prefix === prefix
        ? { ...s, fillColor: fill, borderColor: border } as Shape
        : s
    ));
  };

  const resetLabelColor = (prefix: string) => {
    setLabelCustomColors((prev) => {
      const next = { ...prev };
      delete next[prefix];
      return next;
    });
    const idx = labelPrefixes.indexOf(prefix);
    const def = LABEL_COLOR_PALETTE[idx % LABEL_COLOR_PALETTE.length];
    pushHistory(shapes.map((s) =>
      s.type === 'label' && (s as LabelShape).prefix === prefix
        ? { ...s, fillColor: def.fill, borderColor: def.border } as Shape
        : s
    ));
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const pushHistory = useCallback((newShapes: Shape[]) => {
    setHistory((h) => [...h.slice(-30), shapes]);
    setShapes(newShapes);
  }, [shapes]);

  const [paperFitScale, setPaperFitScale] = useState(1);
  useEffect(() => {
    const updateFit = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const availW = Math.max(200, rect.width - 64);
      const availH = Math.max(200, rect.height - 64);
      const scale = Math.min(availW / canvasSize.width, availH / canvasSize.height);
      setPaperFitScale(scale);
    };
    updateFit();
    const ro = new ResizeObserver(updateFit);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateFit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateFit);
    };
  }, [paperSize, canvasSize.width, canvasSize.height]);

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setShapes(prev);
    setHistory((h) => h.slice(0, -1));
    setSelectedId(null);
  };

  const snapCenterByEdge = (cx: number, cy: number, w: number, h: number) => {
    if (!snapToGrid) return { x: cx, y: cy };
    const left = Math.round((cx - w / 2) / gridSize) * gridSize;
    const top  = Math.round((cy - h / 2) / gridSize) * gridSize;
    return { x: left + w / 2, y: top + h / 2 };
  };

  const newId = () => `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const addLabel = (prefix = 'A') => {
    const next = (labelCounters[prefix] || 0) + 1;
    setLabelCounters({ ...labelCounters, [prefix]: next });
    const colors = getLabelColor(prefix);
    const lastSize = labelLastSize[prefix];
    const w = lastSize?.width ?? 56;
    const h = lastSize?.height ?? 32;
    const pos = snapCenterByEdge(canvasSize.width / 2, canvasSize.height / 2, w, h);
    pushHistory([...shapes, {
      id: newId(), type: 'label', x: pos.x, y: pos.y,
      text: `${prefix}-${next}`, width: w, height: h, rotation: 0,
      fillColor: colors.fill, borderColor: colors.border, prefix,
    } as LabelShape]);
  };

  const addLabelPrefix = () => {
    const used = new Set(labelPrefixes);
    let next: string | null = null;
    for (let i = 0; i < 26; i++) {
      const c = String.fromCharCode(65 + i);
      if (!used.has(c)) { next = c; break; }
    }
    if (!next) return;
    setLabelPrefixes([...labelPrefixes, next]);
    setLabelCounters({ ...labelCounters, [next]: 0 });
  };

  const addArrow = () => {
    const next = arrowCounter + 1;
    setArrowCounter(next);
    const arrowW = 44 * 1.4, arrowH = 44 * 1.1;
    const pos = snapCenterByEdge(canvasSize.width / 2, canvasSize.height / 2, arrowW, arrowH);
    pushHistory([...shapes, {
      id: newId(), type: 'arrow', x: pos.x, y: pos.y,
      text: String(next), rotation: 0, size: 44,
    } as ArrowShape]);
  };

  const addColorIcon = (color: string) => {
    // デフォルトサイズ = グリッドサイズ（1×1グリッド）
    const defaultSize = gridSize;
    const pos = snapCenterByEdge(canvasSize.width / 2, canvasSize.height / 2, defaultSize, defaultSize);
    pushHistory([...shapes, {
      id: newId(), type: 'color', x: pos.x, y: pos.y,
      color, size: defaultSize, opacity: 0.5, rotation: 0,
    } as ColorShape]);
  };

  const addCircleIcon = () => {
    const pos = snapCenterByEdge(canvasSize.width / 2, canvasSize.height / 2, 30, 30);
    pushHistory([...shapes, {
      id: newId(), type: 'circle', x: pos.x, y: pos.y,
      text: 'H', color: '#fde047', size: 30, rotation: 0,
    } as CircleShape]);
  };

  const addBoxFromDrag = (x1: number, y1: number, x2: number, y2: number, borderStyle: 'none' | 'thin' | 'thick') => {
    const sx1 = snapToGrid ? Math.round(x1 / gridSize) * gridSize : x1;
    const sy1 = snapToGrid ? Math.round(y1 / gridSize) * gridSize : y1;
    const sx2 = snapToGrid ? Math.round(x2 / gridSize) * gridSize : x2;
    const sy2 = snapToGrid ? Math.round(y2 / gridSize) * gridSize : y2;
    const minW = snapToGrid ? gridSize : 4;
    const minH = snapToGrid ? gridSize : 4;
    const w = Math.max(minW, Math.abs(sx2 - sx1));
    const h = Math.max(minH, Math.abs(sy2 - sy1));
    const cx = (Math.min(sx1, sx2) + Math.max(sx1, sx2)) / 2;
    const cy = (Math.min(sy1, sy2) + Math.max(sy1, sy2)) / 2;
    pushHistory([...shapes, {
      id: newId(), type: 'box', x: cx, y: cy,
      width: w, height: h, text: '', borderStyle, rotation: 0,
    } as BoxShape]);
  };

  const [drawingTool, setDrawingTool] = useState<string | null>(null);
  const [linePreview, setLinePreview] = useState<LinePreview | null>(null);
  const [boxPreview, setBoxPreview] = useState<BoxPreview | null>(null);
  const [boxDragStart, setBoxDragStart] = useState<{ x: number; y: number } | null>(null);

  const startLineDrawing = (weight: string) => {
    setDrawingTool(weight === 'thin' ? 'line-thin' : 'line-thick');
    setLinePreview(null);
    setBoxPreview(null);
    setBoxDragStart(null);
    setSelectedId(null);
  };

  const startBoxDrawing = (borderStyle: 'none' | 'thin' | 'thick') => {
    setDrawingTool(`box-${borderStyle}`);
    setLinePreview(null);
    setBoxPreview(null);
    setBoxDragStart(null);
    setSelectedId(null);
  };

  const cancelDrawing = () => {
    setDrawingTool(null);
    setLinePreview(null);
    setBoxPreview(null);
    setBoxDragStart(null);
  };

  const rotateSelected = (deltaDegree = 30) => {
    if (!selectedId) return;
    pushHistory(shapes.map((s) => {
      if (s.id !== selectedId) return s;
      const rot = (s as any).rotation || 0;
      return { ...s, rotation: (rot + deltaDegree) % 360 } as Shape;
    }));
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    const s = shapes.find((s) => s.id === selectedId);
    if (!s) return;
    const ns = { ...s, id: newId() } as any;
    if (ns.x !== undefined) ns.x += 20;
    if (ns.y !== undefined) ns.y += 20;
    pushHistory([...shapes, ns as Shape]);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    pushHistory(shapes.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  };

  const clearAll = () => {
    if (shapes.length === 0) return;
    if (!window.confirm('全ての図形を削除しますか？')) return;
    pushHistory([]);
    setSelectedId(null);
  };

  // PDFページをCanvasにレンダリングして背景画像としてセット
  const renderPdfPage = async (doc: any, pageNum: number) => {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // 高解像度でレンダリング
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/png');
    updateBgImage({ src: dataUrl, naturalWidth: canvas.width, naturalHeight: canvas.height });
    setBgOffsetX(0);
    setBgOffsetY(0);
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      // PDF処理
      const arrayBuffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
      setPdfPages(doc.numPages);
      setPdfCurrentPage(1);
      if (doc.numPages > 1) {
        setShowPdfPageSelector(true);
      } else {
        await renderPdfPage(doc, 1);
      }
    } else {
      // 画像処理（従来通り）
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          updateBgImage({ src: ev.target?.result as string, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
          setBgOffsetX(0);
          setBgOffsetY(0);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // トリミング実行
  const executeTrim = async () => {
    if (!bgImage || !trimRect) return;
    const { x: tx, y: ty, w: tw, h: th } = trimRect;
    if (tw < 4 || th < 4) { setTrimMode(false); setTrimRect(null); setTrimStart(null); return; }

    // 現在の表示位置から画像内の座標に変換
    const ratio = Math.min(canvasSize.width / bgImage.naturalWidth, canvasSize.height / bgImage.naturalHeight);
    const imgW = bgImage.naturalWidth * ratio;
    const imgH = bgImage.naturalHeight * ratio;
    const baseX = (canvasSize.width - imgW) / 2 + bgOffsetX;
    const baseY = (canvasSize.height - imgH) / 2 + bgOffsetY;

    // トリミング矩形を画像内座標に変換
    const cropX = (tx - baseX) / ratio;
    const cropY = (ty - baseY) / ratio;
    const cropW = tw / ratio;
    const cropH = th / ratio;

    // Canvasで切り抴き
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = bgImage.naturalWidth;
    srcCanvas.height = bgImage.naturalHeight;
    const srcCtx = srcCanvas.getContext('2d')!;
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => { srcCtx.drawImage(img, 0, 0); resolve(); };
      img.src = bgImage.src;
    });

    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = Math.max(1, Math.round(cropW));
    dstCanvas.height = Math.max(1, Math.round(cropH));
    const dstCtx = dstCanvas.getContext('2d')!;
    dstCtx.drawImage(srcCanvas, Math.round(cropX), Math.round(cropY), Math.round(cropW), Math.round(cropH), 0, 0, dstCanvas.width, dstCanvas.height);

    const dataUrl = dstCanvas.toDataURL('image/png');
    updateBgImage({ src: dataUrl, naturalWidth: dstCanvas.width, naturalHeight: dstCanvas.height });
    setBgOffsetX(0);
    setBgOffsetY(0);
    setTrimMode(false);
    setTrimRect(null);
    setTrimStart(null);
  };

  // 番号リセット（各系統独立）
  const resetLabelCounter = (prefix: string) => {
    setLabelCounters((prev) => ({ ...prev, [prefix]: 0 }));
  };

  // addLabelの90度回転対応版
  const addLabelWithRotation = (prefix = 'A') => {
    const next = (labelCounters[prefix] || 0) + 1;
    setLabelCounters({ ...labelCounters, [prefix]: next });
    const colors = getLabelColor(prefix);
    const lastSize = labelLastSize[prefix];
    const isRotated = !!labelRotated[prefix];
    // 回転時は宽高を入れ替え
    const baseW = lastSize?.width ?? 56;
    const baseH = lastSize?.height ?? 32;
    const w = isRotated ? baseH : baseW;
    const h = isRotated ? baseW : baseH;
    const pos = snapCenterByEdge(canvasSize.width / 2, canvasSize.height / 2, w, h);
    pushHistory([...shapes, {
      id: newId(), type: 'label', x: pos.x, y: pos.y,
      text: `${prefix}-${next}`, width: w, height: h,
      rotation: isRotated ? 90 : 0,
      fillColor: colors.fill, borderColor: colors.border, prefix,
    } as LabelShape]);
  };

  const getCanvasCoords = (e: React.MouseEvent) => {
    const svg = canvasRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 4.0;

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) < 50) {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left - rect.width / 2;
      const my = e.clientY - rect.top - rect.height / 2;
      const delta = -e.deltaY * 0.002;
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * (1 + delta)));
      const ratio = newZoom / zoom;
      setPan({ x: mx - (mx - pan.x) * ratio, y: my - (my - pan.y) * ratio });
      setZoom(newZoom);
    }
  };

  const zoomIn = () => {
    const newZoom = Math.min(ZOOM_MAX, zoom * 1.2);
    const ratio = newZoom / zoom;
    setPan({ x: pan.x * ratio, y: pan.y * ratio });
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(ZOOM_MIN, zoom / 1.2);
    const ratio = newZoom / zoom;
    setPan({ x: pan.x * ratio, y: pan.y * ratio });
    setZoom(newZoom);
  };

  const resetZoom = () => { setZoom(1.0); setPan({ x: 0, y: 0 }); };

  const handleChangePaperSize = (newSize: PaperSizeKey) => {
    if (newSize === paperSize) return;
    const newCanvas = PAPER_SIZES[newSize];
    const wouldOverflow = shapes.some((s) => {
      const w = getShapeWidth(s), h = getShapeHeight(s);
      const sx = (s as any).x ?? 0, sy = (s as any).y ?? 0;
      return sx - w/2 < 0 || sx + w/2 > newCanvas.width || sy - h/2 < 0 || sy + h/2 > newCanvas.height;
    });
    if (wouldOverflow) {
      if (!window.confirm('一部の図形が用紙からはみ出します。続行しますか？\n（はみ出した図形は用紙内に自動移動されます）')) return;
      setShapes((prev) => prev.map((s) => {
        const w = getShapeWidth(s), h = getShapeHeight(s);
        const sx = (s as any).x ?? 0, sy = (s as any).y ?? 0;
        let nx = sx, ny = sy;
        if (nx - w/2 < 0) nx = w/2;
        if (nx + w/2 > newCanvas.width) nx = newCanvas.width - w/2;
        if (ny - h/2 < 0) ny = h/2;
        if (ny + h/2 > newCanvas.height) ny = newCanvas.height - h/2;
        return { ...s, x: nx, y: ny } as Shape;
      }));
    }
    setPaperSize(newSize);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleShapeMouseDown = (e: React.MouseEvent, shape: Shape) => {
    if (spacePressed || drawingTool) return;
    e.stopPropagation();
    setSelectedId(shape.id);
    const { x, y } = getCanvasCoords(e);
    if (shape.type === 'line') {
      const ls = shape as LineShape;
      const mx = (ls.x1 + ls.x2) / 2, my = (ls.y1 + ls.y2) / 2;
      setDragging({ id: shape.id, offsetX: x - mx, offsetY: y - my, startShape: { ...shape }, moved: false });
    } else {
      const bs = shape as any;
      setDragging({ id: shape.id, offsetX: x - bs.x, offsetY: y - bs.y, startShape: { ...shape }, moved: false });
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (spacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const getShapeWidth = (s: Shape): number => {
    if (s.type === 'label') return (s as LabelShape).width;
    if (s.type === 'box') return (s as BoxShape).width;
    if (s.type === 'arrow') return (s as ArrowShape).size * 1.4;
    if (s.type === 'color') return (s as ColorShape).size;
    if (s.type === 'circle') return (s as CircleShape).size;
    if (s.type === 'line') { const ls = s as LineShape; return Math.max(2, Math.abs(ls.x2 - ls.x1)); }
    return 32;
  };

  const getShapeHeight = (s: Shape): number => {
    if (s.type === 'label') return (s as LabelShape).height;
    if (s.type === 'box') return (s as BoxShape).height;
    if (s.type === 'arrow') return (s as ArrowShape).size * 1.1;
    if (s.type === 'color') return (s as ColorShape).size;
    if (s.type === 'circle') return (s as CircleShape).size;
    if (s.type === 'line') { const ls = s as LineShape; return Math.max(2, Math.abs(ls.y2 - ls.y1)); }
    return 32;
  };

  const applyResize = (s: Shape, cx: number, cy: number, w: number, h: number): Shape => {
    const updated: any = { ...s, x: cx, y: cy };
    if (s.type === 'label' || s.type === 'box') { updated.width = w; updated.height = h; }
    else if (s.type === 'arrow') updated.size = Math.min(w / 1.4, h / 1.1);
    else if (s.type === 'color' || s.type === 'circle') updated.size = Math.min(w, h);
    return updated as Shape;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 背景画像ドラッグ
    if (bgDragging && bgDragStart) {
      const svg = canvasRef.current;
      if (svg) {
        const rect = svg.getBoundingClientRect();
        const scaleX = canvasSize.width / rect.width;
        const scaleY = canvasSize.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        setBgOffsetX(bgDragStart.ox + (mx - bgDragStart.mx));
        setBgOffsetY(bgDragStart.oy + (my - bgDragStart.my));
      }
      return;
    }
    if (isPanning && panStart) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (resizing) {
      const { x, y } = getCanvasCoords(e);
      const dx = x - resizing.startX, dy = y - resizing.startY;
      const ss = resizing.startShape, handle = resizing.handle;
      const MIN_SIZE = 12;
      if (ss.type === 'line' && (handle === 'p1' || handle === 'p2')) {
        const ls = ss as LineShape;
        const snapEdge = (v: number) => snapToGrid ? Math.round(v / gridSize) * gridSize : v;
        const newX = snapEdge((handle === 'p1' ? ls.x1 : ls.x2) + dx);
        const newY = snapEdge((handle === 'p1' ? ls.y1 : ls.y2) + dy);
        setShapes((prev) => prev.map((s) => {
          if (s.id !== resizing.id) return s;
          return handle === 'p1' ? { ...s, x1: newX, y1: newY } as Shape : { ...s, x2: newX, y2: newY } as Shape;
        }));
        setResizing({ ...resizing, moved: true });
        return;
      }
      const sw = getShapeWidth(ss), sh = getShapeHeight(ss);
      const bss = ss as any;
      let x1 = bss.x - sw/2, y1 = bss.y - sh/2, x2 = bss.x + sw/2, y2 = bss.y + sh/2;
      const snapEdge = (v: number) => snapToGrid ? Math.round(v / gridSize) * gridSize : v;
      if (handle.includes('w')) x1 = snapEdge(x1 + dx);
      if (handle.includes('e')) x2 = snapEdge(x2 + dx);
      if (handle.includes('n')) y1 = snapEdge(y1 + dy);
      if (handle.includes('s')) y2 = snapEdge(y2 + dy);
      const minW = snapToGrid ? Math.max(MIN_SIZE, gridSize) : MIN_SIZE;
      const minH = snapToGrid ? Math.max(MIN_SIZE, gridSize) : MIN_SIZE;
      if (x2 - x1 < minW) { if (handle.includes('w')) x1 = x2 - minW; else x2 = x1 + minW; }
      if (y2 - y1 < minH) { if (handle.includes('n')) y1 = y2 - minH; else y2 = y1 + minH; }
      setShapes((prev) => prev.map((s) => s.id === resizing.id ? applyResize(s, (x1+x2)/2, (y1+y2)/2, x2-x1, y2-y1) : s));
      setResizing({ ...resizing, moved: true });
      return;
    }
    if (!dragging) return;
    const { x, y } = getCanvasCoords(e);
    const targetCx = x - dragging.offsetX, targetCy = y - dragging.offsetY;
    const refShape = dragging.startShape || shapes.find((s) => s.id === dragging.id);
    if (!refShape) return;
    if (refShape.type === 'line') {
      const ss = dragging.startShape as LineShape;
      const oldMx = (ss.x1 + ss.x2) / 2, oldMy = (ss.y1 + ss.y2) / 2;
      let newMx = targetCx, newMy = targetCy;
      if (snapToGrid) { newMx = Math.round(newMx / gridSize) * gridSize; newMy = Math.round(newMy / gridSize) * gridSize; }
      const dx = newMx - oldMx, dy = newMy - oldMy;
      setShapes((prev) => prev.map((s) => s.id === dragging.id ? { ...s, x1: ss.x1+dx, y1: ss.y1+dy, x2: ss.x2+dx, y2: ss.y2+dy } as Shape : s));
      setDragging({ ...dragging, moved: true });
      return;
    }
    const pos = snapCenterByEdge(targetCx, targetCy, getShapeWidth(refShape), getShapeHeight(refShape));
    setShapes((prev) => prev.map((s) => s.id === dragging.id ? { ...s, x: pos.x, y: pos.y } as Shape : s));
    setDragging({ ...dragging, moved: true });
  };

  const handleMouseUp = () => {
    if (bgDragging) { setBgDragging(false); setBgDragStart(null); }
    if (isPanning) { setIsPanning(false); setPanStart(null); }
    if (dragging?.moved) setHistory((h) => [...h.slice(-30), shapes]);
    if (resizing?.moved) {
      setHistory((h) => [...h.slice(-30), shapes]);
      const resizedShape = shapes.find((s) => s.id === resizing.id);
      if (resizedShape?.type === 'label') {
        const ls = resizedShape as LabelShape;
        setLabelLastSize((prev) => ({ ...prev, [ls.prefix]: { width: ls.width, height: ls.height } }));
      }
    }
    setDragging(null);
    setResizing(null);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, shape: Shape, handle: string) => {
    e.stopPropagation(); e.preventDefault();
    setSelectedId(shape.id);
    const { x, y } = getCanvasCoords(e);
    setResizing({ id: shape.id, handle, startX: x, startY: y, startShape: { ...shape }, moved: false });
  };

  const handleLineEndpointMouseDown = (e: React.MouseEvent, shape: Shape, endpoint: string) => {
    e.stopPropagation(); e.preventDefault();
    setSelectedId(shape.id);
    const { x, y } = getCanvasCoords(e);
    setResizing({ id: shape.id, handle: endpoint, startX: x, startY: y, startShape: { ...shape }, moved: false });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // トリミングモード
    if (trimMode) {
      e.stopPropagation();
      const { x, y } = getCanvasCoords(e);
      setTrimStart({ x, y });
      setTrimRect({ x, y, w: 0, h: 0 });
      return;
    }
    // 長方形ドラッグ描画の開始
    if (drawingTool && drawingTool.startsWith('box-')) {
      e.stopPropagation();
      const { x, y } = getCanvasCoords(e);
      const sx = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
      const sy = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
      setBoxDragStart({ x: sx, y: sy });
      const borderStyle = drawingTool.replace('box-', '') as 'none' | 'thin' | 'thick';
      setBoxPreview({ x1: sx, y1: sy, x2: sx, y2: sy, borderStyle });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (drawingTool === 'line-thin' || drawingTool === 'line-thick') {
      const { x, y } = getCanvasCoords(e);
      const sx = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
      const sy = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
      if (!linePreview) {
        setLinePreview({ x1: sx, y1: sy, x2: sx, y2: sy });
      } else {
        const weight: 'thin' | 'thick' = drawingTool === 'line-thick' ? 'thick' : 'thin';
        pushHistory([...shapes, { id: newId(), type: 'line', x1: linePreview.x1, y1: linePreview.y1, x2: sx, y2: sy, weight } as LineShape]);
        setLinePreview(null);
      }
      return;
    }
    // 長方形モードではclickは使わない（mousedown/upで処理）
    if (drawingTool && drawingTool.startsWith('box-')) return;
    const target = e.target as SVGElement;
    if (target === canvasRef.current || target.tagName === 'image' || (target.tagName === 'rect' && target.classList.contains('bg-rect'))) {
      setSelectedId(null);
    }
  };

  const handleCanvasMouseMoveForLine = (e: React.MouseEvent) => {
    // トリミングプレビュー
    if (trimMode && trimStart) {
      const { x, y } = getCanvasCoords(e);
      setTrimRect({
        x: Math.min(trimStart.x, x),
        y: Math.min(trimStart.y, y),
        w: Math.abs(x - trimStart.x),
        h: Math.abs(y - trimStart.y),
      });
    }
    if ((drawingTool === 'line-thin' || drawingTool === 'line-thick') && linePreview) {
      const { x, y } = getCanvasCoords(e);
      const sx = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
      const sy = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
      setLinePreview((prev) => prev ? { ...prev, x2: sx, y2: sy } : null);
    }
    // 長方形プレビュー更新
    if (drawingTool && drawingTool.startsWith('box-') && boxDragStart) {
      const { x, y } = getCanvasCoords(e);
      const sx = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
      const sy = snapToGrid ? Math.round(y / gridSize) * gridSize : y;
      const borderStyle = drawingTool.replace('box-', '') as 'none' | 'thin' | 'thick';
      setBoxPreview({ x1: boxDragStart.x, y1: boxDragStart.y, x2: sx, y2: sy, borderStyle });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    // トリミング確定（ドラッグ終了時に自動実行）
    if (trimMode && trimStart && trimRect && trimRect.w > 4 && trimRect.h > 4) {
      executeTrim();
      return;
    }
    if (trimMode) { setTrimStart(null); setTrimRect(null); return; }
    // 長方形ドラッグ描画の確定
    if (drawingTool && drawingTool.startsWith('box-') && boxDragStart && boxPreview) {
      const { x, y } = getCanvasCoords(e);
      const borderStyle = drawingTool.replace('box-', '') as 'none' | 'thin' | 'thick';
      addBoxFromDrag(boxDragStart.x, boxDragStart.y, x, y, borderStyle);
      setBoxDragStart(null);
      setBoxPreview(null);
      // 連続描画のためツールは維持
    }
  };

  const handleShapeDoubleClick = (e: React.MouseEvent, shape: Shape) => {
    e.stopPropagation();
    if (shape.type === 'label' || shape.type === 'arrow' || shape.type === 'circle' || shape.type === 'box') {
      setEditingId(shape.id);
      setEditText((shape as any).text || '');
    }
  };

  const commitEdit = () => {
    if (!editingId) return;
    pushHistory(shapes.map((s) => s.id === editingId ? { ...s, text: editText } as Shape : s));
    setEditingId(null);
    setEditText('');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingId) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { deleteSelected(); }
      else if (e.key === 'Escape') {
        if (trimMode) { setTrimMode(false); setTrimRect(null); setTrimStart(null); }
        else if (drawingTool) cancelDrawing();
        else setSelectedId(null);
      }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
      else if ((e.key === 'r' || e.key === 'R') && selectedId && !e.metaKey && !e.ctrlKey) { e.preventDefault(); rotateSelected(e.shiftKey ? -30 : 30); }
      else if (e.key === ' ' && !spacePressed) { e.preventDefault(); setSpacePressed(true); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut(); }
      else if (e.key === '0') { e.preventDefault(); resetZoom(); }
    };
    const upHandler = (e: KeyboardEvent) => { if (e.key === ' ') setSpacePressed(false); };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', upHandler);
    return () => { window.removeEventListener('keydown', handler); window.removeEventListener('keyup', upHandler); };
  }, [selectedId, editingId, history, shapes, zoom, pan, spacePressed, drawingTool, trimMode]);

  const exportPNG = async () => {
    const svg = canvasRef.current;
    if (!svg) return;

    const W = canvasSize.width;
    const H = canvasSize.height;

    // SVGをクローンして選択リングを除去（背景画像のimage要素はそのまま残す）
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll('.selection-ring').forEach((el) => el.remove());

    // 白背景を先頭に挿入
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', String(W));
    bgRect.setAttribute('height', String(H));
    bgRect.setAttribute('fill', 'white');
    clone.insertBefore(bgRect, clone.firstChild);

    // SVG全体（背景画像含む）をbase64エンコード
    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // SVG全体をCanvasに描画（背景画像はSVG内のimage要素として含む）
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
        resolve();
      };
      img.onerror = () => {
        console.warn('PNG出力: SVGの描画に失敗。白背景のみで出力します。');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, W, H);
        resolve();
      };
      img.src = svgBase64;
    });

    // PNGダウンロード
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `floor_plan_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG出力エラー:', err);
      alert('PNG出力に失敗しました。');
    }
  };

  const exportPDF = () => {
    const svg = canvasRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll('.selection-ring').forEach((el) => el.remove());
    const svgString = new XMLSerializer().serializeToString(clone);
    const orientation = paperSize === 'a4-portrait' ? 'portrait' : 'landscape';
    const maxDim = paperSize === 'a4-portrait' ? '190mm' : '277mm';
    const pw = window.open('', '_blank');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><title>平面図</title><style>@page{size:A4 ${orientation};margin:10mm}body{margin:0;padding:0;display:flex;justify-content:center;align-items:center}svg{width:100%;max-width:${maxDim};height:auto;background:white}.container{width:100%}</style></head><body><div class="container">${svgString}</div><script>window.onload=()=>{setTimeout(()=>window.print(),300)}<\/script></body></html>`);
    pw.document.close();
  };

  const saveState = () => {
    const data = { version: 6, paperSize, shapes, gridSize, showGrid, bgImage, bgOpacity, bgOffsetX, bgOffsetY, labelPrefixes, labelCounters, labelLastSize, labelCustomColors, arrowCounter, labelRotated };
    const link = document.createElement('a');
    link.download = `floor_plan_${Date.now()}.json`;
    link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    link.click();
  };

  const loadState = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setPaperSize(data.paperSize || 'a4-landscape');
        updateBgImage(data.bgImage || null);
        setShapes(data.shapes || []);
        setGridSize(data.gridSize || 25);
        setShowGrid(data.showGrid ?? true);
        updateBgOpacity(data.bgOpacity ?? 1.0);
        setBgOffsetX(data.bgOffsetX ?? 0);
        setBgOffsetY(data.bgOffsetY ?? 0);
        setLabelPrefixes(data.labelPrefixes || ['A', 'B', 'C']);
        setLabelCounters(data.labelCounters || { A: 0, B: 0, C: 0 });
        setLabelLastSize(data.labelLastSize || {});
        setLabelCustomColors(data.labelCustomColors || {});
        setArrowCounter(data.arrowCounter || 0);
        setLabelRotated(data.labelRotated || {});
        setHistory([]);
        setSelectedId(null);
      } catch (err: any) {
        alert('読み込みに失敗しました: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // ===== レンダリング =====
  const SelectionRing = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
    <rect className="selection-ring" x={x} y={y} width={w} height={h}
      fill="none" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5,3" rx={4}
      style={{ pointerEvents: 'none' }}>
      <animate attributeName="stroke-dashoffset" from="0" to="16" dur="0.6s" repeatCount="indefinite" />
    </rect>
  );

  const ResizeHandles = ({ shape }: { shape: Shape }) => {
    const w = getShapeWidth(shape), h = getShapeHeight(shape);
    const cx = (shape as any).x, cy = (shape as any).y;
    const x1 = cx - w/2, y1 = cy - h/2, x2 = cx + w/2, y2 = cy + h/2;
    const handles = [
      { handle: 'nw', x: x1, y: y1, cursor: 'nwse-resize' }, { handle: 'n', x: cx, y: y1, cursor: 'ns-resize' },
      { handle: 'ne', x: x2, y: y1, cursor: 'nesw-resize' }, { handle: 'e', x: x2, y: cy, cursor: 'ew-resize' },
      { handle: 'se', x: x2, y: y2, cursor: 'nwse-resize' }, { handle: 's', x: cx, y: y2, cursor: 'ns-resize' },
      { handle: 'sw', x: x1, y: y2, cursor: 'nesw-resize' }, { handle: 'w', x: x1, y: cy, cursor: 'ew-resize' },
    ];
    const rotation = (shape as any).rotation || 0;
    return (
      <g transform={`rotate(${rotation} ${cx} ${cy})`}>
        {handles.map(({ handle, x, y, cursor }) => (
          <rect key={handle} x={x-5} y={y-5} width={10} height={10}
            fill="#ffffff" stroke="#0ea5e9" strokeWidth={1.5}
            style={{ cursor }} onMouseDown={(e) => handleResizeMouseDown(e, shape, handle)} />
        ))}
      </g>
    );
  };

  const renderShape = (shape: Shape) => {
    const isSelected = shape.id === selectedId;
    const rotation = (shape as any).rotation || 0;
    const commonProps = {
      onMouseDown: (e: React.MouseEvent) => handleShapeMouseDown(e, shape),
      onDoubleClick: (e: React.MouseEvent) => handleShapeDoubleClick(e, shape),
      style: { cursor: 'move' as const },
      transform: `rotate(${rotation} ${(shape as any).x ?? 0} ${(shape as any).y ?? 0})`,
    };

    if (shape.type === 'label') {
      const s = shape as LabelShape;
      return (
        <g key={s.id} {...commonProps}>
          <rect x={s.x-s.width/2} y={s.y-s.height/2} width={s.width} height={s.height} rx={6} fill={s.fillColor} stroke={s.borderColor} strokeWidth={1.8} />
          <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="700" fill="#1a1a1a" style={{ userSelect: 'none', pointerEvents: 'none' }}>{s.text}</text>
          {isSelected && <SelectionRing x={s.x-s.width/2-4} y={s.y-s.height/2-4} w={s.width+8} h={s.height+8} />}
        </g>
      );
    }
    if (shape.type === 'arrow') {
      const s = shape as ArrowShape;
      const bodyL = s.size*1.4, headL = s.size*0.7, bodyW = s.size*0.7, headW = s.size*1.1;
      const cx = s.x, cy = s.y;
      const points = [[cx-bodyL/2,cy-bodyW/2],[cx+bodyL/2-headL,cy-bodyW/2],[cx+bodyL/2-headL,cy-headW/2],[cx+bodyL/2,cy],[cx+bodyL/2-headL,cy+headW/2],[cx+bodyL/2-headL,cy+bodyW/2],[cx-bodyL/2,cy+bodyW/2]].map(([px,py])=>`${px},${py}`).join(' ');
      const textX = cx - bodyL/4;
      return (
        <g key={s.id} {...commonProps}>
          <polygon points={points} fill="#fde047" stroke="#1f2937" strokeWidth={1.8} strokeLinejoin="round" />
          <g transform={`rotate(${-rotation} ${textX} ${cy})`}>
            <text x={textX} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="700" fill="#1a1a1a" style={{ userSelect: 'none', pointerEvents: 'none' }}>{s.text}</text>
          </g>
          {isSelected && <SelectionRing x={cx-bodyL/2-4} y={cy-headW/2-4} w={bodyL+8} h={headW+8} />}
        </g>
      );
    }
    if (shape.type === 'color') {
      const s = shape as ColorShape;
      return (
        <g key={s.id} {...commonProps}>
          <rect x={s.x-s.size/2} y={s.y-s.size/2} width={s.size} height={s.size} fill={s.color} fillOpacity={s.opacity} stroke="#1f2937" strokeWidth={1} />
          {isSelected && <SelectionRing x={s.x-s.size/2-4} y={s.y-s.size/2-4} w={s.size+8} h={s.size+8} />}
        </g>
      );
    }
    if (shape.type === 'circle') {
      const s = shape as CircleShape;
      const r = s.size/2;
      return (
        <g key={s.id} {...commonProps}>
          <circle cx={s.x} cy={s.y} r={r} fill={s.color} stroke="#1f2937" strokeWidth={1.5} />
          <g transform={`rotate(${-rotation} ${s.x} ${s.y})`}>
            <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="700" fill="#1a1a1a" style={{ userSelect: 'none', pointerEvents: 'none' }}>{s.text}</text>
          </g>
          {isSelected && <SelectionRing x={s.x-r-4} y={s.y-r-4} w={r*2+8} h={r*2+8} />}
        </g>
      );
    }
    if (shape.type === 'box') {
      const s = shape as BoxShape;
      const sw = s.borderStyle === 'thick' ? 2.8 : s.borderStyle === 'thin' ? 1.2 : 0;
      const sc = s.borderStyle === 'none' ? 'none' : '#1f2937';
      return (
        <g key={s.id} {...commonProps}>
          <rect x={s.x-s.width/2} y={s.y-s.height/2} width={s.width} height={s.height} fill="white" fillOpacity={s.borderStyle === 'none' ? 0 : 1} stroke={sc} strokeWidth={sw} />
          {s.borderStyle === 'none' && <rect x={s.x-s.width/2} y={s.y-s.height/2} width={s.width} height={s.height} fill="white" fillOpacity={0.01} stroke="none" />}
          {s.text && <g transform={`rotate(${-rotation} ${s.x} ${s.y})`}><text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="500" fill="#1a1a1a" style={{ userSelect: 'none', pointerEvents: 'none' }}>{s.text}</text></g>}
          {isSelected && <SelectionRing x={s.x-s.width/2-4} y={s.y-s.height/2-4} w={s.width+8} h={s.height+8} />}
        </g>
      );
    }
    if (shape.type === 'line') {
      const s = shape as LineShape;
      const sw = s.weight === 'thick' ? 4 : 1.5;
      return (
        <g key={s.id}>
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="rgba(0,0,0,0)" strokeWidth={Math.max(12, sw+8)} onMouseDown={(e) => handleShapeMouseDown(e, shape)} onDoubleClick={(e) => handleShapeDoubleClick(e, shape)} style={{ cursor: 'move' }} />
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#1f2937" strokeWidth={sw} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
          {isSelected && (() => {
            const minX = Math.min(s.x1, s.x2), minY = Math.min(s.y1, s.y2);
            const w = Math.max(2, Math.abs(s.x2-s.x1)), h = Math.max(2, Math.abs(s.y2-s.y1));
            return (<>
              <SelectionRing x={minX-6} y={minY-6} w={w+12} h={h+12} />
              <circle cx={s.x1} cy={s.y1} r={6} fill="white" stroke="#0ea5e9" strokeWidth={2} style={{ cursor: 'crosshair' }} onMouseDown={(e) => handleLineEndpointMouseDown(e, shape, 'p1')} />
              <circle cx={s.x2} cy={s.y2} r={6} fill="white" stroke="#0ea5e9" strokeWidth={2} style={{ cursor: 'crosshair' }} onMouseDown={(e) => handleLineEndpointMouseDown(e, shape, 'p2')} />
            </>);
          })()}
        </g>
      );
    }
    return null;
  };

  const colorPalette = [
    { color: '#ef4444', label: '赤' }, { color: '#3b82f6', label: '青' },
    { color: '#a855f7', label: '紫' }, { color: '#f97316', label: 'オレンジ' },
    { color: '#22c55e', label: '緑' }, { color: '#eab308', label: '黄' },
  ];

  return (
    <div className="w-full h-screen flex flex-col bg-stone-100" style={{ fontFamily: '"Noto Sans JP", "Hiragino Sans", system-ui, sans-serif' }}>
      <header className="bg-white border-b border-stone-300 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">平面図エディタ</h1>
            <p className="text-[10px] text-stone-500">省エネ設備申請用 作図ツール</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-stone-100 rounded-md p-0.5 mr-1">
            {(['a4-landscape', 'a4-portrait'] as PaperSizeKey[]).map((size) => (
              <button key={size} onClick={() => handleChangePaperSize(size)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${paperSize === size ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-900'}`}>
                <span className={`inline-block border border-current rounded-[1px] ${size === 'a4-landscape' ? 'w-4 h-3' : 'w-3 h-4'}`} />
                {size === 'a4-landscape' ? 'A4横' : 'A4縦'}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-stone-300 mx-0.5" />
          <ToolButton onClick={() => fileInputRef.current?.click()} icon={<Upload size={15} />} label="背景画像/PDF" />
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleBgUpload} />
          {bgImage && <ToolButton onClick={() => setShowBgImage(!showBgImage)} icon={showBgImage ? <Eye size={15} /> : <EyeOff size={15} />} label={showBgImage ? '背景表示' : '背景非表示'} variant="ghost" />}
          {bgImage && <ToolButton onClick={() => { updateBgImage(null); setPdfDoc(null); setPdfPages(0); setShowBgImage(true); }} icon={<Trash2 size={15} />} label="背景削除" variant="ghost" />}
          <div className="w-px h-5 bg-stone-300 mx-0.5" />
          <ToolButton onClick={() => setShowGrid(!showGrid)} icon={showGrid ? <Eye size={15} /> : <EyeOff size={15} />} label={showGrid ? 'グリッドON' : 'グリッドOFF'} variant="ghost" />
          <div className="w-px h-5 bg-stone-300 mx-0.5" />
          <ToolButton onClick={undo} icon={<Undo2 size={15} />} label="元に戻す" variant="ghost" disabled={history.length === 0} />
          <ToolButton onClick={clearAll} icon={<Trash2 size={15} />} label="全消去" variant="ghost" />
          <div className="w-px h-5 bg-stone-300 mx-0.5" />
          <label className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-stone-100 rounded-md cursor-pointer transition-colors">
            JSON読込<input type="file" accept=".json" className="hidden" onChange={loadState} />
          </label>
          <ToolButton onClick={saveState} icon={<Download size={15} />} label="JSON保存" variant="ghost" />
          <div className="w-px h-5 bg-stone-300 mx-0.5" />
          <ToolButton onClick={exportPNG} icon={<ImageIcon size={15} />} label="PNG出力" variant="primary" />
          <ToolButton onClick={exportPDF} icon={<FileText size={15} />} label="PDF出力" variant="primary" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-stone-300 overflow-y-auto">
          <div className="p-4">
            <SectionTitle>図形パレット</SectionTitle>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">機器ラベル（自動連番）</p>
                <p className="text-[9px] text-stone-400">右クリックで色変更</p>
              </div>
              <div className="space-y-1">
                {labelPrefixes.map((p) => {
                  const colors = getLabelColor(p);
                  const isRotated = !!labelRotated[p];
                  return (
                    <div key={p} className="flex items-center gap-1">
                      {/* メインボタン */}
                      <button onClick={() => addLabelWithRotation(p)}
                        onContextMenu={(e) => { e.preventDefault(); setColorPickerPrefix(p); }}
                        className="flex-1 py-1.5 px-2 rounded-md hover:scale-105 text-sm font-bold transition-all relative"
                        style={{ backgroundColor: colors.fill, border: `1.5px solid ${colors.border}`, color: '#1a1a1a' }}>
                        {isRotated ? (
                          <span className="flex items-center justify-center gap-1">
                            <span style={{ display: 'inline-block', transform: 'rotate(90deg)', fontSize: '10px' }}>↕</span>
                            {p}-{(labelCounters[p] || 0) + 1}
                          </span>
                        ) : (
                          `${p}-${(labelCounters[p] || 0) + 1}`
                        )}
                        {!!labelCustomColors[p] && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-500 border border-white" />}
                      </button>
                      {/* 90度回転トグル */}
                      <button
                        onClick={() => setLabelRotated((prev) => ({ ...prev, [p]: !prev[p] }))}
                        className={`p-1 rounded text-[10px] transition-all ${isRotated ? 'bg-sky-100 text-sky-700 border border-sky-400' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                        title={isRotated ? '横向きに戻す' : '90度回転して配置'}
                      >
                        <RotateCw size={11} />
                      </button>
                      {/* 番号リセット */}
                      <button
                        onClick={() => resetLabelCounter(p)}
                        className="p-1 rounded text-[10px] bg-stone-100 text-stone-500 hover:bg-red-100 hover:text-red-600 transition-all"
                        title={`${p}系の番号を1にリセット`}
                      >
                        <RefreshCw size={11} />
                      </button>
                    </div>
                  );
                })}
                {labelPrefixes.length < 26 && (
                  <button onClick={addLabelPrefix} className="w-full py-1.5 px-2 bg-white border border-dashed border-stone-400 rounded-md hover:border-slate-700 hover:bg-stone-50 text-sm font-bold text-stone-500 hover:text-slate-900 transition-all">+ 系統追加</button>
                )}
              </div>
            </div>

            <button onClick={addArrow} className="w-full py-2.5 px-3 mb-2 bg-white border border-stone-300 rounded-md hover:border-slate-700 hover:bg-stone-50 flex items-center gap-2.5 text-sm font-medium text-slate-900 transition-all group">
              <svg width="18" height="18" viewBox="0 0 18 18"><polygon points="2,7 11,7 11,4 16,9 11,14 11,11 2,11" fill="#fde047" stroke="#1f2937" strokeWidth="1.2" strokeLinejoin="round" /></svg>
              <span>撮影方向矢印</span>
              <span className="ml-auto text-xs text-stone-400 group-hover:text-stone-600">#{arrowCounter + 1}</span>
            </button>

            <button onClick={addCircleIcon} className="w-full py-2.5 px-3 mb-4 bg-white border border-stone-300 rounded-md hover:border-slate-700 hover:bg-stone-50 flex items-center gap-2.5 text-sm font-medium text-slate-900 transition-all">
              <Circle size={16} className="text-yellow-500 fill-yellow-300" />
              <span>円形アイコン (H系)</span>
            </button>

            <SectionTitle>長方形（部屋枠など）</SectionTitle>
            <p className="text-[9px] text-stone-400 mb-1.5">選択→キャンバスでドラッグして配置</p>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {(['none', 'thin', 'thick'] as const).map((style) => (
                <button key={style}
                  onClick={() => startBoxDrawing(style)}
                  className={`py-3 px-2 rounded-md transition-all flex flex-col items-center gap-1 ${
                    drawingTool === `box-${style}`
                      ? 'bg-sky-100 border-2 border-sky-500 text-sky-900'
                      : 'bg-white border border-stone-300 hover:border-slate-700 hover:bg-stone-50 text-slate-900'
                  }`}>
                  <svg width="32" height="18" viewBox="0 0 32 18">
                    {/* 枠なしは薄いグレー点線で視認性を確保 */}
                    {style === 'none'
                      ? <rect x="3" y="3" width="26" height="12" fill="#f8f8f8" stroke="#bbb" strokeWidth="1" strokeDasharray="3,2" />
                      : <rect x="3" y="3" width="26" height="12" fill="white" stroke="#1f2937" strokeWidth={style === 'thick' ? 2.5 : 1} />
                    }
                  </svg>
                  <span className="text-[10px] text-stone-600">{style === 'none' ? '枠なし' : style === 'thin' ? '細い枠' : '太い枠'}</span>
                </button>
              ))}
            </div>
            {drawingTool && drawingTool.startsWith('box-') && (
              <div className="mb-3 p-2 bg-sky-50 border border-sky-200 rounded text-[10px] text-sky-800 leading-relaxed">
                <p className="font-semibold mb-0.5">📐 長方形描画モード</p>
                <p>{boxDragStart ? 'ドラッグして大きさを決定' : 'キャンバスでドラッグして配置'}</p>
                <button onClick={cancelDrawing} className="mt-1 text-[10px] underline hover:text-sky-600">終了 (Esc)</button>
              </div>
            )}

            <SectionTitle>直線（壁・配線など）</SectionTitle>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {(['thin', 'thick'] as const).map((w) => (
                <button key={w} onClick={() => startLineDrawing(w)}
                  className={`py-3 px-2 rounded-md transition-all flex flex-col items-center gap-1 ${drawingTool === `line-${w}` ? 'bg-sky-100 border-2 border-sky-500 text-sky-900' : 'bg-white border border-stone-300 hover:border-slate-700 hover:bg-stone-50 text-slate-900'}`}>
                  <svg width="42" height="14" viewBox="0 0 42 14"><line x1="4" y1="7" x2="38" y2="7" stroke="#1f2937" strokeWidth={w === 'thick' ? 4 : 1.5} strokeLinecap="round" /></svg>
                  <span className="text-[10px]">{w === 'thin' ? '細い線' : '太い線'}</span>
                </button>
              ))}
            </div>
            {drawingTool && (
              <div className="mb-3 p-2 bg-sky-50 border border-sky-200 rounded text-[10px] text-sky-800 leading-relaxed">
                <p className="font-semibold mb-0.5">📐 描画モード</p>
                <p>{linePreview ? '2点目をクリックして確定' : '1点目をクリック'}</p>
                <button onClick={cancelDrawing} className="mt-1 text-[10px] underline hover:text-sky-600">終了 (Esc)</button>
              </div>
            )}
            <div className="mb-4" />

            <SectionTitle>カラーアイコン（半透明）</SectionTitle>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {colorPalette.map(({ color, label }) => (
                <button key={color} onClick={() => addColorIcon(color)} className="aspect-square rounded-md border border-stone-300 hover:scale-105 hover:border-slate-700 transition-all relative overflow-hidden" title={label}>
                  <div className="absolute inset-0" style={{ backgroundColor: color, opacity: 0.5 }} />
                </button>
              ))}
            </div>
            <button onClick={() => { const c = prompt('色を16進数で入力 (例: #ff8800)', '#888888'); if (c) addColorIcon(c); }}
              className="w-full py-1.5 text-xs text-stone-600 hover:text-slate-900 hover:bg-stone-100 rounded transition-colors flex items-center justify-center gap-1.5">
              <Palette size={12} /> 任意の色を追加
            </button>

            <div className="my-5 border-t border-stone-200" />
            <SectionTitle>表示設定</SectionTitle>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-600 flex justify-between mb-1">
                  <span>グリッドサイズ</span><span className="font-mono text-stone-900">{gridSize}px</span>
                </label>
                <input type="range" min="10" max="80" value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} className="w-full accent-slate-700" />
              </div>
              {bgImage && (
                <>
                  <div>
                    <label className="text-xs text-stone-600 flex justify-between mb-1">
                      <span>背景画像の不透明度</span><span className="font-mono text-stone-900">{Math.round(bgOpacity * 100)}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={bgOpacity * 100} onChange={(e) => updateBgOpacity(Number(e.target.value) / 100)} className="w-full accent-slate-700" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1">背景画像の位置調整</label>
                    <p className="text-[9px] text-stone-400 mb-1.5">画像を直接ドラッグで移動できます</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">X移動</label>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setBgOffsetX((v) => v - 10)} className="px-1.5 py-0.5 text-xs bg-stone-100 hover:bg-stone-200 rounded">-</button>
                          <input type="number" value={Math.round(bgOffsetX)} onChange={(e) => setBgOffsetX(Number(e.target.value))} className="w-full text-xs text-center border border-stone-300 rounded px-1 py-0.5 font-mono" />
                          <button onClick={() => setBgOffsetX((v) => v + 10)} className="px-1.5 py-0.5 text-xs bg-stone-100 hover:bg-stone-200 rounded">+</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">Y移動</label>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setBgOffsetY((v) => v - 10)} className="px-1.5 py-0.5 text-xs bg-stone-100 hover:bg-stone-200 rounded">-</button>
                          <input type="number" value={Math.round(bgOffsetY)} onChange={(e) => setBgOffsetY(Number(e.target.value))} className="w-full text-xs text-center border border-stone-300 rounded px-1 py-0.5 font-mono" />
                          <button onClick={() => setBgOffsetY((v) => v + 10)} className="px-1.5 py-0.5 text-xs bg-stone-100 hover:bg-stone-200 rounded">+</button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setBgOffsetX(0); setBgOffsetY(0); }} className="mt-1.5 w-full py-0.5 text-[10px] text-stone-500 hover:text-slate-900 hover:bg-stone-100 rounded transition-colors">位置をリセット</button>
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 block mb-1">トリミング（切り抴き）</label>
                    {!trimMode ? (
                      <button
                        onClick={() => { setTrimMode(true); setTrimRect(null); setTrimStart(null); }}
                        className="w-full py-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 rounded transition-colors"
                      >
                        ✂️ トリミングモードに入る
                      </button>
                    ) : (
                      <div className="p-2 bg-amber-50 border border-amber-300 rounded text-[10px] text-amber-800">
                        <p className="font-semibold mb-0.5">✂️ トリミングモード</p>
                        <p>ドラッグで範囲を選択→自動切り抴き</p>
                        <button onClick={() => { setTrimMode(false); setTrimRect(null); setTrimStart(null); }} className="mt-1 text-[10px] underline hover:text-amber-600">キャンセル (Esc)</button>
                      </div>
                    )}
                  </div>
                  {pdfPages > 1 && (
                    <div>
                      <label className="text-xs text-stone-600 flex justify-between mb-1">
                        <span>PDFページ</span><span className="font-mono text-stone-900">{pdfCurrentPage} / {pdfPages}</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { const p = Math.max(1, pdfCurrentPage - 1); setPdfCurrentPage(p); renderPdfPage(pdfDoc, p); }} disabled={pdfCurrentPage <= 1} className="px-2 py-1 text-xs bg-stone-100 hover:bg-stone-200 rounded disabled:opacity-40">←</button>
                        <input type="number" min={1} max={pdfPages} value={pdfCurrentPage} onChange={(e) => { const p = Math.max(1, Math.min(pdfPages, Number(e.target.value))); setPdfCurrentPage(p); renderPdfPage(pdfDoc, p); }} className="flex-1 text-xs text-center border border-stone-300 rounded px-1 py-1 font-mono" />
                        <button onClick={() => { const p = Math.min(pdfPages, pdfCurrentPage + 1); setPdfCurrentPage(p); renderPdfPage(pdfDoc, p); }} disabled={pdfCurrentPage >= pdfPages} className="px-2 py-1 text-xs bg-stone-100 hover:bg-stone-200 rounded disabled:opacity-40">→</button>
                      </div>
                    </div>
                  )}
                </>
              )}
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} className="accent-slate-700" />
                グリッドにスナップ
              </label>
            </div>

            <div className="my-5 border-t border-stone-200" />
            <SectionTitle>操作方法</SectionTitle>
            <div className="text-[11px] text-stone-600 space-y-1 leading-relaxed">
              <p>• 図形をドラッグで移動</p>
              <p>• ハンドル（青い四角）でリサイズ</p>
              <p>• ダブルクリックで文字編集</p>
              <p>• <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">R</kbd> で30°右回転</p>
              <p>• <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">Shift+R</kbd> で30°左回転</p>
              <p>• Delete/BSキーで削除</p>
              <p>• <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">⌘Z</kbd> で元に戻す</p>
              <p>• <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">⌘D</kbd> で複製</p>
            </div>

            <div className="my-5 border-t border-stone-200" />
            <SectionTitle>ズーム・パン</SectionTitle>
            <div className="text-[11px] text-stone-600 space-y-1 leading-relaxed">
              <p>• ホイールでズーム</p>
              <p>• <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">Space</kbd> + ドラッグで移動</p>
              <p>• <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">+</kbd> / <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">-</kbd> で拡大縮小</p>
              <p>• <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">0</kbd> でリセット</p>
            </div>
          </div>
        </aside>

        <main ref={containerRef} className="flex-1 overflow-hidden bg-stone-200 p-4 relative"
          onMouseMove={handleMouseMove}
          onMouseUp={(e) => { handleMouseUp(); handleCanvasMouseUp(e); }}
          onMouseLeave={handleMouseUp}
          onMouseDown={handleContainerMouseDown} onWheel={handleWheel}
          style={{ cursor: isPanning ? 'grabbing' : (spacePressed ? 'grab' : (trimMode ? 'crosshair' : (drawingTool ? 'crosshair' : 'default'))) }}>
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center', transition: isPanning || dragging ? 'none' : 'transform 0.1s ease-out' }}>
            <div className="bg-white rounded-sm relative"
              style={{ width: canvasSize.width * paperFitScale, height: canvasSize.height * paperFitScale, boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <svg ref={canvasRef} viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
                className="block w-full h-full" preserveAspectRatio="xMidYMid meet"
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMoveForLine}
                onMouseDown={handleCanvasMouseDown}
                style={{ cursor: drawingTool ? 'crosshair' : 'default' }}>
                <rect className="bg-rect" width={canvasSize.width} height={canvasSize.height} fill="#fefefe" />
                {bgImage && showBgImage && (() => {
                  const ratio = Math.min(canvasSize.width / bgImage.naturalWidth, canvasSize.height / bgImage.naturalHeight);
                  const imgW = bgImage.naturalWidth * ratio, imgH = bgImage.naturalHeight * ratio;
                  const baseX = (canvasSize.width - imgW) / 2;
                  const baseY = (canvasSize.height - imgH) / 2;
                  return (
                    <image
                      href={bgImage.src}
                      x={baseX + bgOffsetX} y={baseY + bgOffsetY}
                      width={imgW} height={imgH}
                      opacity={bgOpacity}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ pointerEvents: bgDragging ? 'auto' : 'none', cursor: 'move' }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setBgDragging(true);
                        const svg = canvasRef.current;
                        if (!svg) return;
                        const rect = svg.getBoundingClientRect();
                        const scaleX = canvasSize.width / rect.width;
                        const scaleY = canvasSize.height / rect.height;
                        setBgDragStart({
                          mx: (e.clientX - rect.left) * scaleX,
                          my: (e.clientY - rect.top) * scaleY,
                          ox: bgOffsetX, oy: bgOffsetY
                        });
                      }}
                    />
                  );
                })()}
                {showGrid && (
                  <g style={{ pointerEvents: 'none' }}>
                    <defs>
                      <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                        <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#94a3b8" strokeWidth="0.5" opacity="0.4" />
                      </pattern>
                    </defs>
                    <rect width={canvasSize.width} height={canvasSize.height} fill="url(#grid)" />
                  </g>
                )}
                {shapes.map(renderShape)}
                {selectedId && (() => {
                  const sel = shapes.find((s) => s.id === selectedId);
                  if (!sel || sel.type === 'line') return null;
                  return <ResizeHandles shape={sel} />;
                })()}
                {linePreview && drawingTool && (
                  <g style={{ pointerEvents: 'none' }}>
                    <line x1={linePreview.x1} y1={linePreview.y1} x2={linePreview.x2} y2={linePreview.y2} stroke="#0ea5e9" strokeWidth={drawingTool === 'line-thick' ? 4 : 1.5} strokeLinecap="round" strokeDasharray="4,3" opacity={0.8} />
                    <circle cx={linePreview.x1} cy={linePreview.y1} r={4} fill="#0ea5e9" />
                  </g>
                )}
                {/* トリミング選択プレビュー */}
                {trimMode && trimRect && trimRect.w > 0 && (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect x={trimRect.x} y={trimRect.y} width={trimRect.w} height={trimRect.h}
                      fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="6,3" />
                    <rect x={0} y={0} width={canvasSize.width} height={canvasSize.height}
                      fill="rgba(0,0,0,0.3)" style={{ mixBlendMode: 'multiply' } as any}
                      clipPath={`path('M 0 0 L ${canvasSize.width} 0 L ${canvasSize.width} ${canvasSize.height} L 0 ${canvasSize.height} Z M ${trimRect.x} ${trimRect.y} L ${trimRect.x + trimRect.w} ${trimRect.y} L ${trimRect.x + trimRect.w} ${trimRect.y + trimRect.h} L ${trimRect.x} ${trimRect.y + trimRect.h} Z')`}
                    />
                  </g>
                )}
                {/* 長方形ドラッグプレビュー */}
                {boxPreview && (() => {
                  const x = Math.min(boxPreview.x1, boxPreview.x2);
                  const y = Math.min(boxPreview.y1, boxPreview.y2);
                  const w = Math.max(1, Math.abs(boxPreview.x2 - boxPreview.x1));
                  const h = Math.max(1, Math.abs(boxPreview.y2 - boxPreview.y1));
                  const sw = boxPreview.borderStyle === 'thick' ? 2.8 : boxPreview.borderStyle === 'thin' ? 1.2 : 0;
                  return (
                    <g style={{ pointerEvents: 'none' }}>
                      <rect x={x} y={y} width={w} height={h}
                        fill="rgba(14,165,233,0.08)" stroke="#0ea5e9"
                        strokeWidth={Math.max(1, sw)} strokeDasharray="6,3" />
                      <circle cx={boxPreview.x1} cy={boxPreview.y1} r={4} fill="#0ea5e9" />
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-stone-200 flex items-center overflow-hidden">
            <button onClick={zoomOut} className="px-3 py-2 hover:bg-stone-100 text-slate-700 transition-colors text-lg font-bold" title="縮小 (-)">−</button>
            <button onClick={resetZoom} className="px-3 py-2 hover:bg-stone-100 text-slate-700 transition-colors text-xs font-mono border-x border-stone-200 min-w-[60px]" title="リセット (0)">{Math.round(zoom * 100)}%</button>
            <button onClick={zoomIn} className="px-3 py-2 hover:bg-stone-100 text-slate-700 transition-colors text-lg font-bold" title="拡大 (+)">+</button>
          </div>

          {selectedId && (() => {
            const sel = shapes.find((s) => s.id === selectedId);
            if (!sel) return null;
            const rot = (sel as any).rotation || 0;
            return (
              <div className="absolute bottom-6 right-[260px] bg-white rounded-lg shadow-lg border border-stone-200 flex items-center overflow-hidden">
                <button onClick={() => rotateSelected(-30)} className="px-3 py-2 hover:bg-stone-100 text-slate-700 transition-colors flex items-center gap-1" title="左に30°回転 (Shift+R)"><RotateCw size={14} style={{ transform: 'scaleX(-1)' }} /></button>
                <div className="px-3 py-2 text-xs font-mono border-x border-stone-200 min-w-[55px] text-center text-slate-700">{rot}°</div>
                <button onClick={() => rotateSelected(30)} className="px-3 py-2 hover:bg-stone-100 text-slate-700 transition-colors flex items-center gap-1" title="右に30°回転 (R)"><RotateCw size={14} /></button>
                {rot !== 0 && <button onClick={() => pushHistory(shapes.map((s) => s.id === selectedId ? { ...s, rotation: 0 } as Shape : s))} className="px-2 py-2 hover:bg-stone-100 text-stone-500 hover:text-slate-700 transition-colors text-[10px] border-l border-stone-200" title="回転をリセット">リセット</button>}
              </div>
            );
          })()}

          {(spacePressed || isPanning) && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />パンモード（ドラッグで移動）
            </div>
          )}
        </main>
      </div>

      <footer className="bg-white border-t border-stone-300 px-6 py-2 flex items-center justify-between text-xs text-stone-600">
        <div className="flex items-center gap-4">
          <span>図形 <span className="font-mono font-semibold text-slate-900">{shapes.length}</span></span>
          <span>用紙 <span className="font-mono">{PAPER_SIZES[paperSize].name}</span></span>
          {selectedId && (() => {
            const sel = shapes.find((s) => s.id === selectedId);
            if (!sel) return null;
            return (
              <span className="text-sky-600 flex items-center gap-3">
                <span>選択中: {sel.type}</span>
                <span className="font-mono text-stone-500">{Math.round(getShapeWidth(sel))} × {Math.round(getShapeHeight(sel))} px</span>
                {snapToGrid && <span className="text-xs text-emerald-600">⌘ スナップON</span>}
              </span>
            );
          })()}
        </div>
        <div className="text-stone-400">v0.5 (Web)</div>
      </footer>

      {/* PDFページ選択モーダル */}
      {showPdfPageSelector && pdfDoc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowPdfPageSelector(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-900 mb-3">PDFページを選択</h3>
            <p className="text-xs text-stone-500 mb-4">全{pdfPages}ページあります。読み込むページを選択してください。</p>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPdfCurrentPage((p) => Math.max(1, p - 1))} disabled={pdfCurrentPage <= 1} className="px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-200 rounded disabled:opacity-40">←</button>
              <input type="number" min={1} max={pdfPages} value={pdfCurrentPage} onChange={(e) => setPdfCurrentPage(Math.max(1, Math.min(pdfPages, Number(e.target.value))))} className="flex-1 text-center border border-stone-300 rounded px-2 py-1.5 text-sm font-mono" />
              <span className="text-xs text-stone-500">/ {pdfPages}</span>
              <button onClick={() => setPdfCurrentPage((p) => Math.min(pdfPages, p + 1))} disabled={pdfCurrentPage >= pdfPages} className="px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-200 rounded disabled:opacity-40">→</button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPdfPageSelector(false)} className="px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">キャンセル</button>
              <button onClick={async () => { await renderPdfPage(pdfDoc, pdfCurrentPage); setShowPdfPageSelector(false); }} className="px-4 py-1.5 text-sm bg-slate-800 text-white rounded-md hover:bg-slate-900">読み込む</button>
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-lg shadow-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-900 mb-3">テキストを編集</h3>
            <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
              autoFocus className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:border-slate-700 text-slate-900" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingId(null)} className="px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">キャンセル</button>
              <button onClick={commitEdit} className="px-4 py-1.5 text-sm bg-slate-800 text-white rounded-md hover:bg-slate-900">確定</button>
            </div>
          </div>
        </div>
      )}

      {colorPickerPrefix && (
        <ColorPickerModal
          prefix={colorPickerPrefix}
          currentColors={getLabelColor(colorPickerPrefix)}
          onApply={(fill, border) => { setLabelColor(colorPickerPrefix, fill, border); setColorPickerPrefix(null); }}
          onReset={() => { resetLabelColor(colorPickerPrefix); setColorPickerPrefix(null); }}
          onClose={() => setColorPickerPrefix(null)}
          isCustomized={!!labelCustomColors[colorPickerPrefix]}
        />
      )}
    </div>
  );
}

// ===== カラーピッカーモーダル =====
interface ColorPickerModalProps {
  prefix: string;
  currentColors: LabelColor;
  onApply: (fill: string, border: string) => void;
  onReset: () => void;
  onClose: () => void;
  isCustomized: boolean;
}

function ColorPickerModal({ prefix, currentColors, onApply, onReset, onClose, isCustomized }: ColorPickerModalProps) {
  const [fill, setFill] = useState(currentColors.fill);
  const [border, setBorder] = useState(currentColors.border);
  const presets = [
    { fill: '#e8b4a0', border: '#a85a3e', name: 'テラコッタ' }, { fill: '#e8c2c2', border: '#a85a5a', name: 'ローズピンク' },
    { fill: '#e8d4a0', border: '#a8843e', name: 'マスタード' }, { fill: '#bcd4a8', border: '#5e8240', name: 'セージグリーン' },
    { fill: '#a8c4d4', border: '#3e6e84', name: 'ダスティブルー' }, { fill: '#c8b4d4', border: '#6e4e84', name: 'ラベンダー' },
    { fill: '#d4c0a8', border: '#7e6240', name: 'ベージュ' }, { fill: '#a8d4c8', border: '#3e8474', name: 'ミント' },
    { fill: '#d4a8c4', border: '#84407a', name: 'ダスティローズ' }, { fill: '#c0c0d4', border: '#5e5e84', name: 'ペールパープル' },
    { fill: '#d4d0a8', border: '#7e7a40', name: 'オリーブ' }, { fill: '#a8b4c0', border: '#3e5060', name: 'スレートブルー' },
  ];
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-900 mb-1">{prefix} 系の色を変更</h3>
        <p className="text-xs text-stone-500 mb-4">配置済みの「{prefix}-1, {prefix}-2...」全てに反映されます</p>
        <div className="flex items-center justify-center mb-5 py-4 bg-stone-50 rounded-md">
          <div className="px-6 py-3 rounded-md text-base font-bold" style={{ backgroundColor: fill, border: `1.5px solid ${border}`, color: '#1a1a1a' }}>{prefix}-1</div>
        </div>
        <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">プリセット</p>
        <div className="grid grid-cols-6 gap-1.5 mb-4">
          {presets.map((p, i) => (
            <button key={i} onClick={() => { setFill(p.fill); setBorder(p.border); }}
              className="aspect-square rounded-md hover:scale-110 transition-transform"
              style={{ backgroundColor: p.fill, border: `1.5px solid ${p.border}` }} title={p.name} />
          ))}
        </div>
        <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">カスタム</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[{ label: '塗りつぶし色', value: fill, onChange: setFill }, { label: '枠線の色', value: border, onChange: setBorder }].map(({ label, value, onChange }) => (
            <div key={label}>
              <label className="text-xs text-stone-600 block mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-9 rounded border border-stone-300 cursor-pointer" />
                <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-2 py-1.5 text-xs font-mono border border-stone-300 rounded focus:outline-none focus:border-slate-700" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          {isCustomized ? <button onClick={onReset} className="px-3 py-1.5 text-xs text-stone-500 hover:text-slate-900 hover:bg-stone-100 rounded-md transition-colors">デフォルトに戻す</button> : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-md">キャンセル</button>
            <button onClick={() => onApply(fill, border)} className="px-4 py-1.5 text-sm bg-slate-800 text-white rounded-md hover:bg-slate-900">適用</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== サブコンポーネント =====
interface ToolButtonProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label: string;
  variant?: 'default' | 'ghost' | 'primary';
  disabled?: boolean;
}

function ToolButton({ onClick, icon, label, variant = 'default', disabled }: ToolButtonProps) {
  const base = "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = { default: "bg-white border border-stone-300 text-slate-900 hover:border-slate-700 hover:bg-stone-50", ghost: "text-slate-700 hover:bg-stone-100", primary: "bg-slate-800 text-white hover:bg-slate-900 border border-slate-800" };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>{icon} {label}</button>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2.5">{children}</h2>;
}
