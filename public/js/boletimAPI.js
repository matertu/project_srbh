// ── Configuração Supabase ─────────────────────────────────────
const SUPABASE_URL     = "https://ytrowyxkuemlqmiyfvll.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cm93eXhrdWVtbHFtaXlmdmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjA4NCwiZXhwIjoyMDk0MTY4MDg0fQ.VneeIzziKTakMFBKI3_YPg9iDwjcjWuayJw8DHllOcI"; 

const headers = {
  "Content-Type":  "application/json",
  "apikey":        SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Prefer":        "return=representation",
};


// ── Salvar Boletim ────────────────────────────────────────────
/**
 * Salva um boletim na tabela `boletim` do Supabase.
 *
 * @param {Object} dados
 * @param {number} dados.id_estacao              - FK para tabela estacao (obrigatório)
 * @param {number|null} dados.id_func            - FK para tabela funcionarios (opcional)
 * @param {string} dados.ano_mes_boletim         - Data no formato "YYYY-MM-DD" (ex: "2026-05-01")
 * @param {string} dados.status_boletim          - Enum status_bol (default: "R")
 * @param {string} dados.ficheiro_boletim        - Nome/caminho do ficheiro (obrigatório)
 * @param {string} dados.data_recebimento_boletim - Data no formato "YYYY-MM-DD" (obrigatório)
 *
 * @returns {Promise<Object>} O registro inserido com id_boletim gerado
 */
async function salvarBoletim(dados) {
  const payload = {
    id_estacao:                dados.id_estacao,
    id_func:                   dados.id_func ?? null,
    ano_mes_boletim:           dados.ano_mes_boletim,
    status_boletim:            dados.status_boletim ?? "R",
    ficheiro_boletim:          dados.ficheiro_boletim,
    data_recebimento_boletim:  dados.data_recebimento_boletim,
  };

  const response = await fetch(`${SUPABASE_URL}/boletim`, {
    method:  "POST",
    headers: headers,
    body:    JSON.stringify(payload),
  });

  if (!response.ok) {
    const erro = await response.json();
    throw new Error(`Erro ao salvar boletim: ${erro.message ?? JSON.stringify(erro)}`);
  }

  const resultado = await response.json();
  return Array.isArray(resultado) ? resultado[0] : resultado;
}


// ── Buscar Boletins ───────────────────────────────────────────
/**
 * Busca todos os boletins. Aceita filtros opcionais.
 *
 * @param {Object} [filtros]
 * @param {number} [filtros.id_estacao]   - Filtra por estação
 * @param {number} [filtros.id_func]      - Filtra por funcionário
 * @param {string} [filtros.status_boletim] - Filtra por status (ex: "R", "E")
 *
 * @returns {Promise<Array>}
 */
async function buscarBoletins(filtros = {}) {
  const params = new URLSearchParams();

  if (filtros.id_estacao)     params.append("id_estacao",     `eq.${filtros.id_estacao}`);
  if (filtros.id_func)        params.append("id_func",        `eq.${filtros.id_func}`);
  if (filtros.status_boletim) params.append("status_boletim", `eq.${filtros.status_boletim}`);

  params.append("order", "id_boletim.desc");

  const url = `${SUPABASE_URL}/boletim?${params.toString()}`;

  const response = await fetch(url, {
    method:  "GET",
    headers: headers,
  });

  if (!response.ok) {
    const erro = await response.json();
    throw new Error(`Erro ao buscar boletins: ${erro.message ?? JSON.stringify(erro)}`);
  }

  return await response.json();
}


// ── Buscar Boletim por ID ─────────────────────────────────────
/**
 * Busca um boletim específico pelo id_boletim.
 *
 * @param {number} id - id_boletim
 * @returns {Promise<Object|null>}
 */
async function buscarBoletimPorId(id) {
  const response = await fetch(
    `${SUPABASE_URL}/boletim?id_boletim=eq.${id}&limit=1`,
    { method: "GET", headers: headers }
  );

  if (!response.ok) {
    const erro = await response.json();
    throw new Error(`Erro ao buscar boletim: ${erro.message ?? JSON.stringify(erro)}`);
  }

  const resultado = await response.json();
  return resultado.length > 0 ? resultado[0] : null;
}


