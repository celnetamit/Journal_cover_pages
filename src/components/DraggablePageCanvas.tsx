"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type { GenericPageElementLayout } from "@/lib/binder-content";

type GuideKind = "edge" | "center" | "margin" | "match";

type Guide = {
  orientation: "horizontal" | "vertical";
  position: number;
  kind: GuideKind;
  start: number;
  end: number;
};

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

type PointerDrag<T extends string> = {
  id: T;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startLeft: number;
  startTop: number;
};

type Match = {
  delta: number;
  snappedPosition: number;
  line: number;
  kind: GuideKind;
  relatedRect?: Rect;
};

type CandidateLine = {
  line: number;
  kind: GuideKind;
  relatedRect?: Rect;
};

type CanvasItem<T extends string> = {
  id: T;
  className: string;
  content: ReactNode;
};

type Props<T extends string> = {
  items: CanvasItem<T>[];
  layout: Record<T, GenericPageElementLayout>;
  interactive?: boolean;
  onLayoutChange?: (layout: Record<T, GenericPageElementLayout>) => void;
};

const magneticPullPx = 18;
const canvasMarginGuidePx = 20;

function rectFrom(left: number, top: number, width: number, height: number): Rect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRect(node: HTMLElement, container: HTMLElement): Rect {
  const containerRect = container.getBoundingClientRect();
  const nodeRect = node.getBoundingClientRect();
  return rectFrom(
    nodeRect.left - containerRect.left,
    nodeRect.top - containerRect.top,
    nodeRect.width,
    nodeRect.height,
  );
}

function toPercent(value: number, total: number) {
  if (!total) return 0;
  return Number(((value / total) * 100).toFixed(3));
}

