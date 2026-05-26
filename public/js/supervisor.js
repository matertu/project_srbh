// ══════════════════════════════════════════════════════════════════════
//  supervisor.js — Lógica da página do Supervisor
// ══════════════════════════════════════════════════════════════════════

let usuario = null;
let allBoletins = [];

// ── Init ─────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  usuario = verificarLogin(["supervisor"]);
  if (!usuario) return;
  document.getElementById("userNome").textContent = usuario.nome;

  // Tabs
  const secMap = {
    dashboard: "secDashboard",
    fechamento: "secFechamento",
    relatorios: "secRelatorios",
    cadastros: "secCadastros",
  };
  document.querySelectorAll(".srbh-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".srbh-tab")
        .forEach((t) => t.classList.remove("ativa"));
      document
        .querySelectorAll(".srbh-secao")
        .forEach((s) => s.classList.remove("ativa"));
      tab.classList.add("ativa");
      document.getElementById(secMap[tab.dataset.tab]).classList.add("ativa");
      if (tab.dataset.tab === "relatorios") carregarRelatorios();
      if (tab.dataset.tab === "cadastros") carregarCadastroUsuarios();
    });
  });

  // Roteiro dropdown
  const roteiros = await Roteiros.listar();
  popularSelect(
    document.getElementById("filtroDashRot"),
    roteiros,
    "id_roteiro",
    "nome_roteiro",
    "Todos",
  );
  popularSelect(
    document.getElementById("cadRoteiroEst"),
    roteiros,
    "id_roteiro",
    "nome_roteiro",
    "Selecione...",
  );

  // Máscara
  const codAnaInput = document.getElementById("cadCodAna");
  if (codAnaInput) mascaraCodAna(codAnaInput);

  // Forms
  document
    .getElementById("formUsuario")
    .addEventListener("submit", cadastrarUsuario);
  document
    .getElementById("formEstacao")
    .addEventListener("submit", cadastrarEstacao);
  document
    .getElementById("formRoteiro")
    .addEventListener("submit", cadastrarRoteiro);

  // Tabelas ordenáveis
  tornarTabelaOrdenavel("tabelaDash");
  tornarTabelaOrdenavel("tabelaProdutividade");

  // Carregar dados
  await carregarKPIs();
  await carregarTabelaDash();
});

// ══════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════════════
async function carregarKPIs() {
  try {
    const c = await Boletins.contarPorStatus();
    document.getElementById("kR").textContent = c.R;
    document.getElementById("kD").textContent = c.D;
    document.getElementById("kAN").textContent = c.AN;
    document.getElementById("kE").textContent = c.E;
    document.getElementById("kTot").textContent = c.total;

    // Contar atrasados (>60 dias)
    const todos = await Boletins.listar();
    allBoletins = todos;
    const atrasados = todos.filter(
      (b) =>
        b.status_boletim !== "E" &&
        b.status_boletim !== "A" &&
        diasEntre(b.data_recebimento_boletim) > 60,
    );
    document.getElementById("kAtraso").textContent = atrasados.length;

    // Gráfico de barras
    desenharGraficoBarras(
      "chartBarras",
      { R: c.R, D: c.D, AN: c.AN, A: c.A || 0, E: c.E },
      "Boletins por Status",
    );
  } catch (e) {
    console.error("Erro KPIs:", e);
  }
}

