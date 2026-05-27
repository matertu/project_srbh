
let usuario = null;
let allBoletins = [];

// ── Init ─────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  // Configuração das abas (Mover para o topo para garantir que funcionem sempre)
  const secMap = {
    dashboard: "secDashboard",
    fechamento: "secFechamento",
    relatorios: "secRelatorios",
    cadastros: "secCadastros",
    aprovacoes: "secAprovacoes",
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
      if (tab.dataset.tab === "aprovacoes") carregarAprovacoes();
    });
  });

  // Verificação de login e carga de dados base
  usuario = verificarLogin(["supervisor"]);
  if (!usuario) return;

  try {
    // Máscaras (Inicializadas antes de requisições de rede)
    const codAnaInput = document.getElementById("cadCodAna");
    if (codAnaInput) mascaraCodAna(codAnaInput);

    const mesFechamentoInput = document.getElementById("filtroFechamentoMes");
    if (mesFechamentoInput) mascaraMesAno(mesFechamentoInput);

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

    configurarSelecionarTodos("checkAllFechamento", "cb-fechamento");
    configurarSelecionarTodos("checkAllAprov", "cb-aprov");

    // Tabelas ordenáveis
    tornarTabelaOrdenavel("tabelaDash");
    tornarTabelaOrdenavel("tabelaProdutividade");

    // Carregar dados
    await carregarKPIs();
    await carregarTabelaDash();
  } catch (err) {
    console.error("Erro na inicialização do Supervisor:", err);
  }
});

