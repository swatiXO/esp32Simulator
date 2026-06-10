// components/CircuitCanvas.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function CircuitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    type Node = { x: number; y: number };
    type Line = [number, number];
    type Pulse = { line: Line; t: number; speed: number };

    let nodes: Node[] = [];
    let lines: Line[] = [];
    let pulses: Pulse[] = [];
    let animId: number;

    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }

    function initCircuit() {
      nodes = []; lines = []; pulses = [];
      const W = canvas!.width, H = canvas!.height;
      const cols = Math.ceil(W / 90);
      const rows = Math.ceil(H / 90);
      for (let c = 0; c <= cols; c++) {
        for (let r = 0; r <= rows; r++) {
          if (Math.random() > 0.45) continue;
          nodes.push({
            x: c * 90 + (Math.random() - 0.5) * 20,
            y: r * 90 + (Math.random() - 0.5) * 20,
          });
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 130 && Math.random() > 0.55) {
            lines.push([i, j]);
            if (Math.random() > 0.55) {
              pulses.push({ line: [i, j], t: Math.random(), speed: 0.003 + Math.random() * 0.005 });
            }
          }
        }
      }
    }

    function draw() {
      const W = canvas!.width, H = canvas!.height;
      ctx.clearRect(0, 0, W, H);

      /* traces */
      ctx.strokeStyle = 'rgba(59,130,246,0.1)';
      ctx.lineWidth   = 1;
      for (const [a, b] of lines) {
        const ax = nodes[a].x, ay = nodes[a].y;
        const bx = nodes[b].x, by = nodes[b].y;
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        ctx.beginPath();
        if (Math.abs(ax - bx) > Math.abs(ay - by)) {
          ctx.moveTo(ax, ay); ctx.lineTo(mx, ay); ctx.lineTo(mx, by); ctx.lineTo(bx, by);
        } else {
          ctx.moveTo(ax, ay); ctx.lineTo(ax, my); ctx.lineTo(bx, my); ctx.lineTo(bx, by);
        }
        ctx.stroke();
      }

      /* pulses */
      for (const p of pulses) {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
        const [ai, bi] = p.line;
        const ax = nodes[ai].x, ay = nodes[ai].y;
        const bx = nodes[bi].x, by = nodes[bi].y;
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        let px = ax, py = ay;
        const horiz = Math.abs(ax - bx) > Math.abs(ay - by);
        if (p.t < 0.33) {
          const lt = p.t / 0.33;
          px = horiz ? ax + (mx - ax) * lt : ax;
          py = horiz ? ay : ay + (my - ay) * lt;
        } else if (p.t < 0.66) {
          const lt = (p.t - 0.33) / 0.33;
          px = horiz ? mx : ax + (bx - ax) * lt;
          py = horiz ? ay + (by - ay) * lt : my;
        } else {
          const lt = (p.t - 0.66) / 0.34;
          px = horiz ? mx + (bx - mx) * lt : bx;
          py = horiz ? by : my + (by - my) * lt;
        }
        const g = ctx.createRadialGradient(px, py, 0, px, py, 7);
        g.addColorStop(0, 'rgba(59,130,246,0.9)');
        g.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
      }

      /* pads */
      for (const n of nodes) {
        ctx.beginPath(); ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,130,246,0.28)'; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,130,246,0.65)'; ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => { resize(); initCircuit(); });
    ro.observe(canvas);
    resize();
    initCircuit();
    animId = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0, opacity: 0.55,
      }}
    />
  );
}