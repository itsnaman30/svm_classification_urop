import { useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Database,
  FlaskConical,
  Layers3,
  Menu,
  Mountain,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Tag,
  Upload,
  X,
} from "lucide-react";

type View = "overview" | "experiments" | "annotation" | "datasets";
type Strategy = "Rare-class aware" | "Uncertainty" | "Random";

const lithologies = [
  { name: "Sandstone", count: 2880, color: "#C67B4E" },
  { name: "Shale", count: 2140, color: "#667C73" },
  { name: "Limestone", count: 1325, color: "#A69A81" },
  { name: "Dolomite", count: 465, color: "#7A8D62" },
  { name: "Coal", count: 190, color: "#333735" },
];

const initialSamples = [
  {
    id: "W-07 · 1842.6m",
    well: "WELL-07",
    depth: "1,842.6 m",
    confidence: 43,
    predicted: "Dolomite",
    rare: true,
  },
  {
    id: "W-03 · 2291.2m",
    well: "WELL-03",
    depth: "2,291.2 m",
    confidence: 47,
    predicted: "Sandstone",
    rare: false,
  },
  {
    id: "W-11 · 1618.9m",
    well: "WELL-11",
    depth: "1,618.9 m",
    confidence: 51,
    predicted: "Coal",
    rare: true,
  },
  {
    id: "W-02 · 2054.1m",
    well: "WELL-02",
    depth: "2,054.1 m",
    confidence: 53,
    predicted: "Shale",
    rare: false,
  },
  {
    id: "W-09 · 1744.3m",
    well: "WELL-09",
    depth: "1,744.3 m",
    confidence: 56,
    predicted: "Dolomite",
    rare: true,
  },
];

const navItems: { id: View; label: string; icon: typeof Activity; badge?: number }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "experiments", label: "Experiments", icon: FlaskConical },
  { id: "annotation", label: "Annotation queue", icon: Tag, badge: 12 },
  { id: "datasets", label: "Datasets", icon: Database },
];

function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {accent && (
          <span className="icon-chip">
            <Sparkles size={14} />
          </span>
        )}
      </div>
      <p className="mt-5 text-[30px] font-semibold tracking-[-0.04em] text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </div>
  );
}

