// ══════════════════════════════════════════════════════════════════
//  ALIMENTADOR — Lógica da página
// ══════════════════════════════════════════════════════════════════
let usuario = null;
let estacaoSelecionada = null;
let duplicataEncontrada = null;

// ── Init ─────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  usuario = verificarLogin(["alimentador", "digitador"]);
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
      document
        .getElementById("sec" + capitalizar(tab.dataset.tab))
        .classList.add("ativa");
    });
  });

  // Máscaras
  mascaraCodAna(document.getElementById("codEstacao"));
  mascaraMesAno(document.getElementById("mesObs"));

  // Auto-preenchimento ao digitar código da estação
  document
    .getElementById("codEstacao")
    .addEventListener("input", async function () {
      const val = this.value.replace(/\D/g, "");
      if (val.length >= 7 && val.length <= 8) {
        const est = await Estacoes.buscarPorCodAna(parseInt(val));
        if (est) {
          estacaoSelecionada = est;
          document.getElementById("nomeEstacao").value = est.nome_estacao;
          document.getElementById("roteiroEstacao").value =
            est.roteiro?.nome_roteiro || "—";
        } else {
          estacaoSelecionada = null;
          document.getElementById("nomeEstacao").value =
            "Estação não encontrada";
          document.getElementById("roteiroEstacao").value = "";
        }
      } else {
        estacaoSelecionada = null;
        document.getElementById("nomeEstacao").value = "";
        document.getElementById("roteiroEstacao").value = "";
      }
    });

  // Upload preview
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  uploadArea.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById("previewImg").src = e.target.result;
        document.getElementById("uploadPreview").style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  // Form submit
  document
    .getElementById("formRecebimento")
    .addEventListener("submit", registrarRecebimento);

  // Roteiro dropdowns
  const roteiros = await Roteiros.listar();
  popularSelect(
    document.getElementById("selRoteiroDigit"),
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
    .getElementById("selRoteiroDigit")
    .addEventListener("change", carregarDigitacao);

  // Checkboxes
  configurarSelecionarTodos("checkAllDigit", "cb-digit");
  configurarSelecionarTodos("checkAllArq", "cb-arq");

  // Tabelas ordenáveis
  tornarTabelaOrdenavel("tabelaRecebidos");
  tornarTabelaOrdenavel("tabelaDigitacao");
  tornarTabelaOrdenavel("tabelaArquivamento");

  // Carregar dados
  await carregarKPIs();
  await carregarRecebidos();
  await carregarDigitacao();
});

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── KPIs ─────────────────────────────────────────────────────────
async function carregarKPIs() {
  try {
    const c = await Boletins.contarPorStatus();
    document.getElementById("kpiRecebidos").textContent = c.R;
    document.getElementById("kpiDigitados").textContent = c.D;
    document.getElementById("kpiPendentes").textContent = c.R;
  } catch (e) {
    console.error("Erro KPIs:", e);
  }
}

// ── Recebimento ──────────────────────────────────────────────────
async function registrarRecebimento(e) {
  e.preventDefault();
  if (!estacaoSelecionada) {
    alert("Código de estação inválido ou não encontrado.");
    return;
  }
  const mesObsRaw = document.getElementById("mesObs").value;
  const mesObs = parseMesAno(mesObsRaw);
  const tipoReceb = document.getElementById("tipoReceb").value;
  const arquivo = document.getElementById("fileInput").files[0];
  if (!mesObs) {
    alert("Mês de observação inválido (use MM/AAAA).");
    return;
  }
  if (!tipoReceb) {
    alert("Preencha todos os campos.");
    return;
  }
  if (!arquivo) {
    alert("Selecione o arquivo do boletim.");
    return;
  }

  // Verifica duplicata
  const dup = await Boletins.verificarDuplicata(
    estacaoSelecionada.id_estacao,
    mesObs + "-01",
  );
  if (dup && !duplicataEncontrada) {
    duplicataEncontrada = dup;
    document.getElementById("alertaDuplicataMsg").textContent =
      `⚠ Já existe boletim para esta estação no mês ${fmtMesAno(mesObs)}. Deseja substituir?`;
    document.getElementById("alertaDuplicata").style.display = "block";
    return;
  }

  await salvarBoletim(mesObs, tipoReceb, arquivo);
}

