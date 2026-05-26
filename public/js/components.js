class SrbhHeader extends HTMLElement {
  connectedCallback() {
    // Tenta pegar o nome e tipo do usuário do localStorage
    let nome = "---";
    let tipo = "Usuário";
    try {
      const usuarioStr = localStorage.getItem("srbh_usuario");
      if (usuarioStr) {
        const usuario = JSON.parse(usuarioStr);
        if (usuario.nome) nome = usuario.nome;
        if (usuario.tipo) {
          tipo = usuario.tipo.charAt(0).toUpperCase() + usuario.tipo.slice(1);
        }
      }
    } catch (e) {}

    this.innerHTML = `
      <header class="srbh-header">
        <img src="assets/img/logo-sgb-cabecalho.png" class="logo-topo" alt="SGB" />
        <div class="user-info">
          <span class="user-nome" id="userNome">${nome}</span>
          <span class="user-tipo">${tipo}</span>
          <button class="btn-logout" onclick="logout()">Sair</button>
        </div>
      </header>
    `;
  }
}

class SrbhFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="srbh-footer">
        <img src="assets/img/logo-sgb-rodape.png" class="logo-footer" alt="SGB" />
      </footer>
    `;
  }
}

customElements.define('srbh-header', SrbhHeader);
customElements.define('srbh-footer', SrbhFooter);
