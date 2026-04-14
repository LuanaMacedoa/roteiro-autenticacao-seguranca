const SESSION_KEY = "session_email_v1";
const REF_PREFIX = "refugiados_v1_";

const RELIGIOES_PERMITIDAS = ["Muçulmano", "Judeu", "Católico"];
const IDEOLOGIAS_PERMITIDAS = ["Esquerda", "Direita", "Centro"];

function getSession() {
  return sessionStorage.getItem(SESSION_KEY);
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

function keyRef(email) {
  return REF_PREFIX + email;
}

function getRefugiados(email) {
  const raw = localStorage.getItem(keyRef(email));
  return raw ? JSON.parse(raw) : [];
}

function saveRefugiados(email, lista) {
  localStorage.setItem(keyRef(email), JSON.stringify(lista));
}

function gerarId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const email = getSession();
  if (!email) {
    window.location.href = "../login/login.html";
    return;
  }

  const usuarioLogado = document.getElementById("usuarioLogado");
  const msg = document.getElementById("msg");
  const total = document.getElementById("total");
  const tabela = document.getElementById("tabela");

  const form = document.getElementById("refForm");
  const cancelar = document.getElementById("cancelar");
  const sairBtn = document.getElementById("sairBtn");

  usuarioLogado.textContent = "Logado como: " + email;

  function setMsg(texto, tipo) {
    msg.className = "msg " + (tipo || "");
    msg.textContent = texto || "";
  }

  function resetEdicao() {
    document.getElementById("id").value = "";
    cancelar.classList.add("hidden");
  }

  function render() {
    const lista = getRefugiados(email);
    total.textContent = `${lista.length} registro(s).`;

    tabela.innerHTML = "";
    if (lista.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 10;
      td.textContent = "Nenhum refugiado cadastrado.";
      tr.appendChild(td);
      tabela.appendChild(tr);
      return;
    }

    lista.forEach((r) => {
      const tr = document.createElement("tr");

      const cols = [
        r.nome, r.endereco, r.idade, r.religiao, r.ideologia,
        r.profissao || "-", r.filhos ?? 0,
        `R$ ${Number(r.renda ?? 0).toFixed(2)}`,
        r.escolaridade || "-"
      ];

      cols.forEach(c => {
        const td = document.createElement("td");
        td.textContent = String(c);
        tr.appendChild(td);
      });

      const tdAcoes = document.createElement("td");

      const btnEditar = document.createElement("button");
      btnEditar.type = "button";
      btnEditar.className = "btn-tabela";
      btnEditar.textContent = "Editar";
      btnEditar.addEventListener("click", () => {
        setMsg("Editando registro...", "ok");
        document.getElementById("id").value = r.id;
        document.getElementById("nome").value = r.nome;
        document.getElementById("endereco").value = r.endereco;
        document.getElementById("idade").value = r.idade;
        document.getElementById("religiao").value = r.religiao;
        document.getElementById("ideologia").value = r.ideologia;
        document.getElementById("profissao").value = r.profissao || "";
        document.getElementById("filhos").value = r.filhos ?? 0;
        document.getElementById("renda").value = r.renda ?? 0;
        document.getElementById("escolaridade").value = r.escolaridade || "";
        cancelar.classList.remove("hidden");
      });

      const btnExcluir = document.createElement("button");
      btnExcluir.type = "button";
      btnExcluir.className = "btn-tabela btn-danger";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", () => {
        if (!confirm("Deseja excluir este registro?")) return;
        const nova = getRefugiados(email).filter(x => x.id !== r.id);
        saveRefugiados(email, nova);
        setMsg("Registro excluído.", "ok");
        form.reset();
        resetEdicao();
        render();
      });

      tdAcoes.appendChild(btnEditar);
      tdAcoes.appendChild(btnExcluir);
      tr.appendChild(tdAcoes);
      tabela.appendChild(tr);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setMsg("", "");

    const id = document.getElementById("id").value || gerarId();
    const nome = document.getElementById("nome").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const idade = Number(document.getElementById("idade").value);

    const religiao = document.getElementById("religiao").value;
    const ideologia = document.getElementById("ideologia").value;

    const profissao = document.getElementById("profissao").value.trim();
    const filhos = Number(document.getElementById("filhos").value || 0);
    const renda = Number(document.getElementById("renda").value || 0);
    const escolaridade = document.getElementById("escolaridade").value.trim();

    if (!nome || !endereco || !Number.isInteger(idade) || idade < 0) {
      setMsg("Preencha nome/endereço e idade corretamente.", "erro");
      return;
    }

    if (!RELIGIOES_PERMITIDAS.includes(religiao)) {
      setMsg("Religião inválida.", "erro");
      return;
    }
    if (!IDEOLOGIAS_PERMITIDAS.includes(ideologia)) {
      setMsg("Ideologia inválida.", "erro");
      return;
    }

    if (filhos < 0 || renda < 0) {
      setMsg("Filhos e renda não podem ser negativos.", "erro");
      return;
    }

    const lista = getRefugiados(email);
    const idx = lista.findIndex(x => x.id === id);

    const registro = { id, nome, endereco, idade, religiao, ideologia, profissao, filhos, renda, escolaridade };

    if (idx >= 0) lista[idx] = registro;
    else lista.push(registro);

    saveRefugiados(email, lista);

    setMsg("Salvo com sucesso.", "ok");
    form.reset();
    resetEdicao();
    render();
  });

  cancelar.addEventListener("click", () => {
    form.reset();
    resetEdicao();
    setMsg("", "");
  });

  sairBtn.addEventListener("click", () => {
    logout();
    window.location.href = "../login/login.html";
  });

  render();
});