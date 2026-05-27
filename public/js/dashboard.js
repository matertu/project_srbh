// ── Verifica sessão: todos os cargos acessam o dashboard ─────
let CARGO_ATUAL = null;

(function () {
  CARGO_ATUAL = verificarSessao(['digitalizador', 'tecnico', 'supervisor']);
  if (!CARGO_ATUAL) return;

  const bar = document.getElementById('userBar');
  if (bar) bar.innerHTML = `
    <span class="user-info">👤 ${getNomeUsuario()} <em>(${CARGO_ATUAL})</em></span>
    <button class="btn-logout" onclick="logout()">Sair</button>
  `;

  // Botão de adicionar: só para digitalizador
  const btnAdicionar = document.querySelector('.btn-adicionar');
  if (btnAdicionar && CARGO_ATUAL !== 'digitalizador') {
    btnAdicionar.style.display = 'none';
  }
})();

// ── Mapa de status ────────────────────────────────────────────
const STATUS_MAP = {
  D:       { label: 'DIGITALIZADO', classe: 'status-d'       },
  AN:      { label: 'ANOTADO',      classe: 'status-an'      },
  E: { label: 'ENVIADO',      classe: 'status-enviado' },
};

function formatarData(dataStr) {
  if (!dataStr) return '—';
  const [ano, mes] = dataStr.split('-');
  return `${mes}/${ano}`;
}

// ── Cria card conforme cargo ──────────────────────────────────
function criarCard(boletim) {
  const s     = STATUS_MAP[boletim.status_boletim] ?? { label: boletim.status_boletim, classe: 'status-d' };
  const data  = formatarData(boletim.ano_mes_boletim);
  const receb = formatarData(boletim.data_recebimento_boletim);

  const div = document.createElement('div');
  div.className = 'boletim-card';

  const base = `
    <h3>Boletim ${data}</h3>
    <p>Recebido: ${receb}</p>
    <p>Estação: ${boletim.id_estacao}</p>
    <span class="status ${s.classe}">${s.label}</span>
  `;

  if (CARGO_ATUAL === 'digitalizador') {
    // Só leitura, sem clique
    div.style.cursor = 'default';
    div.innerHTML = base;
  } else {
    // Técnico e supervisor: clicável → visualizador
    div.title = 'Clique para visualizar';
    div.innerHTML = base + `
      <button class="btn-card-acao btn-visualizar"
        onclick="event.stopPropagation(); abrirVisualizador(${boletim.id_boletim})">
        👁 Visualizar
      </button>`;
    div.addEventListener('click', () => abrirVisualizador(boletim.id_boletim));
  }

  return div;
}

// ── Mostra erro ───────────────────────────────────────────────
function mostrarErro(msg) {
  const banner = document.getElementById('erroBanner');
  banner.textContent = '⚠ ' + msg;
  banner.style.display = 'block';
}

// ── Carrega boletins ──────────────────────────────────────────
async function carregarBoletins(soArquivados = false) {
  const grid = document.getElementById('boletinsGrid');
  try {
    const filtros   = soArquivados ? { status_boletim: 'E' } : {};
    const lista     = await buscarBoletins(filtros);
    const filtrados = soArquivados
      ? lista
      : lista.filter(b => b.status_boletim !== 'E');

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
      const pendentes = lista.filter(b => ['D', 'AN'].includes(b.status_boletim)).length;
      document.getElementById('txtEnviados').textContent =
        `${enviados} boletim(ns) enviado(s) à ANA.`;
      document.getElementById('txtPendentes').textContent =
        `${pendentes} boletim(ns) aguardam envio à ANA.`;
    }
  } catch (erro) {
    console.error(erro);
    grid.innerHTML = '';
    mostrarErro('Não foi possível carregar os boletins: ' + erro.message);
  }
}

// ── Arquivados (enviados) ─────────────────────────────────────
function visualizarArquivados() {
  const contador = document.querySelector('.contador-boletins h2');
  contador.innerHTML = `Boletins enviados: <span id="contadorBoletins">0</span>`;
  carregarBoletins(true);
  document.querySelector('.arquivados-container').innerHTML = `
    <button class="arquivados-btn" onclick="voltarBoletins()">
      ← VOLTAR PARA BOLETINS DIGITALIZADOS
    </button>
  `;
}

function voltarBoletins() { location.reload(); }

function abrirVisualizador(id) {
  window.location.href = `visualizador.html?id=${id}`;
}

// ── Init ──────────────────────────────────────────────────────
window.onload = function () {
  if (CARGO_ATUAL) carregarBoletins();
};
