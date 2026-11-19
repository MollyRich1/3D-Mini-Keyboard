let context: AudioContext | undefined;
export function unlockSound() {
  context ??= new AudioContext();
  void context.resume();
}
export function clickSound(wide: boolean, release = false) {
  if (!context) return;
  const now = context.currentTime,
    duration = release ? 0.032 : 0.07;
  const buffer = context.createBuffer(
    1,
    context.sampleRate * duration,
    context.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++)
    data[i] =
      (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.009));
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = wide ? 1100 : 1800;
  filter.Q.value = 0.65;
  const gain = context.createGain();
  gain.gain.setValueAtTime(release ? 0.1 : 0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  noise.connect(filter).connect(gain).connect(context.destination);
  noise.start();
  const tone = context.createOscillator(),
    body = context.createGain();
  tone.type = "sine";
  tone.frequency.setValueAtTime(wide ? 190 : 270, now);
  tone.frequency.exponentialRampToValueAtTime(90, now + 0.04);
  body.gain.setValueAtTime(release ? 0.025 : 0.07, now);
  body.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  tone.connect(body).connect(context.destination);
  tone.start();
  tone.stop(now + 0.07);
}
