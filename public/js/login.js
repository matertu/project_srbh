// FUNÇÃO DE RECUPERAÇÃO DE SENHA (AGORA SE COMUNICA COM O BACKEND JAVA SPRING BOOT)
async function executarRecuperacao() {
  const email = document.getElementById("emailRecuperacao").value.trim();
  
  if (!email) {
    alert("Por favor, digite seu e-mail.");
    return;
  }

  try {
    // 1. Envia a requisição para a nossa API Java na porta 8080
    const response = await fetch('http://localhost:8080/api/auth/recuperar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    });

    const data = await response.json();

    if (!response.ok) {
      alert("Erro: " + data.error);
      return;
    }

    // 2. Resposta de simulação vinda do Java
    if (data.real_email) {
      alert(data.message);
    } else {
      alert(`[SIMULAÇÃO PELO BACKEND JAVA]\n\nEnviado para: ${email}\n\nMensagem: Sua senha atual é: ${data.senha}`);
    }

    window.location.href = "index.html"; 

  } catch (err) {
    console.error("Erro inesperado:", err);
    alert("Ocorreu um erro. Verifique se o servidor Spring Boot está rodando!");
  }
}

// FUNÇÃO DE LOGIN INTEGRADA AO BACKEND JAVA SPRING BOOT
async function fazerlogin() {
  const emailDigitado = document.getElementById("email").value.trim();
  const senhaDigitada = document.getElementById("senha").value;

  if (!emailDigitado || !senhaDigitada) {
    alert("Por favor, preencha o email e a senha.");
    return;
  }

  try {
    // Dispara a tentativa de login para o servidor Java
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailDigitado, senha: senhaDigitada })
    });

    const data = await response.json();

    // Se o backend recusar o login
    if (!response.ok) {
      alert(data.error); 
      return;
    }

    // Se o login der certo, pega os dados que o Java validou
    const funcionario = data.usuario;
    sessionStorage.setItem("usuarioLogado", funcionario.nome_func);
    sessionStorage.setItem("tipoUsuario", funcionario.tipo_func);
    
    // Redirecionamento baseado na resposta do backend Java
    if (funcionario.tipo_func === "administrador") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (err) {
    console.error("Erro inesperado:", err);
    alert("Não foi possível conectar ao servidor. O Spring Boot está rodando?");
  }
}
