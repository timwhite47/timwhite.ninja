import { csvParse, extent, scaleBand, scaleLinear, timer } from 'd3';

interface Row {
  t: number;
  agent: string;
  lane: 'board' | 'target';
}

const DAY = 86400;
const FADE = 60; // simulated seconds

export function mount(host: HTMLElement): () => void {
  const canvas = host.querySelector('canvas')!;
  const status = host.querySelector<HTMLOutputElement>('[data-role=status]')!;
  const toggle = host.querySelector<HTMLButtonElement>('[data-action=toggle]')!;
  const scrub = host.querySelector<HTMLInputElement>('[data-action=scrub]')!;
  const speedSel = host.querySelector<HTMLSelectElement>('[data-action=speed]')!;
  const ctx = canvas.getContext('2d')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let rows: Row[] = [];
  let now = 0;
  let playing = false;
  let speed = Number(speedSel.value);
  let w = 0;
  let h = 0;
  let lastStatus = 0;
  let loop: ReturnType<typeof timer> | null = null;
  let disposed = false;

  const x = scaleLinear().domain([0, DAY]);
  const y = scaleBand<string>().domain(['board', 'target']).paddingInner(0.1);
  const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.range([8, w - 8]);
    y.range([8, h - 8]);
    draw();
  }

  function fmtClock(t: number) {
    const s = Math.floor(t);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const ink = css('--ink-2') || '#444';
    const accent = css('--accent') || '#0e6b74';
    const flag = css('--flag') || '#8a5200';
    ctx.strokeStyle = css('--rule') || '#ccc';
    for (const lane of ['board', 'target']) {
      const ly = (y(lane) ?? 0) + y.bandwidth() / 2;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(w, ly);
      ctx.stroke();
    }
    const bw = y.bandwidth();
    for (const r of rows) {
      const age = now - r.t;
      if (age < 0 || age > FADE) continue;
      ctx.globalAlpha = 1 - age / FADE;
      ctx.fillStyle = r.lane === 'board' ? accent : flag;
      const jitter = (hash(r.agent) % 1000) / 1000;
      ctx.fillRect(x(r.t), (y(r.lane) ?? 0) + jitter * (bw - 2), 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = ink;
    ctx.fillRect(x(now), 0, 1, h);
  }

  function hash(s: string) {
    let n = 0;
    for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(n);
  }

  function updateStatus(force = false) {
    const t = performance.now();
    if (!force && t - lastStatus < 250) return;
    lastStatus = t;
    const board = new Set<string>();
    let targetReqs = 0;
    for (const r of rows) {
      const age = now - r.t;
      if (age < 0 || age > FADE) continue;
      if (r.lane === 'board') board.add(r.agent);
      else targetReqs++;
    }
    status.textContent = `t = ${fmtClock(now)} · ${board.size} active on board · ${targetReqs} requests to target`;
  }

  function setPlaying(p: boolean) {
    playing = p;
    toggle.textContent = p ? 'Pause' : 'Play';
    toggle.setAttribute('aria-pressed', String(p));
  }

  function render() {
    scrub.value = String(Math.round((now / DAY) * 1000));
    draw();
    updateStatus();
  }

  const onToggle = () => setPlaying(!playing);
  const onScrub = () => {
    now = (Number(scrub.value) / 1000) * DAY;
    render();
    updateStatus(true);
  };
  const onSpeed = () => (speed = Number(speedSel.value));
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space' && e.target === host.querySelector('.replay-toolbar')) {
      e.preventDefault();
      onToggle();
    }
  };
  toggle.addEventListener('click', onToggle);
  scrub.addEventListener('input', onScrub);
  speedSel.addEventListener('change', onSpeed);
  host.querySelector('.replay-toolbar')?.addEventListener('keydown', onKey as EventListener);

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  fetch(host.dataset.src!)
    .then((r) => r.text())
    .then((text) => {
      if (disposed) return;
      rows = csvParse(text).map((d) => ({
        t: Number(d.t_s),
        agent: d.agent_id ?? '',
        lane: d.target === 'hf' ? 'target' : 'board',
      }));
      const [lo, hi] = extent(rows, (r) => r.t);
      x.domain([0, Math.max(DAY, hi ?? DAY)]);
      now = lo ?? 0;
      resize();
      render();
      updateStatus(true);
      setPlaying(!reduced && host.dataset.autoplay === 'true');
    })
    .catch(() => {
      status.textContent = 'Could not load the data. Use the CSV link instead.';
    });

  let prev = 0;
  loop = timer((elapsed) => {
    // elapsed is cumulative; advance by frame delta using a closure variable
    const dt = Math.min(elapsed - prev, 100) / 1000;
    prev = elapsed;
    if (!playing || rows.length === 0) return;
    now += dt * speed * 60;
    if (now >= DAY) {
      now = DAY;
      setPlaying(false);
    }
    render();
  });

  return () => {
    disposed = true;
    loop?.stop();
    ro.disconnect();
    toggle.removeEventListener('click', onToggle);
    scrub.removeEventListener('input', onScrub);
    speedSel.removeEventListener('change', onSpeed);
  };
}