async function carregarTabelaDash() {
  const tbody = document.getElementById("tbodyDash");
  tbody.innerHTML =
    '<tr><td colspan="8" class="srbh-vazio">Carregando...</td></tr>';
  try {
    let bols = allBoletins.length ? allBoletins : await Boletins.listar();

    // Filtros
    const rotId = document.getElementById("filtroDashRot").value;
    const statusF = document.getElementById("filtroDashStatus").value;
    if (rotId) bols = bols.filter((b) => b.estacao?.id_roteiro == rotId);
    if (statusF) bols = bols.filter((b) => b.status_boletim === statusF);

    if (!bols.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="srbh-vazio">Nenhum boletim encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = bols
      .map((b) => {
        const dias = diasEntre(b.data_recebimento_boletim);
        return `<tr>
        <td>${b.estacao?.nome_estacao || "—"}</td>
        <td class="center">${b.estacao?.cod_ana_estacao ? "P/F" : "—"}</td>
        <td>${b.estacao?.roteiro?.nome_roteiro || "—"}</td>
        <td>${b.funcionarios?.nome_func || "—"}</td>
        <td>${fmtData(b.data_recebimento_boletim)}</td>
        <td>${badgeStatusHTML(b.status_boletim)}</td>
        <td class="center">${dias}</td>
        <td class="center">${semaforoAlerta(dias)}</td>
      </tr>`;
      })
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="srbh-vazio">Erro ao carregar.</td></tr>';
  }
}

// ══════════════════════════════════════════════════════════════════════
//  FECHAMENTO
// ══════════════════════════════════════════════════════════════════════
let passoAtual = 1;
let mesFechRef = "";
let conferenciaSemErros = false;

function iniciarFechamento() {
  document.getElementById("wizardCard").style.display = "block";
  irParaPasso(1);
}

function irParaPasso(n) {
  passoAtual = n;
  for (let i = 1; i <= 3; i++) {
    document.getElementById("ws" + i).className =
      "wizard-step" + (i === n ? " ativo" : i < n ? " concluido" : "");
    document.getElementById("wc" + i).className =
      "wizard-conteudo" + (i === n ? " ativo" : "");
  }
}

function avancarPasso2() {
  mesFechRef = document.getElementById("mesFechamento").value;
  if (!mesFechRef) {
    alert("Selecione o mês de referência.");
    return;
  }
  irParaPasso(2);
}

async function simularUploadMdb() {
  const div = document.getElementById("resultadoConferencia");
  div.style.display = "block";
  div.innerHTML =
    '<div class="srbh-loader"><div class="srbh-spinner"></div>Verificando consistência...</div>';

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const bols = allBoletins.filter((b) =>
      b.ano_mes_boletim?.startsWith(mesFechRef),
    );
    const analisados = bols.filter(
      (b) => b.status_boletim === "AN" || b.status_boletim === "E",
    );
    const naoAnalisados = bols.filter(
      (b) =>
        b.status_boletim !== "AN" &&
        b.status_boletim !== "E" &&
        b.status_boletim !== "A",
    );

    if (naoAnalisados.length > 0) {
      conferenciaSemErros = false;
      div.innerHTML =
        `<div class="bloqueio-msg">Fechamento bloqueado — ${naoAnalisados.length} inconsistência(s) encontrada(s)</div>` +
        '<div class="srbh-table-wrapper"><table class="srbh-table"><thead><tr><th>Estação</th><th>Status</th><th>Problema</th></tr></thead><tbody>' +
        naoAnalisados
          .map(
            (b) =>
              `<tr class="divergencia"><td>${b.estacao?.nome_estacao || "—"}</td><td>${badgeStatusHTML(b.status_boletim)}</td><td>Boletim não analisado</td></tr>`,
          )
          .join("") +
        "</tbody></table></div>";
    } else {
      conferenciaSemErros = true;
      div.innerHTML =
        `<p style="color:#16a34a;font-weight:600;margin:12px 0;">✔ ${analisados.length} boletim(ns) consistentes. Sem divergências.</p>` +
        '<button class="srbh-btn btn-success" onclick="irParaPasso(3)">Avançar para Confirmação →</button>';

      // Verifica atraso
      const atrasados = bols.filter(
        (b) => diasEntre(b.data_recebimento_boletim) > 60,
      );
      if (atrasados.length > 0) {
        document.getElementById("areaJustificativa").style.display = "block";
      } else {
        document.getElementById("areaJustificativa").style.display = "none";
      }
    }
  } catch (e) {
    div.innerHTML = '<p class="srbh-vazio">Erro na conferência.</p>';
  }
}

