// ══════════════════════════════════════════════════════════════════════
//  supervisor.js — Lógica da página do Supervisor
// ══════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════
//  FECHAMENTO E GERAÇÃO DE ZIP
// ══════════════════════════════════════════════════════════════════════
let boletinsFechamento = [];

function iniciarFechamento() {
  document.getElementById("wizardCard").style.display = "block";
  carregarListaFechamento();
}

async function carregarListaFechamento() {
  const tbody = document.getElementById("tbodyFechamentoLista");
  tbody.innerHTML = '<tr><td colspan="5" class="srbh-vazio">Carregando...</td></tr>';

  try {
    // Lista apenas os boletins Analisados (prontos para envio)
    let bols = await Boletins.listar("status_boletim=eq.AN");

    let mes = document.getElementById("filtroFechamentoMes").value;
    if (mes) mes = parseMesAno(mes);
    const rotId = document.getElementById("filtroFechamentoRot").value;
    const tipoEst = document.getElementById("filtroFechamentoTipoEst").value;

    if (mes) bols = bols.filter(b => b.ano_mes_boletim?.startsWith(mes));
    if (rotId) bols = bols.filter(b => b.estacao?.id_roteiro == rotId);
    if (tipoEst) bols = bols.filter(b => b.estacao?.tipo_estacao === tipoEst);

    boletinsFechamento = bols;

    if (!bols.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="srbh-vazio">Nenhum boletim analisado para os filtros selecionados.</td></tr>';
      return;
    }

    tbody.innerHTML = bols.map(b => `<tr>
      <td class="center"><input type="checkbox" class="cb-fechamento" value="${b.id_boletim}" onchange="verificarAtrasosFechamento()" /></td>
      <td>${b.estacao?.nome_estacao || "—"}</td>
      <td>${fmtMesAno(b.ano_mes_boletim)}</td>
      <td>${b.estacao?.roteiro?.nome_roteiro || "—"}</td>
      <td>${badgeStatusHTML(b.status_boletim)}</td>
    </tr>`).join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

function verificarAtrasosFechamento() {
  const idsChecked = [...document.querySelectorAll(".cb-fechamento:checked")].map(cb => parseInt(cb.value));
  const selected = boletinsFechamento.filter(b => idsChecked.includes(b.id_boletim));

  const atrasados = selected.filter(b => diasEntre(b.data_recebimento_boletim) > 60);
  if (atrasados.length > 0) {
    document.getElementById("areaJustificativa").style.display = "block";
  } else {
    document.getElementById("areaJustificativa").style.display = "none";
  }
}

async function confirmarFechamento() {
  const idsChecked = [...document.querySelectorAll(".cb-fechamento:checked")].map(cb => parseInt(cb.value));
  if (!idsChecked.length) {
    alert("Selecione ao menos um boletim para gerar o pacote ZIP.");
    return;
  }

  const selected = boletinsFechamento.filter(b => idsChecked.includes(b.id_boletim));

  const areaJust = document.getElementById("areaJustificativa");
  let obs = "Fechamento mensal e pacote ZIP gerado";
  if (areaJust.style.display !== "none") {
    const tipo = document.getElementById("tipoJust").value;
    if (!tipo) {
      alert("Preencha a justificativa de atraso.");
      return;
    }
    obs += ` | Justificativa: ${tipo} - ${document.getElementById("obsJust").value}`;
  }

  const btnGerarZip = document.getElementById("btnGerarZip");
  const originalText = btnGerarZip.innerHTML;
  btnGerarZip.innerHTML = 'Gerando ZIP e Atualizando...';
  btnGerarZip.disabled = true;

  try {
    // 1. Inicia o empacotamento ZIP
    const zip = new JSZip();

    // 2. Adiciona arquivo MDB se fornecido (plus)
    const mdbFile = document.getElementById('mdbInput').files[0];
    if (mdbFile) {
      zip.file(mdbFile.name, mdbFile);
    }

    // 3. Organiza pastas por roteiro e baixa as imagens
    for (const b of selected) {
      if (b.ficheiro_boletim && b.ficheiro_boletim !== "null") {
        const roteiroNome = b.estacao?.roteiro?.nome_roteiro || "Sem_Roteiro";
        const folder = zip.folder(roteiroNome);

        try {
          // Extrai o nome do arquivo da URL (ex: "bol_...jpg")
          let nomeDoArquivo = b.ficheiro_boletim;
          if (nomeDoArquivo.includes("/")) {
            nomeDoArquivo = nomeDoArquivo.split("/").pop();
          }

          const imgUrl = Storage.getPublicUrl(b.ficheiro_boletim);
          const response = await fetch(imgUrl);
          if (response.ok) {
            let blob = await response.blob();

            // Se tiver anotações e for uma imagem (jpg/png), desenha do lado!
            if (b.ficheiro_anotacao && b.ficheiro_anotacao.trim() !== "" && b.ficheiro_anotacao !== "null") {
              const ext = nomeDoArquivo.split(".").pop().toLowerCase();
              if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
                blob = await desenharAnotacoesNaImagem(blob, b.ficheiro_anotacao);
              } else {
                // Se não for imagem (ex: pdf), salva um .txt junto
                folder.file(nomeDoArquivo.replace(`.${ext}`, "_anotacoes.txt"), b.ficheiro_anotacao);
              }
            }

            folder.file(nomeDoArquivo, blob);
          }
        } catch (err) {
          console.warn(`Erro ao baixar a imagem: ${b.ficheiro_boletim}`, err);
        }
      }
    }

    // 4. Salva o arquivo ZIP
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Producao_SRBH_${new Date().toISOString().split('T')[0]}.zip`);

    // 5. Atualiza o banco de dados (status = "E" Enviado)
    await Boletins.atualizarStatusEmBloco(idsChecked, "E");
    for (const id of idsChecked) {
      await Movimentacoes.criar({
        id_boletim: id,
        id_func: usuario.id,
        status_anterior: "AN",
        status_novo: "E",
        observacao_movimentacao: obs,
      });
    }

    mostrarToast(`Fechamento concluído! ${idsChecked.length} boletins exportados no ZIP.`, "sucesso");

    // 6. Reseta a tela
    document.getElementById("wizardCard").style.display = "none";
    document.getElementById('mdbInput').value = "";
    document.getElementById('mdbName').textContent = "";
    document.getElementById("tipoJust").value = "";
    document.getElementById("obsJust").value = "";
    document.getElementById("areaJustificativa").style.display = "none";

    await carregarKPIs();
    await carregarTabelaDash();
  } catch (e) {
    mostrarToast("Erro no fechamento: " + e.message, "erro");
  } finally {
    btnGerarZip.innerHTML = originalText;
    btnGerarZip.disabled = false;
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

// ══════════════════════════════════════════════════════════════════════
//  CADASTROS
// ══════════════════════════════════════════════════════════════════════
function mostrarCadastro(tipo) {
  // Alterar exibição dos cards
  document.getElementById("cadUsuarios").style.display =
    tipo === "usuarios" ? "block" : "none";
  document.getElementById("cadEstacoes").style.display =
    tipo === "estacoes" ? "block" : "none";
  document.getElementById("cadRoteiros").style.display =
    tipo === "roteiros" ? "block" : "none";

  // Alterar cor dos botões
  document.getElementById("btnCadUsuarios").className =
    tipo === "usuarios" ? "srbh-btn btn-primary" : "srbh-btn btn-secondary";
  document.getElementById("btnCadEstacoes").className =
    tipo === "estacoes" ? "srbh-btn btn-primary" : "srbh-btn btn-secondary";
  document.getElementById("btnCadRoteiros").className =
    tipo === "roteiros" ? "srbh-btn btn-primary" : "srbh-btn btn-secondary";

  // Carregar tabelas
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
    tbody.innerHTML = '<tr><td colspan="4" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

async function cadastrarUsuario(e) {
  e.preventDefault();

  const nome = document.getElementById("cadNome").value.trim();
  const nomeRegex = /^[A-Za-zÀ-ÿ\s]+$/;
  if (!nomeRegex.test(nome)) {
    mostrarToast(
      "⚠ O nome não pode conter números ou caracteres especiais.",
      "erro",
    );
    return;
  }

  try {
    await Funcionarios.criar({
      nome_func: nome,
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
          `<tr><td>${e.id_estacao}</td><td>${e.cod_ana_estacao}</td><td>${e.nome_estacao}</td><td>${e.tipo_estacao || "—"}</td><td>${e.roteiro?.nome_roteiro || "—"}</td></tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

async function cadastrarEstacao(e) {
  e.preventDefault();
  const cod = document.getElementById("cadCodAna").value;
  if (!validarCodAna(cod)) {
    alert("Código ANA deve ter 7 ou 8 dígitos numéricos.");
    return;
  }
  try {
    await Estacoes.criar({
      cod_ana_estacao: parseInt(cod),
      nome_estacao: document.getElementById("cadNomeEst").value,
      id_roteiro: parseInt(document.getElementById("cadRoteiroEst").value),
      tipo_estacao: document.getElementById("cadTipoEst").value,
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
    tbody.innerHTML = '<tr><td colspan="3" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
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

// ══════════════════════════════════════════════════════════════════════
//  APROVAÇÕES
// ══════════════════════════════════════════════════════════════════════
async function carregarAprovacoes() {
  const tbody = document.getElementById("tbodyAprovacoes");
  tbody.innerHTML = '<tr><td colspan="6" class="srbh-vazio">Carregando...</td></tr>';
  try {
    const bols = await Boletins.listar("status_boletim=eq.AA");
    if (!bols.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="srbh-vazio">Nenhuma aprovação pendente.</td></tr>';
      return;
    }
    tbody.innerHTML = bols.map(b => `<tr>
      <td class="center"><input type="checkbox" class="cb-aprov" value="${b.id_boletim}" /></td>
      <td>${b.estacao?.nome_estacao || "—"}</td>
      <td>${fmtMesAno(b.ano_mes_boletim)}</td>
      <td>${badgeStatusHTML(b.status_boletim)}</td>
      <td>${b.funcionarios?.nome_func || "—"}</td>
      <td class="acoes-cell">
        <button class="srbh-btn btn-small btn-success" onclick="aprovarArquivamento(${b.id_boletim})">✔ Aprovar</button>
        <button class="srbh-btn btn-small btn-danger" onclick="rejeitarArquivamento(${b.id_boletim})">✖ Rejeitar</button>
      </td>
    </tr>`).join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

async function aprovarArquivamento(id) {
  try {
    await Boletins.atualizarStatus(id, "A");
    await Movimentacoes.criar({ id_boletim: id, id_func: usuario.id, status_anterior: "AA", status_novo: "A", observacao_movimentacao: "Arquivamento aprovado" });
    mostrarToast("Arquivamento aprovado com sucesso!");
    await carregarAprovacoes();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function rejeitarArquivamento(id) {
  try {
    await Boletins.atualizarStatus(id, "AN");
    await Movimentacoes.criar({ id_boletim: id, id_func: usuario.id, status_anterior: "AA", status_novo: "AN", observacao_movimentacao: "Arquivamento rejeitado" });
    mostrarToast("Arquivamento rejeitado! Boletim voltou para Analisado.");
    await carregarAprovacoes();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function aprovarArquivamentoBloco() {
  const ids = [...document.querySelectorAll(".cb-aprov:checked")].map(cb => parseInt(cb.value));
  if (!ids.length) { alert("Selecione ao menos um boletim."); return; }
  try {
    await Boletins.atualizarStatusEmBloco(ids, "A");
    for (const id of ids) {
      await Movimentacoes.criar({ id_boletim: id, id_func: usuario.id, status_anterior: "AA", status_novo: "A", observacao_movimentacao: "Arquivamento aprovado em bloco" });
    }
    mostrarToast(`${ids.length} arquivamento(s) aprovado(s)!`);
    await carregarAprovacoes();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function rejeitarArquivamentoBloco() {
  const ids = [...document.querySelectorAll(".cb-aprov:checked")].map(cb => parseInt(cb.value));
  if (!ids.length) { alert("Selecione ao menos um boletim."); return; }
  try {
    await Boletins.atualizarStatusEmBloco(ids, "AN");
    for (const id of ids) {
      await Movimentacoes.criar({ id_boletim: id, id_func: usuario.id, status_anterior: "AA", status_novo: "AN", observacao_movimentacao: "Arquivamento rejeitado em bloco" });
    }
    mostrarToast(`${ids.length} arquivamento(s) rejeitado(s)!`);
    await carregarAprovacoes();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}
// ── Função para Carimbar Anotações do lado da Imagem ────────────────
async function desenharAnotacoesNaImagem(imgBlob, jsonStr) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const espacoAnotacao = 500; // Pixels extras na largura para o texto
      canvas.width = img.width + espacoAnotacao;
      canvas.height = Math.max(img.height, 600);

      const ctx = canvas.getContext("2d");

      // Fundo totalmente branco
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Desenha a imagem original colada na esquerda
      ctx.drawImage(img, 0, 0);

      // Linha divisória
      ctx.beginPath();
      ctx.moveTo(img.width, 0);
      ctx.lineTo(img.width, canvas.height);
      ctx.strokeStyle = "#dddddd";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Configura fonte e cor
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px Arial";
      ctx.fillText("ANOTAÇÕES DO TÉCNICO", img.width + 30, 50);

      let y = 100;
      try {
        const anotacoes = JSON.parse(jsonStr);
        anotacoes.forEach(a => {
          // Quebra de página se passar da altura
          if (y > canvas.height - 100) return;

          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 22px Arial";
          ctx.fillText(`Dia ${a.dia}: Valor ${a.valor}`, img.width + 30, y);
          y += 30;

          ctx.fillStyle = "#475569";
          ctx.font = "18px Arial";
          // Quebra o texto da observação para não vazar a tela
          const obsStr = a.obs || "Sem observação";
          const maxLinha = 40;
          const linhasObs = obsStr.match(new RegExp(`.{1,${maxLinha}}(\\s|$)|.{1,${maxLinha}}`, 'g')) || [obsStr];

          linhasObs.forEach(linha => {
            ctx.fillText(`Obs: ${linha.trim()}`, img.width + 30, y);
            y += 24;
          });

          y += 20;
        });
      } catch (e) {
        ctx.font = "16px Arial";
        ctx.fillText("Erro ao ler anotações.", img.width + 30, y);
      }

      canvas.toBlob((novoBlob) => {
        resolve(novoBlob);
      }, imgBlob.type || "image/jpeg", 0.9);
    };
    img.onerror = () => resolve(imgBlob);
    img.src = URL.createObjectURL(imgBlob);
  });
}
