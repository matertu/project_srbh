// ── Abre o visualizador passando o ID via URL ─────────────────
function abrirVisualizador(idBoletim) {
  window.location.href = `visualizador.html?id=${idBoletim}`;
}

// ── Init ──────────────────────────────────────────────────────
let usuario = null;

window.onload = function () {
  usuario = verificarLogin(["digitador", "alimentador"]);
  if (!usuario) return;
  
  carregarBoletins();
};
