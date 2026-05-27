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
      '<tr><td colspan="5" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
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

