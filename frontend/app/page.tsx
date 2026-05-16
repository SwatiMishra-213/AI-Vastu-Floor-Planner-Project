"use client";

import { Arc, Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { Fragment, useMemo, useRef, useState } from "react";

function analyzePlanWithAI(items: PlanItem[]) {
  let suggestions: string[] = [];

  const kitchen = items.find(i => i.name.toLowerCase().includes("kitchen"));
  const bedroom = items.find(i => i.name.toLowerCase().includes("bedroom"));
  const door = items.find(i => i.type === "door");

  // Kitchen check
  if (kitchen) {
    if (kitchen.x < 300) {
      suggestions.push("❌ Kitchen West side me hai — Vaastu ke according South-East best hota hai.");
    } else {
      suggestions.push("✅ Kitchen placement good hai 👍");
    }
  }

  // Bedroom check
  if (bedroom) {
    if (bedroom.x < 300) {
      suggestions.push("❌ Bedroom wrong direction me hai — South-West better hota hai.");
    } else {
      suggestions.push("✅ Bedroom placement sahi hai 🛏");
    }
  }

  // Door check
  if (door) {
    if (door.x > 400) {
      suggestions.push("❌ Main door South side me lag raha hai — North/East better hota hai.");
    } else {
      suggestions.push("✅ Main door placement good hai 🚪");
    }
  }

  if (suggestions.length === 0) {
    suggestions.push("⚠️ Rooms properly define karo (Kitchen, Bedroom etc.)");
  }

  return suggestions;
}

type PlanItemType = "room" | "door" | "window" | "garden" | "parking" | "cupboard" | "commode" | "table" | "chair" | "curtain" | "wall";

type TileStyle = "none" | "grid" | "checker" | "wood";

type PlanItem = {
  id: number;
  type: PlanItemType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  tileStyle?: TileStyle;
};

type Template = {
  id: string;
  title: string;
  description: string;
  items: Omit<PlanItem, "id">[];
};

type ChatMessage = { role: "user" | "assistant"; text: string };

const STAGE_WIDTH = 980;
const STAGE_HEIGHT = 620;
const ROOM_COLORS = ["#bae6fd", "#bfdbfe", "#ddd6fe", "#fecaca", "#fde68a", "#bbf7d0"];

const TEMPLATES: Template[] = [
  {
    id: "2bhk",
    title: "2BHK Family",
    description: "Living + 2 Bedrooms + Kitchen",
    items: [
      { type: "room", name: "Living", x: 90, y: 80, width: 240, height: 180, fill: "#bfdbfe" },
      { type: "room", name: "Bedroom 1", x: 350, y: 80, width: 180, height: 160, fill: "#ddd6fe" },
      { type: "room", name: "Bedroom 2", x: 350, y: 260, width: 180, height: 150, fill: "#fecaca" },
      { type: "room", name: "Kitchen", x: 90, y: 280, width: 200, height: 140, fill: "#fde68a" },
      { type: "door", name: "Main Door", x: 195, y: 260, width: 42, height: 12, fill: "#7c3aed" },
      { type: "window", name: "Window", x: 430, y: 70, width: 75, height: 12, fill: "#0ea5e9" },
      { type: "parking", name: "Parking", x: 90, y: 440, width: 180, height: 90, fill: "#94a3b8" },
      { type: "garden", name: "Garden", x: 300, y: 440, width: 170, height: 90, fill: "#22c55e" },
    ],
  },
  {
    id: "office",
    title: "Home Office",
    description: "Work + Meeting + Pantry",
    items: [
      { type: "room", name: "Work Area", x: 110, y: 90, width: 300, height: 190, fill: "#bfdbfe" },
      { type: "room", name: "Meeting", x: 430, y: 90, width: 180, height: 150, fill: "#bbf7d0" },
      { type: "room", name: "Pantry", x: 430, y: 260, width: 160, height: 120, fill: "#fde68a" },
      { type: "door", name: "Entry Door", x: 220, y: 280, width: 42, height: 12, fill: "#7c3aed" },
      { type: "window", name: "North Window", x: 235, y: 80, width: 95, height: 12, fill: "#0ea5e9" },
      { type: "cupboard", name: "Storage", x: 620, y: 120, width: 70, height: 45, fill: "#a16207" },
    ],
  },
  {
    id: "studio",
    title: "Compact Studio",
    description: "Single hall with utility",
    items: [
      { type: "room", name: "Studio Hall", x: 120, y: 120, width: 420, height: 250, fill: "#ddd6fe" },
      { type: "room", name: "Utility", x: 560, y: 120, width: 150, height: 120, fill: "#fecaca" },
      { type: "door", name: "Entrance", x: 280, y: 370, width: 44, height: 12, fill: "#7c3aed" },
      { type: "window", name: "East Window", x: 535, y: 220, width: 80, height: 12, fill: "#0ea5e9" },
      { type: "commode", name: "Commode", x: 610, y: 260, width: 30, height: 36, fill: "#e2e8f0" },
    ],
  },
];

function getVastuRecommendation(query: string, items: PlanItem[]) {
  const q = query.toLowerCase();
  const roomCount = items.filter((i) => i.type === "room").length;
  const doorCount = items.filter((i) => i.type === "door").length;
  const windowCount = items.filter((i) => i.type === "window").length;

  if (q.includes("kitchen")) return "Kitchen South-East zone me rakhna better hota hai.";
  if (q.includes("bedroom")) return "Master bedroom South-West side me best mana jata hai.";
  if (q.includes("toilet") || q.includes("washroom")) return "Toilet North-East avoid karo; West/North-West better hai.";
  if (q.includes("door") || q.includes("main gate")) return "Main entry North ya East me positive flow ke liye acchi hoti hai.";
  if (q.includes("window")) return "North/East openings zyada rakhne se light aur ventilation improve hota hai.";
  if (q.includes("bathroom") || q.includes("commode")) return "Bathroom West/North-West me better hota hai; commode North-South alignment me rakhna preferable hai.";

  return `Plan summary: ${roomCount} rooms, ${doorCount} doors, ${windowCount} windows. Tip: North-East open rakho, South-West heavy rakho.`;
}

export default function Planner() {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [showDimensions, setShowDimensions] = useState(true);
  const [badItems, setBadItems] = useState<number[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: "assistant", text: "Namaste 👋 Main Vaastu assistant hoon. Kitchen, bedroom, door placement puch sakte ho." },
  ]);
  const idRef = useRef(1000);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const isDark = theme === "dark";
  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const createItem = (type: PlanItemType) => {
    const count = items.filter((i) => i.type === type).length + 1;
    const item: PlanItem = {
      id: nextId(),
      type,
      name: `${type[0].toUpperCase()}${type.slice(1)} ${count}`,
      x: 80 + count * 14,
      y: 80 + count * 14,
      width: type === "room" ? 150 : type === "door" ? 46 : type === "commode" ? 34 : type === "cupboard" ? 60 : type === "table" ? 70 : type === "chair" ? 28 : type === "curtain" ? 80 : type === "wall" ? 120 : 72,
      height: type === "room" ? 110 : type === "garden" || type === "parking" ? 80 : type === "commode" ? 42 : type === "cupboard" ? 40 : type === "table" ? 40 : type === "chair" ? 28 : type === "curtain" ? 20 : type === "wall" ? 10 : 12,
      fill:
        type === "room"
          ? ROOM_COLORS[(count - 1) % ROOM_COLORS.length]
          : type === "door"
            ? "#7c3aed"
            : type === "window"
              ? "#0ea5e9"
              : type === "garden"
                ? "#22c55e"
                : type === "parking"
                  ? "#94a3b8"
                  : type === "cupboard"
                    ? "#a16207"
                    : type === "table"
                      ? "#8b5a2b"
                      : type === "chair"
                        ? "#a16207"
                        : type === "curtain"
                          ? "#f472b6"
                          : type === "wall"
                            ? "#475569"
                            : "#e2e8f0",
      tileStyle: type === "room" ? "none" : undefined,
    };
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
  };


  const createNamedRoom = (name: string) => {
    const count = items.filter((i) => i.type === "room").length + 1;
    const item: PlanItem = {
      id: nextId(),
      type: "room",
      name,
      x: 80 + count * 14,
      y: 80 + count * 14,
      width: 150,
      height: 110,
      fill: ROOM_COLORS[(count - 1) % ROOM_COLORS.length],
      tileStyle: "none",
    };
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
  };

  const updateItem = (id: number, updates: Partial<PlanItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };


  const snap = (value: number) => (snapToGrid ? Math.round(value / gridSize) * gridSize : value);

  const placeAt = (x: number, y: number) => ({ x: snap(x), y: snap(y) });

  const totalRoomArea = items
    .filter((i) => i.type === "room")
    .reduce((sum, room) => sum + room.width * room.height, 0);

  const loadTemplate = (template: Template) => {
    const generated = template.items.map((item) => ({ ...item, id: nextId() }));
    setItems(generated);
    setSelectedId(generated[0]?.id ?? null);
  };

  const sendChat = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    const reply = getVastuRecommendation(msg, items);
    setChatHistory((prev) => [...prev, { role: "user", text: msg }, { role: "assistant", text: reply }]);
    setChatInput("");
  };

  return (
    <div className={isDark ? "relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1e293b_0%,#020617_55%)] text-slate-100" : "relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_55%)] text-slate-800"}>
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 animate-pulse rounded-full bg-violet-500/20 blur-3xl [animation-delay:1000ms]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl [animation-delay:2000ms]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[conic-gradient(from_90deg,rgba(56,189,248,0.14),rgba(168,85,247,0.12),rgba(56,189,248,0.14))] blur-3xl animate-spin [animation-duration:28s]" />
      <div className="pointer-events-none absolute -bottom-56 right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[conic-gradient(from_0deg,rgba(99,102,241,0.16),rgba(34,211,238,0.12),rgba(99,102,241,0.16))] blur-3xl animate-spin [animation-direction:reverse] [animation-duration:34s]" />
      <header className={isDark ? "border-b border-slate-700/60 bg-slate-900/70 backdrop-blur-xl" : "border-b border-slate-200/70 bg-white/70 backdrop-blur-xl"}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
  <h1 className="text-2xl font-bold">SmartPlanner Pro</h1>
  <p className="text-xs text-slate-400">
    Founded by Swati Mishra Co-Founded by Shubham Utkarsh • www.smartplannerpro.com
  </p>
</div>
          <div className="flex gap-2">
            <button onClick={() => createItem("room")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Add Room</button>
            <button onClick={() => createItem("door")} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Add Door</button>
            <button onClick={() => createItem("window")} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">Add Window</button>
            <button onClick={() => createItem("parking")} className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white">Add Parking</button>
            <button onClick={() => createItem("garden")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Add Garden</button>
            <button onClick={() => createItem("wall")} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white">Add Wall</button>
            <button
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              className={isDark ? "rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm" : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"}
            >
              {isDark ? "☀️ Bright" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[320px_1fr]">
        <aside className={isDark ? "space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-xl backdrop-blur" : "space-y-4 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-xl backdrop-blur"}>
          <h2 className="text-lg font-semibold">Project Controls</h2>
          <button
  onClick={() => {
    const result = analyzePlanWithAI(items);
    setAiSuggestions(result);
  }}
  className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
>
  🤖 Analyze Plan (AI)
</button>
          <div className="rounded-lg border border-slate-600/40 p-3 text-xs">
            <p className="mb-2 font-semibold">Architect Settings</p>
            <label className="mb-1 flex items-center gap-2"><input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} /> Snap to grid</label>
            <label className="mb-2 flex items-center gap-2"><input type="checkbox" checked={showDimensions} onChange={(e) => setShowDimensions(e.target.checked)} /> Show dimensions</label>
            <label className="block">Grid Size: {gridSize}px</label>
            <input type="range" min={10} max={40} step={2} value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} className="w-full" />
            <p className="mt-2 text-slate-300">Total Room Area: {Math.round(totalRoomArea)} sq.ft</p>
          </div>
          {selectedItem ? (
            <>
              <input
                value={selectedItem.name}
                onChange={(e) => updateItem(selectedItem.id, { name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={selectedItem.width} onChange={(e) => updateItem(selectedItem.id, { width: Number(e.target.value) || 10 })} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm" />
                <input type="number" value={selectedItem.height} onChange={(e) => updateItem(selectedItem.id, { height: Number(e.target.value) || 10 })} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateItem(selectedItem.id, { width: Math.max(20, selectedItem.width - 10) })} className="rounded-md bg-slate-700 px-2 py-1 text-xs text-white">- Width</button>
                <button onClick={() => updateItem(selectedItem.id, { width: selectedItem.width + 10 })} className="rounded-md bg-slate-700 px-2 py-1 text-xs text-white">+ Width</button>
                <button onClick={() => updateItem(selectedItem.id, { height: Math.max(10, selectedItem.height - 10) })} className="rounded-md bg-slate-700 px-2 py-1 text-xs text-white">- Height</button>
                <button onClick={() => updateItem(selectedItem.id, { height: selectedItem.height + 10 })} className="rounded-md bg-slate-700 px-2 py-1 text-xs text-white">+ Height</button>
              </div>
              <div className="space-y-2 rounded-lg border border-slate-600/40 p-2">
                <label className="block text-xs text-slate-300">Quick Width Slider</label>
                <input type="range" min={20} max={400} value={selectedItem.width} onChange={(e) => updateItem(selectedItem.id, { width: Number(e.target.value) })} className="w-full" />
                <label className="block text-xs text-slate-300">Quick Height Slider</label>
                <input type="range" min={10} max={300} value={selectedItem.height} onChange={(e) => updateItem(selectedItem.id, { height: Number(e.target.value) })} className="w-full" />
              </div>
              {selectedItem.type === "room" && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {ROOM_COLORS.map((color) => (
                      <button key={color} onClick={() => updateItem(selectedItem.id, { fill: color })} className="h-7 w-7 rounded-full border" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300">Tile Style</p>
                    <div className="flex flex-wrap gap-2">
                      {(["none", "grid", "checker", "wood"] as TileStyle[]).map((style) => (
                        <button
                          key={style}
                          onClick={() => updateItem(selectedItem.id, { tileStyle: style })}
                          className={`rounded-full px-2 py-1 text-[11px] ${selectedItem.tileStyle === style ? "bg-cyan-500 text-white" : "bg-slate-700 text-slate-200"}`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <button onClick={() => setItems((prev) => prev.filter((i) => i.id !== selectedItem.id))} className="w-full rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Delete Selected</button>
            </>
          ) : (
            <p className={isDark ? "rounded-xl bg-slate-800 p-3 text-sm text-slate-300" : "rounded-xl bg-slate-100 p-3 text-sm text-slate-600"}>Select any element to edit.</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => createItem("cupboard")} className="rounded-md bg-amber-700 px-2 py-1 text-xs text-white">Add Cupboard</button>
            <button onClick={() => createNamedRoom("Bathroom") } className="rounded-md bg-sky-700 px-2 py-1 text-xs text-white">Add Bathroom</button>
            <button onClick={() => createItem("commode")} className="rounded-md bg-slate-500 px-2 py-1 text-xs text-white">Add Commode</button>
            <button onClick={() => createItem("table")} className="rounded-md bg-orange-700 px-2 py-1 text-xs text-white">Add Table</button>
            <button onClick={() => createItem("chair")} className="rounded-md bg-yellow-700 px-2 py-1 text-xs text-white">Add Chair</button>
            <button onClick={() => createItem("curtain")} className="rounded-md bg-pink-600 px-2 py-1 text-xs text-white">Add Curtain</button>
          </div>
          <button onClick={() => createNamedRoom("Room") } className="rounded-md bg-indigo-700 px-2 py-1 text-xs text-white">Add Custom Room</button>

          {selectedItem && selectedItem.type === "room" && (
            <div className="flex flex-wrap gap-2">
              {['Living', 'Kitchen', 'Bedroom', 'Bathroom'].map((n) => (
                <button key={n} onClick={() => updateItem(selectedItem.id, { name: n })} className="rounded-full bg-slate-700 px-2 py-1 text-[11px] text-white">
                  {n}
                </button>
              ))}
            </div>
          )}

          <button onClick={() => { setItems([]); setSelectedId(null); }} className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white">Reset Plan</button>
        </aside>

        <main className="space-y-5">
          <section className={isDark ? "rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-xl backdrop-blur" : "rounded-2xl border border-white/80 bg-white/80 p-4 shadow-xl backdrop-blur"}>
            <h2 className="mb-3 text-lg font-semibold">Architect Plan Canvas</h2>
            <div className={isDark ? "overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-2" : "overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2"}>
              <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT} className={isDark ? "rounded-xl bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px]" : "rounded-xl bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:24px_24px]"}>
                <Layer>
                  <Line points={[50, 50, 50, 140, 140, 140]} stroke="#ef4444" strokeWidth={3} />
                  <Text x={54} y={36} text="N" fontStyle="bold" fill="#ef4444" />
                  {items.map((item) => (
                    <Fragment key={item.id}>
                      {item.type === "window" ? (
                        <Group
                          x={item.x}
                          y={item.y}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}
                        >
                          <Line points={[0, 0, item.width, 0]} stroke={item.id === selectedId ? "#67e8f9" : "#22d3ee"} strokeWidth={6} lineCap="round" />
                          <Line points={[0, -4, 0, 7, item.width, 7, item.width, -4]} stroke={isDark ? "#e2e8f0" : "#0f172a"} strokeWidth={1.4} />
                          <Line points={[item.width / 2, -2, item.width / 2, 9]} stroke={isDark ? "#e2e8f0" : "#0f172a"} strokeWidth={1.4} />
                        </Group>
                      ) : item.type === "door" ? (
                        <Group
                          x={item.x}
                          y={item.y}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}
                        >
                          <Line points={[0, 0, item.width, 0]} stroke={isDark ? "#cbd5e1" : "#0f172a"} strokeWidth={2} />
                          <Line points={[0, 0, item.width * 0.9, item.width * 0.55]} stroke={item.id === selectedId ? "#fb923c" : "#8b5cf6"} strokeWidth={3} lineCap="round" />
                          <Arc
                            x={0}
                            y={0}
                            innerRadius={Math.max(14, item.width * 0.75)}
                            outerRadius={Math.max(16, item.width * 0.82)}
                            angle={58}
                            rotation={0}
                            stroke={item.id === selectedId ? "#fdba74" : "#a78bfa"}
                            strokeWidth={2}
                          />
                          <Circle x={0} y={0} radius={3} fill={isDark ? "#f8fafc" : "#0f172a"} />
                        </Group>
                      ) : item.type === "room" ? (
                        <Group
                          x={item.x}
                          y={item.y}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onMouseEnter={() => setHoveredRoomId(item.id)}
                          onMouseLeave={() => setHoveredRoomId((prev) => (prev === item.id ? null : prev))}
                          onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}
                        >
                          <Rect width={item.width} height={item.height} fill={item.fill} stroke={item.id === selectedId ? (isDark ? "#f8fafc" : "#0f172a") : "#94a3b8"} strokeWidth={item.id === selectedId ? 3 : 1} cornerRadius={8} />
                          {item.tileStyle === "grid" && (
                            <>
                              {[...new Array(Math.floor(item.width / 18))].map((_, i) => (
                                <Line key={`gx-${i}`} points={[i * 18, 0, i * 18, item.height]} stroke={isDark ? "#334155" : "#94a3b8"} strokeWidth={0.8} />
                              ))}
                              {[...new Array(Math.floor(item.height / 18))].map((_, i) => (
                                <Line key={`gy-${i}`} points={[0, i * 18, item.width, i * 18]} stroke={isDark ? "#334155" : "#94a3b8"} strokeWidth={0.8} />
                              ))}
                            </>
                          )}
                          {item.tileStyle === "checker" && (
                            <>
                              {[...new Array(Math.floor(item.width / 20))].map((_, x) =>
                                [...new Array(Math.floor(item.height / 20))].map((_, y) =>
                                  (x + y) % 2 === 0 ? (
                                    <Rect key={`ch-${x}-${y}`} x={x * 20} y={y * 20} width={20} height={20} fill={isDark ? "#33415566" : "#ffffff66"} />
                                  ) : null
                                )
                              )}
                            </>
                          )}
                          {item.tileStyle === "wood" && (
                            <>
                              {[...new Array(Math.floor(item.height / 16))].map((_, i) => (
                                <Line key={`wd-${i}`} points={[0, i * 16, item.width, i * 16]} stroke={isDark ? "#7c2d12" : "#b45309"} strokeWidth={1} />
                              ))}
                            </>
                          )}
                          {showDimensions && hoveredRoomId === item.id && (
                            <Text x={6} y={item.height - 18} text={`${Math.round(item.width)} x ${Math.round(item.height)} ft`} fontSize={12} fill={isDark ? "#e2e8f0" : "#0f172a"} />
                          )}
                        </Group>
                      ) : item.type === "parking" ? (
                        <Group
                          x={item.x}
                          y={item.y}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}
                        >
                          <Rect x={0} y={0} width={item.width} height={item.height} fill={isDark ? "#475569" : "#94a3b8"} stroke={isDark ? "#cbd5e1" : "#334155"} cornerRadius={8} />
                          <Line points={[8, item.height / 2, item.width - 8, item.height / 2]} stroke="#e2e8f0" dash={[6, 6]} />
                          <Rect x={item.width / 2 - 12} y={item.height / 2 - 26} width={24} height={52} fill="#2563eb" cornerRadius={8} stroke="#1e3a8a" />
                          <Rect x={item.width / 2 - 9} y={item.height / 2 - 20} width={18} height={14} fill="#60a5fa" cornerRadius={4} stroke="#1e40af" />
                          <Circle x={item.width / 2 - 10} y={item.height / 2 - 20} radius={3.5} fill="#0f172a" />
                          <Circle x={item.width / 2 + 10} y={item.height / 2 - 20} radius={3.5} fill="#0f172a" />
                          <Circle x={item.width / 2 - 10} y={item.height / 2 + 20} radius={3.5} fill="#0f172a" />
                          <Circle x={item.width / 2 + 10} y={item.height / 2 + 20} radius={3.5} fill="#0f172a" />
                        </Group>
                      ) : item.type === "garden" ? (
                        <Group
                          x={item.x}
                          y={item.y}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}
                        >
                          <Rect
                            x={0}
                            y={0}
                            width={item.width}
                            height={item.height}
                            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                            fillLinearGradientEndPoint={{ x: 0, y: item.height }}
                            fillLinearGradientColorStops={[0, "#86efac", 1, "#16a34a"]}
                            stroke={isDark ? "#4ade80" : "#166534"}
                            cornerRadius={10}
                          />
                          <Circle x={18} y={18} radius={10} fill="#22c55e" />
                          <Circle x={34} y={28} radius={12} fill="#16a34a" />
                          <Circle x={54} y={20} radius={10} fill="#15803d" />
                          <Circle x={item.width - 24} y={20} radius={4} fill="#f43f5e" />
                          <Circle x={item.width - 18} y={28} radius={4} fill="#facc15" />
                          <Circle x={item.width - 30} y={30} radius={4} fill="#a855f7" />
                          <Rect x={item.width - 58} y={8} width={30} height={22} fill="rgba(186,230,253,0.35)" stroke="#7dd3fc" cornerRadius={4} />
                          <Line points={[item.width - 58, 19, item.width - 28, 19]} stroke="#7dd3fc" strokeWidth={1.2} />
                          <Line points={[item.width - 43, 8, item.width - 43, 30]} stroke="#7dd3fc" strokeWidth={1.2} />
                          <Line points={[8, item.height - 10, item.width - 8, item.height - 10]} stroke="#d4a373" strokeWidth={4} lineCap="round" />
                        </Group>
                      ) : item.type === "cupboard" ? (
                        <Group
                          x={item.x}
                          y={item.y}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}
                        >
                          <Rect x={0} y={0} width={item.width} height={item.height} fill="#a16207" stroke="#78350f" strokeWidth={2} cornerRadius={6} />
                          <Line points={[item.width / 2, 4, item.width / 2, item.height - 4]} stroke="#78350f" strokeWidth={2} />
                          <Circle x={item.width / 2 - 7} y={item.height / 2} radius={2} fill="#fef3c7" />
                          <Circle x={item.width / 2 + 7} y={item.height / 2} radius={2} fill="#fef3c7" />
                        </Group>
                      ) : item.type === "commode" ? (
                        <Group
                          x={item.x}
                          y={item.y}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}
                        >
                          <Rect x={2} y={0} width={item.width - 4} height={10} fill={isDark ? "#e2e8f0" : "#ffffff"} stroke={isDark ? "#64748b" : "#94a3b8"} cornerRadius={3} />
                          <Circle x={item.width / 2} y={3} radius={1.5} fill={isDark ? "#64748b" : "#94a3b8"} />
                          <Circle x={item.width / 2} y={18} radius={11} fill={isDark ? "#f8fafc" : "#ffffff"} stroke={isDark ? "#64748b" : "#94a3b8"} strokeWidth={1.5} />
                          <Circle x={item.width / 2} y={18} radius={5} fill={isDark ? "#94a3b8" : "#cbd5e1"} />
                          <Rect x={item.width / 2 - 9} y={22} width={18} height={item.height - 22} fill={isDark ? "#cbd5e1" : "#f1f5f9"} stroke={isDark ? "#64748b" : "#94a3b8"} cornerRadius={6} />
                        </Group>
                      ) : item.type === "table" ? (
                        <Group x={item.x} y={item.y} draggable onClick={() => setSelectedId(item.id)} onTap={() => setSelectedId(item.id)} onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}>
                          <Rect x={0} y={0} width={item.width} height={14} fill="#8b5a2b" cornerRadius={4} stroke="#5b3a1a" />
                          <Line points={[8, 14, 8, item.height, item.width - 8, item.height, item.width - 8, 14]} stroke="#5b3a1a" strokeWidth={3} />
                        </Group>
                      ) : item.type === "chair" ? (
                        <Group x={item.x} y={item.y} draggable onClick={() => setSelectedId(item.id)} onTap={() => setSelectedId(item.id)} onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}>
                          <Rect x={4} y={10} width={item.width - 8} height={item.height - 10} fill="#a16207" cornerRadius={5} />
                          <Rect x={4} y={0} width={item.width - 8} height={10} fill="#92400e" cornerRadius={4} />
                        </Group>
                      ) : item.type === "curtain" ? (
                        <Group x={item.x} y={item.y} draggable onClick={() => setSelectedId(item.id)} onTap={() => setSelectedId(item.id)} onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}>
                          <Line points={[0, 0, item.width, 0]} stroke="#64748b" strokeWidth={2} />
                          <Rect x={0} y={0} width={item.width / 2 - 2} height={item.height} fill="#f472b6" cornerRadius={3} />
                          <Rect x={item.width / 2 + 2} y={0} width={item.width / 2 - 2} height={item.height} fill="#ec4899" cornerRadius={3} />
                        </Group>
                      ) : item.type === "wall" ? (
                        <Rect x={item.x} y={item.y} width={item.width} height={item.height} fill="#475569" stroke="#1e293b" strokeWidth={1.5} cornerRadius={2} draggable onClick={() => setSelectedId(item.id)} onTap={() => setSelectedId(item.id)} onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))} />
                      ) : (
                        <Rect
                          x={item.x}
                          y={item.y}
                          width={item.width}
                          height={item.height}
                          fill={item.fill}
                          stroke={item.id === selectedId ? (isDark ? "#f8fafc" : "#0f172a") : "#94a3b8"}
                          strokeWidth={item.id === selectedId ? 3 : 1}
                          cornerRadius={8}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={(e) => updateItem(item.id, placeAt(e.target.x(), e.target.y()))}
                        />
                      )}
                      <Text x={item.x + 6} y={item.type === "window" ? item.y + 11 : item.type === "door" ? item.y + 30 : item.type === "commode" || item.type === "garden" || item.type === "cupboard" || item.type === "parking" || item.type === "table" || item.type === "chair" || item.type === "curtain" ? item.y + item.height + 4 : item.y + 4} text={item.name} fontSize={12} fontStyle="bold" fill={isDark ? "#e2e8f0" : "#0f172a"} />
                      {item.id === selectedId && (
                        <Circle
                          x={item.x + item.width}
                          y={item.y + (item.type === "room" || item.type === "commode" || item.type === "garden" || item.type === "parking" || item.type === "cupboard" || item.type === "table" || item.type === "chair" || item.type === "curtain" ? item.height : 0)}
                          radius={6}
                          fill="#f59e0b"
                          draggable
                          onDragMove={(e) => {
                            const nx = e.target.x();
                            const ny = e.target.y();
                            updateItem(item.id, {
                              width: Math.max(20, nx - item.x),
                              height: item.type === "room" || item.type === "commode" || item.type === "garden" || item.type === "parking" || item.type === "cupboard" || item.type === "table" || item.type === "chair" || item.type === "curtain" ? Math.max(20, ny - item.y) : item.height,
                            });
                          }}
                        />
                      )}
                    </Fragment>
                  ))}
                </Layer>
              </Stage>
            </div>
          </section>

          <section className={isDark ? "rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-xl backdrop-blur" : "rounded-2xl border border-white/80 bg-white/80 p-4 shadow-xl backdrop-blur"}>
            <h3 className="mb-3 text-lg font-semibold">Starter Layout Templates</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {TEMPLATES.map((template) => (
                <button key={template.id} onClick={() => loadTemplate(template)} className={isDark ? "rounded-xl border border-slate-700 bg-slate-950 p-4 text-left hover:border-cyan-500" : "rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-blue-300"}>
                  <p className="font-semibold">{template.title}</p>
                  <p className={isDark ? "text-sm text-slate-300" : "text-sm text-slate-600"}>{template.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className={isDark ? "rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-xl backdrop-blur" : "rounded-2xl border border-white/80 bg-white/80 p-4 shadow-xl backdrop-blur"}>
            <h3 className="mb-3 text-lg font-semibold">Vaastu Assistant</h3>
            <div className="mt-4">
  <h4 className="text-md font-semibold mb-2">AI Suggestions 🤖</h4>

  {aiSuggestions.length === 0 ? (
    <p className="text-sm text-gray-400">No analysis yet. Click "Analyze Plan".</p>
  ) : (
    <ul className="space-y-2">
      {aiSuggestions.map((s, i) => (
        <li key={i} className="bg-slate-800 p-2 rounded text-sm">
          {s}
        </li>
      ))}
    </ul>
  )}
</div>
{aiSuggestions.length === 0 ? (
  <p>No analysis yet</p>
) : (
  <ul>
    {aiSuggestions.map((s, i) => (
      <li key={i}>{s}</li>
    ))}
  </ul>
)}
            <div className={isDark ? "max-h-56 space-y-2 overflow-auto rounded-xl bg-slate-950 p-3" : "max-h-56 space-y-2 overflow-auto rounded-xl bg-slate-50 p-3"}>
              {chatHistory.map((m, idx) => (
                <div key={`${m.role}-${idx}`} className={m.role === "assistant" ? (isDark ? "rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100" : "rounded-lg bg-white px-3 py-2 text-sm text-slate-700") : "rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Ask: main door best direction?" className="flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm" />
              <button onClick={sendChat} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Send</button>
            </div>
          </section>
        </main>
      </div>
      <section className={isDark 
  ? "rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-xl backdrop-blur" 
  : "rounded-2xl border border-white/80 bg-white/80 p-4 shadow-xl backdrop-blur"}>

  <h3 className="mb-3 text-lg font-semibold">User Reviews ⭐</h3>

  <div className="space-y-3 text-sm">
    <div className={isDark ? "rounded-lg bg-slate-800 p-3" : "rounded-lg bg-slate-100 p-3"}>
      "Amazing tool! Helped me design my home easily." – Rahul
    </div>
    <div className={isDark ? "rounded-lg bg-slate-800 p-3" : "rounded-lg bg-slate-100 p-3"}>
      "UI is smooth and beginner friendly 💯" – Priya
    </div>
    <div className={isDark ? "rounded-lg bg-slate-800 p-3" : "rounded-lg bg-slate-100 p-3"}>
      "Best planner for students and architects!" – Aman
    </div>
  </div>
</section>
      <footer className={isDark 
  ? "mt-6 border-t border-slate-700 bg-slate-900 text-center py-4 text-sm text-slate-400" 
  : "mt-6 border-t border-slate-200 bg-white text-center py-4 text-sm text-slate-600"}>

  <p>© 2026 SmartPlanner Pro. All rights reserved.</p>
  <p>Built by Swati Mishrs  & Shubham Utkarsh 🚀</p>
</footer>
    </div>
  );
}