async function salvarBoletim(mesObs, tipoReceb, arquivo) {
  try {
    const nomeArq = gerarNomeArquivo(
      estacaoSelecionada.cod_ana_estacao,
      mesObs,
    );

    // 1. Upload do arquivo para o Supabase Storage
    mostrarToast("Enviando arquivo...", "info");
    const ext = arquivo.name.split(".").pop().toLowerCase();
    const nomeComExt = `${nomeArq}.${ext}`;
    await Storage.upload(arquivo, nomeArq);

    // 2. Salva/atualiza registro no banco
    const dados = {
      id_estacao: estacaoSelecionada.id_estacao,
      id_func: usuario.id,
      ano_mes_boletim: mesObs + "-01",
      status_boletim: "R",
      ficheiro_boletim: nomeComExt,
      data_recebimento_boletim: new Date().toISOString().split("T")[0],
    };

    if (duplicataEncontrada) {
      await Boletins.atualizarStatus(duplicataEncontrada.id_boletim, "R");
    } else {
      await Boletins.criar(dados);
    }

    // 3. Log de movimentação
    const boletins = await Boletins.listar(
      `id_estacao=eq.${estacaoSelecionada.id_estacao}&ano_mes_boletim=eq.${mesObs}-01&limit=1`,
    );
    if (boletins[0]) {
      await Movimentacoes.criar({
        id_boletim: boletins[0].id_boletim,
        id_func: usuario.id,
        status_anterior: "R",
        status_novo: "R",
        observacao_movimentacao: `Recebimento via ${tipoReceb}`,
      });
    }

    cancelarSubstituicao();
    document.getElementById("formRecebimento").reset();
    document.getElementById("uploadPreview").style.display = "none";
    document.getElementById("nomeEstacao").value = "";
    document.getElementById("roteiroEstacao").value = "";
    estacaoSelecionada = null;

    mostrarToast(`Boletim registrado e imagem enviada! Arquivo: ${nomeComExt}`);
    await carregarRecebidos();
    await carregarKPIs();
  } catch (err) {
    mostrarToast("Erro ao registrar: " + err.message, "erro");
  }
}

function substituirBoletim() {
  const mesObsRaw = document.getElementById("mesObs").value;
  const mesObs = parseMesAno(mesObsRaw);
  const tipoReceb = document.getElementById("tipoReceb").value;
  const arquivo = document.getElementById("fileInput").files[0];
  if (!mesObs) {
    alert("Mês de observação inválido.");
    return;
  }
  if (!arquivo) {
    alert("Selecione o arquivo do boletim.");
    return;
  }
  salvarBoletim(mesObs, tipoReceb, arquivo);
}

function cancelarSubstituicao() {
  duplicataEncontrada = null;
  document.getElementById("alertaDuplicata").style.display = "none";
}

