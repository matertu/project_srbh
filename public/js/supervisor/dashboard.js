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
    const desenharChart = () => {
      desenharGraficoBarras(
        "chartBarras",
        { R: c.R, D: c.D, AN: c.AN, A: c.A || 0, E: c.E },
        "Boletins por Status",
      );
    };

    if (document.readyState === "complete") {
      desenharChart();
    } else {
      window.addEventListener("load", desenharChart);
    }
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
    const tipoEstF = document.getElementById("filtroDashTipoEst").value;
    const statusF = document.getElementById("filtroDashStatus").value;
    if (rotId) bols = bols.filter((b) => b.estacao?.id_roteiro == rotId);
    if (tipoEstF) bols = bols.filter((b) => b.estacao?.tipo_estacao === tipoEstF);
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
      '<tr><td colspan="8" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

