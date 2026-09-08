/** Cubic Hermite interpolation keeps flight direction continuous at every cue. */
export function smoothPath(time: number, times: readonly number[], values: readonly number[]): number {
  if (times.length !== values.length || times.length < 2) throw new Error('A flight path needs matching time and position samples.');
  if (time <= times[0]) return values[0];
  if (time >= times[times.length - 1]) return values[values.length - 1];
  const end = times.findIndex(value => value > time);
  const start = end - 1;
  const before = Math.max(0, start - 1);
  const after = Math.min(times.length - 1, end + 1);
  const span = times[end] - times[start];
  const u = (time - times[start]) / span;
  const tangentStart = (values[end] - values[before]) / (times[end] - times[before]) * span;
  const tangentEnd = (values[after] - values[start]) / (times[after] - times[start]) * span;
  return (2 * u ** 3 - 3 * u ** 2 + 1) * values[start]
    + (u ** 3 - 2 * u ** 2 + u) * tangentStart
    + (-2 * u ** 3 + 3 * u ** 2) * values[end]
    + (u ** 3 - u ** 2) * tangentEnd;
}
