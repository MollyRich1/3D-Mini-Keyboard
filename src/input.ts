/** Tracks each input source independently: two Shift keys, mouse + keyboard, and chords. */
export class PressedKeys {
  sources = new Map<string, string>();
  press(source: string, key: string) {
    if (this.sources.has(source)) return false;
    this.sources.set(source, key);
    return true;
  }
  release(source: string) {
    return this.sources.delete(source);
  }
  has(key: string) {
    return [...this.sources.values()].includes(key);
  }
  clear() {
    this.sources.clear();
  }
  snapshot() {
    return new Set(this.sources.values());
  }
}
