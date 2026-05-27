let boletinsFechamento = [];

function iniciarFechamento() {
  document.getElementById("wizardCard").style.display = "block";
  carregarListaFechamento();
}

async function carregarListaFechamento() {
  const tbody = document.getElementById("tbodyFechamentoLista");
  tbody.innerHTML = '<tr><td colspan="5" class="srbh-vazio">Carregando...</td></tr>';

  try {
    // Lista apenas os boletins Analisados (prontos para envio)
    let bols = await Boletins.listar("status_boletim=eq.AN");

    let mes = document.getElementById("filtroFechamentoMes").value;
    if (mes) mes = parseMesAno(mes);
    const rotId = document.getElementById("filtroFechamentoRot").value;
    const tipoEst = document.getElementById("filtroFechamentoTipoEst").value;

    if (mes) bols = bols.filter(b => b.ano_mes_boletim?.startsWith(mes));
    if (rotId) bols = bols.filter(b => b.estacao?.id_roteiro == rotId);
    if (tipoEst) bols = bols.filter(b => b.estacao?.tipo_estacao === tipoEst);

    boletinsFechamento = bols;

    if (!bols.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="srbh-vazio">Nenhum boletim analisado para os filtros selecionados.</td></tr>';
      return;
    }

    tbody.innerHTML = bols.map(b => `<tr>
      <td class="center"><input type="checkbox" class="cb-fechamento" value="${b.id_boletim}" onchange="verificarAtrasosFechamento()" /></td>
      <td>${b.estacao?.nome_estacao || "—"}</td>
      <td>${fmtMesAno(b.ano_mes_boletim)}</td>
      <td>${b.estacao?.roteiro?.nome_roteiro || "—"}</td>
      <td>${badgeStatusHTML(b.status_boletim)}</td>
    </tr>`).join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

function verificarAtrasosFechamento() {
  const idsChecked = [...document.querySelectorAll(".cb-fechamento:checked")].map(cb => parseInt(cb.value));
  const selected = boletinsFechamento.filter(b => idsChecked.includes(b.id_boletim));

  const atrasados = selected.filter(b => diasEntre(b.data_recebimento_boletim) > 60);
  if (atrasados.length > 0) {
    document.getElementById("areaJustificativa").style.display = "block";
  } else {
    document.getElementById("areaJustificativa").style.display = "none";
  }
}

async function confirmarFechamento() {
  const idsChecked = [...document.querySelectorAll(".cb-fechamento:checked")].map(cb => parseInt(cb.value));
  if (!idsChecked.length) {
    alert("Selecione ao menos um boletim para gerar o pacote ZIP.");
    return;
  }

  const selected = boletinsFechamento.filter(b => idsChecked.includes(b.id_boletim));

  const areaJust = document.getElementById("areaJustificativa");
  let obs = "Fechamento mensal e pacote ZIP gerado";
  if (areaJust.style.display !== "none") {
    const tipo = document.getElementById("tipoJust").value;
    if (!tipo) {
      alert("Preencha a justificativa de atraso.");
      return;
    }
    obs += ` | Justificativa: ${tipo} - ${document.getElementById("obsJust").value}`;
  }

  const btnGerarZip = document.getElementById("btnGerarZip");
  const originalText = btnGerarZip.innerHTML;
  btnGerarZip.innerHTML = 'Gerando ZIP e Atualizando...';
  btnGerarZip.disabled = true;

  try {
    // 1. Inicia o empacotamento ZIP
    const zip = new JSZip();

    // 2. Adiciona arquivo MDB se fornecido (plus)
    const mdbFile = document.getElementById('mdbInput').files[0];
    if (mdbFile) {
      zip.file(mdbFile.name, mdbFile);
    }

    // 3. Organiza pastas por roteiro e baixa as imagens
    for (const b of selected) {
      if (b.ficheiro_boletim && b.ficheiro_boletim !== "null") {
        const roteiroNome = b.estacao?.roteiro?.nome_roteiro || "Sem_Roteiro";
        const folder = zip.folder(roteiroNome);

        try {
          // Extrai o nome do arquivo da URL (ex: "bol_...jpg")
          let nomeDoArquivo = b.ficheiro_boletim;
          if (nomeDoArquivo.includes("/")) {
            nomeDoArquivo = nomeDoArquivo.split("/").pop();
          }

          const imgUrl = Storage.getPublicUrl(b.ficheiro_boletim);
          const response = await fetch(imgUrl);
          if (response.ok) {
            let blob = await response.blob();

            // Se tiver anotações e for uma imagem (jpg/png), desenha do lado!
            if (b.ficheiro_anotacao && b.ficheiro_anotacao.trim() !== "" && b.ficheiro_anotacao !== "null") {
              const ext = nomeDoArquivo.split(".").pop().toLowerCase();
              if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
                blob = await desenharAnotacoesNaImagem(blob, b.ficheiro_anotacao);
              } else {
                // Se não for imagem (ex: pdf), salva um .txt junto
                folder.file(nomeDoArquivo.replace(`.${ext}`, "_anotacoes.txt"), b.ficheiro_anotacao);
              }
            }

            folder.file(nomeDoArquivo, blob);
          }
        } catch (err) {
          console.warn(`Erro ao baixar a imagem: ${b.ficheiro_boletim}`, err);
        }
      }
    }

    // 4. Salva o arquivo ZIP
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Producao_SRBH_${new Date().toISOString().split('T')[0]}.zip`);

    // 5. Atualiza o banco de dados (status = "E" Enviado)
    await Boletins.atualizarStatusEmBloco(idsChecked, "E");
    for (const id of idsChecked) {
      await Movimentacoes.criar({
        id_boletim: id,
        id_func: usuario.id,
        status_anterior: "AN",
        status_novo: "E",
        observacao_movimentacao: obs,
      });
    }

    mostrarToast(`Fechamento concluído! ${idsChecked.length} boletins exportados no ZIP.`, "sucesso");

    // 6. Reseta a tela
    document.getElementById("wizardCard").style.display = "none";
    document.getElementById('mdbInput').value = "";
    document.getElementById('mdbName').textContent = "";
    document.getElementById("tipoJust").value = "";
    document.getElementById("obsJust").value = "";
    document.getElementById("areaJustificativa").style.display = "none";

    await carregarKPIs();
    await carregarTabelaDash();
  } catch (e) {
    mostrarToast("Erro no fechamento: " + e.message, "erro");
  } finally {
    btnGerarZip.innerHTML = originalText;
    btnGerarZip.disabled = false;
  }
}

