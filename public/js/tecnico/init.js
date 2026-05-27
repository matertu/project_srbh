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

