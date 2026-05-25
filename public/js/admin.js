async function checarSessao() {
  const tipo = sessionStorage.getItem("tipoUsuario");
  
  if (tipo !== "administrador") {
    alert("Acesso bloqueado. Apenas administradores podem acessar esta página.");
    window.location.href = "index.html";
    return false;
  }
  return true;
}

window.onload = async () => {
  const autorizado = await checarSessao();
  if (autorizado) {
    listarFuncionarios();
  }
};

async function logoutAdmin() {
  sessionStorage.clear();
  window.location.href = "index.html";
}

async function cadastrarFuncionario() {
  const nome_func = document.getElementById("nomeFuncionario").value.trim();
  const login_func = document.getElementById("loginFuncionario").value.trim();
  const tipo_func = document.getElementById("tipoFuncionario").value.trim();
  const senha_func = document.getElementById("senhaFuncionario").value;
  if (nome_func === "" || login_func === "" || tipo_func === "" || senha_func === "") {
    alert("Preencha nome, email, tipo e senha.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('funcionarios')
      .insert([{ nome_func, login_func, tipo_func, senha_func }]);

    if (error) {
      console.error("Erro ao cadastrar:", error);
      alert("Erro ao cadastrar: " + error.message);
      return;
    }

    alert("Funcionário cadastrado com sucesso!");
    // Limpa o formulário
    document.getElementById("nomeFuncionario").value = "";
    document.getElementById("loginFuncionario").value = "";
    document.getElementById("tipoFuncionario").value = "";
    document.getElementById("senhaFuncionario").value = "";

    listarFuncionarios();
  } catch (err) {
    console.error("Erro inesperado:", err);
    alert("Erro inesperado ao cadastrar.");
  }
}

async function listarFuncionarios() {
  const listaDiv = document.getElementById("listaFuncionarios");
  listaDiv.innerHTML = "<p style='text-align:center;'>Carregando funcionários...</p>";

  try {
    const { data: lista, error } = await supabaseClient
      .from('funcionarios')
      .select('*')
      .order('nome_func', { ascending: true });

    if (error) {
      console.error("Erro ao buscar funcionários:", error);
      listaDiv.innerHTML = "<p style='text-align:center; color:red;'>Erro ao carregar: " + error.message + "</p>";
      return;
    }

    let html = "";

    if (lista.length === 0) {
      html = "<p style='text-align:center; grid-column: 1 / -1;'>Nenhum funcionário cadastrado no banco de dados.</p>";
    } else {
      lista.forEach((funcionario) => {
        let btnDeletar = "";
        
        // Só exibe a lixeira se NÃO for um administrador
        if (funcionario.tipo_func !== "administrador") {
          btnDeletar = `<button onclick="deletarFuncionario('${funcionario.id_func}', '${funcionario.tipo_func}')" style=" position:absolute; top:15px; right:15px; border:none; background:#d62828; color:white; width:35px; height:35px; border-radius:8px; cursor:pointer; font-size:18px; font-weight:bold; transition: background 0.2s; " onmouseover="this.style.background='#b31b1b'" onmouseout="this.style.background='#d62828'" title="Excluir funcionário"> 🗑 </button>`;
        }

        html += ` <div style=" background:#f3f6fa; padding:20px; border-radius:12px; font-size:16px; line-height:1.6; position:relative; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; "> ${btnDeletar} <strong>Nome:</strong> ${funcionario.nome_func}<br> <strong>Email:</strong> ${funcionario.login_func}<br> <strong>Tipo:</strong> ${funcionario.tipo_func}<br> <strong>Senha:</strong> ${funcionario.senha_func} </div> `;
      });
    }

    listaDiv.innerHTML = html;
  } catch (err) {
    console.error("Erro inesperado:", err);
    listaDiv.innerHTML = "<p style='text-align:center; color:red;'>Erro inesperado.</p>";
  }
}

async function deletarFuncionario(id_func, tipo_func) {
  if (tipo_func === "administrador") {
    alert("Operação negada: Não é permitido deletar um perfil de administrador do sistema.");
    return;
  }

  const confirmar = confirm("Tem certeza que deseja deletar este funcionário?");
  if (confirmar) {
    try {
      const { error } = await supabaseClient
        .from('funcionarios')
        .delete()
        .eq('id_func', id_func);

      if (error) {
        console.error("Erro ao deletar:", error);
        alert("Erro ao deletar: " + error.message);
        return;
      }

      alert("Funcionário deletado com sucesso.");
      listarFuncionarios();
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert("Erro inesperado ao deletar.");
    }
  }
}

