// ══════════════════════════════════════════════════════════════════════
//  data.js — SRBH Supabase API Client
//  Camada de acesso ao banco de dados para todos os dashboards
// ══════════════════════════════════════════════════════════════════════

const API_URL = "https://ytrowyxkuemlqmiyfvll.supabase.co/rest/v1";
const STORAGE_URL = "https://ytrowyxkuemlqmiyfvll.supabase.co/storage/v1";
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cm93eXhrdWVtbHFtaXlmdmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjA4NCwiZXhwIjoyMDk0MTY4MDg0fQ.VneeIzziKTakMFBKI3_YPg9iDwjcjWuayJw8DHllOcI";

const _headers = {
  "Content-Type": "application/json",
  apikey: API_KEY,
  Authorization: `Bearer ${API_KEY}`,
};

// ── Request genérico ─────────────────────────────────────────────────
async function _req(method, endpoint, body = null) {
  const opts = { method, headers: { ..._headers } };
  if (method === "POST") opts.headers["Prefer"] = "return=representation";
  if (method === "PATCH") opts.headers["Prefer"] = "return=representation";
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}/${endpoint}`, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Erro ${res.status}: ${txt}`);
  }
  return res.json();
}

// ══════════════════════════════════════════════════════════════════════
//  Funcionários
// ══════════════════════════════════════════════════════════════════════
const Funcionarios = {
  listar() {
    return _req(
      "GET",
      "funcionarios?select=id_func,nome_func,login_func,tipo_func&order=nome_func",
    );
  },
  buscarPorId(id) {
    return _req("GET", `funcionarios?id_func=eq.${id}&limit=1`).then(
      (r) => r[0] || null,
    );
  },
  criar(data) {
    return _req("POST", "funcionarios", data);
  },
  atualizar(id, data) {
    return _req("PATCH", `funcionarios?id_func=eq.${id}`, data);
  },
};

// ══════════════════════════════════════════════════════════════════════
//  Roteiros
// ══════════════════════════════════════════════════════════════════════
const Roteiros = {
  listar() {
    return _req("GET", "roteiro?select=*&order=nome_roteiro");
  },
  buscarPorId(id) {
    return _req("GET", `roteiro?id_roteiro=eq.${id}&limit=1`).then(
      (r) => r[0] || null,
    );
  },
  criar(data) {
    return _req("POST", "roteiro", data);
  },
  atualizar(id, data) {
    return _req("PATCH", `roteiro?id_roteiro=eq.${id}`, data);
  },
};

// ══════════════════════════════════════════════════════════════════════
//  Estações
// ══════════════════════════════════════════════════════════════════════
const Estacoes = {
  listar() {
    return _req(
      "GET",
      "estacao?select=*,roteiro(nome_roteiro,uf_roteiro)&order=nome_estacao",
    );
  },
  listarPorRoteiro(idRoteiro) {
    return _req(
      "GET",
      `estacao?select=*,roteiro(nome_roteiro)&id_roteiro=eq.${idRoteiro}&order=nome_estacao`,
    );
  },
  buscarPorCodAna(cod) {
    return _req(
      "GET",
      `estacao?select=*,roteiro(nome_roteiro)&cod_ana_estacao=eq.${cod}&limit=1`,
    ).then((r) => r[0] || null);
  },
  criar(data) {
    return _req("POST", "estacao", data);
  },
  atualizar(id, data) {
    return _req("PATCH", `estacao?id_estacao=eq.${id}`, data);
  },
};

// ══════════════════════════════════════════════════════════════════════
//  Boletins
// ══════════════════════════════════════════════════════════════════════
const Boletins = {
  /** Lista todos os boletins com dados de estação e funcionário embutidos */
  listar(filtros = "") {
    const base =
      "boletim?select=*,estacao(id_estacao,nome_estacao,cod_ana_estacao,id_roteiro,roteiro(id_roteiro,nome_roteiro)),funcionarios(id_func,nome_func)";
    return _req(
      "GET",
      `${base}&order=data_recebimento_boletim.desc${filtros ? "&" + filtros : ""}`,
    );
  },

  listarPorStatus(status) {
    return this.listar(`status_boletim=eq.${status}`);
  },

  listarPorRoteiroViaEstacao(idRoteiro, statusFiltro = null) {
    // Filtra boletins cujas estações pertencem ao roteiro fornecido
    let query = `boletim?select=*,estacao!inner(id_estacao,nome_estacao,cod_ana_estacao,id_roteiro,roteiro(id_roteiro,nome_roteiro)),funcionarios(id_func,nome_func)&estacao.id_roteiro=eq.${idRoteiro}&order=data_recebimento_boletim.desc`;
    if (statusFiltro) query += `&status_boletim=eq.${statusFiltro}`;
    return _req("GET", query);
  },

  buscarPorId(id) {
    return _req(
      "GET",
      `boletim?select=*,estacao(id_estacao,nome_estacao,cod_ana_estacao,id_roteiro,roteiro(id_roteiro,nome_roteiro)),funcionarios(id_func,nome_func)&id_boletim=eq.${id}&limit=1`,
    ).then((r) => r[0] || null);
  },

  /** Verifica se já existe boletim para a estação no mês informado */
  verificarDuplicata(idEstacao, anoMes) {
    return _req(
      "GET",
      `boletim?id_estacao=eq.${idEstacao}&ano_mes_boletim=eq.${anoMes}&limit=1`,
    ).then((r) => (r.length > 0 ? r[0] : null));
  },

  criar(data) {
    return _req("POST", "boletim", data);
  },

  atualizarStatus(id, novoStatus) {
    return _req("PATCH", `boletim?id_boletim=eq.${id}`, {
      status_boletim: novoStatus,
    });
  },

  atualizarStatusEmBloco(ids, novoStatus) {
    const filtro = ids.map((id) => `id_boletim.eq.${id}`).join(",");
    return _req("PATCH", `boletim?or=(${filtro})`, {
      status_boletim: novoStatus,
    });
  },

  /** Conta boletins por status (para KPIs) */
  async contarPorStatus() {
    const todos = await _req("GET", "boletim?select=status_boletim");
    const contagem = { R: 0, D: 0, AN: 0, A: 0, E: 0 };
    todos.forEach((b) => {
      if (contagem[b.status_boletim] !== undefined)
        contagem[b.status_boletim]++;
    });
    contagem.total = todos.length;
    return contagem;
  },

  /** Conta boletins por status filtrando por mês de observação */
  async contarPorStatusNoMes(anoMes) {
    const todos = await _req(
      "GET",
      `boletim?select=status_boletim&ano_mes_boletim=eq.${anoMes}`,
    );
    const contagem = { R: 0, D: 0, AN: 0, A: 0, E: 0 };
    todos.forEach((b) => {
      if (contagem[b.status_boletim] !== undefined)
        contagem[b.status_boletim]++;
    });
    contagem.total = todos.length;
    return contagem;
  },
};

