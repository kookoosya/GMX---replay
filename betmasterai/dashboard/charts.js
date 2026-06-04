const Charts = {
  drawWhaleFeedChart(canvas, data) {
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = 300;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    const pad = { top: 20, right: 20, bottom: 40, left: 50 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    // Zone backgrounds
    const zones = [
      { min: 0.65, max: 1.0, color: 'rgba(34, 197, 94, 0.08)' },
      { min: 0.45, max: 0.65, color: 'rgba(234, 179, 8, 0.08)' },
      { min: 0.0, max: 0.45, color: 'rgba(239, 68, 68, 0.08)' }
    ];
    for (const z of zones) {
      const y1 = pad.top + ch * (1 - z.max);
      const y2 = pad.top + ch * (1 - z.min);
      ctx.fillStyle = z.color;
      ctx.fillRect(pad.left, y1, cw, y2 - y1);
    }

    // Zone threshold lines
    const thresholds = [
      { val: 0.65, color: 'rgba(34, 197, 94, 0.3)', label: '65 — Full' },
      { val: 0.45, color: 'rgba(234, 179, 8, 0.3)', label: '45 — Cautious' }
    ];
    for (const t of thresholds) {
      const y = pad.top + ch * (1 - t.val);
      ctx.strokeStyle = t.color;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = t.color.replace('0.3', '0.6');
      ctx.font = '11px sans-serif';
      ctx.fillText(t.label, pad.left + 4, y - 4);
    }

    // Y-axis
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const val = i * 10;
      const y = pad.top + ch * (1 - val / 100);
      ctx.fillText(val.toString(), pad.left - 8, y + 4);
      if (i > 0 && i < 10) {
        ctx.strokeStyle = 'rgba(42, 45, 62, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + cw, y);
        ctx.stroke();
      }
    }

    // X-axis time labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7280';
    const minTs = data[0].timestamp;
    const maxTs = data[data.length - 1].timestamp;
    const totalMs = maxTs - minTs;
    const labelCount = Math.min(8, data.length);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.floor((i / (labelCount - 1)) * (data.length - 1));
      const point = data[idx];
      const x = pad.left + (idx / (data.length - 1)) * cw;
      const d = new Date(point.timestamp);
      const label = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
      ctx.fillText(label, x, h - pad.bottom + 20);
    }

    // Line
    ctx.beginPath();
    ctx.lineWidth = 2;
    for (let i = 0; i < data.length; i++) {
      const x = pad.left + (i / (data.length - 1)) * cw;
      const y = pad.top + ch * (1 - data[i].score);
      const score = data[i].score;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();

    // Gradient fill under line
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
    ctx.lineTo(pad.left + cw, pad.top + ch);
    ctx.lineTo(pad.left, pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Current value dot
    if (data.length > 0) {
      const last = data[data.length - 1];
      const x = pad.left + cw;
      const y = pad.top + ch * (1 - last.score);
      const color = last.score >= 0.65 ? '#22c55e' : last.score >= 0.45 ? '#eab308' : '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#1e2130';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  },

  drawEquityCurve(canvas, data) {
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = 300;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    const pad = { top: 20, right: 20, bottom: 40, left: 60 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    const equities = data.map(d => d.equity);
    const minEq = Math.floor(Math.min(...equities) * 0.98);
    const maxEq = Math.ceil(Math.max(...equities) * 1.02);
    const range = maxEq - minEq || 1;

    // Y-axis
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const val = minEq + (range * i / 5);
      const y = pad.top + ch * (1 - i / 5);
      ctx.fillText('$' + val.toFixed(1), pad.left - 8, y + 4);
      ctx.strokeStyle = 'rgba(42, 45, 62, 0.5)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
    }

    // Starting equity line
    const startY = pad.top + ch * (1 - (100 - minEq) / range);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, startY);
    ctx.lineTo(pad.left + cw, startY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Start $100', pad.left + 4, startY - 4);

    // Line
    ctx.beginPath();
    ctx.lineWidth = 2;
    for (let i = 0; i < data.length; i++) {
      const x = pad.left + (i / (data.length - 1)) * cw;
      const y = pad.top + ch * (1 - (data[i].equity - minEq) / range);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }

    const lastEq = data[data.length - 1].equity;
    const isUp = lastEq >= 100;
    ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
    ctx.stroke();

    // Fill
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    gradient.addColorStop(0, isUp ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.lineTo(pad.left + cw, pad.top + ch);
    ctx.lineTo(pad.left, pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Current dot
    const lastX = pad.left + cw;
    const lastY = pad.top + ch * (1 - (lastEq - minEq) / range);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = isUp ? '#22c55e' : '#ef4444';
    ctx.fill();

    // Current value label
    ctx.fillStyle = isUp ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('$' + lastEq.toFixed(2), lastX - 10, lastY - 10);
  }
};

window.Charts = Charts;
