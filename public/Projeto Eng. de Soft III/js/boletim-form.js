// ── Monta a tabela 31x4 ao carregar a página ─────────────────
const colunas = ['X1', 'X1.1', 'X2', 'X2.2'];
const corpo   = document.getElementById('corpoTabela');

for (let dia = 1; dia <= 31; dia++) {
  const tr = document.createElement('tr');

  const tdLabel = document.createElement('td');
  tdLabel.className   = 'dia-label';
  tdLabel.textContent = dia;
  tr.appendChild(tdLabel);

  for (let col = 0; col < 4; col++) {
    const td    = document.createElement('td');
    const input = document.createElement('input');
    input.type        = 'number';
    input.id          = `cell_${dia - 1}_${col}`;
    input.placeholder = '0';
    input.title       = `Dia ${dia} — ${colunas[col]}`;
    td.appendChild(input);
    tr.appendChild(td);
  }

  corpo.appendChild(tr);
}

// ── Gerar e salvar boletim ────────────────────────────────────
async function gerarBoletim() {
  const nome    = document.getElementById('nomeObs').value.trim()        || 'Sem nome';
  const mes     = parseInt(document.getElementById('metaMes').value)     || 1;
  const ano     = parseInt(document.getElementById('metaAno').value)     || 2026;
  const estacao = parseInt(document.getElementById('metaEstacao').value) || 0;
  const func_   = parseInt(document.getElementById('metaFunc').value)    || 0;

  const boletim = new Boletim(nome, mes, ano);
  boletim.setIdEstacao(estacao);
  boletim.setIdFunc(func_);

  for (let dia = 0; dia < 31; dia++) {
    for (let col = 0; col < 4; col++) {
      const val = parseInt(document.getElementById(`cell_${dia}_${col}`).value) || 0;
      boletim.setDadosBole(dia, col, val);
    }
  }

  // ── Monta payload com mês/ano dinâmicos ──────────────────────
  const hoje            = new Date();
  const dataRecebimento = hoje.toISOString().split('T')[0];
  const mesStr          = String(boletim.getMes()).padStart(2, '0');
  const anoStr          = boletim.getAno();
  const ficheiro        = `boletim_${mesStr}_${anoStr}.pdf`;

  // ── Feedback visual: botão travado enquanto salva ─────────────
  const btnSalvar     = document.querySelector('.btn-primary');
  const textoOriginal = btnSalvar.textContent;
  btnSalvar.textContent = 'SALVANDO...';
  btnSalvar.disabled    = true;

  try {
    const payload = boletimParaPayload(boletim, ficheiro, dataRecebimento);
    const salvo   = await salvarBoletim(payload);

    boletim.printBoletim();
    console.log('Salvo no banco com ID:', salvo.id_boletim);

    // ── Monta exibição na tela ───────────────────────────────────
    const dados = boletim.toJSON();
    let saida   = `✔ Salvo no banco! id_boletim: ${salvo.id_boletim}\n\n`;
    saida += `Boletim {\n`;
    saida += `  nomeObs:   "${dados.nomeObs}"\n`;
    saida += `  mes:       ${dados.mes}\n`;
    saida += `  ano:       ${dados.ano}\n`;
    saida += `  idEstacao: ${dados.idEstacao}\n`;
    saida += `  idFunc:    ${dados.idFunc}\n`;
    saida += `  recebido:  ${dados.recebido}\n\n`;
    saida += `  dadosBole: [\n`;

    const nomes = ['X1', 'X1.1', 'X2', 'X2.2'];
    saida += `    //  Dia  ${nomes.map(n => n.padStart(6)).join('')}\n`;
    for (let i = 0; i < 31; i++) {
      const diaStr = `Dia ${String(i + 1).padStart(2)}`;
      const vals   = dados.dadosBole[i].map(v => String(v).padStart(6)).join('');
      saida += `    [ ${diaStr}: ${vals} ]\n`;
    }
    saida += `  ]\n}`;

    document.getElementById('outputBoletim').textContent = saida;
    document.getElementById('resultado').style.display   = 'block';
    document.getElementById('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });

    mostrarToast('✔ Boletim salvo no banco com sucesso!', 'sucesso');

  } catch (erro) {
    console.error('Erro ao salvar boletim:', erro);
    mostrarToast('✖ Erro ao salvar: ' + erro.message, 'erro');
  } finally {
    btnSalvar.textContent = textoOriginal;
    btnSalvar.disabled    = false;
  }
}

// ── Toast de feedback ─────────────────────────────────────────
function mostrarToast(mensagem, tipo) {
  const toast       = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.style.background = tipo === 'erro' ? '#a32d2d' : '#207a36';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ── Limpar formulário ─────────────────────────────────────────
function limparTabela() {
  document.querySelectorAll('.dados-table input[type="number"]')
    .forEach(i => i.value = '');
  ['nomeObs', 'metaMes', 'metaAno', 'metaEstacao', 'metaFunc']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('resultado').style.display = 'none';
}