// ══════════════════════════════════════════════════════════════════════
//  Movimentações (Logs de auditoria)
// ══════════════════════════════════════════════════════════════════════
const Movimentacoes = {
  listarPorBoletim(idBoletim) {
    return _req(
      "GET",
      `movimentacao?select=*,funcionarios(nome_func)&id_boletim=eq.${idBoletim}&order=date_time_movimentacao.desc`,
    );
  },

  criar(data) {
    // data = { id_boletim, id_func, status_anterior, status_novo, observacao_movimentacao? }
    return _req("POST", "movimentacao", {
      ...data,
      date_time_movimentacao: new Date().toISOString(),
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
//  Tipos de Justificativa
// ══════════════════════════════════════════════════════════════════════
const TiposJustificativa = {
  listar() {
    return _req("GET", "tipo_justificativa?select=*&order=id_tipo");
  },
  criar(data) {
    return _req("POST", "tipo_justificativa", data);
  },
};

// ══════════════════════════════════════════════════════════════════════
//  Justificativas de Atraso
// ══════════════════════════════════════════════════════════════════════
const Justificativas = {
  listarPorBoletim(idBoletim) {
    return _req(
      "GET",
      `justificativa_atraso?select=*,tipo_justificativa(descricao_tipo)&id_boletim=eq.${idBoletim}&order=data_hora_justificativa.desc`,
    );
  },

  criar(data) {
    return _req("POST", "justificativa_atraso", {
      ...data,
      data_hora_justificativa: new Date().toISOString(),
    });
  },
};

// ══════════════════════════════════════════════════════════════════════
//  Helper: Usuário logado (do localStorage)
// ══════════════════════════════════════════════════════════════════════
function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuario_logado"));
  } catch {
    return null;
  }
}

function verificarLogin(tiposPermitidos) {
  const user = getUsuarioLogado();
  if (!user) {
    window.location.href = "index.html";
    return null;
  }
  if (tiposPermitidos) {
    const tipoNormalizado = (user.tipo || "").trim().toLowerCase();
    const permitidosNormalizados = tiposPermitidos.map((t) =>
      t.trim().toLowerCase(),
    );
    if (!permitidosNormalizados.includes(tipoNormalizado)) {
      alert("Acesso negado para o seu perfil.");
      window.location.href = "index.html";
      return null;
    }
  }
  return user;
}

function logout() {
  localStorage.removeItem("usuario_logado");
  window.location.href = "index.html";
}

// ══════════════════════════════════════════════════════════════════════
//  Storage — Upload de arquivos para o bucket "boletins"
// ══════════════════════════════════════════════════════════════════════
const Storage = {
  /**
   * Faz upload de um arquivo para o bucket "boletins".
   * @param {File} arquivo   - O objeto File do input
   * @param {string} nomeArquivo - Nome desejado (ex: "bol_10100000_2026.05.jpg")
   * @returns {string} URL pública do arquivo
   */
  async upload(arquivo, nomeArquivo) {
    // Detecta extensão do arquivo original
    const ext = arquivo.name.split(".").pop().toLowerCase();
    const nomeCompleto = `${nomeArquivo}.${ext}`;

    const res = await fetch(`${STORAGE_URL}/object/boletins/${nomeCompleto}`, {
      method: "POST",
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": arquivo.type,
        "x-upsert": "true", // Substitui se já existir
      },
      body: arquivo,
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Erro no upload: ${res.status} — ${txt}`);
    }

    // Retorna a URL pública
    return `${STORAGE_URL}/object/public/boletins/${nomeCompleto}`;
  },

  /**
   * Monta a URL pública de um arquivo já salvo.
   * @param {string} nomeArquivo - Nome do ficheiro (ex: "bol_10100000_2026.05.jpg")
   */
  getPublicUrl(nomeArquivo) {
    return `${STORAGE_URL}/object/public/boletins/${nomeArquivo}`;
  },

  /**
   * Substitui um arquivo existente (usa x-upsert).
   * Mesma lógica do upload, pois o header x-upsert já cobre.
   */
  substituir(arquivo, nomeArquivo) {
    return this.upload(arquivo, nomeArquivo);
  },
};
