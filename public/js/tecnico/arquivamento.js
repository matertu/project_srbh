

async function filtrarArquivamento() {
  const tbody = document.getElementById("tbodyArquivamento");
  tbody.innerHTML =
    '<tr><td colspan="6" class="srbh-vazio">Carregando...</td></tr>';
  try {
    let bols = await Boletins.listar("status_boletim=in.(AN,E)");
    const rotId = document.getElementById("filtroRotArq").value;
    let mes = document.getElementById("filtroMesArq").value;
    if (mes) mes = parseMesAno(mes);
    const tipoEst = document.getElementById("filtroTipoEstArq").value;

    if (rotId) bols = bols.filter((b) => b.estacao?.id_roteiro == rotId);
    if (mes) bols = bols.filter((b) => b.ano_mes_boletim?.startsWith(mes));
    if (tipoEst) bols = bols.filter((b) => b.estacao?.tipo_estacao === tipoEst);
    if (!bols.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="srbh-vazio">Nenhum boletim para arquivamento.</td></tr>';
      return;
    }
    tbody.innerHTML = bols
      .map(
        (b) => `<tr>
      <td class="center"><input type="checkbox" class="cb-arq" value="${b.id_boletim}" /></td>
      <td>${b.estacao?.cod_ana_estacao || "—"}</td>
      <td>${b.estacao?.nome_estacao || "—"}</td>
      <td>${fmtMesAno(b.ano_mes_boletim)}</td>
      <td>${badgeStatusHTML(b.status_boletim)}</td>
      <td class="acoes-cell">
        <button class="srbh-btn btn-small btn-primary" onclick="marcarArquivado(${b.id_boletim})">📦 Arquivar</button>
      </td>
    </tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

async function marcarArquivado(id) {
  try {
    await Boletins.atualizarStatus(id, "A");
    await Movimentacoes.criar({
      id_boletim: id,
      id_func: usuario.id,
      status_anterior: "AN",
      status_novo: "A",
    });
    mostrarToast("Boletim arquivado!");
    await filtrarArquivamento();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function marcarArquivadoBloco() {
  const ids = [...document.querySelectorAll(".cb-arq:checked")].map((cb) =>
    parseInt(cb.value),
  );
  if (!ids.length) {
    alert("Selecione ao menos um boletim.");
    return;
  }
  try {
    await Boletins.atualizarStatusEmBloco(ids, "A");
    for (const id of ids) {
      await Movimentacoes.criar({
        id_boletim: id,
        id_func: usuario.id,
        status_anterior: "AN",
        status_novo: "A",
      });
    }
    mostrarToast(`${ids.length} boletim(ns) arquivado(s)!`);
    await filtrarArquivamento();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}
