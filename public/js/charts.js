// ══════════════════════════════════════════════════════════════════════
//  charts.js — Gráficos em Canvas nativo para o SRBH (sem libs externas)
// ══════════════════════════════════════════════════════════════════════

// ── Paleta de cores dos status ───────────────────────────────────────
const CHART_COLORS = {
  R: "#6b7280",
  D: "#2563eb",
  AN: "#16a34a",
  A: "#7c3aed",
  E: "#d97706",
};

const CHART_LABELS = {
  R: "Recebido",
  D: "Digitado",
  AN: "Analisado",
  A: "Arquivado",
  E: "Enviado",
};

// ══════════════════════════════════════════════════════════════════════
//  Gráfico de Barras
// ══════════════════════════════════════════════════════════════════════
/**
 * Desenha um gráfico de barras em um canvas.
 * @param {string} canvasId - ID do elemento <canvas>
 * @param {Object} dados    - { R: 5, D: 12, AN: 8, A: 3, E: 10 }
 * @param {string} titulo   - Título do gráfico
 */
function desenharGraficoBarras(canvasId, dados, titulo = "") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  // High-DPI
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const padTop = titulo ? 50 : 30;
  const padBottom = 60;
  const padLeft = 60;
  const padRight = 20;

  ctx.clearRect(0, 0, W, H);

  // Fundo
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, W, H);

  // Título
  if (titulo) {
    ctx.fillStyle = "#0b3d5c";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(titulo, W / 2, 28);
  }

  const chaves = Object.keys(dados);
  const valores = Object.values(dados);
  const maxVal = Math.max(...valores, 1);

  const areaW = W - padLeft - padRight;
  const areaH = H - padTop - padBottom;
  const barW = Math.min(60, (areaW / chaves.length) * 0.6);
  const gap = areaW / chaves.length;

  // Grid horizontal
  const numLinhas = 5;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.font = "12px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "#64748b";

  for (let i = 0; i <= numLinhas; i++) {
    const y = padTop + areaH - (areaH / numLinhas) * i;
    const val = Math.round((maxVal / numLinhas) * i);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(W - padRight, y);
    ctx.stroke();
    ctx.fillText(val, padLeft - 8, y + 4);
  }

  // Barras
  chaves.forEach((key, idx) => {
    const val = valores[idx];
    const barH = (val / maxVal) * areaH;
    const x = padLeft + gap * idx + (gap - barW) / 2;
    const y = padTop + areaH - barH;

    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(x + 3, y + 3, barW, barH);

    // Barra
    const cor = CHART_COLORS[key] || "#6b7280";
    ctx.fillStyle = cor;
    _roundRect(ctx, x, y, barW, barH, 6);
    ctx.fill();

    // Valor no topo da barra
    ctx.fillStyle = "#0b3d5c";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(val, x + barW / 2, y - 8);

    // Label embaixo
    ctx.fillStyle = "#334155";
    ctx.font = "12px Arial, sans-serif";
    ctx.fillText(CHART_LABELS[key] || key, x + barW / 2, padTop + areaH + 20);
  });
}

// ══════════════════════════════════════════════════════════════════════
//  Gráfico de Pizza
// ══════════════════════════════════════════════════════════════════════
/**
 * Desenha um gráfico de pizza em um canvas.
 * @param {string} canvasId - ID do elemento <canvas>
 * @param {Object} dados    - { "WhatsApp": 15, "Correios": 8, "Digitalização local": 5 }
 * @param {string} titulo   - Título do gráfico
 */
function desenharGraficoPizza(canvasId, dados, titulo = "") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, W, H);

  // Título
  if (titulo) {
    ctx.fillStyle = "#0b3d5c";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(titulo, W / 2, 28);
  }

  const coresPizza = [
    "#2563eb",
    "#d97706",
    "#16a34a",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
  ];
  const chaves = Object.keys(dados);
  const valores = Object.values(dados);
  const total = valores.reduce((a, b) => a + b, 0);

  if (total === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sem dados disponíveis", W / 2, H / 2);
    return;
  }

  const cx = W * 0.38;
  const cy = H / 2 + 10;
  const raio = Math.min(cx - 30, cy - 50);

  let angulo = -Math.PI / 2;

  chaves.forEach((key, idx) => {
    const fatia = (valores[idx] / total) * Math.PI * 2;
    const cor = coresPizza[idx % coresPizza.length];

    // Fatia
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, raio, angulo, angulo + fatia);
    ctx.closePath();
    ctx.fillStyle = cor;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Percentual no meio da fatia
    if (fatia > 0.15) {
      const midAngle = angulo + fatia / 2;
      const tx = cx + raio * 0.6 * Math.cos(midAngle);
      const ty = cy + raio * 0.6 * Math.sin(midAngle);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(Math.round((valores[idx] / total) * 100) + "%", tx, ty + 5);
    }

    angulo += fatia;
  });

  // Legenda à direita
  const legendaX = W * 0.68;
  let legendaY = cy - (chaves.length * 24) / 2;

  chaves.forEach((key, idx) => {
    const cor = coresPizza[idx % coresPizza.length];
    ctx.fillStyle = cor;
    ctx.fillRect(legendaX, legendaY, 16, 16);
    ctx.fillStyle = "#334155";
    ctx.font = "13px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${key} (${valores[idx]})`, legendaX + 22, legendaY + 13);
    legendaY += 28;
  });
}

// ── Helper: retângulo arredondado ────────────────────────────────────
function _roundRect(ctx, x, y, w, h, r) {
  if (h < 0) {
    y += h;
    h = -h;
  }
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, 0);
  ctx.arcTo(x, y + h, x, y, 0);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