async function carregarRecebidos() {
  const tbody = document.getElementById("tbodyRecebidos");
  tbody.innerHTML =
    '<tr><td colspan="6" class="srbh-vazio">Carregando...</td></tr>';
  try {
    const bols = await Boletins.listarPorStatus("R");
    if (!bols.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="srbh-vazio">Nenhum boletim recebido.</td></tr>';
      return;
    }
    tbody.innerHTML = bols
      .map(
        (b) => `<tr>
      <td>${b.estacao?.cod_ana_estacao || "—"}</td>
      <td>${b.estacao?.nome_estacao || "—"}</td>
      <td>${fmtMesAno(b.ano_mes_boletim)}</td>
      <td>${fmtData(b.data_recebimento_boletim)}</td>
      <td>${b.ficheiro_boletim}</td>
      <td>${badgeStatusHTML(b.status_boletim)}</td>
    </tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="srbh-vazio">Erro ao carregar.</td></tr>';
  }
}

// ── Digitação ────────────────────────────────────────────────────
async function carregarDigitacao() {
  const tbody = document.getElementById("tbodyDigitacao");
  const rotId = document.getElementById("selRoteiroDigit").value;
  const tipoEst = document.getElementById("selTipoEstDigit").value;
  tbody.innerHTML =
    '<tr><td colspan="8" class="srbh-vazio">Carregando...</td></tr>';
  try {
    let bols;
    if (rotId) {
      bols = await Boletins.listarPorRoteiroViaEstacao(rotId, "R");
    } else {
      bols = await Boletins.listarPorStatus("R");
    }
    if (tipoEst) {
      bols = bols.filter(b => b.estacao?.tipo_estacao === tipoEst);
    }
    document.querySelector("#contadorDigit .num").textContent = bols.length;
    if (!bols.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="srbh-vazio">Nenhum boletim aguardando digitação.</td></tr>';
      return;
    }
    tbody.innerHTML = bols
      .map(
        (b) => `<tr>
      <td class="center"><input type="checkbox" class="cb-digit" value="${b.id_boletim}" /></td>
      <td>${b.estacao?.cod_ana_estacao || "—"}</td>
      <td>${b.estacao?.nome_estacao || "—"}</td>
      <td>${fmtMesAno(b.ano_mes_boletim)}</td>
      <td class="center">${b.estacao?.cod_ana_estacao ? "P/F" : "—"}</td>
      <td>${fmtData(b.data_recebimento_boletim)}</td>
      <td>${badgeStatusHTML(b.status_boletim)}</td>
      <td class="acoes-cell">
        <button class="srbh-btn btn-small btn-secondary" onclick="verImagem('${b.ficheiro_boletim}')">👁 Imagem</button>
        <button class="srbh-btn btn-small btn-primary" onclick="marcarDigitado(${b.id_boletim})">✔ Digitado</button>
      </td>
    </tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="srbh-vazio">Erro ao carregar.</td></tr>';
  }
}

function verImagem(ficheiroBoletim) {
  const areaImg = document.getElementById("modalImagemArea");
  if (
    ficheiroBoletim &&
    ficheiroBoletim !== "null" &&
    ficheiroBoletim !== "undefined"
  ) {
    const url = Storage.getPublicUrl(ficheiroBoletim);
    areaImg.innerHTML = `<img src="${url}" alt="Boletim" style="max-width:100%; object-fit:contain;" />`;
  } else {
    areaImg.innerHTML = `<div class="preview-placeholder">Nenhuma imagem enviada.</div>`;
  }
  abrirModal("modalImagem");
}

async function marcarDigitado(id) {
  try {
    await Boletins.atualizarStatus(id, "D");
    await Movimentacoes.criar({
      id_boletim: id,
      id_func: usuario.id,
      status_anterior: "R",
      status_novo: "D",
    });
    mostrarToast("Boletim marcado como Digitado!");
    await carregarDigitacao();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function marcarDigitadoBloco() {
  const ids = [...document.querySelectorAll(".cb-digit:checked")].map((cb) =>
    parseInt(cb.value),
  );
  if (!ids.length) {
    alert("Selecione ao menos um boletim.");
    return;
  }
  try {
    await Boletins.atualizarStatusEmBloco(ids, "D");
    for (const id of ids) {
      await Movimentacoes.criar({
        id_boletim: id,
        id_func: usuario.id,
        status_anterior: "R",
        status_novo: "D",
      });
    }
    mostrarToast(`${ids.length} boletim(ns) marcado(s) como Digitado!`);
    await carregarDigitacao();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

// ── Arquivamento ─────────────────────────────────────────────────
async function filtrarArquivamento() {
  const tbody = document.getElementById("tbodyArquivamento");
  tbody.innerHTML =
    '<tr><td colspan="8" class="srbh-vazio">Carregando...</td></tr>';
  try {
    let bols = await Boletins.listar("status_boletim=in.(AN,E)");
    const rotId = document.getElementById("filtroRotArq").value;
    const mes = document.getElementById("filtroMesArq").value;
    const tipoEst = document.getElementById("filtroTipoEstArq").value;

    if (rotId) bols = bols.filter((b) => b.estacao?.id_roteiro == rotId);
    if (mes) bols = bols.filter((b) => b.ano_mes_boletim?.startsWith(mes));
    if (tipoEst) bols = bols.filter((b) => b.estacao?.tipo_estacao === tipoEst);
    if (!bols.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="srbh-vazio">Nenhum boletim para arquivamento.</td></tr>';
      return;
    }
    tbody.innerHTML = bols
      .map(
        (b) => `<tr>
      <td class="center"><input type="checkbox" class="cb-arq" value="${b.id_boletim}" /></td>
      <td>${b.estacao?.cod_ana_estacao || "—"}</td>
      <td>${b.estacao?.nome_estacao || "—"}</td>
      <td>${fmtMesAno(b.ano_mes_boletim)}</td>
      <td class="center">P/F</td>
      <td class="center">—</td>
      <td>${badgeStatusHTML(b.status_boletim)}</td>
      <td class="acoes-cell">
        <button class="srbh-btn btn-small btn-primary" onclick="marcarArquivado(${b.id_boletim})">⏳ Solicitar Arquivamento</button>
      </td>
    </tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="srbh-vazio">Erro ao carregar.</td></tr>';
  }
}

async function marcarArquivado(id) {
  try {
    await Boletins.atualizarStatus(id, "AA");
    await Movimentacoes.criar({
      id_boletim: id,
      id_func: usuario.id,
      status_anterior: "AN",
      status_novo: "AA",
      observacao_movimentacao: "Solicitação de arquivamento",
    });
    mostrarToast("Solicitação de arquivamento enviada ao supervisor!");
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
    await Boletins.atualizarStatusEmBloco(ids, "AA");
    for (const id of ids) {
      await Movimentacoes.criar({
        id_boletim: id,
        id_func: usuario.id,
        status_anterior: "AN",
        status_novo: "AA",
        observacao_movimentacao: "Solicitação de arquivamento em bloco",
      });
    }
    mostrarToast(`${ids.length} solicitação(ões) de arquivamento enviada(s)!`);
    await filtrarArquivamento();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}