async function confirmarFechamento() {
  const areaJust = document.getElementById("areaJustificativa");
  if (areaJust.style.display !== "none") {
    const tipo = document.getElementById("tipoJust").value;
    if (!tipo) {
      alert("Preencha a justificativa de atraso.");
      return;
    }
  }

  try {
    const bols = allBoletins.filter(
      (b) =>
        b.ano_mes_boletim?.startsWith(mesFechRef) && b.status_boletim === "AN",
    );
    const ids = bols.map((b) => b.id_boletim);
    if (ids.length) {
      await Boletins.atualizarStatusEmBloco(ids, "E");
      for (const id of ids) {
        await Movimentacoes.criar({
          id_boletim: id,
          id_func: usuario.id,
          status_anterior: "AN",
          status_novo: "E",
          observacao_movimentacao: "Fechamento mensal",
        });
      }
    }
    mostrarToast(
      `Fechamento de ${mesFechRef} concluído! ${ids.length} boletim(ns) enviado(s). Pacote ZIP gerado.`,
    );
    document.getElementById("wizardCard").style.display = "none";
    await carregarKPIs();
    await carregarTabelaDash();
  } catch (e) {
    mostrarToast("Erro no fechamento: " + e.message, "erro");
  }
}

// ══════════════════════════════════════════════════════════════════════
//  RELATÓRIOS
// ══════════════════════════════════════════════════════════════════════
async function carregarRelatorios() {
  // Produtividade por funcionário
  const tbody = document.getElementById("tbodyProdutividade");
  try {
    const funcs = await Funcionarios.listar();
    const bols = allBoletins.length ? allBoletins : await Boletins.listar();
    tbody.innerHTML = funcs
      .map((f) => {
        const recebidos = bols.filter(
          (b) => b.funcionarios?.id_func === f.id_func && b.status_boletim,
        ).length;
        const digitados = bols.filter(
          (b) =>
            b.funcionarios?.id_func === f.id_func &&
            ["D", "AN", "E", "A"].includes(b.status_boletim),
        ).length;
        const analisados = bols.filter(
          (b) =>
            b.funcionarios?.id_func === f.id_func &&
            ["AN", "E", "A"].includes(b.status_boletim),
        ).length;
        return `<tr><td>${f.nome_func}</td><td>${f.tipo_func}</td><td class="center">${recebidos}</td><td class="center">${digitados}</td><td class="center">${analisados}</td></tr>`;
      })
      .join("");

    // Gráfico pizza de tipo de recebimento
    // (simulação - o schema não tem coluna tipo_recebimento, então demonstramos com dados simulados)
    desenharGraficoPizza(
      "chartPizza",
      { WhatsApp: 15, Correios: 8, "Digitalização local": 5 },
      "Boletins por Tipo de Recebimento",
    );
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="srbh-vazio">Erro ao carregar.</td></tr>';
  }
}

function exportarRelProdutividade() {
  const linhas = [];
  document.querySelectorAll("#tbodyProdutividade tr").forEach((tr) => {
    linhas.push([...tr.cells].map((td) => td.textContent));
  });
  exportarCSV(
    "produtividade.csv",
    ["Nome", "Função", "Recebidos", "Digitados", "Analisados"],
    linhas,
  );
}

// ══════════════════════════════════════════════════════════════════════
//  CADASTROS
// ══════════════════════════════════════════════════════════════════════
function mostrarCadastro(tipo) {
  document.getElementById("cadUsuarios").style.display =
    tipo === "usuarios" ? "block" : "none";
  document.getElementById("cadEstacoes").style.display =
    tipo === "estacoes" ? "block" : "none";
  document.getElementById("cadRoteiros").style.display =
    tipo === "roteiros" ? "block" : "none";
  if (tipo === "usuarios") carregarCadastroUsuarios();
  if (tipo === "estacoes") carregarCadastroEstacoes();
  if (tipo === "roteiros") carregarCadastroRoteiros();
}

