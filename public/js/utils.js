// ══════════════════════════════════════════════════════════════════════
//  utils.js — Funções utilitárias compartilhadas do SRBH
// ══════════════════════════════════════════════════════════════════════

// ── Cálculo de dias entre datas ──────────────────────────────────────
function diasEntre(dataInicio, dataFim = new Date()) {
  const d1 = new Date(dataInicio);
  const d2 = dataFim instanceof Date ? dataFim : new Date(dataFim);
  return Math.floor((d2 - d1) / 86400000);
}

// ── Formatar data ISO → "dd/mm/aaaa" ─────────────────────────────────
function fmtData(dataStr) {
  if (!dataStr) return "—";
  const d = new Date(dataStr + (dataStr.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("pt-BR");
}

// ── Formatar data ISO → "mm/aaaa" ────────────────────────────────────
function fmtMesAno(dataStr) {
  if (!dataStr) return "—";
  const [ano, mes] = dataStr.split("-");
  return `${mes}/${ano}`;
}

// ── Formatar datetime ISO → "dd/mm/aaaa HH:MM" ──────────────────────
function fmtDataHora(dataStr) {
  if (!dataStr) return "—";
  const d = new Date(dataStr);
  return (
    d.toLocaleDateString("pt-BR") +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

// ── Gerar nome do arquivo de boletim ─────────────────────────────────
function gerarNomeArquivo(codigoAna, anoMes) {
  // Formato: bol_<codigo>_<aaaa>.<mm>
  const [ano, mes] = anoMes.split("-");
  return `bol_${String(codigoAna).padStart(8, "0")}_${ano}.${mes}`;
}

// ── Máscara para código ANA (8 dígitos) ──────────────────────────────
function mascaraCodAna(input) {
  input.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 8);
  });
}

// ── Máscara para Mês de Observação (MM/AAAA) ─────────────────────────
function mascaraMesAno(input) {
  input.addEventListener("input", function (e) {
    let v = this.value.replace(/\D/g, ""); // Remove tudo que não for dígito
    if (v.length > 6) v = v.slice(0, 6);
    if (v.length > 2) {
      v = v.slice(0, 2) + "/" + v.slice(2);
    }
    this.value = v;
  });
}

// ── Utilitário de Criação de Elementos DOM Seguros ────────────────────
    function criarElemento(tag, atributos = {}, filhos = []) {
      const el = document.createElement(tag);
      for (const [key, value] of Object.entries(atributos)) {
        if (key === "className" || key === "class") {
          el.className = value;
        } else if (key.startsWith("on") && typeof value === "function") {
          el.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
          el.setAttribute(key, value);
        }
      }

      if (!Array.isArray(filhos)) filhos = [filhos];

      filhos.forEach(filho => {
        if (typeof filho === "string" || typeof filho === "number") {
          el.appendChild(document.createTextNode(filho));
        } else if (filho instanceof HTMLElement) {
          el.appendChild(filho);
        }
      });
      return el;
    }

    // ── Converte MM/AAAA para AAAA-MM ────────────────────────────────────
    function parseMesAno(mmAaaa) {
      if (!mmAaaa || mmAaaa.length !== 7) return null;
      const [mes, ano] = mmAaaa.split("/");
      const m = parseInt(mes, 10);
      const a = parseInt(ano, 10);
      if (isNaN(m) || isNaN(a) || m < 1 || m > 12 || a < 1900 || a > 2100) return null;
      return `${ano}-${mes}`;
    }

    // ── Validar código ANA (7 ou 8 dígitos) ──────────────────────────────
    function validarCodAna(codigo) {
      const codLimpo = String(codigo).replace(/\D/g, "");
      return codLimpo.length === 7 || codLimpo.length === 8;
    }

    // ── Badge de status ──────────────────────────────────────────────────
    const STATUS_CONFIG = {
      R: { label: "Recebido", classe: "badge-r", cor: "#6b7280" },
      D: { label: "Digitado", classe: "badge-d", cor: "#2563eb" },
      AN: { label: "Analisado", classe: "badge-an", cor: "#16a34a" },
      AA: { label: "Aprovação Pendente", classe: "badge-r", cor: "#f59e0b" },
      A: { label: "Arquivado", classe: "badge-a", cor: "#7c3aed" },
      E: { label: "Enviado", classe: "badge-e", cor: "#d97706" },
    };

    function criarBadgeStatus(status) {
      const cfg = STATUS_CONFIG[status] || { label: status, classe: "badge-r" };
      const span = document.createElement("span");
      span.className = `badge-status ${cfg.classe}`;
      span.textContent = cfg.label;
      return span;
    }

    function badgeStatusHTML(status) {
      const cfg = STATUS_CONFIG[status] || { label: status, classe: "badge-r" };
      return `<span class="badge-status ${cfg.classe}">${cfg.label}</span>`;
    }

    // ── Semáforo de alerta (dias desde recebimento) ──────────────────────
    function semaforoAlerta(dias) {
      if (dias > 60)
        return `<span class="semaforo vermelho-piscando" title="URGENTE: ${dias} dias">🔴</span>`;
      if (dias > 50)
        return `<span class="semaforo vermelho" title="${dias} dias">🔴</span>`;
      if (dias > 30)
        return `<span class="semaforo amarelo" title="${dias} dias">🟡</span>`;
      return `<span class="semaforo verde" title="${dias} dias">🟢</span>`;
    }

    // ── Toast de notificação ─────────────────────────────────────────────
    function mostrarToast(msg, tipo = "sucesso") {
      const existente = document.querySelector(".srbh-toast");
      if (existente) existente.remove();

      const toast = document.createElement("div");
      toast.className = `srbh-toast ${tipo}`;
      toast.textContent = msg;
      document.body.appendChild(toast);

      requestAnimationFrame(() => toast.classList.add("show"));
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
      }, 3500);
    }

    // ── Modal genérico ───────────────────────────────────────────────────
    function abrirModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add("aberto");
        document.body.style.overflow = "hidden";
      }
    }

    function fecharModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove("aberto");
        document.body.style.overflow = "";
      }
    }

    // Fecha modal ao clicar no overlay
    document.addEventListener("click", function (e) {
      if (e.target.classList.contains("srbh-modal")) {
        e.target.classList.remove("aberto");
        document.body.style.overflow = "";
      }
    });

    // ── Ordenação de tabelas ─────────────────────────────────────────────
    function tornarTabelaOrdenavel(tabelaId) {
      const tabela = document.getElementById(tabelaId);
      if (!tabela) return;

      const headers = tabela.querySelectorAll("thead th[data-sort]");
      headers.forEach((th, idx) => {
        th.style.cursor = "pointer";
        th.addEventListener("click", () => {
          const tbody = tabela.querySelector("tbody");
          const linhas = Array.from(tbody.querySelectorAll("tr"));
          const colIdx = th.cellIndex;
          const asc = th.dataset.ordem !== "asc";
          th.dataset.ordem = asc ? "asc" : "desc";

          // Limpa indicadores
          headers.forEach((h) => h.classList.remove("sort-asc", "sort-desc"));
          th.classList.add(asc ? "sort-asc" : "sort-desc");

          linhas.sort((a, b) => {
            const va = (a.cells[colIdx]?.textContent || "").trim();
            const vb = (b.cells[colIdx]?.textContent || "").trim();
            const na = parseFloat(va),
              nb = parseFloat(vb);
            if (!isNaN(na) && !isNaN(nb)) return asc ? na - nb : nb - na;
            return asc
              ? va.localeCompare(vb, "pt-BR")
              : vb.localeCompare(va, "pt-BR");
          });

          linhas.forEach((l) => tbody.appendChild(l));
        });
      });
    }

    // ── Checkbox "selecionar todos" ──────────────────────────────────────
    function configurarSelecionarTodos(checkAllId, checkboxClass) {
      const checkAll = document.getElementById(checkAllId);
      if (!checkAll) return;
      checkAll.addEventListener("change", () => {
        document.querySelectorAll(`.${checkboxClass}`).forEach((cb) => {
          cb.checked = checkAll.checked;
        });
      });
    }

    // ── Popula um <select> com opções ────────────────────────────────────
    function popularSelect(
      selectEl,
      itens,
      valorKey,
      textoKey,
      placeholder = "Selecione...",
    ) {
      selectEl.innerHTML = `<option value="">${placeholder}</option>`;
      itens.forEach((item) => {
        const opt = document.createElement("option");
        opt.value = item[valorKey];
        opt.textContent = item[textoKey];
        selectEl.appendChild(opt);
      });
    }

    // ── Exportar CSV ─────────────────────────────────────────────────────
    function exportarCSV(nomeArquivo, cabecalhos, linhas) {
      const bom = "\uFEFF"; // UTF-8 BOM para Excel
      let csv = bom + cabecalhos.join(";") + "\n";
      linhas.forEach((l) => {
        csv +=
          l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";") + "\n";
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(url);
    }

    // ── Mês atual no formato aaaa-mm ─────────────────────────────────────
    function mesAtual() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    // ── Primeiro dia do mês como Date ────────────────────────────────────
    function primeiroDiaMes(anoMes) {
      return new Date(anoMes + "-01T00:00:00");
    }
