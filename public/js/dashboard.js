// ── Verifica sessão: todos os cargos têm acesso ao dashboard ──
let CARGO_ATUAL = null;

(function () {
  CARGO_ATUAL = verificarSessao(['digitalizador', 'tecnico', 'supervisor']);
  if (!CARGO_ATUAL) return;

  // Monta barra de usuário
  const bar = document.getElementById('userBar');
  if (bar) bar.innerHTML = `
    <span class="user-info">👤 ${getNomeUsuario()} <em>(${CARGO_ATUAL})</em></span>
    <button class="btn-logout" onclick="logout()">Sair</button>
  `;

  // Digitalizador: vê o botão de adicionar. Técnico e supervisor: não.
  const btnAdicionar = document.querySelector('.btn-adicionar');
  if (btnAdicionar && CARGO_ATUAL !== 'digitalizador') {
    btnAdicionar.style.display = 'none';
  }
})();

// ── Mapa de status ────────────────────────────────────────────
const STATUS_MAP = {
  R: { label: 'RECEBIDO',  classe: 'status-r'         },
  E: { label: 'ENVIADO',   classe: 'status-enviado'    },
  P: { label: 'PENDENTE',  classe: 'status-pendente'   },
  A: { label: 'ARQUIVADO', classe: 'status-arquivado'  },
};

function formatarData(dataStr) {
  if (!dataStr) return '—';
  const [ano, mes] = dataStr.split('-');
  return `${mes}/${ano}`;
}

// ── Cria card conforme o cargo ────────────────────────────────
function criarCard(boletim) {
  const s     = STATUS_MAP[boletim.status_boletim] ?? { label: boletim.status_boletim, classe: 'status-r' };
  const data  = formatarData(boletim.ano_mes_boletim);
  const receb = formatarData(boletim.data_recebimento_boletim);

  const div = document.createElement('div');
  div.className = 'boletim-card';

  // Digitalizador: card não é clicável, sem botão de ação
  if (CARGO_ATUAL === 'digitalizador') {
    div.style.cursor = 'default';
    div.innerHTML = `
      <h3>Boletim #${boletim.id_boletim}</h3>
      <p>Ref.: ${data}</p>
      <p>Recebido: ${receb}</p>
      <p>Estação: ${boletim.id_estacao}</p>
      <span class="status ${s.classe}">${s.label}</span>
    `;
    return div;
  }

  // Técnico: clica e vai para anotações
  if (CARGO_ATUAL === 'tecnico') {
    div.title = 'Clique para anotar';
    div.innerHTML = `
      <h3>Boletim #${boletim.id_boletim}</h3>
      <p>Ref.: ${data}</p>
      <p>Recebido: ${receb}</p>
      <p>Estação: ${boletim.id_estacao}</p>
      <span class="status ${s.classe}">${s.label}</span>
      <button class="btn-card-acao btn-anotar" onclick="event.stopPropagation(); irParaAnotacoes(${boletim.id_boletim})">✏️ Anotar</button>
    `;
    div.addEventListener('click', () => irParaAnotacoes(boletim.id_boletim));
    return div;
  }

  // Supervisor: clica e vai para visualizador
  div.title = 'Clique para visualizar';
  div.innerHTML = `
    <h3>Boletim #${boletim.id_boletim}</h3>
    <p>Ref.: ${data}</p>
    <p>Recebido: ${receb}</p>
    <p>Estação: ${boletim.id_estacao}</p>
    <span class="status ${s.classe}">${s.label}</span>
    <button class="btn-card-acao btn-enviar" onclick="event.stopPropagation(); abrirVisualizador(${boletim.id_boletim})">👁 Visualizar</button>
  `;
  div.addEventListener('click', () => abrirVisualizador(boletim.id_boletim));
  return div;
}

// ── Mostra erro no banner ─────────────────────────────────────
function mostrarErro(msg) {
  const banner = document.getElementById('erroBanner');
  banner.textContent = '⚠ ' + msg;
  banner.style.display = 'block';
}

// ── Carrega boletins do banco ─────────────────────────────────
async function carregarBoletins(soArquivados = false) {
  const grid = document.getElementById('boletinsGrid');
  try {
    const filtros   = soArquivados ? { status_boletim: 'A' } : {};
    const lista     = await buscarBoletins(filtros);
    const filtrados = soArquivados
      ? lista
      : lista.filter(b => b.status_boletim !== 'A');

    grid.innerHTML = '';

    if (filtrados.length === 0) {
      grid.innerHTML = `<div class="grid-vazio">Nenhum boletim encontrado.</div>`;
      document.getElementById('contadorBoletins').textContent = '0';
      return;
    }

    filtrados.forEach(b => grid.appendChild(criarCard(b)));
    document.getElementById('contadorBoletins').textContent = filtrados.length;

    if (!soArquivados) {
      const enviados  = lista.filter(b => b.status_boletim === 'E').length;
      const pendentes = lista.filter(b => ['R', 'P'].includes(b.status_boletim)).length;
      document.getElementById('txtEnviados').textContent =
        `${enviados} boletim(ns) enviado(s) referente(s) aos últimos registros.`;
      document.getElementById('txtPendentes').textContent =
        `${pendentes} boletim(ns) aguardam envio à ANA.`;
    }
  } catch (erro) {
    console.error(erro);
    grid.innerHTML = '';
    mostrarErro('Não foi possível carregar os boletins: ' + erro.message);
  }
}

// ── Arquivados ────────────────────────────────────────────────
function visualizarArquivados() {
  const contador = document.querySelector('.contador-boletins h2');
  contador.innerHTML = `Boletins arquivados: <span id="contadorBoletins">0</span>`;
  carregarBoletins(true);
  document.querySelector('.arquivados-container').innerHTML = `
    <button class="arquivados-btn" onclick="voltarBoletins()">
      ← VOLTAR PARA BOLETINS DIGITALIZADOS
    </button>
  `;
}

function voltarBoletins() { location.reload(); }

// ── Navegação por cargo ───────────────────────────────────────
function abrirVisualizador(id) {
  window.location.href = `visualizador.html?id=${id}`;
}

function irParaAnotacoes(id) {
  window.location.href = `anotacoes.html?id=${id}`;
}

// ── Init ──────────────────────────────────────────────────────
window.onload = function () {
  if (CARGO_ATUAL) carregarBoletins();
};
