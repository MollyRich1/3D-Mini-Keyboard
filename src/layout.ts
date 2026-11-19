export type KeyDefinition = {
  id: string;
  label: string;
  codes: string[];
  x: number;
  z: number;
  width: number;
  depth?: number;
  color: string;
  shape?: "enter";
};
const cream = "#e9e7d8";
export const layout: KeyDefinition[] = [
  {
    id: "esc",
    label: "Esc",
    codes: ["Escape"],
    x: 0.55,
    z: -1.1,
    width: 1,
    color: "#dda59c",
  },
  {
    id: "1",
    label: "1",
    codes: ["Digit1", "Numpad1"],
    x: 1.65,
    z: -1.1,
    width: 1,
    color: cream,
  },
  {
    id: "2",
    label: "2",
    codes: ["Digit2", "Numpad2"],
    x: 2.75,
    z: -1.1,
    width: 1,
    color: cream,
  },
  {
    id: "3",
    label: "3",
    codes: ["Digit3", "Numpad3"],
    x: 3.85,
    z: -1.1,
    width: 1,
    color: cream,
  },
  {
    id: "shift",
    label: "Shift",
    codes: ["ShiftLeft", "ShiftRight"],
    x: 0.7,
    z: 0,
    width: 1.3,
    color: cream,
  },
  {
    id: "q",
    label: "Q",
    codes: ["KeyQ"],
    x: 1.95,
    z: 0,
    width: 1,
    color: cream,
  },
  {
    id: "w",
    label: "W",
    codes: ["KeyW"],
    x: 3.05,
    z: 0,
    width: 1,
    color: cream,
  },
  {
    id: "e",
    label: "E",
    codes: ["KeyE", "ArrowUp"],
    x: 4.15,
    z: 0,
    width: 1,
    color: cream,
  },
  {
    id: "enter",
    label: "Enter ↵",
    codes: ["Enter", "NumpadEnter"],
    x: 5.2,
    z: -0.55,
    width: 1.6,
    depth: 2.1,
    color: "#e7b85d",
    shape: "enter",
  },
  {
    id: "space",
    label: "",
    codes: ["Space"],
    x: 1.4,
    z: 1.1,
    width: 2.7,
    color: "#99bfa7",
  },
  {
    id: "left",
    label: "←",
    codes: ["ArrowLeft"],
    x: 3.35,
    z: 1.1,
    width: 1,
    color: cream,
  },
  {
    id: "down",
    label: "↓",
    codes: ["ArrowDown"],
    x: 4.45,
    z: 1.1,
    width: 1,
    color: cream,
  },
  {
    id: "right",
    label: "→",
    codes: ["ArrowRight"],
    x: 5.55,
    z: 1.1,
    width: 1,
    color: cream,
  },
];
export const keyForCode = (code: string) =>
  layout.find((key) => key.codes.includes(code));
export const nameForKey = (id: string) =>
  id === "space" ? "Space" : (layout.find((k) => k.id === id)?.label ?? id);
