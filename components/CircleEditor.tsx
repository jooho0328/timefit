"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Category = "수면" | "업무" | "식사" | "여가" | "이동" | "기타";

export interface TimeBlock {
  id: string;
  startMin: number;
  endMin: number;
  category: Category;
  label?: string;
  color?: string;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  수면: "#3B82F6",
  업무: "#F97316",
  식사: "#22C55E",
  여가: "#A855F7",
  이동: "#6B7280",
  기타: "#D4A76A",
};

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#FBBF24", "#22C55E", "#14B8A6", "#3B82F6",
  "#6366F1", "#A855F7", "#EC4899", "#F472B6", "#84CC16", "#06B6D4",
  "#8B5CF6", "#D97706", "#DC2626", "#16A34A", "#2563EB", "#6B7280",
];

const CATEGORIES: Category[] = ["수면", "업무", "식사", "여가", "이동", "기타"];

const CATEGORY_ICONS: Record<Category, string> = {
  수면: "😴", 업무: "💼", 식사: "🍽️", 여가: "🎮", 이동: "🚗", 기타: "✏️",
};

const SVG_SIZE = 300;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const R = 110;
const INNER_R = 44;

function minToAngle(min: number) {
  return (min / 1440) * 360 - 90;
}

function angleToMin(angle: number) {
  const normalized = ((angle + 90) % 360 + 360) % 360;
  return Math.round((normalized / 360) * 1440);
}

