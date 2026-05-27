function mostrarCadastro(tipo) {
  // Alterar exibição dos cards
  document.getElementById("cadUsuarios").style.display =
    tipo === "usuarios" ? "block" : "none";
  document.getElementById("cadEstacoes").style.display =
    tipo === "estacoes" ? "block" : "none";
  document.getElementById("cadRoteiros").style.display =
    tipo === "roteiros" ? "block" : "none";

  // Alterar cor dos botões
  document.getElementById("btnCadUsuarios").className =
    tipo === "usuarios" ? "srbh-btn btn-primary" : "srbh-btn btn-secondary";
  document.getElementById("btnCadEstacoes").className =
    tipo === "estacoes" ? "srbh-btn btn-primary" : "srbh-btn btn-secondary";
  document.getElementById("btnCadRoteiros").className =
    tipo === "roteiros" ? "srbh-btn btn-primary" : "srbh-btn btn-secondary";

  // Carregar tabelas
  if (tipo === "usuarios") carregarCadastroUsuarios();
  if (tipo === "estacoes") carregarCadastroEstacoes();
  if (tipo === "roteiros") carregarCadastroRoteiros();
}

async function carregarCadastroUsuarios() {
  const tbody = document.getElementById("tbodyUsuarios");
  tbody.innerHTML =
    '<tr><td colspan="4" class="srbh-vazio">Carregando...</td></tr>';
  try {
    const funcs = await Funcionarios.listar();
    tbody.innerHTML = funcs
      .map(
        (f) =>
          `<tr><td>${f.id_func}</td><td>${f.nome_func}</td><td>${f.login_func}</td><td>${f.tipo_func}</td></tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

async function cadastrarUsuario(e) {
  e.preventDefault();

  const nome = document.getElementById("cadNome").value.trim();
  const nomeRegex = /^[A-Za-zÀ-ÿ\s]+$/;
  if (!nomeRegex.test(nome)) {
    mostrarToast(
      "⚠ O nome não pode conter números ou caracteres especiais.",
      "erro",
    );
    return;
  }

  try {
    await Funcionarios.criar({
      nome_func: nome,
      login_func: document.getElementById("cadLogin").value,
      senha_func: document.getElementById("cadSenha").value,
      tipo_func: document.getElementById("cadTipo").value,
    });
    mostrarToast("Usuário cadastrado!");
    e.target.reset();
    await carregarCadastroUsuarios();
  } catch (err) {
    mostrarToast("Erro: " + err.message, "erro");
  }
}

async function carregarCadastroEstacoes() {
  const tbody = document.getElementById("tbodyEstacoes");
  tbody.innerHTML =
    '<tr><td colspan="4" class="srbh-vazio">Carregando...</td></tr>';
  try {
    const ests = await Estacoes.listar();
    tbody.innerHTML = ests
      .map(
        (e) =>
          `<tr><td>${e.id_estacao}</td><td>${e.cod_ana_estacao}</td><td>${e.nome_estacao}</td><td>${e.tipo_estacao || "—"}</td><td>${e.roteiro?.nome_roteiro || "—"}</td></tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

async function cadastrarEstacao(e) {
  e.preventDefault();
  const cod = document.getElementById("cadCodAna").value;
  if (!validarCodAna(cod)) {
    alert("Código ANA deve ter 7 ou 8 dígitos numéricos.");
    return;
  }
  try {
    await Estacoes.criar({
      cod_ana_estacao: parseInt(cod),
      nome_estacao: document.getElementById("cadNomeEst").value,
      id_roteiro: parseInt(document.getElementById("cadRoteiroEst").value),
      tipo_estacao: document.getElementById("cadTipoEst").value,
    });
    mostrarToast("Estação cadastrada!");
    e.target.reset();
    await carregarCadastroEstacoes();
  } catch (err) {
    mostrarToast("Erro: " + err.message, "erro");
  }
}

async function carregarCadastroRoteiros() {
  const tbody = document.getElementById("tbodyRoteiros");
  tbody.innerHTML =
    '<tr><td colspan="3" class="srbh-vazio">Carregando...</td></tr>';
  try {
    const rots = await Roteiros.listar();
    tbody.innerHTML = rots
      .map(
        (r) =>
          `<tr><td>${r.id_roteiro}</td><td>${r.nome_roteiro}</td><td>${(r.uf_roteiro || "").toUpperCase()}</td></tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="3" class="srbh-vazio">Erro ao carregar os dados.</td></tr>';
  }
}

async function cadastrarRoteiro(e) {
  e.preventDefault();
  try {
    await Roteiros.criar({
      nome_roteiro: document.getElementById("cadNomeRot").value,
      uf_roteiro: document.getElementById("cadUfRot").value,
    });
    mostrarToast("Roteiro cadastrado!");
    e.target.reset();
    await carregarCadastroRoteiros();
    // Atualiza dropdowns
    const roteiros = await Roteiros.listar();
    popularSelect(
      document.getElementById("filtroDashRot"),
      roteiros,
      "id_roteiro",
      "nome_roteiro",
      "Todos",
    );
    popularSelect(
      document.getElementById("cadRoteiroEst"),
      roteiros,
      "id_roteiro",
      "nome_roteiro",
      "Selecione...",
    );
  } catch (err) {
    mostrarToast("Erro: " + err.message, "erro");
  }
}

