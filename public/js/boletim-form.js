// ── Estado reativo da tabela ───────────────────────────────────
let estadoBoletim = Array.from({ length: 31 }, () => new Array(4).fill(0));

// ── Monta a tabela 31x4 ao carregar a página ─────────────────
const colunas = ["X1", "X1.1", "X2", "X2.2"];
const corpo = document.getElementById("corpoTabela");

for (let dia = 1; dia <= 31; dia++) {
  const tr = document.createElement("tr");

  const tdLabel = document.createElement("td");
  tdLabel.className = "dia-label";
  tdLabel.textContent = dia;
  tr.appendChild(tdLabel);

  for (let col = 0; col < 4; col++) {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.id = `cell_${dia - 1}_${col}`;
    input.placeholder = "0";
    input.title = `Dia ${dia} — ${colunas[col]}`;
    
    // Atualiza o estado da memória sempre que o usuário digitar
    input.addEventListener("input", (e) => {
      estadoBoletim[dia - 1][col] = parseInt(e.target.value) || 0;
    });

    td.appendChild(input);
    tr.appendChild(td);
  }

  corpo.appendChild(tr);
}

// ── Gerar e salvar boletim ────────────────────────────────────
async function gerarBoletim() {
  const nome = document.getElementById("nomeObs").value.trim() || "Sem nome";
  const mes = parseInt(document.getElementById("metaMes").value);
  const ano = parseInt(document.getElementById("metaAno").value);
  
  if (isNaN(mes) || mes < 1 || mes > 12) {
    alert("Mês inválido! Use um número de 1 a 12.");
    return;
  }
  if (isNaN(ano) || ano < 1900 || ano > 2100) {
    alert("Ano inválido!");
    return;
  }

  const estacao = parseInt(document.getElementById("metaEstacao").value) || 0;
  const func_ = parseInt(document.getElementById("metaFunc").value) || 0;

  const boletimMock = {
    nomeObs: nome,
    mes: mes,
    ano: ano,
    idEstacao: estacao,
    idFunc: func_,
    recebido: false,
    dadosBole: estadoBoletim
  };

  // ── Monta payload com mês/ano dinâmicos ──────────────────────
  const hoje = new Date();
  const dataRecebimento = hoje.toISOString().split("T")[0];
  const mesStr = String(mes).padStart(2, "0");
  const ficheiro = `boletim_${mesStr}_${ano}.pdf`;

  // ── Feedback visual: botão travado enquanto salva ─────────────
  const btnSalvar = document.querySelector(".btn-primary");
  const textoOriginal = btnSalvar.textContent;
  btnSalvar.textContent = "SALVANDO...";
  btnSalvar.disabled = true;

  try {
    const payload = {
      id_estacao: estacao,
      id_func: func_ || null,
      ano_mes_boletim: `${ano}-${mesStr}-01`,
      status_boletim: "R",
      ficheiro_boletim: ficheiro,
      data_recebimento_boletim: dataRecebimento,
    };
    
    const salvo = await Boletins.criar(payload);

    console.log("Salvo no banco com ID:", salvo.id_boletim);

    // ── Monta exibição na tela ───────────────────────────────────
    let saida = `✔ Salvo no banco! id_boletim: ${salvo.id_boletim}\n\n`;
    saida += JSON.stringify(boletimMock, null, 2);

    document.getElementById("outputBoletim").textContent = saida;
    document.getElementById("resultado").style.display = "block";
    document
      .getElementById("resultado")
      .scrollIntoView({ behavior: "smooth", block: "start" });

    mostrarToast("✔ Boletim salvo no banco com sucesso!", "sucesso");
  } catch (erro) {
    console.error("Erro ao salvar boletim:", erro);
    mostrarToast("✖ Erro ao salvar: " + erro.message, "erro");
  } finally {
    btnSalvar.textContent = textoOriginal;
    btnSalvar.disabled = false;
  }
}

// ── Toast de feedback ─────────────────────────────────────────
function mostrarToast(mensagem, tipo) {
  const toast = document.getElementById("toast");
  toast.textContent = mensagem;
  toast.style.background = tipo === "erro" ? "#a32d2d" : "#207a36";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}

// ── Limpar formulário ─────────────────────────────────────────
function limparTabela() {
  document
    .querySelectorAll('.dados-table input[type="number"]')
    .forEach((i) => (i.value = ""));
  ["nomeObs", "metaMes", "metaAno", "metaEstacao", "metaFunc"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("resultado").style.display = "none";
  
  // Zera o estado reativo
  estadoBoletim = Array.from({ length: 31 }, () => new Array(4).fill(0));
}