// ── Atualizar Boletim ─────────────────────────────────────────
/**
 * Atualiza campos de um boletim existente.
 *
 * @param {number} id     - id_boletim a atualizar
 * @param {Object} campos - Campos a alterar (ex: { status_boletim: "E" })
 * @returns {Promise<Object>}
 */
async function atualizarBoletim(id, campos) {
  const response = await fetch(
    `${SUPABASE_URL}/boletim?id_boletim=eq.${id}`,
    {
      method:  "PATCH",
      headers: headers,
      body:    JSON.stringify(campos),
    }
  );

  if (!response.ok) {
    const erro = await response.json();
    throw new Error(`Erro ao atualizar boletim: ${erro.message ?? JSON.stringify(erro)}`);
  }

  const resultado = await response.json();
  return Array.isArray(resultado) ? resultado[0] : resultado;
}


// ── Deletar Boletim ───────────────────────────────────────────
/**
 * Remove um boletim pelo id_boletim.
 *
 * @param {number} id - id_boletim a deletar
 * @returns {Promise<boolean>} true se deletado com sucesso
 */
async function deletarBoletim(id) {
  const response = await fetch(
    `${SUPABASE_URL}/boletim?id_boletim=eq.${id}`,
    {
      method:  "DELETE",
      headers: { ...headers, "Prefer": "return=minimal" },
    }
  );

  if (!response.ok) {
    const erro = await response.json();
    throw new Error(`Erro ao deletar boletim: ${erro.message ?? JSON.stringify(erro)}`);
  }

  return true;
}


// ── Helper: converte objeto Boletim → payload do banco ────────
/**
 * Converte um objeto da classe Boletim para o formato
 * esperado pela tabela do banco de dados.
 *
 * @param {Boletim} boletim         - Instância da classe Boletim
 * @param {string}  ficheiro        - Nome do ficheiro (ex: "boletim_05_2026.pdf")
 * @param {string}  dataRecebimento - Data de recebimento "YYYY-MM-DD"
 * @returns {Object} payload pronto para salvarBoletim()
 */
function boletimParaPayload(boletim, ficheiro, dataRecebimento) {
  const mes = String(boletim.getMes()).padStart(2, "0");
  const ano = boletim.getAno();

  return {
    id_estacao:                boletim.getIdEstacao(),
    id_func:                   boletim.getIdFunc() || null,
    ano_mes_boletim:           `${ano}-${mes}-01`,
    status_boletim:            boletim.getStatus() ?? "R",
    ficheiro_boletim:          ficheiro,
    data_recebimento_boletim:  dataRecebimento,
  };
}


// ── Exportações (use conforme seu ambiente) ───────────────────
// Para uso com import/export (ES Modules):
// export { salvarBoletim, buscarBoletins, buscarBoletimPorId, atualizarBoletim, deletarBoletim, boletimParaPayload };

// Para uso direto no browser (script tag), as funções já ficam no escopo global.


// ════════════════════════════════════════════════════════════════
// EXEMPLO DE USO
// ════════════════════════════════════════════════════════════════
//
// 1) Usando a classe Boletim + helper:
//
//    const b = new Boletim("João Silva", 5, 2026);
//    b.setIdEstacao(101);
//    b.setIdFunc(7);
//    b.setStatus("R");
//
//    const payload = boletimParaPayload(b, "boletim_05_2026.pdf", "2026-05-24");
//    const salvo   = await salvarBoletim(payload);
//    console.log("Salvo com ID:", salvo.id_boletim);
//
//
// 2) Direto com um objeto literal:
//
//    const salvo = await salvarBoletim({
//      id_estacao:                101,
//      id_func:                   7,
//      ano_mes_boletim:           "2026-05-01",
//      status_boletim:            "R",
//      ficheiro_boletim:          "boletim_05_2026.pdf",
//      data_recebimento_boletim:  "2026-05-24",
//    });
//    console.log("Boletim salvo:", salvo);
//
//
// 3) Buscar todos os boletins de uma estação:
//
//    const lista = await buscarBoletins({ id_estacao: 101 });
//    console.log(lista);
//
//
// 4) Atualizar status de um boletim:
//
//    await atualizarBoletim(3, { status_boletim: "E" });
//
//
// 5) Deletar:
//
//    await deletarBoletim(3);
