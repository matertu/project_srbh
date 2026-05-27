// ── Carrega boletins do banco e preenche o grid ───────────────
async function carregarBoletins(soArquivados = false) {
  const grid = document.getElementById("boletinsGrid");

  try {
    const filtros = soArquivados ? { status_boletim: "A" } : {};
    const lista = await buscarBoletins(filtros);

    // Filtra arquivados fora da view principal
    const filtrados = soArquivados
      ? lista
      : lista.filter((b) => b.status_boletim !== "A");

    grid.innerHTML = "";

    if (filtrados.length === 0) {
      grid.innerHTML = `<div class="grid-vazio">Nenhum boletim encontrado.</div>`;
      document.getElementById("contadorBoletins").textContent = "0";
      return;
    }

    filtrados.forEach((b) => grid.appendChild(criarCard(b)));
    document.getElementById("contadorBoletins").textContent = filtrados.length;

    // Atualiza cards de status
    if (!soArquivados) {
      const enviados = lista.filter((b) => b.status_boletim === "E").length;
      const pendentes = lista.filter((b) =>
        ["R", "P"].includes(b.status_boletim),
      ).length;
      document.getElementById("txtEnviados").textContent =
        `${enviados} boletim(ns) enviado(s) referente(s) aos últimos registros.`;
      document.getElementById("txtPendentes").textContent =
        `${pendentes} boletim(ns) aguardam envio à ANA.`;
    }
  } catch (erro) {
    console.error(erro);
    grid.innerHTML = "";
    mostrarErro("Não foi possível carregar os boletins: " + erro.message);
  }
}

