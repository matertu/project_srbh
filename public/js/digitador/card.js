// ── Mapa de status → label e classe CSS ──────────────────────
const STATUS_MAP = {
  R: { label: "RECEBIDO", classe: "status-r" },
  E: { label: "ENVIADO", classe: "status-enviado" },
  P: { label: "PENDENTE", classe: "status-pendente" },
  A: { label: "ARQUIVADO", classe: "status-arquivado" },
};

// ── Formata "YYYY-MM-DD" → "MM/YYYY" ─────────────────────────
function formatarData(dataStr) {
  if (!dataStr) return "—";
  const [ano, mes] = dataStr.split("-");
  return `${mes}/${ano}`;
}

// ── Cria um card de boletim ───────────────────────────────────
function criarCard(boletim) {
  const s = STATUS_MAP[boletim.status_boletim] ?? {
    label: boletim.status_boletim,
    classe: "status-r",
  };
  const data = formatarData(boletim.ano_mes_boletim);
  const receb = formatarData(boletim.data_recebimento_boletim);

  const div = document.createElement("div");
  div.className = "boletim-card";
  div.title = "Clique para visualizar";
  div.innerHTML = `
    <h3>Boletim #${boletim.id_boletim}</h3>
    <p>Ref.: ${data}</p>
    <p>Recebido: ${receb}</p>
    <p>Estação: ${boletim.id_estacao}</p>
    <span class="status ${s.classe}">${s.label}</span>
  `;
  div.addEventListener("click", () => abrirVisualizador(boletim.id_boletim));
  return div;
}

// ── Mostra erro no banner ─────────────────────────────────────
function mostrarErro(msg) {
  const banner = document.getElementById("erroBanner");
  banner.textContent = "⚠ " + msg;
  banner.style.display = "block";
}

