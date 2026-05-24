let telaOriginal = "";
let funcionarios = [
  {
    nome: "Carlos Henrique",
    cpf: "123.456.789-00",
    cargo: "Técnico",
    senha: "carlos123",
  },
  {
    nome: "Mariana Souza",
    cpf: "987.654.321-11",
    cargo: "Supervisora",
    senha: "mariana123",
  },
  {
    nome: "Felipe Rocha",
    cpf: "456.123.789-55",
    cargo: "Digitalizador",
    senha: "felipe123",
  },
  {
    nome: "Juliana Mendes",
    cpf: "741.852.963-77",
    cargo: "Técnica",
    senha: "juliana123",
  },
  {
    nome: "Ricardo Lima",
    cpf: "852.951.357-22",
    cargo: "Supervisor",
    senha: "ricardo123",
  },
];
function abrirAdmin() {
  const senha = prompt("Digite a senha de administrador:");
  if (senha !== "12345") {
    alert("Senha errada, acesso negado.");
    return;
  }
  const mainCard = document.getElementById("mainCard");
  telaOriginal = mainCard.innerHTML;
  mainCard.innerHTML = ` <div style=" display:flex; justify-content:center; margin-bottom:40px; "> <img src="../assets/img/logo-sgb-form.png" style=" width:20%; object-fit:contain; " > </div> <h1>CADASTRO DE FUNCIONÁRIOS</h1> <form> <div class="input-group"> <label>Nome:</label> <input type="text" id="nomeFuncionario" placeholder="Digite o nome" > </div> <div class="input-group"> <label>CPF:</label> <input type="text" id="cpfFuncionario" placeholder="Digite o CPF" > </div> <div class="input-group"> <label>Função:</label> <input type="text" id="cargoFuncionario" placeholder="Digite a função do funcionário" > </div> <div class="input-group"> <label>Senha do funcionário:</label> <input type="text" id="senhaFuncionario" placeholder="Digite a senha do funcionário" > </div> <div class="input-group"> <label>Ano de entrada:</label> <input type="number" placeholder="Digite o ano" > </div> <div class="input-group"> <label>Email corporativo:</label> <input type="email" placeholder="Digite o email" > </div> <button type="button" class="login-btn" onclick="cadastrarFuncionario()" > CADASTRAR </button> </form> <br><br> <button class="login-btn" onclick="listarFuncionarios()" > LISTAR FUNCIONÁRIOS </button> <div id="listaFuncionarios"></div> `;
  const adminButton = document.getElementById("adminButton");
  adminButton.innerHTML = "← VOLTAR";
  adminButton.onclick = voltarTelaLogin;
}
function voltarTelaLogin() {
  const mainCard = document.getElementById("mainCard");
  mainCard.innerHTML = telaOriginal;
  const adminButton = document.getElementById("adminButton");
  adminButton.innerHTML = "ADMIN";
  adminButton.onclick = abrirAdmin;
}
function cadastrarFuncionario() {
  const nome = document.getElementById("nomeFuncionario").value;
  const cpf = document.getElementById("cpfFuncionario").value;
  const cargo = document.getElementById("cargoFuncionario").value;
  const senha = document.getElementById("senhaFuncionario").value;
  if (nome === "" || cpf === "" || cargo === "" || senha === "") {
    alert("Preencha nome, CPF, função e senha.");
    return;
  }
  funcionarios.push({ nome: nome, cpf: cpf, cargo: cargo, senha: senha });
  alert("Funcionário cadastrado com sucesso.");
  listarFuncionarios();
}
function listarFuncionarios() {
  let html = ` <div style="margin-top:30px;"> <h1 style=" font-size:28px; margin-bottom:25px; color:#0b3d5c; text-align:center; "> FUNCIONÁRIOS </h1> `;
  funcionarios.forEach((funcionario, index) => {
    html += ` <div style=" background:#f3f6fa; padding:18px; border-radius:12px; margin-bottom:14px; font-size:16px; line-height:1.5; position:relative; "> <button onclick="deletarFuncionario(${index})" style=" position:absolute; top:15px; right:15px; border:none; background:#d62828; color:white; width:35px; height:35px; border-radius:8px; cursor:pointer; font-size:18px; font-weight:bold; " > 🗑 </button> <strong>Nome:</strong> ${funcionario.nome}<br> <strong>CPF:</strong> ${funcionario.cpf}<br> <strong>Função:</strong> ${funcionario.cargo}<br> <strong>Senha:</strong> ${funcionario.senha} </div> `;
  });
  html += `</div>`;
  document.getElementById("listaFuncionarios").innerHTML = html;
}
function deletarFuncionario(index) {
  const confirmar = confirm("Tem certeza que deseja deletar este funcionário?");
  if (confirmar) {
    funcionarios.splice(index, 1);
    listarFuncionarios();
    alert("Funcionário deletado com sucesso.");
  }
}
