// ══════════════════════════════════════════════════════════════
// MODO DE TESTE — troque o valor para simular um cargo sem banco
// Valores válidos: 'digitalizador' | 'tecnico' | 'supervisor'
// Em produção, deixe como null
const DEV_CARGO = null;
// ══════════════════════════════════════════════════════════════

// ── Rota padrão por cargo (para redirect após login / acesso negado) ──
const ROTAS_CARGO = {
  digitalizador: 'dashboard.html',
  tecnico:       'dashboard.html',
  supervisor:    'dashboard.html',
};

// ── Injeta sessão de teste se DEV_CARGO estiver ativo ─────────
(function () {
  if (!DEV_CARGO) return;
  if (!sessionStorage.getItem('usuario_cargo')) {
    sessionStorage.setItem('usuario_cargo', DEV_CARGO);
    sessionStorage.setItem('usuario_nome',  'Usuário Teste');
    sessionStorage.setItem('usuario_id',    '0');
    console.warn(`[DEV] Sessão simulada como "${DEV_CARGO}". Troque DEV_CARGO para null em produção.`);
  }
})();

// ── Verifica sessão e permissão de cargo ──────────────────────
// cargoPermitido: string ou array de strings
// Se o cargo não tiver permissão, redireciona para a rota padrão do cargo
function verificarSessao(cargoPermitido) {
  const cargo = sessionStorage.getItem('usuario_cargo');
  if (!cargo) {
    window.location.href = 'index.html';
    return null;
  }
  const permitidos = Array.isArray(cargoPermitido) ? cargoPermitido : [cargoPermitido];
  if (!permitidos.includes(cargo)) {
    window.location.href = ROTAS_CARGO[cargo] || 'index.html';
    return null;
  }
  return cargo;
}

function getCargo()       { return sessionStorage.getItem('usuario_cargo'); }
function getNomeUsuario() { return sessionStorage.getItem('usuario_nome');  }
function getIdUsuario()   { return sessionStorage.getItem('usuario_id');    }

function logout() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}
