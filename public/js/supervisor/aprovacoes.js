async function carregarAprovacoes() {
  const tbody = document.getElementById("tbodyAprovacoes");
  tbody.innerHTML = '<tr><td colspan="6" class="srbh-vazio">Carregando...</td></tr>';
  try {
    const bols = await Boletins.listar("status_boletim=eq.AA");
    if (!bols.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="srbh-vazio">Nenhuma aprovação pendente.</td></tr>';
      return;
    }
    tbody.innerHTML = bols.map(b => `<tr>
      <td class="center"><input type="checkbox" class="cb-aprov" value="${b.id_boletim}" /></td>
      <td>${b.estacao?.nome_estacao || "—"}</td>
      <td>${fmtMesAno(b.ano_mes_boletim)}</td>
      <td>${badgeStatusHTML(b.status_boletim)}</td>
      <td>${b.funcionarios?.nome_func || "—"}</td>
      <td class="acoes-cell">
        <button class="srbh-btn btn-small btn-success" onclick="aprovarArquivamento(${b.id_boletim})">✔ Aprovar</button>
        <button class="srbh-btn btn-small btn-danger" onclick="rejeitarArquivamento(${b.id_boletim})">✖ Rejeitar</button>
      </td>
    </tr>`).join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

async function aprovarArquivamento(id) {
  try {
    await Boletins.atualizarStatus(id, "A");
    await Movimentacoes.criar({ id_boletim: id, id_func: usuario.id, status_anterior: "AA", status_novo: "A", observacao_movimentacao: "Arquivamento aprovado" });
    mostrarToast("Arquivamento aprovado com sucesso!");
    await carregarAprovacoes();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function rejeitarArquivamento(id) {
  try {
    await Boletins.atualizarStatus(id, "AN");
    await Movimentacoes.criar({ id_boletim: id, id_func: usuario.id, status_anterior: "AA", status_novo: "AN", observacao_movimentacao: "Arquivamento rejeitado" });
    mostrarToast("Arquivamento rejeitado! Boletim voltou para Analisado.");
    await carregarAprovacoes();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function aprovarArquivamentoBloco() {
  const ids = [...document.querySelectorAll(".cb-aprov:checked")].map(cb => parseInt(cb.value));
  if (!ids.length) { alert("Selecione ao menos um boletim."); return; }
  try {
    await Boletins.atualizarStatusEmBloco(ids, "A");
    for (const id of ids) {
      await Movimentacoes.criar({ id_boletim: id, id_func: usuario.id, status_anterior: "AA", status_novo: "A", observacao_movimentacao: "Arquivamento aprovado em bloco" });
    }
    mostrarToast(`${ids.length} arquivamento(s) aprovado(s)!`);
    await carregarAprovacoes();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}

async function rejeitarArquivamentoBloco() {
  const ids = [...document.querySelectorAll(".cb-aprov:checked")].map(cb => parseInt(cb.value));
  if (!ids.length) { alert("Selecione ao menos um boletim."); return; }
  try {
    await Boletins.atualizarStatusEmBloco(ids, "AN");
    for (const id of ids) {
      await Movimentacoes.criar({ id_boletim: id, id_func: usuario.id, status_anterior: "AA", status_novo: "AN", observacao_movimentacao: "Arquivamento rejeitado em bloco" });
    }
    mostrarToast(`${ids.length} arquivamento(s) rejeitado(s)!`);
    await carregarAprovacoes();
    await carregarKPIs();
  } catch (e) {
    mostrarToast("Erro: " + e.message, "erro");
  }
}
// ── Função para Carimbar Anotações do lado da Imagem ────────────────
async function desenharAnotacoesNaImagem(imgBlob, jsonStr) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const espacoAnotacao = 500; // Pixels extras na largura para o texto
      canvas.width = img.width + espacoAnotacao;
      canvas.height = Math.max(img.height, 600);

      const ctx = canvas.getContext("2d");

      // Fundo totalmente branco
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Desenha a imagem original colada na esquerda
      ctx.drawImage(img, 0, 0);

      // Linha divisória
      ctx.beginPath();
      ctx.moveTo(img.width, 0);
      ctx.lineTo(img.width, canvas.height);
      ctx.strokeStyle = "#dddddd";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Configura fonte e cor
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px Arial";
      ctx.fillText("ANOTAÇÕES DO TÉCNICO", img.width + 30, 50);

      let y = 100;
      try {
        const anotacoes = JSON.parse(jsonStr);
        anotacoes.forEach(a => {
          // Quebra de página se passar da altura
          if (y > canvas.height - 100) return;

          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 22px Arial";
          ctx.fillText(`Dia ${a.dia}: Valor ${a.valor}`, img.width + 30, y);
          y += 30;

          ctx.fillStyle = "#475569";
          ctx.font = "18px Arial";
          // Quebra o texto da observação para não vazar a tela
          const obsStr = a.obs || "Sem observação";
          const maxLinha = 40;
          const linhasObs = obsStr.match(new RegExp(`.{1,${maxLinha}}(\\s|$)|.{1,${maxLinha}}`, 'g')) || [obsStr];

          linhasObs.forEach(linha => {
            ctx.fillText(`Obs: ${linha.trim()}`, img.width + 30, y);
            y += 24;
          });

          y += 20;
        });
      } catch (e) {
        ctx.font = "16px Arial";
        ctx.fillText("Erro ao ler anotações.", img.width + 30, y);
      }

      canvas.toBlob((novoBlob) => {
        resolve(novoBlob);
      }, imgBlob.type || "image/jpeg", 0.9);
    };
    img.onerror = () => resolve(imgBlob);
    img.src = URL.createObjectURL(imgBlob);
  });
}
