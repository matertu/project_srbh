// ── Configurações do Supabase (reaproveitando credenciais de boletimAPI.js) ──
const SUPABASE_URL = "https://ytrowyxkuemlqmiyfvll.supabase.co/rest/v1";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cm93eXhrdWVtbHFtaXlmdmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjA4NCwiZXhwIjoyMDk0MTY4MDg0fQ.VneeIzziKTakMFBKI3_YPg9iDwjcjWuayJw8DHllOcI";

const headers = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Prefer: "return=representation",
};

// ── Elementos do DOM ──
const formFuncionario = document.getElementById("formFuncionario");
const funcionariosList = document.getElementById("funcionariosList");
const totalFuncionarios = document.getElementById("totalFuncionarios");
const loader = document.getElementById("loader");
const listaVazia = document.getElementById("listaVazia");
const senhaInput = document.getElementById("senha_func");

// ── Toast moderno de feedback ──
function mostrarToast(mensagem, tipo) {
  const toast = document.getElementById("toast");
  toast.textContent = mensagem;
  toast.className = `toast show ${tipo}`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

async function buscarFuncionarios() {
  mostrarLoader(true);
  try {
    const response = await fetch(
      `${SUPABASE_URL}/funcionarios?select=id_func,nome_func,login_func,tipo_func&order=id_func.desc`,
      {
        method: "GET",
        headers: headers,
      },
    );

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(
        erro.message || "Erro desconhecido ao carregar colaboradores.",
      );
    }

    const funcionarios = await response.json();
    renderizarFuncionarios(funcionarios);
  } catch (error) {
    console.error("Erro ao buscar funcionários:", error);
    mostrarToast(`✖ Erro ao carregar funcionários: ${error.message}`, "erro");
  } finally {
    mostrarLoader(false);
  }
}

// ── Mostrar/Ocultar Loader ──
function mostrarLoader(visivel) {
  if (visivel) {
    loader.style.display = "flex";
    funcionariosList.style.display = "none";
    listaVazia.style.display = "none";
  } else {
    loader.style.display = "none";
    funcionariosList.style.display = "grid";
  }
}

function renderizarFuncionarios(lista) {
  funcionariosList.innerHTML = "";
  totalFuncionarios.textContent = lista.length;

  if (lista.length === 0) {
    listaVazia.style.display = "block";
    return;
  }

  listaVazia.style.display = "none";

  lista.forEach((func) => {
    const item = document.createElement("div");
    item.className = "funcionario-item";

    const cargosExibicao = {
      tecnico: "Técnico",
      supervisor: "Supervisor",
      digitador: "Digitador",
      alimentador: "Alimentador",
    };
    const cargoFormatado = cargosExibicao[func.tipo_func] || func.tipo_func;

    item.innerHTML = `
      <div class="funcionario-info">
        <h3 title="${func.nome_func}">${func.nome_func}</h3>
        <div class="info-row">
          <strong>Login:</strong> <span>${func.login_func}</span>
        </div>
        <span class="tag-funcao ${func.tipo_func}">${cargoFormatado}</span>
      </div>
    `;
    funcionariosList.appendChild(item);
  });
}

formFuncionario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome_func").value.trim();
  const login = document.getElementById("login_func").value.trim();
  const senha = senhaInput.value;
  const tipo = document.getElementById("tipo_func").value;

  if (!nome || !login || !senha || !tipo) {
    mostrarToast("⚠ Preencha todos os campos do formulário.", "erro");
    return;
  }

  const nomeRegex = /^[A-Za-zÀ-ÿ\s]+$/;
  if (!nomeRegex.test(nome)) {
    mostrarToast(
      "⚠ O nome não pode conter números ou caracteres especiais.",
      "erro",
    );
    return;
  }

  const payload = {
    nome_func: nome,
    login_func: login,
    senha_func: senha,
    tipo_func: tipo,
  };

  const btnCadastrar = formFuncionario.querySelector(".btn-cadastrar-func");
  const originalText = btnCadastrar.innerHTML;
  btnCadastrar.innerHTML = "<span>Cadastrando...</span>";
  btnCadastrar.disabled = true;

  try {
    const response = await fetch(`${SUPABASE_URL}/funcionarios`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const erro = await response.json();
      // Tratar erro de login duplicado
      if (erro.message && erro.message.includes("violates unique constraint")) {
        throw new Error(
          "Este login de acesso já está em uso por outro funcionário.",
        );
      }
      throw new Error(
        erro.message || "Não foi possível cadastrar o colaborador.",
      );
    }

    mostrarToast("✔ Funcionário cadastrado com sucesso!", "sucesso");
    formFuncionario.reset();

    // Atualizar lista
    await buscarFuncionarios();
  } catch (error) {
    console.error("Erro ao cadastrar funcionário:", error);
    mostrarToast(`✖ Erro: ${error.message}`, "erro");
  } finally {
    btnCadastrar.innerHTML = originalText;
    btnCadastrar.disabled = false;
  }
});

// ── Iniciar página ──
window.onload = () => {
  buscarFuncionarios();
};