function dedupeGuides(guides: Guide[]) {
  const seen = new Set<string>();
  return guides.filter((guide) => {
    const key = `${guide.orientation}:${guide.kind}:${Math.round(guide.position * 10) / 10}:${Math.round(guide.start)}:${Math.round(guide.end)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function guideKindForCanvasLine(line: number, size: number) {
  if (line === 0 || line === size) return "edge";
  if (line === size / 2) return "center";
  return "margin";
}

function buildVerticalGuide(position: number, kind: GuideKind, activeRect: Rect, relatedRect?: Rect): Guide {
  const start = relatedRect
    ? Math.max(0, Math.min(activeRect.top, relatedRect.top) - 12)
    : Math.max(0, activeRect.top - 24);
  const end = relatedRect
    ? Math.max(activeRect.bottom, relatedRect.bottom) + 12
    : activeRect.bottom + 24;

  return {
    orientation: "vertical",
    position,
    kind,
    start,
    end,
  };
}

function buildHorizontalGuide(position: number, kind: GuideKind, activeRect: Rect, relatedRect?: Rect): Guide {
  const start = relatedRect
    ? Math.max(0, Math.min(activeRect.left, relatedRect.left) - 12)
    : Math.max(0, activeRect.left - 24);
  const end = relatedRect
    ? Math.max(activeRect.right, relatedRect.right) + 12
    : activeRect.right + 24;

  return {
    orientation: "horizontal",
    position,
    kind,
    start,
    end,
  };
}

export default function DraggablePageCanvas<T extends string>({
  items,
  layout,
  interactive = false,
  onLayoutChange,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<T, HTMLDivElement | null>());
  const dragRef = useRef<PointerDrag<T> | null>(null);
  const [draftLayout, setDraftLayout] = useState(layout);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [draggingId, setDraggingId] = useState<T | null>(null);
  const [matchedIds, setMatchedIds] = useState<T[]>([]);
  const resolvedLayout = draggingId ? draftLayout : layout;

  useEffect(() => {
    if (!interactive) return;

    function onPointerMove(event: PointerEvent) {
      const drag = dragRef.current;
      const container = containerRef.current;
      if (!drag || !container || event.pointerId !== drag.pointerId) return;

      const node = itemRefs.current.get(drag.id);
      if (!node) return;

      const canvasRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const nextLeft = drag.startLeft + (event.clientX - drag.startClientX);
      const nextTop = drag.startTop + (event.clientY - drag.startClientY);
      const boundedLeft = clamp(nextLeft, 0, Math.max(0, canvasRect.width - nodeRect.width));
      const boundedTop = clamp(nextTop, 0, Math.max(0, canvasRect.height - nodeRect.height));
      const candidateRect = rectFrom(boundedLeft, boundedTop, nodeRect.width, nodeRect.height);

      const otherEntries = items
        .filter((item) => item.id !== drag.id)
        .map((item) => {
          const candidate = itemRefs.current.get(item.id);
          return candidate ? { id: item.id, rect: normalizeRect(candidate, container) } : null;
        })
        .filter((entry): entry is { id: T; rect: Rect } => entry !== null);

      const verticalCandidates: CandidateLine[] = [
        0,
        canvasMarginGuidePx,
        canvasRect.width / 2,
        canvasRect.width - canvasMarginGuidePx,
        canvasRect.width,
      ].map((line) => ({ line, kind: guideKindForCanvasLine(line, canvasRect.width) }));
      const horizontalCandidates: CandidateLine[] = [
        0,
        canvasMarginGuidePx,
        canvasRect.height / 2,
        canvasRect.height - canvasMarginGuidePx,
        canvasRect.height,
      ].map((line) => ({ line, kind: guideKindForCanvasLine(line, canvasRect.height) }));

      for (const entry of otherEntries) {
        verticalCandidates.push(
          { line: entry.rect.left, kind: "match", relatedRect: entry.rect },
          { line: entry.rect.centerX, kind: "match", relatedRect: entry.rect },
          { line: entry.rect.right, kind: "match", relatedRect: entry.rect },
        );
        horizontalCandidates.push(
          { line: entry.rect.top, kind: "match", relatedRect: entry.rect },
          { line: entry.rect.centerY, kind: "match", relatedRect: entry.rect },
          { line: entry.rect.bottom, kind: "match", relatedRect: entry.rect },
        );
      }

      const verticalAnchors = [
        { position: candidateRect.left, resolve: (line: number) => line },
        { position: candidateRect.centerX, resolve: (line: number) => line - candidateRect.width / 2 },
        { position: candidateRect.right, resolve: (line: number) => line - candidateRect.width },
      ];
      const horizontalAnchors = [
        { position: candidateRect.top, resolve: (line: number) => line },
        { position: candidateRect.centerY, resolve: (line: number) => line - candidateRect.height / 2 },
        { position: candidateRect.bottom, resolve: (line: number) => line - candidateRect.height },
      ];

      let bestVertical: Match | null = null;
      let bestHorizontal: Match | null = null;
      const nearIds = new Set<T>();

      for (const candidate of verticalCandidates) {
        for (const anchor of verticalAnchors) {
          const delta = anchor.position - candidate.line;
          const distance = Math.abs(delta);
          if (distance <= magneticPullPx && (!bestVertical || distance < Math.abs(bestVertical.delta))) {
            bestVertical = {
              delta,
              snappedPosition: anchor.resolve(candidate.line),
              line: candidate.line,
              kind: candidate.kind,
              relatedRect: candidate.relatedRect,
            };
          }
        }
      }

      for (const candidate of horizontalCandidates) {
        for (const anchor of horizontalAnchors) {
          const delta = anchor.position - candidate.line;
          const distance = Math.abs(delta);
          if (distance <= magneticPullPx && (!bestHorizontal || distance < Math.abs(bestHorizontal.delta))) {
            bestHorizontal = {
              delta,
              snappedPosition: anchor.resolve(candidate.line),
              line: candidate.line,
              kind: candidate.kind,
              relatedRect: candidate.relatedRect,
            };
          }
        }
      }

      for (const entry of otherEntries) {
        const xNear = [
          Math.abs(candidateRect.left - entry.rect.left),
          Math.abs(candidateRect.left - entry.rect.centerX),
          Math.abs(candidateRect.left - entry.rect.right),
          Math.abs(candidateRect.centerX - entry.rect.left),
          Math.abs(candidateRect.centerX - entry.rect.centerX),
          Math.abs(candidateRect.centerX - entry.rect.right),
          Math.abs(candidateRect.right - entry.rect.left),
          Math.abs(candidateRect.right - entry.rect.centerX),
          Math.abs(candidateRect.right - entry.rect.right),
        ].some((distance) => distance <= magneticPullPx);
        const yNear = [
          Math.abs(candidateRect.top - entry.rect.top),
          Math.abs(candidateRect.top - entry.rect.centerY),
          Math.abs(candidateRect.top - entry.rect.bottom),
          Math.abs(candidateRect.centerY - entry.rect.top),
          Math.abs(candidateRect.centerY - entry.rect.centerY),
          Math.abs(candidateRect.centerY - entry.rect.bottom),
          Math.abs(candidateRect.bottom - entry.rect.top),
          Math.abs(candidateRect.bottom - entry.rect.centerY),
          Math.abs(candidateRect.bottom - entry.rect.bottom),
        ].some((distance) => distance <= magneticPullPx);
        if (xNear || yNear) nearIds.add(entry.id);
      }

      const snappedLeft = bestVertical
        ? clamp(bestVertical.snappedPosition, 0, Math.max(0, canvasRect.width - nodeRect.width))
        : boundedLeft;
      const snappedTop = bestHorizontal
        ? clamp(bestHorizontal.snappedPosition, 0, Math.max(0, canvasRect.height - nodeRect.height))
        : boundedTop;

      const nextLayout = {
        ...resolvedLayout,
        [drag.id]: {
          x: toPercent(snappedLeft, canvasRect.width),
          y: toPercent(snappedTop, canvasRect.height),
        },
      };

      setDraftLayout(nextLayout);
      setGuides(
        dedupeGuides([
          ...(bestVertical ? [buildVerticalGuide(bestVertical.line, bestVertical.kind, candidateRect, bestVertical.relatedRect)] : []),
          ...(bestHorizontal ? [buildHorizontalGuide(bestHorizontal.line, bestHorizontal.kind, candidateRect, bestHorizontal.relatedRect)] : []),
        ]),
      );
      setMatchedIds(Array.from(nearIds));
      onLayoutChange?.(nextLayout);
    }

    function stopDrag(event?: PointerEvent) {
      if (!dragRef.current) return;
      if (event && event.pointerId !== dragRef.current.pointerId) return;
      dragRef.current = null;
      setGuides([]);
      setDraggingId(null);
      setMatchedIds([]);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [interactive, items, onLayoutChange, resolvedLayout]);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>, id: T) {
    if (!interactive) return;
    const container = containerRef.current;
    const node = itemRefs.current.get(id);
    if (!container || !node) return;

    const rect = normalizeRect(node, container);
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };
    setDraftLayout(layout);
    node.setPointerCapture?.(event.pointerId);
    setDraggingId(id);
    event.preventDefault();
  }

  function itemClass(id: T, base: string) {
    const dragging = draggingId === id;
    const matched = matchedIds.includes(id);
    return `${base} page-dnd-item${interactive ? " draggable" : ""}${dragging ? " dragging" : ""}${matched ? " near-guide" : ""}`;
  }

  return (
    <div className="page-dnd-canvas" ref={containerRef}>
      {guides.map((guide, index) => (
        <span
          key={`${guide.orientation}-${guide.kind}-${guide.position}-${index}`}
          className={`alignment-guide ${guide.orientation} ${guide.kind}`}
          style={
            guide.orientation === "vertical"
              ? { left: `${guide.position}px`, top: `${guide.start}px`, height: `${Math.max(0, guide.end - guide.start)}px` }
              : { top: `${guide.position}px`, left: `${guide.start}px`, width: `${Math.max(0, guide.end - guide.start)}px` }
          }
          aria-hidden="true"
        />
      ))}

      {items.map((item) => (
        <div
          key={item.id}
          ref={(node) => {
            itemRefs.current.set(item.id, node);
          }}
          className={itemClass(item.id, item.className)}
          style={{ left: `${resolvedLayout[item.id].x}%`, top: `${resolvedLayout[item.id].y}%` }}
          onPointerDown={(event) => startDrag(event, item.id)}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
