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

// ── Carrega boletins do banco e preenche o grid ───────────────
async function carregarBoletins(soArquivados = false) {
  const grid = document.getElementById("boletinsGrid");

  try {
    const filtros = soArquivados ? { status_boletim: "A" } : {};
    const lista = await buscarBoletins(filtros);

    // Filtra arquivados fora da view principal
    const filtrados = soArquivados
      ? lista
      : lista.filter((b) => b.status_boletim !== "A");

    grid.innerHTML = "";

    if (filtrados.length === 0) {
      grid.innerHTML = `<div class="grid-vazio">Nenhum boletim encontrado.</div>`;
      document.getElementById("contadorBoletins").textContent = "0";
      return;
    }

    filtrados.forEach((b) => grid.appendChild(criarCard(b)));
    document.getElementById("contadorBoletins").textContent = filtrados.length;

    // Atualiza cards de status
    if (!soArquivados) {
      const enviados = lista.filter((b) => b.status_boletim === "E").length;
      const pendentes = lista.filter((b) =>
        ["R", "P"].includes(b.status_boletim),
      ).length;
      document.getElementById("txtEnviados").textContent =
        `${enviados} boletim(ns) enviado(s) referente(s) aos últimos registros.`;
      document.getElementById("txtPendentes").textContent =
        `${pendentes} boletim(ns) aguardam envio à ANA.`;
    }
  } catch (erro) {
    console.error(erro);
    grid.innerHTML = "";
    mostrarErro("Não foi possível carregar os boletins: " + erro.message);
  }
}

// ── Visualizar arquivados ─────────────────────────────────────
function visualizarArquivados() {
  const contador = document.querySelector(".contador-boletins h2");
  contador.innerHTML = `Boletins arquivados: <span id="contadorBoletins">0</span>`;

  carregarBoletins(true);

  document.querySelector(".arquivados-container").innerHTML = `
    <button class="arquivados-btn" onclick="voltarBoletins()">
      ← VOLTAR PARA BOLETINS DIGITALIZADOS
    </button>
  `;
}

// ── Voltar ────────────────────────────────────────────────────
function voltarBoletins() {
  location.reload();
}

// ── Abre o visualizador passando o ID via URL ─────────────────
function abrirVisualizador(idBoletim) {
  window.location.href = `visualizador.html?id=${idBoletim}`;
}

// ── Init ──────────────────────────────────────────────────────
window.onload = function () {
  carregarBoletins();
};
