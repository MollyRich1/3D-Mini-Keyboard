import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { KeyboardScene } from "./KeyboardScene";
import { keyForCode, layout, nameForKey } from "./layout";
import { PressedKeys } from "./input";
import { clickSound, unlockSound } from "./sound";

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m11 5-6 4H2v6h3l6 4Z" />
      {on ? (
        <>
          <path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
        </>
      ) : (
        <path d="m16 9 6 6m0-6-6 6" />
      )}
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" />
    </svg>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fallback">
        This little keyboard needs WebGL.
        <br />
        <span>Try a browser with hardware acceleration enabled.</span>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const input = useRef(new PressedKeys()),
    soundRef = useRef(false),
    releaseTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>()),
    pressTimes = useRef(new Map<string, number>());
  const [pressed, setPressed] = useState(new Set<string>()),
    [sound, setSound] = useState(false),
    [last, setLast] = useState(""),
    [count, setCount] = useState(0),
    [reset, setReset] = useState(0),
    [help, setHelp] = useState(false);
  const press = useCallback((source: string, id: string) => {
    const timer = releaseTimers.current.get(source);
    if (timer) {
      clearTimeout(timer);
      releaseTimers.current.delete(source);
      input.current.release(source);
    }
    if (!input.current.press(source, id)) return;
    pressTimes.current.set(source, performance.now());
    setPressed(input.current.snapshot());
    setLast(id);
    setCount((n) => n + 1);
    if (soundRef.current) clickSound(id === "space" || id === "enter");
  }, []);
  const release = useCallback((source: string) => {
    const finish = () => {
      const id = input.current.sources.get(source);
      if (input.current.release(source)) {
        setPressed(input.current.snapshot());
        if (soundRef.current) clickSound(id === "space", true);
      }
      releaseTimers.current.delete(source);
      pressTimes.current.delete(source);
    };
    const remaining =
      75 - (performance.now() - (pressTimes.current.get(source) ?? 0));
    if (remaining > 0 && !releaseTimers.current.has(source))
      releaseTimers.current.set(source, setTimeout(finish, remaining));
    else if (remaining <= 0) finish();
  }, []);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('input,textarea,select,[contenteditable="true"]')
      )
        return;
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("button") &&
        ["Space", "Enter"].includes(e.code)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = keyForCode(e.code);
      if (!key) return;
      e.preventDefault();
      if (!e.repeat) press(e.code, key.id);
    };
    const up = (e: KeyboardEvent) => {
      if (input.current.sources.has(e.code)) {
        e.preventDefault();
        release(e.code);
      }
    };
    const pointerUp = (e: PointerEvent) => release(`pointer:${e.pointerId}`);
    const clear = () => {
      releaseTimers.current.forEach(clearTimeout);
      releaseTimers.current.clear();
      pressTimes.current.clear();
      input.current.clear();
      setPressed(new Set());
      document.body.style.cursor = "";
    };
    const visibility = () => {
      if (document.hidden) clear();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clear();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [press, release]);
  const toggleSound = () => {
    if (!sound) unlockSound();
    soundRef.current = !sound;
    setSound(!sound);
  };
  return (
    <main>
      <header>
        <a className="wordmark" href="./" aria-label="Little Keys home">
          <span className="brand-icon">
            <i />
            <i />
            <i />
          </span>
          little keys<span className="wordmark-dot">.</span>
        </a>
        <span className="edition">AN EXERCISE IN PLAY</span>
        <button
          className="about-button"
          onClick={() => setHelp(!help)}
          aria-expanded={help}
          aria-controls="about"
        >
          {help ? "Close" : "About"}
          <span>{help ? "−" : "+"}</span>
        </button>
      </header>
      <div
        className="scene"
        aria-label="Interactive miniature pastel mechanical keyboard. Click keys to press; drag the empty background to rotate; scroll to zoom."
      >
        <SceneBoundary>
          <KeyboardScene
            pressed={pressed}
            press={press}
            release={release}
            reset={reset}
          />
        </SceneBoundary>
      </div>
      <div className="live-readout" aria-live="polite" aria-atomic="true">
        <span className="readout-label">
          {last ? "THAT FELT GOOD" : "MAKE YOURSELF AT HOME"}
        </span>
        <div>
          <span className={`last-key ${last ? "has-key" : ""}`} key={count}>
            {last ? nameForKey(last) : "Hello, curious."}
          </span>
          {last && (
            <span className="press-count">
              {String(count).padStart(3, "0")}{" "}
              {count === 1 ? "press" : "presses"}
            </span>
          )}
        </div>
      </div>
      <div className="controls">
        <button
          onClick={toggleSound}
          aria-pressed={sound}
          aria-label={sound ? "Mute keyboard sound" : "Enable keyboard sound"}
        >
          <SoundIcon on={sound} />
          <span>
            Sound <span className="control-state">{sound ? "on" : "off"}</span>
          </span>
        </button>
        <span className="divider" />
        <button onClick={() => setReset((n) => n + 1)}>
          <ResetIcon />
          <span>Reset view</span>
        </button>
      </div>
      <footer>
        <span>
          <span className="tiny-key">Q</span> Click or type to play
        </span>
        <span className="orbit-hint">
          Drag to orbit <b>·</b> Scroll to get closer
        </span>
        <span className="footer-note">A TACTILE LITTLE EXPERIMENT</span>
      </footer>
      {help && (
        <aside id="about" className="about">
          <div className="eyebrow">A KEYBOARD WITH NO TO-DO LIST</div>
          <h2>Go on. Press a few.</h2>
          <p>
            A tiny study in soft colors, sculpted shapes, and the joy of a good
            click. Made for the moments between things.
          </p>
          <p>
            Click a key or use your keyboard. Hold a few together. Drag the
            space around the keyboard to explore, and scroll to lean in. Sound
            starts off; turn it on for a little extra tactility.
          </p>
          <span className="about-foot">CREAM · MINT · CORAL · HONEY</span>
          <div className="accessible-keys" aria-label="Keyboard keys">
            {layout.map((k) => (
              <button
                key={k.id}
                onPointerDown={() => press(`accessible:${k.id}`, k.id)}
                onPointerUp={() => release(`accessible:${k.id}`)}
                onPointerLeave={() => release(`accessible:${k.id}`)}
                onClick={(e) => {
                  if (e.detail === 0) {
                    press(`accessible:${k.id}`, k.id);
                    release(`accessible:${k.id}`);
                  }
                }}
                aria-pressed={pressed.has(k.id)}
              >
                {nameForKey(k.id)}
              </button>
            ))}
          </div>
        </aside>
      )}
    </main>
  );
}