async function carregarCadastroUsuarios() {
  const tbody = document.getElementById("tbodyUsuarios");
  tbody.innerHTML =
    '<tr><td colspan="4" class="srbh-vazio">Carregando...</td></tr>';
  try {
    const funcs = await Funcionarios.listar();
    tbody.innerHTML = funcs
      .map(
        (f) =>
          `<tr><td>${f.id_func}</td><td>${f.nome_func}</td><td>${f.login_func}</td><td>${f.tipo_func}</td></tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="srbh-vazio">Erro.</td></tr>';
  }
}

async function cadastrarUsuario(e) {
  e.preventDefault();
  try {
    await Funcionarios.criar({
      nome_func: document.getElementById("cadNome").value,
      login_func: document.getElementById("cadLogin").value,
      senha_func: document.getElementById("cadSenha").value,
      tipo_func: document.getElementById("cadTipo").value,
    });
    mostrarToast("Usuário cadastrado!");
    e.target.reset();
    await carregarCadastroUsuarios();
  } catch (err) {
    mostrarToast("Erro: " + err.message, "erro");
  }
}

async function carregarCadastroEstacoes() {
  const tbody = document.getElementById("tbodyEstacoes");
  tbody.innerHTML =
    '<tr><td colspan="4" class="srbh-vazio">Carregando...</td></tr>';
  try {
    const ests = await Estacoes.listar();
    tbody.innerHTML = ests
      .map(
        (e) =>
          `<tr><td>${e.id_estacao}</td><td>${e.cod_ana_estacao}</td><td>${e.nome_estacao}</td><td>${e.roteiro?.nome_roteiro || "—"}</td></tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="srbh-vazio">Erro.</td></tr>';
  }
}

async function cadastrarEstacao(e) {
  e.preventDefault();
  const cod = document.getElementById("cadCodAna").value;
  if (!validarCodAna(cod)) {
    alert("Código ANA deve ter 8 dígitos.");
    return;
  }
  try {
    await Estacoes.criar({
      cod_ana_estacao: parseInt(cod),
      nome_estacao: document.getElementById("cadNomeEst").value,
      id_roteiro: parseInt(document.getElementById("cadRoteiroEst").value),
    });
    mostrarToast("Estação cadastrada!");
    e.target.reset();
    await carregarCadastroEstacoes();
  } catch (err) {
    mostrarToast("Erro: " + err.message, "erro");
  }
}

async function carregarCadastroRoteiros() {
  const tbody = document.getElementById("tbodyRoteiros");
  tbody.innerHTML =
    '<tr><td colspan="3" class="srbh-vazio">Carregando...</td></tr>';
  try {
    const rots = await Roteiros.listar();
    tbody.innerHTML = rots
      .map(
        (r) =>
          `<tr><td>${r.id_roteiro}</td><td>${r.nome_roteiro}</td><td>${(r.uf_roteiro || "").toUpperCase()}</td></tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="3" class="srbh-vazio">Erro.</td></tr>';
  }
}

async function cadastrarRoteiro(e) {
  e.preventDefault();
  try {
    await Roteiros.criar({
      nome_roteiro: document.getElementById("cadNomeRot").value,
      uf_roteiro: document.getElementById("cadUfRot").value,
    });
    mostrarToast("Roteiro cadastrado!");
    e.target.reset();
    await carregarCadastroRoteiros();
    // Atualiza dropdowns
    const roteiros = await Roteiros.listar();
    popularSelect(
      document.getElementById("filtroDashRot"),
      roteiros,
      "id_roteiro",
      "nome_roteiro",
      "Todos",
    );
    popularSelect(
      document.getElementById("cadRoteiroEst"),
      roteiros,
      "id_roteiro",
      "nome_roteiro",
      "Selecione...",
    );
  } catch (err) {
    mostrarToast("Erro: " + err.message, "erro");
  }
}
