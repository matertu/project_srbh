// ── Verifica permissão: só digitalizador ─────────────────────
(function () {
  const cargo = verificarSessao('digitalizador');
  if (!cargo) return;
  const bar = document.getElementById('userBar');
  if (bar) bar.innerHTML = `
    <span class="user-info">👤 ${getNomeUsuario()} <em>(${cargo})</em></span>
    <button class="btn-logout" onclick="logout()">Sair</button>
  `;
})();

// ── Variável global para armazenar a imagem selecionada ───────
let imagemSelecionada = null; // File object
let imagemBase64 = null;      // string base64 para preview/envio

// ── Configura o input de arquivo e drag-and-drop ──────────────
const inputImagem   = document.getElementById('inputImagem');
const uploadArea    = document.getElementById('uploadArea');
const uploadPreview = document.getElementById('uploadPreview');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');

inputImagem.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) processarImagem(file);
});

// Drag & Drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    processarImagem(file);
  } else {
    mostrarToast('✖ Selecione um arquivo de imagem válido (PNG ou JPG).', 'erro');
  }
});

function processarImagem(file) {
  imagemSelecionada = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagemBase64 = e.target.result;
    document.getElementById('previewImg').src = imagemBase64;
    uploadPlaceholder.style.display = 'none';
    uploadPreview.style.display     = 'flex';
  };
  reader.readAsDataURL(file);
}

function removerImagem() {
  imagemSelecionada = null;
  imagemBase64      = null;
  document.getElementById('previewImg').src = '';
  inputImagem.value = '';
  uploadPlaceholder.style.display = 'flex';
  uploadPreview.style.display     = 'none';
}

// ── Gerar e salvar boletim ────────────────────────────────────
async function gerarBoletim() {
  const nome    = document.getElementById('nomeObs').value.trim()        || 'Sem nome';
  const mes     = parseInt(document.getElementById('metaMes').value)     || 1;
  const ano     = parseInt(document.getElementById('metaAno').value)     || 2026;
  const estacao = parseInt(document.getElementById('metaEstacao').value) || 0;
  const func_   = parseInt(document.getElementById('metaFunc').value)    || 0;

  if (!imagemSelecionada) {
    mostrarToast('✖ Anexe a imagem do boletim antes de salvar.', 'erro');
    uploadArea.style.borderColor = '#a32d2d';
    setTimeout(() => uploadArea.style.borderColor = '', 2000);
    return;
  }

  const boletim = new Boletim(nome, mes, ano);
  boletim.setIdEstacao(estacao);
  boletim.setIdFunc(func_);

  const hoje            = new Date();
  const dataRecebimento = hoje.toISOString().split('T')[0];
  const mesStr          = String(mes).padStart(2, '0');
  const ficheiro        = imagemSelecionada.name || `boletim_${mesStr}_${ano}.png`;

  boletim.setFicheiro(ficheiro);

  const btnSalvar     = document.querySelector('.btn-primary');
  const textoOriginal = btnSalvar.textContent;
  btnSalvar.textContent = 'SALVANDO...';
  btnSalvar.disabled    = true;

  try {
    const payload = boletimParaPayload(boletim, ficheiro, dataRecebimento);
    const salvo   = await salvarBoletim(payload);

    console.log('Salvo no banco com ID:', salvo.id_boletim);

    const dados = boletim.toJSON();
    let saida   = `✔ Salvo no banco! id_boletim: ${salvo.id_boletim}\n\n`;
    saida += `Boletim {\n`;
    saida += `  nomeObs:   "${dados.nomeObs}"\n`;
    saida += `  mes:       ${dados.mes}\n`;
    saida += `  ano:       ${dados.ano}\n`;
    saida += `  idEstacao: ${dados.idEstacao}\n`;
    saida += `  idFunc:    ${dados.idFunc}\n`;
    saida += `  ficheiro:  "${ficheiro}"\n`;
    saida += `  recebido:  ${dados.recebido}\n`;
    saida += `}`;

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
  removerImagem();
  ['nomeObs', 'metaMes', 'metaAno', 'metaEstacao', 'metaFunc']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('resultado').style.display = 'none';
}
