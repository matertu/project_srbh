let usuario = null;
let boletimAnalisando = null;

window.addEventListener("DOMContentLoaded", async () => {
  usuario = verificarLogin(["tecnico", "técnico"]);
  if (!usuario) return;
  document.getElementById("userNome").textContent = usuario.nome;

  // Tabs
  document.querySelectorAll(".srbh-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".srbh-tab")
        .forEach((t) => t.classList.remove("ativa"));
      document
        .querySelectorAll(".srbh-secao")
        .forEach((s) => s.classList.remove("ativa"));
      tab.classList.add("ativa");
      const secId =
        tab.dataset.tab === "analise" ? "secAnalise" : "secArquivamento";
      document.getElementById(secId).classList.add("ativa");
    });
  });

  const roteiros = await Roteiros.listar();
  popularSelect(
    document.getElementById("selRoteiroAnalise"),
    roteiros,
    "id_roteiro",
    "nome_roteiro",
    "Todos os roteiros",
  );
  popularSelect(
    document.getElementById("filtroRotArq"),
    roteiros,
    "id_roteiro",
    "nome_roteiro",
    "Todos",
  );
  document
    .getElementById("selRoteiroAnalise")
    .addEventListener("change", carregarAnalise);

  configurarSelecionarTodos("checkAllAnalise", "cb-analise");
  configurarSelecionarTodos("checkAllArq", "cb-arq");
  tornarTabelaOrdenavel("tabelaAnalise");
  tornarTabelaOrdenavel("tabelaArquivamento");

  await carregarKPIs();
  await carregarAnalise();
});

async function carregarKPIs() {
  try {
    const c = await Boletins.contarPorStatus();
    document.getElementById("kpiAguardando").textContent = c.D;
    document.getElementById("kpiAnalisados").textContent = c.AN;
    document.getElementById("kpiAnotacoes").textContent = "—";
  } catch (e) {
    console.error(e);
  }
}

// ── Análise ──────────────────────────────────────────────────────
async function carregarAnalise() {
  const tbody = document.getElementById("tbodyAnalise");
  const rotId = document.getElementById("selRoteiroAnalise").value;
  tbody.innerHTML =
    '<tr><td colspan="10" class="srbh-vazio">Carregando...</td></tr>';
  try {
    let bols;
    if (rotId) {
      bols = await Boletins.listarPorRoteiroViaEstacao(rotId, "D");
    } else {
      bols = await Boletins.listarPorStatus("D");
    }
    document.querySelector("#contadorAnalise .num").textContent = bols.length;
    if (!bols.length) {
      tbody.innerHTML =
        '<tr><td colspan="10" class="srbh-vazio">Nenhum boletim aguardando análise.</td></tr>';
      return;
    }
    tbody.innerHTML = bols
      .map((b) => {
        const dias = diasEntre(b.data_recebimento_boletim);
        return `<tr>
        <td class="center"><input type="checkbox" class="cb-analise" value="${b.id_boletim}" /></td>
        <td>${b.estacao?.cod_ana_estacao || "—"}</td>
        <td>${b.estacao?.nome_estacao || "—"}</td>
        <td class="center">P/F</td>
        <td>${fmtMesAno(b.ano_mes_boletim)}</td>
        <td>${fmtData(b.data_recebimento_boletim)}</td>
        <td>${b.funcionarios?.nome_func || "—"}</td>
        <td>${badgeStatusHTML(b.status_boletim)}</td>
        <td class="center">${semaforoAlerta(dias)}</td>
        <td class="acoes-cell">
          <button class="srbh-btn btn-small btn-success" onclick="abrirAnalise(${b.id_boletim}, '${b.ficheiro_boletim}')">🔍 Analisar</button>
          <button class="srbh-btn btn-small btn-secondary btn-icon" onclick="verHistorico(${b.id_boletim})" title="Histórico">🕐</button>
        </td>
      </tr>`;
      })
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="10" class="srbh-vazio">Erro ao carregar.</td></tr>';
  }
}

function abrirAnalise(id, ficheiroBoletim) {
  boletimAnalisando = id;
  document.getElementById("painelPergunta").style.display = "block";
  document.getElementById("painelAnotacao").style.display = "none";
  document.getElementById("listaAnotacoes").innerHTML = "";

  const areaImg = document.getElementById("modalImagemArea");
  if (
    ficheiroBoletim &&
    ficheiroBoletim !== "null" &&
    ficheiroBoletim !== "undefined"
  ) {
    const url = Storage.getPublicUrl(ficheiroBoletim);
    areaImg.innerHTML = `<img src="${url}" alt="Boletim" style="max-width:100%; object-fit:contain;" />`;
  } else {
    areaImg.innerHTML = `<div class="preview-placeholder">Nenhuma imagem enviada para este boletim.</div>`;
  }

  abrirModal("modalAnalise");
}

function mostrarFormAnotacao() {
  document.getElementById("painelPergunta").style.display = "none";
  document.getElementById("painelAnotacao").style.display = "block";
  addLinhaAnotacao();
}

function addLinhaAnotacao() {
  const div = document.createElement("div");
  div.className = "anotacao-row";
  div.innerHTML = `
    <input type="number" class="srbh-input anot-dia" min="1" max="31" placeholder="Dia" />
    <input type="text" class="srbh-input anot-valor" placeholder="Valor alterado" />
    <input type="text" class="srbh-input anot-obs" placeholder="Observação técnica" />
    <button class="srbh-btn btn-danger btn-icon btn-small" onclick="this.parentElement.remove()">✕</button>
  `;
  document.getElementById("listaAnotacoes").appendChild(div);
}