function polarToCart(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function describeSector(startMin: number, endMin: number, outerR: number, innerR: number) {
  let start = startMin;
  let end = endMin;
  if (end <= start) end += 1440;
  const startAngle = minToAngle(start);
  const endAngle = minToAngle(end);
  const os = polarToCart(startAngle, outerR);
  const oe = polarToCart(endAngle, outerR);
  const is = polarToCart(startAngle, innerR);
  const ie = polarToCart(endAngle, innerR);
  const largeArc = end - start > 720 ? 1 : 0;
  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${is.x} ${is.y}`,
    "Z",
  ].join(" ");
}

export function blockDisplayName(block: Pick<TimeBlock, "category" | "label">) {
  return block.category === "기타" && block.label ? block.label : block.category;
}

export function blockColor(block: Pick<TimeBlock, "category" | "color">) {
  return block.color ?? CATEGORY_COLORS[block.category as Category] ?? "#6B7280";
}

/** 섹터 호 중앙의 직교 좌표와 회전 각도를 반환 */
export function sectorLabelInfo(
  startMin: number, endMin: number,
  outerR: number, innerR: number,
  cx: number, cy: number,
) {
  let end = endMin;
  if (end <= startMin) end += startMin + 1440 - startMin;
  // 실제 span
  const span = ((endMin - startMin) + 1440) % 1440;
  const midMin = startMin + span / 2;
  const midAngle = (midMin / 1440) * 360 - 90;          // degrees
  const midR = (outerR + innerR) / 2;
  const rad = (midAngle * Math.PI) / 180;
  const x = cx + midR * Math.cos(rad);
  const y = cy + midR * Math.sin(rad);
  // 텍스트를 방사형으로 회전 (읽기 쉽도록 0~180 범위로 뒤집기 방지)
  let rotate = midAngle + 90;
  if (rotate > 90 && rotate < 270) rotate += 180;
  return { x, y, rotate, span };
}

/** 섹터 크기에 따라 표시할 글자 수 결정 */
export function labelForSpan(name: string, spanMin: number): string {
  if (spanMin < 20) return "";
  if (spanMin < 45) return name.slice(0, 1);
  if (spanMin < 90) return name.slice(0, 2);
  return name.slice(0, 4);
}

export function formatMin(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getSvgAngle(svg: SVGSVGElement, clientX: number, clientY: number) {
  const rect = svg.getBoundingClientRect();
  const x = clientX - rect.left - CX * (rect.width / SVG_SIZE);
  const y = clientY - rect.top - CY * (rect.height / SVG_SIZE);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export interface CircleThemeVars {
  bg?: string; inner?: string; stroke?: string;
  tickMajor?: string; tickMinor?: string; label?: string; hint?: string;
}

interface CircleEditorProps {
  blocks: TimeBlock[];
  onChange: (blocks: TimeBlock[]) => void;
  theme?: CircleThemeVars;
}

export default function CircleEditor({ blocks, onChange, theme }: CircleEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<{ start: number; end: number } | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  // 선택 상태
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [customLabel, setCustomLabel] = useState("");

  const getMinFromEvent = useCallback((e: MouseEvent | TouchEvent) => {
    if (!svgRef.current) return 0;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const angle = getSvgAngle(svgRef.current, clientX, clientY);
    return angleToMin(angle);
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    if (!svgRef.current) return;
    const angle = getSvgAngle(svgRef.current, clientX, clientY);
    const min = angleToMin(angle);
    setDragging(true);
    setDragStart(min);
    setDragEnd(min);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => setDragEnd(getMinFromEvent(e));
    const onUp = (e: MouseEvent | TouchEvent) => {
      const min = getMinFromEvent(e);
      setDragEnd(min);
      setDragging(false);
      if (dragStart !== null) {
        const diff = ((min - dragStart) % 1440 + 1440) % 1440;
        if (diff > 5) {
          setPendingRange({ start: dragStart, end: min });
          setSelectedCategory(null);
          setSelectedColor("");
          setCustomLabel("");
          setSheetOpen(true);
        }
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, dragStart, getMinFromEvent]);

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setSelectedColor(CATEGORY_COLORS[cat]);
    if (cat !== "기타") setCustomLabel("");
  };

  const handleAddBlock = () => {
    if (!pendingRange || !selectedCategory) return;
    const newBlock: TimeBlock = {
      id: crypto.randomUUID(),
      startMin: pendingRange.start,
      endMin: pendingRange.end,
      category: selectedCategory,
      color: selectedColor || CATEGORY_COLORS[selectedCategory],
      ...(selectedCategory === "기타" && customLabel.trim()
        ? { label: customLabel.trim() }
        : {}),
    };
    onChange([...blocks, newBlock]);
    resetSheet();
  };

  const resetSheet = () => {
    setPendingRange(null);
    setSheetOpen(false);
    setSelectedCategory(null);
    setSelectedColor("");
    setCustomLabel("");
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
    setSelectedBlock(null);
  };

  const hourTicks = Array.from({ length: 24 }, (_, i) => i);
  const previewColor = selectedColor || (selectedCategory ? CATEGORY_COLORS[selectedCategory] : "#ffffff");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-[320px] aspect-square touch-none select-none" style={theme ? {
        "--circle-bg": theme.bg, "--circle-inner": theme.inner, "--circle-stroke": theme.stroke,
        "--circle-tick-major": theme.tickMajor, "--circle-tick-minor": theme.tickMinor,
        "--circle-label": theme.label, "--circle-hint": theme.hint,
      } as React.CSSProperties : undefined}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full h-full"
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        >
          <circle cx={CX} cy={CY} r={R} fill="var(--circle-bg, #1e1e2e)" stroke="var(--circle-stroke, #333)" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={INNER_R} fill="var(--circle-inner, #12121f)" />

          {hourTicks.map((h) => {
            const angle = (h / 24) * 360 - 90;
            const inner = polarToCart(angle, INNER_R + 4);
            const outer = polarToCart(angle, R - 4);
            const isMajor = h % 6 === 0;
            return (
              <line key={h} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke={isMajor ? "var(--circle-tick-major, #555)" : "var(--circle-tick-minor, #333)"}
                strokeWidth={isMajor ? 1.5 : 0.8} />
            );
          })}

          {[0, 6, 12, 18].map((h) => {
            const angle = (h / 24) * 360 - 90;
            const pos = polarToCart(angle, R + 14);
            return (
              <text key={h} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fill="var(--circle-label, #888)" fontWeight="600">
                {h === 0 ? "0시" : `${h}시`}
              </text>
            );
          })}

          {blocks.map((b) => {
            const name = blockDisplayName(b);
            const info = sectorLabelInfo(b.startMin, b.endMin, R, INNER_R, CX, CY);
            const labelText = labelForSpan(name, info.span);
            return (
              <g key={b.id} onClick={() => setSelectedBlock(selectedBlock === b.id ? null : b.id)}>
                <path
                  d={describeSector(b.startMin, b.endMin, R, INNER_R)}
                  fill={blockColor(b)}
                  opacity="0.9"
                  stroke="var(--circle-bg, #1e1e2e)"
                  strokeWidth="1"
                  className="cursor-pointer"
                />
                {selectedBlock === b.id && (
                  <path d={describeSector(b.startMin, b.endMin, R, INNER_R)} fill="none" stroke="white" strokeWidth="2" />
                )}
                {labelText && (
                  <text
                    x={info.x} y={info.y}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="9" fontWeight="700"
                    fill="rgba(255,255,255,0.95)"
                    transform={`rotate(${info.rotate}, ${info.x}, ${info.y})`}
                    style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.7))", pointerEvents: "none" }}
                  >
                    {labelText}
                  </text>
                )}
              </g>
            );
          })}

          {dragging && dragStart !== null && dragEnd !== null && (
            <path d={describeSector(dragStart, dragEnd, R, INNER_R)}
              fill="white" opacity="0.25" stroke="white" strokeWidth="1.5" pointerEvents="none" />
          )}

          <text x={CX} y={CY - 6} textAnchor="middle" fontSize="10" fill="var(--circle-hint, #aaa)">드래그로</text>
          <text x={CX} y={CY + 8} textAnchor="middle" fontSize="10" fill="var(--circle-hint, #aaa)">입력</text>
        </svg>
      </div>

      {/* 선택된 블록 삭제 */}
      {selectedBlock && (
        <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3 w-full max-w-[320px]">
          <div className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: blockColor(blocks.find(b => b.id === selectedBlock)!) }} />
          <span className="text-sm text-zinc-300 flex-1">
            {(() => {
              const b = blocks.find((b) => b.id === selectedBlock);
              if (!b) return "";
              return `${blockDisplayName(b)}  ${formatMin(b.startMin)} ~ ${formatMin(b.endMin)}`;
            })()}
          </span>
          <Button variant="destructive" size="sm" onClick={() => deleteBlock(selectedBlock)}>삭제</Button>
        </div>
      )}

      {/* 바텀시트 */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) resetSheet(); }}>
        <SheetContent side="bottom" className="bg-zinc-900 border-zinc-700 rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-white text-center text-sm font-medium">
              {pendingRange
                ? `${formatMin(pendingRange.start)} ~ ${formatMin(pendingRange.end)}`
                : "블록 추가"}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5 pb-6 px-1">
            {/* 카테고리 선택 */}
            <div>
              <p className="text-xs text-zinc-400 mb-2 font-medium">카테고리</p>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button key={cat} onClick={() => handleCategorySelect(cat)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95 ${
                        isSelected
                          ? "border-transparent ring-2 ring-white/60"
                          : "border-zinc-700 hover:border-zinc-500"
                      }`}
                      style={isSelected ? { backgroundColor: CATEGORY_COLORS[cat] + "33", borderColor: CATEGORY_COLORS[cat] } : {}}>
                      <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                      <span className="text-xs text-zinc-200">{cat === "기타" ? "직접입력" : cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 기타 라벨 입력 */}
            {selectedCategory === "기타" && (
              <div>
                <p className="text-xs text-zinc-400 mb-2 font-medium">활동 이름</p>
                <Input autoFocus placeholder="예: 독서, 운동, 공부..."
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 h-10 rounded-xl"
                  maxLength={20} />
              </div>
            )}

            {/* 색상 선택 */}
            {selectedCategory && (
              <div>
                <p className="text-xs text-zinc-400 mb-2 font-medium flex items-center gap-2">
                  색상
                  <span className="w-4 h-4 rounded-full border border-white/30 inline-block"
                    style={{ backgroundColor: previewColor }} />
                </p>
                <div className="grid grid-cols-9 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button key={color} onClick={() => setSelectedColor(color)}
                      className={`w-full aspect-square rounded-full transition-transform active:scale-90 ${
                        selectedColor === color ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-900 scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
                {/* 직접 입력 */}
                <div className="flex items-center gap-2 mt-3">
                  <label className="text-xs text-zinc-500 whitespace-nowrap">직접 입력</label>
                  <div className="relative flex-1">
                    <input type="color" value={selectedColor || CATEGORY_COLORS[selectedCategory]}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0.5" />
                  </div>
                </div>
              </div>
            )}

            {/* 추가 버튼 */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetSheet}
                className="flex-1 border-zinc-700 text-zinc-300 rounded-xl">
                취소
              </Button>
              <Button onClick={handleAddBlock} disabled={!selectedCategory}
                className="flex-1 rounded-xl font-semibold text-white"
                style={selectedCategory ? { backgroundColor: previewColor } : {}}>
                추가
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
