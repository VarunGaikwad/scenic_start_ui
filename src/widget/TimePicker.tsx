import Drum from "./Drum";

export default function TimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [h, m] = value ? value.split(":").map(Number) : [0, 0];

  const update = (newH: number, newM: number) => {
    onChange(
      `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`,
    );
  };

  return (
    <div className="flex flex-col gap-2 items-center">
      <p className="text-zinc-500">{label}</p>
      <div className="flex items-center gap-3">
        <Drum count={24} value={h} onChange={(v) => update(v, m)} />
        <span className="text-zinc-100 text-xl font-medium font-mono">:</span>
        <Drum count={60} value={m} onChange={(v) => update(h, v)} />
      </div>
      <time
        dateTime={`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}
        className="text-zinc-100 font-mono text-sm"
      >
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
      </time>
    </div>
  );
}
