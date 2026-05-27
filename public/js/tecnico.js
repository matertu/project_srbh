let usuario = null;
let boletimAnalisando = null;

window.addEventListener("DOMContentLoaded", async () => {
  // Tabs (moved to top so they always work)
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

  usuario = verificarLogin(["tecnico", "técnico"]);
  if (!usuario) return;

  try {
    const mesArqInput = document.getElementById("filtroMesArq");
    if (mesArqInput) mascaraMesAno(mesArqInput);

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
  } catch (err) {
    console.error("Erro na inicialização do Técnico:", err);
  }
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
  const tipoEst = document.getElementById("selTipoEstAnalise").value;
  tbody.innerHTML =
    '<tr><td colspan="10" class="srbh-vazio">Carregando...</td></tr>';
  try {
    let bols;
    if (rotId) {
      bols = await Boletins.listarPorRoteiroViaEstacao(rotId, "D");
    } else {
      bols = await Boletins.listarPorStatus("D");
    }
    if (tipoEst) {
      bols = bols.filter(b => b.estacao?.tipo_estacao === tipoEst);
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
      '<tr><td colspan="10" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

function abrirAnalise(id, ficheiroBoletim) {
  boletimAnalisando = id;
  document.getElementById("painelPergunta").style.display = "block";
  document.getElementById("painelAnotacao").style.display = "none";
  document.getElementById("listaAnotacoes").innerHTML = "";
  document.getElementById("btnConfirmarAnalise").style.display = "none";

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

function toggleAnotacao(temAnotacao) {
  if (temAnotacao) {
    document.getElementById("painelAnotacao").style.display = "block";
    if (document.getElementById("listaAnotacoes").children.length === 0) {
      addLinhaAnotacao();
    }
  } else {
    document.getElementById("painelAnotacao").style.display = "none";
    document.getElementById("listaAnotacoes").innerHTML = ""; // Limpa se tinha algo e ele mudou de ideia
  }
  document.getElementById("btnConfirmarAnalise").style.display = "block";
}

function addLinhaAnotacao() {
  const div = document.createElement("div");
  div.className = "anotacao-row";
  div.innerHTML = `
    <input type="number" class="srbh-input anot-dia" min="1" max="31" placeholder="Dia" oninput="if(this.value>31)this.value=31;if(this.value<1&&this.value!=='')this.value=1;" />
    <input type="text" class="srbh-input anot-valor" placeholder="Valor alterado" />
    <input type="text" class="srbh-input anot-obs" placeholder="Observação técnica" />
    <button class="srbh-btn btn-danger btn-icon btn-small" onclick="this.parentElement.remove()">✕</button>
  `;
  document.getElementById("listaAnotacoes").appendChild(div);
}

// confirmarAnalise foi removida e mesclada com salvarAnotacoesEAnalisar

async function salvarAnotacoesEAnalisar() {
  if (!boletimAnalisando) return;
  
  // 1. Coleta os valores digitados nas linhas de anotação
  const anotacoes = [];
  const linhas = document.querySelectorAll("#listaAnotacoes .anotacao-row");
  linhas.forEach((linha) => {
    const dia = linha.querySelector(".anot-dia").value;
    const valor = linha.querySelector(".anot-valor").value;
    const obs = linha.querySelector(".anot-obs").value;
    // Salva apenas se algo foi preenchido
    if (dia || valor || obs) {
      anotacoes.push({ dia, valor, obs });
    }
  });

  const textoAnotacao = anotacoes.length ? JSON.stringify(anotacoes) : null;
  const msgMov = anotacoes.length ? "Análise com anotações salvas em ficheiro_anotacao" : "Análise concluída";

  try {
    // 2. Atualiza o status e a coluna ficheiro_anotacao no banco
    await Boletins.atualizar(boletimAnalisando, {
      status_boletim: "AN",
      ficheiro_anotacao: textoAnotacao
    });

    await Movimentacoes.criar({
      id_boletim: boletimAnalisando,
      id_func: usuario.id,
      status_anterior: "D",
      status_novo: "AN",
      observacao_movimentacao: msgMov,
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
    let mes = document.getElementById("filtroMesArq").value;
    if (mes) mes = parseMesAno(mes);
    const tipoEst = document.getElementById("filtroTipoEstArq").value;

    if (rotId) bols = bols.filter((b) => b.estacao?.id_roteiro == rotId);
    if (mes) bols = bols.filter((b) => b.ano_mes_boletim?.startsWith(mes));
    if (tipoEst) bols = bols.filter((b) => b.estacao?.tipo_estacao === tipoEst);
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
      '<tr><td colspan="6" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
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
