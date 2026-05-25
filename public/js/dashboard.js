function atualizarContadorBoletins() {
  const totalBoletins = document.querySelectorAll(".boletim-card").length;
  document.getElementById("contadorBoletins").innerText = totalBoletins;
}

function visualizarArquivados() {
  document.querySelector(
    ".contador-boletins h2",
  ).innerHTML = ` Boletins arquivados: <span id="contadorBoletins"> 5 </span> `;
  const boletinsGrid =
    document.querySelector(".boletins-grid");
  boletinsGrid.innerHTML = ` <div class="boletim-card"> <h3>Boletim Arquivado 01</h3> <p>Data: 10/03/2026</p> <p>Boletim armazenado no sistema.</p> <span class="status"> ARQUIVADO </span> </div> <div class="boletim-card"> <h3>Boletim Arquivado 02</h3> <p>Data: 11/03/2026</p> <p>Boletim armazenado no sistema.</p> <span class="status"> ARQUIVADO </span> </div> <div class="boletim-card"> <h3>Boletim Arquivado 03</h3> <p>Data: 12/03/2026</p> <p>Boletim armazenado no sistema.</p> <span class="status"> ARQUIVADO </span> </div> <div class="boletim-card"> <h3>Boletim Arquivado 04</h3> <p>Data: 13/03/2026</p> <p>Boletim armazenado no sistema.</p> <span class="status"> ARQUIVADO </span> </div> <div class="boletim-card"> <h3>Boletim Arquivado 05</h3> <p>Data: 14/03/2026</p> <p>Boletim armazenado no sistema.</p> <span class="status"> ARQUIVADO </span> </div> `;
  document.querySelector(
    ".arquivados-container",
  ).innerHTML =
    ` <button class="arquivados-btn" onclick="voltarBoletins()" > ← VOLTAR PARA BOLETINS DIGITALIZADOS </button> `;
}

function voltarBoletins() {
  location.reload();
}

window.onload = function () {
  atualizarContadorBoletins();
};