function PerformanceChart() {
  const lines = [
    {
      name: "Rare-class aware",
      color: "#B95735",
      points: "38,130 94,112 150,91 206,76 262,57 318,46 374,35 430,28 486,22",
    },
    {
      name: "Uncertainty",
      color: "#536B63",
      points: "38,132 94,116 150,99 206,87 262,76 318,68 374,60 430,54 486,49",
    },
    {
      name: "Random",
      color: "#B1AAA0",
      points: "38,135 94,126 150,118 206,111 262,102 318,96 374,91 430,85 486,80",
    },
  ];
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        {lines.map((line) => (
          <span key={line.name} className="flex items-center gap-2 text-xs font-medium text-muted">
            <i className="h-2 w-2 rounded-full" style={{ background: line.color }} />
            {line.name}
          </span>
        ))}
      </div>
      <svg
        viewBox="0 0 520 165"
        className="w-full overflow-visible"
        role="img"
        aria-label="Macro F1 score by labels acquired"
      >
        {[24, 60, 96, 132].map((y, index) => (
          <g key={y}>
            <line x1="38" y1={y} x2="496" y2={y} stroke="#E7E3DC" strokeDasharray="4 5" />
            <text x="0" y={y + 4} className="chart-label">
              {(0.9 - index * 0.2).toFixed(1)}
            </text>
          </g>
        ))}
        {["40", "80", "120", "160", "200"].map((label, index) => (
          <text
            key={label}
            x={38 + index * 114.5}
            y="158"
            textAnchor={index === 0 ? "start" : index === 4 ? "end" : "middle"}
            className="chart-label"
          >
            {label}
          </text>
        ))}
        {lines.map((line) => (
          <g key={line.name}>
            <polyline
              points={line.points}
              fill="none"
              stroke={line.color}
              strokeWidth={line.name === "Rare-class aware" ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {line.points.split(" ").map((point, index) => {
              const [cx, cy] = point.split(",");
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={line.name === "Rare-class aware" ? 3 : 2.5}
                  fill="#FAF9F6"
                  stroke={line.color}
                  strokeWidth="2"
                />
              );
            })}
          </g>
        ))}
      </svg>
      <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
        Labels acquired
      </p>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [strategy, setStrategy] = useState<Strategy>("Rare-class aware");
  const [rareShare, setRareShare] = useState(30);
  const [batchSize, setBatchSize] = useState(20);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [iteration, setIteration] = useState(8);
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const labeledCount = 160 + Object.keys(labels).length;
  const queueRemaining = initialSamples.length - Object.keys(labels).length;
  const title = {
    overview: "Experiment overview",
    experiments: "Active learning experiments",
    annotation: "Expert annotation queue",
    datasets: "Lithology datasets",
  }[view];

  const rareCount = useMemo(
    () => initialSamples.filter((sample) => sample.rare && !labels[sample.id]).length,
    [labels],
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const runIteration = () => {
    setIsRunning(true);
    window.setTimeout(() => {
      setIteration((value) => value + 1);
      setIsRunning(false);
      showToast(`Iteration ${iteration + 1} complete — ${batchSize} candidates added`);
    }, 850);
  };

  const annotate = (id: string, lithology: string) => {
    setLabels((current) => ({ ...current, [id]: lithology }));
    showToast(`${lithology} label saved`);
  };

  const exportReport = () => {
    const report = {
      experiment: "RCAL-SVM-004",
      strategy,
      iteration,
      labelsAcquired: labeledCount,
      batchSize,
      rareClassReservation: rareShare,
      macroF1: 0.84,
      rareClassRecall: 0.71,
      annotations: labels,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lithoscan-experiment-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Experiment report exported");
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside
        className={`sidebar ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-6">
          <button className="flex items-center gap-3 text-left" onClick={() => setView("overview")}>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-clay text-white">
              <Layers3 size={19} />
            </span>
            <span>
              <span className="block text-[15px] font-semibold tracking-tight text-white">
                LithoScan
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-white/45">
                Research lab
              </span>
            </span>
          </button>
          <button
            className="text-white/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Workspace
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`nav-item ${view === item.id ? "nav-item-active" : ""}`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
                      {Math.max(0, item.badge - Object.keys(labels).length)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mx-4 mt-1 border-t border-white/10 pt-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Current project
          </p>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-moss/30 text-[#C3D0BD]">
                <Mountain size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white/90">North Basin wells</p>
                <p className="mt-1 text-[11px] text-white/45">7,000 observations</p>
              </div>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[64%] bg-clay" />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-white/40">
              <span>{labeledCount} labeled</span>
              <span>2.3%</span>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-white/10 p-4">
          <button className="nav-item" onClick={() => showToast("Help center opened")}>
            <CircleHelp size={17} />
            Documentation
          </button>
          <button className="nav-item" onClick={() => showToast("Workspace settings opened")}>
            <Settings size={17} />
            Settings
          </button>
          <div className="mt-4 flex items-center gap-3 px-3 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#D3C4B6] text-xs font-bold text-stone">
              SM
            </span>
            <div>
              <p className="text-xs font-medium text-white/90">Sarang Marath</p>
              <p className="text-[10px] text-white/40">Researcher</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close overlay"
        />
      )}

      <main className="lg:ml-[248px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-line bg-canvas/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-line lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>
            <div>
              <h1 className="text-[18px] font-semibold tracking-[-0.02em]">{title}</h1>
              <p className="hidden text-xs text-muted sm:block">
                Rare-class-aware SVM classification
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="icon-button hidden sm:grid"
              aria-label="Search"
              onClick={() => showToast("Search is ready")}
            >
              <Search size={17} />
            </button>
            <button
              className="icon-button relative hidden sm:grid"
              aria-label="Notifications"
              onClick={() => showToast("No new notifications")}
            >
              <Bell size={17} />
              <i className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-clay" />
            </button>
            <a
              className="button-secondary"
              href="/lithoscan-active-learning.zip"
              download="lithoscan-active-learning.zip"
              title="Download the complete source code"
            >
              <ArrowDownToLine size={15} />
              <span className="hidden md:inline">Download code</span>
            </a>
            <button className="button-secondary hidden md:flex" onClick={exportReport}>
              <ArrowDownToLine size={15} /> Export
            </button>
            <button className="button-primary" onClick={() => setView("experiments")}>
              <Plus size={16} /> <span className="hidden sm:inline">New experiment</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] p-5 md:p-8">
          {view === "overview" && (
            <div className="animate-in">
              <section className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="status-dot" />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">
                      Experiment running
                    </span>
                  </div>
                  <h2 className="max-w-2xl text-[30px] font-semibold tracking-[-0.045em] md:text-[38px]">
                    Rare lithologies, brought into focus.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                    Monitor label efficiency and class coverage across the North Basin well-log
                    dataset.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="select-wrap">
                    <span className="text-xs text-muted">RCAL-SVM-004</span>
                    <ChevronDown size={14} />
                  </div>
                  <button className="button-primary" onClick={runIteration} disabled={isRunning}>
                    <Play size={15} fill="currentColor" />
                    {isRunning ? "Running…" : "Run iteration"}
                  </button>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Macro F1 score"
                  value="0.84"
                  detail="+6.3% from baseline"
                  accent
                />
                <MetricCard
                  label="Rare-class recall"
                  value="71%"
                  detail="+18 pts vs. uncertainty"
                  accent
                />
                <MetricCard
                  label="Labels acquired"
                  value={String(labeledCount)}
                  detail="of 200 annotation budget"
                />
                <MetricCard
                  label="Current iteration"
                  value={`${iteration} / 10`}
                  detail={`${Math.max(0, (10 - iteration) * batchSize)} labels remaining`}
                />
              </section>

              <section className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
                <div className="panel p-5 md:p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="section-title">Learning performance</p>
                      <p className="section-subtitle">Macro F1 across annotation budgets</p>
                    </div>
                    <button className="text-link" onClick={() => setView("experiments")}>
                      View details <ArrowUpRight size={13} />
                    </button>
                  </div>
                  <PerformanceChart />
                </div>
                <div className="panel p-5 md:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="section-title">Label distribution</p>
                      <p className="section-subtitle">Current labeled set</p>
                    </div>
                    <span className="text-xs font-medium text-muted">{labeledCount} total</span>
                  </div>
                  <div className="mt-6 space-y-4">
                    {lithologies.map((item) => {
                      const labeled = Math.round((item.count / 7000) * labeledCount);
                      return (
                        <div key={item.name}>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 font-medium">
                              <i
                                className="h-2 w-2 rounded-sm"
                                style={{ background: item.color }}
                              />
                              {item.name}
                            </span>
                            <span className="font-mono text-muted">{labeled}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-wash">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(7, (item.count / 2880) * 100)}%`,
                                background: item.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 rounded-lg border border-clay/15 bg-clay/[0.06] p-3 text-xs leading-5 text-muted">
                    <strong className="font-semibold text-clay">Rare-class reserve:</strong> 6 of
                    the next 20 queries target Dolomite and Coal candidates.
                  </div>
                </div>
              </section>

              <section className="mt-4 panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-5 py-4 md:px-6">
                  <div>
                    <p className="section-title">Priority annotations</p>
                    <p className="section-subtitle">
                      Lowest-confidence candidates in the current batch
                    </p>
                  </div>
                  <button className="text-link" onClick={() => setView("annotation")}>
                    Open queue <ArrowUpRight size={13} />
                  </button>
                </div>
                <SampleTable
                  samples={initialSamples.slice(0, 3)}
                  labels={labels}
                  annotate={annotate}
                  compact
                />
              </section>
            </div>
          )}

          {view === "experiments" && (
            <div className="animate-in">
              <div className="mb-7 max-w-2xl">
                <p className="eyebrow text-clay">Experiment RCAL-SVM-004</p>
                <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.04em]">
                  Configure the acquisition strategy
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Compare query methods using the same SVM model, initial labeled set, and
                  annotation budget.
                </p>
              </div>
              <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
                <div className="panel p-5 md:p-7">
                  <p className="section-title">Query strategy</p>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {(["Rare-class aware", "Uncertainty", "Random"] as Strategy[]).map((item) => (
                      <button
                        key={item}
                        onClick={() => setStrategy(item)}
                        className={`strategy-card ${strategy === item ? "strategy-card-active" : ""}`}
                      >
                        <span className="flex items-center justify-between">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-wash">
                            <Activity size={16} />
                          </span>
                          {strategy === item && <Check size={16} className="text-clay" />}
                        </span>
                        <strong>{item}</strong>
                        <small>
                          {item === "Rare-class aware"
                            ? "Reserve queries for predicted minority classes."
                            : item === "Uncertainty"
                              ? "Select samples closest to the SVM boundary."
                              : "Sample the unlabeled pool uniformly."}
                        </small>
                      </button>
                    ))}
                  </div>
                  <div className="mt-7 grid gap-6 border-t border-line pt-6 md:grid-cols-2">
                    <label>
                      <span className="input-label">
                        Batch size <b>{batchSize}</b>
                      </span>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        step="5"
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                      />
                      <span className="range-labels">
                        <i>10</i>
                        <i>50</i>
                      </span>
                    </label>
                    <label className={strategy !== "Rare-class aware" ? "opacity-40" : ""}>
                      <span className="input-label">
                        Rare-class reservation <b>{rareShare}%</b>
                      </span>
                      <input
                        disabled={strategy !== "Rare-class aware"}
                        type="range"
                        min="10"
                        max="50"
                        step="5"
                        value={rareShare}
                        onChange={(e) => setRareShare(Number(e.target.value))}
                      />
                      <span className="range-labels">
                        <i>10%</i>
                        <i>50%</i>
                      </span>
                    </label>
                    <label>
                      <span className="input-label">SVM kernel</span>
                      <div className="select-wrap mt-2 w-full justify-between">
                        RBF (radial basis)
                        <ChevronDown size={15} />
                      </div>
                    </label>
                    <label>
                      <span className="input-label">Annotation budget</span>
                      <div className="select-wrap mt-2 w-full justify-between">
                        200 labels
                        <ChevronDown size={15} />
                      </div>
                    </label>
                  </div>
                  <button
                    className="button-primary mt-7 w-full justify-center py-3"
                    onClick={runIteration}
                    disabled={isRunning}
                  >
                    <Play size={15} fill="currentColor" />
                    {isRunning ? "Training SVM classifier…" : `Run iteration ${iteration + 1}`}
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="panel p-6">
                    <p className="section-title">Next batch composition</p>
                    <p className="section-subtitle">Based on current settings</p>
                    <div className="mt-6 flex items-center gap-6">
                      <div
                        className="donut"
                        style={
                          {
                            "--value": strategy === "Rare-class aware" ? `${rareShare}%` : "0%",
                          } as React.CSSProperties
                        }
                      >
                        <span>
                          {strategy === "Rare-class aware"
                            ? Math.round((batchSize * rareShare) / 100)
                            : 0}
                        </span>
                        <small>rare</small>
                      </div>
                      <div className="space-y-3 text-sm">
                        <p>
                          <b className="text-xl">
                            {strategy === "Rare-class aware"
                              ? Math.round((batchSize * rareShare) / 100)
                              : 0}
                          </b>
                          <br />
                          <span className="text-muted">rare-class candidates</span>
                        </p>
                        <p>
                          <b className="text-xl">
                            {strategy === "Rare-class aware"
                              ? batchSize - Math.round((batchSize * rareShare) / 100)
                              : batchSize}
                          </b>
                          <br />
                          <span className="text-muted">
                            {strategy === "Random" ? "random" : "uncertain"} candidates
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="panel p-6">
                    <p className="section-title">Controlled variables</p>
                    <div className="mt-4 divide-y divide-line text-xs">
                      {[
                        ["Dataset split", "Well-grouped"],
                        ["Feature scaling", "StandardScaler"],
                        ["Class weights", "Balanced"],
                        ["Random seed", "42"],
                      ].map(([a, b]) => (
                        <div key={a} className="flex justify-between py-3">
                          <span className="text-muted">{a}</span>
                          <strong>{b}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "annotation" && (
            <div className="animate-in">
              <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="eyebrow text-clay">Iteration {iteration}</p>
                  <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.04em]">
                    Review model-selected samples
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    {queueRemaining} candidates remain · {rareCount} rare-class predictions
                  </p>
                </div>
                <button
                  className="button-secondary"
                  onClick={() => showToast(`${Object.keys(labels).length} annotations submitted`)}
                >
                  <Check size={15} /> Submit annotations
                </button>
              </div>
              <div className="panel overflow-hidden">
                <SampleTable samples={initialSamples} labels={labels} annotate={annotate} />
              </div>
              {queueRemaining === 0 && (
                <div className="mt-4 rounded-xl border border-moss/20 bg-moss/[0.06] p-6 text-center">
                  <Check className="mx-auto text-moss" />
                  <p className="mt-2 font-semibold">Batch complete</p>
                  <p className="mt-1 text-sm text-muted">
                    All candidate labels are ready for the next training iteration.
                  </p>
                </div>
              )}
            </div>
          )}

          {view === "datasets" && (
            <div className="animate-in">
              <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="eyebrow text-clay">Data library</p>
                  <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.04em]">
                    Well-log datasets
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Manage the observations used across your active learning studies.
                  </p>
                </div>
                <input
                  ref={fileRef}
                  className="hidden"
                  type="file"
                  accept=".csv"
                  onChange={(event) =>
                    event.target.files?.[0] && showToast(`${event.target.files[0].name} uploaded`)
                  }
                />
                <button className="button-primary" onClick={() => fileRef.current?.click()}>
                  <Upload size={16} /> Upload CSV
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.7fr]">
                <div className="panel overflow-hidden">
                  <div className="border-b border-line p-6">
                    <div className="flex items-start justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-clay/10 text-clay">
                        <Database size={21} />
                      </span>
                      <span className="tag tag-green">Active</span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">North Basin well logs</h3>
                    <p className="mt-1 text-sm text-muted">
                      Gamma ray, density, sonic, neutron porosity and resistivity measurements.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-line border-b border-line sm:grid-cols-4">
                    {[
                      ["7,000", "Observations"],
                      ["11", "Wells"],
                      ["5", "Lithologies"],
                      ["8", "Features"],
                    ].map(([value, name]) => (
                      <div key={name} className="p-5">
                        <b className="text-xl">{value}</b>
                        <p className="mt-1 text-xs text-muted">{name}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-6">
                    <p className="eyebrow">Class balance</p>
                    <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                      {lithologies.map((item) => (
                        <i
                          key={item.name}
                          style={{ width: `${item.count / 70}%`, background: item.color }}
                        />
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4">
                      {lithologies.map((item) => (
                        <span
                          key={item.name}
                          className="flex items-center gap-1.5 text-[11px] text-muted"
                        >
                          <i className="h-2 w-2 rounded-sm" style={{ background: item.color }} />
                          {item.name} {Math.round(item.count / 70)}%
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="panel p-6">
                  <p className="section-title">Dataset health</p>
                  <p className="section-subtitle">Validation summary</p>
                  <div className="mt-6 space-y-4">
                    {[
                      ["Missing values", "0.8%", 8],
                      ["Duplicate rows", "0.2%", 2],
                      ["Labeled coverage", "2.3%", 23],
                      ["Rare-class share", "9.4%", 94],
                    ].map(([name, value, width]) => (
                      <div key={String(name)}>
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-muted">{name}</span>
                          <b>{value}</b>
                        </div>
                        <div className="h-1.5 rounded-full bg-wash">
                          <div
                            className="h-full rounded-full bg-moss"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="button-secondary mt-7 w-full justify-center"
                    onClick={() => showToast("Dataset validation complete")}
                  >
                    <Activity size={15} /> Run validation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function SampleTable({
  samples,
  labels,
  annotate,
  compact = false,
}: {
  samples: typeof initialSamples;
  labels: Record<string, string>;
  annotate: (id: string, lithology: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr>
            <th>Sample</th>
            <th>Model prediction</th>
            <th>Confidence</th>
            <th>Selection reason</th>
            <th className="text-right">Expert label</th>
          </tr>
        </thead>
        <tbody>
          {samples.map((sample) => (
            <tr key={sample.id} className={labels[sample.id] ? "opacity-55" : ""}>
              <td>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-wash text-stone">
                    <Mountain size={16} />
                  </span>
                  <div>
                    <b className="block text-xs">{sample.well}</b>
                    <span className="text-[11px] text-muted">{sample.depth}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className={`tag ${sample.rare ? "tag-clay" : ""}`}>{sample.predicted}</span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-wash">
                    <div
                      className="h-full rounded-full bg-clay"
                      style={{ width: `${sample.confidence}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-muted">{sample.confidence}%</span>
                </div>
              </td>
              <td>
                <span className="text-xs text-muted">
                  {sample.rare ? "Rare-class reserve" : "High uncertainty"}
                </span>
              </td>
              <td className="text-right">
                {labels[sample.id] ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-moss">
                    <Check size={14} />
                    {labels[sample.id]}
                  </span>
                ) : (
                  <select
                    aria-label={`Label ${sample.id}`}
                    defaultValue=""
                    onChange={(event) =>
                      event.target.value && annotate(sample.id, event.target.value)
                    }
                    className="table-select"
                  >
                    <option value="" disabled>
                      {compact ? "Label" : "Select lithology"}
                    </option>
                    {lithologies.map((item) => (
                      <option key={item.name}>{item.name}</option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
