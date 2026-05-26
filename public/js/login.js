// ── Configurações do Supabase (reaproveitando credenciais de boletimAPI.js) ──
const SUPABASE_URL = "https://ytrowyxkuemlqmiyfvll.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cm93eXhrdWVtbHFtaXlmdmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjA4NCwiZXhwIjoyMDk0MTY4MDg0fQ.VneeIzziKTakMFBKI3_YPg9iDwjcjWuayJw8DHllOcI";

const headers = {
  "Content-Type":  "application/json",
  "apikey":        SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
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
      // 1. Verificação se é o Administrador Geral
      if (loginValue.toLowerCase() === "admin" && senhaValue === "12345") {
        loginBtn.textContent = "ENTRANDO...";
        // Salva dados do Admin no localStorage
        localStorage.setItem("usuario_logado", JSON.stringify({
          nome: "Administrador",
          login: "admin",
          tipo: "admin"
        }));
        
        // Redireciona para o Painel do Administrador
        window.location.href = "admin.html";
        return;
      }

      // 2. Verificação no Banco do Supabase (para os funcionários cadastrados)
      const url = `${SUPABASE_URL}/funcionarios?login_func=eq.${encodeURIComponent(loginValue)}&senha_func=eq.${encodeURIComponent(senhaValue)}&limit=1`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: headers
      });

      if (!response.ok) {
        throw new Error("Erro de conexão com o banco de dados.");
      }

      const dados = await response.json();

      if (dados && dados.length > 0) {
        const funcionario = dados[0];
        
        // Salva informações do colaborador logado
        localStorage.setItem("usuario_logado", JSON.stringify({
          id: funcionario.id_func,
          nome: funcionario.nome_func,
          login: funcionario.login_func,
          tipo: funcionario.tipo_func
        }));

        loginBtn.textContent = "ENTRANDO...";

        // Redireciona para o painel geral de boletins
        window.location.href = "dashboard.html";
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