async function confirmarAnalise() {
  if (!boletimAnalisando) return;
  try {
    await Boletins.atualizarStatus(boletimAnalisando, "AN");
    await Movimentacoes.criar({
      id_boletim: boletimAnalisando,
      id_func: usuario.id,
      status_anterior: "D",
      status_novo: "AN",
    });
    fecharModal("modalAnalise");
    mostrarToast("Boletim analisado! Arquivo movido para pasta de produção.");
    await carregarAnalise();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function salvarAnotacoesEAnalisar() {
  if (!boletimAnalisando) return;
  try {
    await Boletins.atualizarStatus(boletimAnalisando, "AN");
    await Movimentacoes.criar({
      id_boletim: boletimAnalisando,
      id_func: usuario.id,
      status_anterior: "D",
      status_novo: "AN",
      observacao_movimentacao: "Análise com anotações registradas",
    });
    fecharModal("modalAnalise");
    mostrarToast("Anotações salvas e boletim analisado!");
    await carregarAnalise();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function marcarAnalisadoBloco() {
  const ids = [...document.querySelectorAll(".cb-analise:checked")].map((cb) =>
    parseInt(cb.value),
  );
  if (!ids.length) {
    alert("Selecione ao menos um boletim.");
    return;
  }
  try {
    await Boletins.atualizarStatusEmBloco(ids, "AN");
    for (const id of ids) {
      await Movimentacoes.criar({
        id_boletim: id,
        id_func: usuario.id,
        status_anterior: "D",
        status_novo: "AN",
      });
    }
    mostrarToast(`${ids.length} boletim(ns) analisado(s)!`);
    await carregarAnalise();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function verHistorico(id) {
  const conteudo = document.getElementById("historicoConteudo");
  conteudo.innerHTML =
    '<div class="srbh-loader"><div class="srbh-spinner"></div>Carregando...</div>';
  abrirModal("modalHistorico");
  try {
    const movs = await Movimentacoes.listarPorBoletim(id);
    if (!movs.length) {
      conteudo.innerHTML =
        '<p class="srbh-vazio">Nenhuma movimentação registrada.</p>';
      return;
    }
    conteudo.innerHTML =
      '<table class="srbh-table"><thead><tr><th>Data/Hora</th><th>Usuário</th><th>De</th><th>Para</th><th>Obs.</th></tr></thead><tbody>' +
      movs
        .map(
          (m) => `<tr>
        <td>${fmtDataHora(m.date_time_movimentacao)}</td>
        <td>${m.funcionarios?.nome_func || "—"}</td>
        <td>${badgeStatusHTML(m.status_anterior)}</td>
        <td>${badgeStatusHTML(m.status_novo)}</td>
        <td>${m.observacao_movimentacao || "—"}</td>
      </tr>`,
        )
        .join("") +
      "</tbody></table>";
  } catch (e) {
    conteudo.innerHTML =
      '<p class="srbh-vazio">Erro ao carregar histórico.</p>';
  }
}

// ── Arquivamento (idêntico ao alimentador) ───────────────────────
async function filtrarArquivamento() {
  const tbody = document.getElementById("tbodyArquivamento");
  tbody.innerHTML =
    '<tr><td colspan="6" class="srbh-vazio">Carregando...</td></tr>';
  try {
    let bols = await Boletins.listar("status_boletim=in.(AN,E)");
    const rotId = document.getElementById("filtroRotArq").value;
    const mes = document.getElementById("filtroMesArq").value;
    if (rotId) bols = bols.filter((b) => b.estacao?.id_roteiro == rotId);
    if (mes) bols = bols.filter((b) => b.ano_mes_boletim?.startsWith(mes));
    if (!bols.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="srbh-vazio">Nenhum boletim para arquivamento.</td></tr>';
      return;
    }
    tbody.innerHTML = bols
      .map(
        (b) => `<tr>
      <td class="center"><input type="checkbox" class="cb-arq" value="${b.id_boletim}" /></td>
      <td>${b.estacao?.cod_ana_estacao || "—"}</td>
      <td>${b.estacao?.nome_estacao || "—"}</td>
      <td>${fmtMesAno(b.ano_mes_boletim)}</td>
      <td>${badgeStatusHTML(b.status_boletim)}</td>
      <td class="acoes-cell">
        <button class="srbh-btn btn-small btn-primary" onclick="marcarArquivado(${b.id_boletim})">📦 Arquivar</button>
      </td>
    </tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="srbh-vazio">Erro ao carregar.</td></tr>';
  }
}

async function marcarArquivado(id) {
  try {
    await Boletins.atualizarStatus(id, "A");
    await Movimentacoes.criar({
      id_boletim: id,
      id_func: usuario.id,
      status_anterior: "AN",
      status_novo: "A",
    });
    mostrarToast("Boletim arquivado!");
    await filtrarArquivamento();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function marcarArquivadoBloco() {
  const ids = [...document.querySelectorAll(".cb-arq:checked")].map((cb) =>
    parseInt(cb.value),
  );
  if (!ids.length) {
    alert("Selecione ao menos um boletim.");
    return;
  }
  try {
    await Boletins.atualizarStatusEmBloco(ids, "A");
    for (const id of ids) {
      await Movimentacoes.criar({
        id_boletim: id,
        id_func: usuario.id,
        status_anterior: "AN",
        status_novo: "A",
      });
    }
    mostrarToast(`${ids.length} boletim(ns) arquivado(s)!`);
    await filtrarArquivamento();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}
