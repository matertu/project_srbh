class Boletim {
  // ── Atributos privados ────────────────────────────────────────
  #dadosBole;
  #mes;
  #ano;
  #mesReceb;
  #anoReceb;
  #idEstacao;
  #idFunc;
  #nomeObs;
  #status;
  #ficheiro;
  #recebido;

  // ── Construtor ────────────────────────────────────────────────
  constructor(nome, mes, ano) {
    this.#dadosBole = Array.from({ length: 31 }, () => new Array(4).fill(0));
    this.#mesReceb = 0;
    this.#anoReceb = 0;
    this.#idEstacao = 0;
    this.#idFunc = 0;
    this.#status = null;
    this.#ficheiro = null;
    this.#recebido = false;
    this.setNomeObs(nome);
    this.setData(mes, ano);
  }

  // ── Sets ──────────────────────────────────────────────────────
  setDadosBole(dia, coluna, conteudo) {
    this.#dadosBole[dia][coluna] = conteudo;
  }
  setNomeObs(nome) {
    this.#nomeObs = nome;
  }
  setStatus(status) {
    this.#status = status;
  }
  setData(mes, ano) {
    if (mes > 0 && mes <= 12) this.#mes = mes;
    this.#ano = ano;
  }
  setMesReceb(m) {
    if (m > 0 && m <= 12) this.#mesReceb = m;
  }
  setAnoReceb(a) {
    this.#anoReceb = a;
  }
  setIdEstacao(id) {
    this.#idEstacao = id;
  }
  setIdFunc(id) {
    this.#idFunc = id;
  }
  setFicheiro(f) {
    this.#ficheiro = f;
  }
  setRecebido(r) {
    this.#recebido = r;
  }

  // ── Gets ──────────────────────────────────────────────────────
  getDadosBole() {
    return this.#dadosBole;
  }
  getDadosBoleRow(dia) {
    return this.#dadosBole[dia];
  }
  getMes() {
    return this.#mes;
  }
  getAno() {
    return this.#ano;
  }
  getMesReceb() {
    return this.#mesReceb;
  }
  getAnoReceb() {
    return this.#anoReceb;
  }
  getIdEstacao() {
    return this.#idEstacao;
  }
  getIdFunc() {
    return this.#idFunc;
  }
  getNomeObs() {
    return this.#nomeObs;
  }
  getStatus() {
    return this.#status;
  }
  getFicheiro() {
    return this.#ficheiro;
  }
  isRecebido() {
    return this.#recebido;
  }

  // ── Utilitários ───────────────────────────────────────────────
  toJSON() {
    return {
      nomeObs: this.#nomeObs,
      mes: this.#mes,
      ano: this.#ano,
      idEstacao: this.#idEstacao,
      idFunc: this.#idFunc,
      recebido: this.#recebido,
      dadosBole: this.#dadosBole,
    };
  }

  printBoletim() {
    const m = String(this.#mes).padStart(2, "0");
    console.log(`Boletim de ${m}/${this.#ano}`);
    console.log(`Feito por: ${this.#nomeObs}`);
    for (let i = 0; i < this.#dadosBole.length; i++) {
      const cols = this.#dadosBole[i]
        .map((v) => String(v).padStart(6))
        .join("");
      console.log(`Dia ${String(i + 1).padStart(2)} |${cols}`);
    }
  }
}
