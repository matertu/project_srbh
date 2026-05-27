// ── Visualizar arquivados ─────────────────────────────────────
function visualizarArquivados() {
  const contador = document.querySelector(".contador-boletins h2");
  contador.innerHTML = `Boletins arquivados: <span id="contadorBoletins">0</span>`;

  carregarBoletins(true);

  document.querySelector(".arquivados-container").innerHTML = `
    <button class="arquivados-btn" onclick="voltarBoletins()">
      ← VOLTAR PARA BOLETINS DIGITALIZADOS
    </button>
  `;
}

// ── Voltar ────────────────────────────────────────────────────
function voltarBoletins() {
  location.reload();
}

