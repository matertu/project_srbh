// ── Configurações do Supabase (reaproveitando credenciais de boletimAPI.js) ──
const SUPABASE_URL = "https://ytrowyxkuemlqmiyfvll.supabase.co/rest/v1";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cm93eXhrdWVtbHFtaXlmdmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjA4NCwiZXhwIjoyMDk0MTY4MDg0fQ.VneeIzziKTakMFBKI3_YPg9iDwjcjWuayJw8DHllOcI";

const headers = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

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
      // Verificação no Banco do Supabase
      const url = `${SUPABASE_URL}/funcionarios?login_func=eq.${encodeURIComponent(loginValue)}&senha_func=eq.${encodeURIComponent(senhaValue)}&limit=1`;

      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        throw new Error("Erro de conexão com o banco de dados.");
      }

      const dados = await response.json();

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
        } else if (tipoFunc === "digitador") {
          window.location.href = "dashboard_alimentador.html";
        } else if (tipoFunc === "alimentador") {
          window.location.href = "dashboard_alimentador.html";
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
