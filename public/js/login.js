

// ── Captura do formulário de login ──
const formLogin = document.querySelector("form");
const loginInput = document.getElementById("login");
const senhaInput = document.getElementById("senha");
const loginBtn = document.querySelector(".login-btn");

if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginValue = loginInput.value.trim();
    const senhaValue = senhaInput.value;

    if (!loginValue || !senhaValue) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    // Feedback visual do botão
    const originalText = loginBtn.textContent;
    loginBtn.textContent = "VERIFICANDO...";
    loginBtn.disabled = true;

    try {
      // Verificação no Banco do Supabase via data.js
      const endpoint = `funcionarios?login_func=eq.${encodeURIComponent(loginValue)}&senha_func=eq.${encodeURIComponent(senhaValue)}&limit=1`;
      const dados = await _req("GET", endpoint);

      if (dados && dados.length > 0) {
        const funcionario = dados[0];

        // Salva informações do colaborador logado
        localStorage.setItem(
          "usuario_logado",
          JSON.stringify({
            id: funcionario.id_func,
            nome: funcionario.nome_func,
            login: funcionario.login_func,
            tipo: funcionario.tipo_func,
          }),
        );

        loginBtn.textContent = "ENTRANDO...";

        // Redireciona de acordo com a função do usuário
        const tipoFunc = (funcionario.tipo_func || "").trim().toLowerCase();

        if (tipoFunc === "administrador" || tipoFunc === "admin") {
          window.location.href = "admin.html";
        } else if (tipoFunc === "tecnico" || tipoFunc === "técnico") {
          window.location.href = "dashboard_tecnico.html";
        } else if (tipoFunc === "supervisor") {
          window.location.href = "dashboard_supervisor.html";
        } else if (tipoFunc === "digitador" || tipoFunc === "alimentador") {
          window.location.href = "dashboard_digitador.html";
        } else {
          console.warn("Tipo de usuário não reconhecido:", tipoFunc);
          window.location.href = "dashboard.html"; // fallback de segurança
        }
      } else {
        alert("Login ou senha incorretos.");
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Não foi possível autenticar. " + error.message);
      loginBtn.textContent = originalText;
      loginBtn.disabled = false;
    }
  });
}

window.addEventListener("pageshow", function (event) {
  if (event.persisted && loginBtn) {
    loginBtn.textContent = "ENTRAR";
    loginBtn.disabled = false;
  }
});
