const EMAILJS_PUBLIC_KEY = CONFIG.EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = CONFIG.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = CONFIG.EMAILJS_TEMPLATE_ID;

emailjs.init(EMAILJS_PUBLIC_KEY);

const DOMINIOS_PERMITIDOS = ["ifpb.edu.br", "academico.ifpb.edu.br"];

let usuarioLogado = localStorage.getItem("usuarioLogado");

let otp = {
  codigo: null,
  emailDestino: null,
  expiry: null,
  timerInterval: null,
  cooldownInterval: null,
};

const TEMPO_INATIVIDADE_MS = 30 * 60 * 1000;
let ultimaAtividadeTimer = null;

const get = (id) => document.getElementById(id);

function atualizarIcones() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

function lerLocalStorage(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave)) || [];
  } catch {
    return [];
  }
}

function salvarLocalStorage(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function dominioPermitido(email) {
  const partes = email.trim().toLowerCase().split("@");

  if (partes.length !== 2) {
    return false;
  }

  return DOMINIOS_PERMITIDOS.includes(partes[1]);
}

function mostrarCadastro() {
  get("login").classList.add("hidden");
  get("cadastro").classList.remove("hidden");
  limparMensagem("msg-login");
  atualizarIcones();
}

function mostrarLogin() {
  esconderTodas();
  get("login").classList.remove("hidden");
  get("formLogin").reset();
  limparMensagem("msg-login");
  limparMensagem("msg-cadastro");
  limparMensagem("msg-otp");
  atualizarIcones();
}

function mostrarVerificacao(email) {
  esconderTodas();
  get("verificacao").classList.remove("hidden");

  const partes = email.split("@");
  const mascarado = `${partes[0].slice(0, 2)}***@${partes[1]}`;

  get("textoOtp").textContent =
    `Um código de 6 dígitos foi enviado para ${mascarado}.`;
  get("inputOtp").value = "";
  get("inputOtp").focus();
  get("btnReenviar").disabled = true;
  get("cooldownMsg").textContent = "";

  iniciarTimerOTP();
  iniciarCooldownReenvio();
  atualizarIcones();
}

function esconderTodas() {
  ["login", "cadastro", "verificacao", "sistema"].forEach((id) => {
    get(id).classList.add("hidden");
  });
}

function mostrarMensagem(id, texto, tipo) {
  const el = get(id);
  el.textContent = texto;
  el.className = `mensagem ${tipo}`;
}

function limparMensagem(id) {
  const el = get(id);

  if (!el) {
    return;
  }

  el.textContent = "";
  el.className = "mensagem";
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function senhaForte(senha) {
  if (senha.length < 8) {
    return "A senha deve ter no mínimo 8 caracteres.";
  }

  if (!/[A-Z]/.test(senha)) {
    return "A senha deve conter pelo menos uma letra maiúscula.";
  }

  if (!/[0-9]/.test(senha)) {
    return "A senha deve conter pelo menos um número.";
  }

  if (!/[!@#$%^&*()\-_,.?":{}|<>]/.test(senha)) {
    return "A senha deve conter pelo menos um caractere especial.";
  }

  const proibidas = [
    "12345678",
    "123456789",
    "1234567890",
    "password1",
    "password",
    "abc12345",
    "admin123",
    "123456",
  ];

  if (proibidas.includes(senha.toLowerCase())) {
    return "Essa senha é muito comum. Escolha uma senha mais segura.";
  }

  return null;
}

async function hashSenha(senha) {
  const dados = new TextEncoder().encode(senha);
  const buffer = await crypto.subtle.digest("SHA-256", dados);

  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function cadastrarUsuario(event) {
  event.preventDefault();
  limparMensagem("msg-cadastro");

  const email = get("cadEmail").value.trim();
  const senha = get("cadSenha").value;
  const confirma = get("cadConfirma").value;

  if (!dominioPermitido(email)) {
    mostrarMensagem(
      "msg-cadastro",
      "E-mail não autorizado. Use somente @ifpb.edu.br ou @academico.ifpb.edu.br.",
      "erro",
    );
    return;
  }

  if (!validarEmail(email)) {
    mostrarMensagem("msg-cadastro", "Formato de e-mail inválido.", "erro");
    return;
  }

  const usuarios = lerLocalStorage("usuarios");

  if (usuarios.some((u) => u.email === email)) {
    mostrarMensagem("msg-cadastro", "Este e-mail já está cadastrado.", "erro");
    return;
  }

  if (senha !== confirma) {
    mostrarMensagem("msg-cadastro", "As senhas não coincidem.", "erro");
    return;
  }

  const erroSenha = senhaForte(senha);

  if (erroSenha) {
    mostrarMensagem("msg-cadastro", erroSenha, "erro");
    return;
  }

  const hash = await hashSenha(senha);

  usuarios.push({ email, hash });
  salvarLocalStorage("usuarios", usuarios);

  get("formCadastro").reset();

  mostrarMensagem(
    "msg-cadastro",
    "Conta criada com sucesso. Faça login.",
    "sucesso",
  );

  setTimeout(() => mostrarLogin(), 1600);
}

async function loginTeste(event) {
  event.preventDefault();
  limparMensagem("msg-login");

  const email = get("loginEmail").value.trim();
  const senha = get("loginSenha").value;

  if (!dominioPermitido(email)) {
    mostrarMensagem(
      "msg-login",
      "E-mail não autorizado. Use somente @ifpb.edu.br ou @academico.ifpb.edu.br.",
      "erro",
    );
    return;
  }

  const usuarios = lerLocalStorage("usuarios");
  const usuario = usuarios.find((u) => u.email === email);

  if (!usuario) {
    mostrarMensagem("msg-login", "E-mail ou senha incorretos.", "erro");
    return;
  }

  const hash = await hashSenha(senha);

  if (hash !== usuario.hash) {
    mostrarMensagem("msg-login", "E-mail ou senha incorretos.", "erro");
    return;
  }

  const btnEntrar = get("btnEntrar");
  btnEntrar.innerHTML =
    '<i data-lucide="loader-circle" aria-hidden="true"></i> Enviando código';
  btnEntrar.disabled = true;
  atualizarIcones();

  const sucesso = await enviarOTP(email);

  btnEntrar.innerHTML =
    '<i data-lucide="log-in" aria-hidden="true"></i> Entrar';
  btnEntrar.disabled = false;
  atualizarIcones();

  if (sucesso) {
    mostrarVerificacao(email);
  } else {
    mostrarMensagem(
      "msg-login",
      "Não foi possível enviar o código. Verifique a configuração do EmailJS.",
      "erro",
    );
  }
}

function logout() {
  usuarioLogado = null;
  localStorage.removeItem("usuarioLogado");
  sessionStorage.removeItem("otpData");

  if (ultimaAtividadeTimer) {
    clearTimeout(ultimaAtividadeTimer);
    ultimaAtividadeTimer = null;
  }

  pararTimers();
  esconderTodas();

  get("login").classList.remove("hidden");
  get("formLogin").reset();

  limparMensagem("msg-login");
  cancelarEdicao();
  atualizarResumo();
  atualizarIcones();
}

function gerarCodigo6Digitos() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

async function enviarOTP(email) {
  const codigo = gerarCodigo6Digitos();

  otp.codigo = codigo;
  otp.emailDestino = email;
  otp.expiry = Date.now() + 5 * 60 * 1000;

  sessionStorage.setItem(
    "otpData",
    JSON.stringify({
      codigo: otp.codigo,
      emailDestino: otp.emailDestino,
      expiry: otp.expiry,
    }),
  );

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: email,
      otp_code: codigo,
    });

    return true;
  } catch (erro) {
    console.error("Erro ao enviar e-mail via EmailJS:", erro);
    return false;
  }
}

async function verificarOTP(event) {
  event.preventDefault();
  limparMensagem("msg-otp");

  const digitado = get("inputOtp").value.trim();

  if (!/^\d{6}$/.test(digitado)) {
    mostrarMensagem(
      "msg-otp",
      "Digite um código válido com 6 números.",
      "erro",
    );
    return;
  }

  if (!otp.expiry || Date.now() > otp.expiry) {
    mostrarMensagem(
      "msg-otp",
      "Código expirado. Solicite um novo código.",
      "erro",
    );
    return;
  }

  if (digitado !== otp.codigo) {
    mostrarMensagem(
      "msg-otp",
      "Código incorreto. Verifique e tente novamente.",
      "erro",
    );
    return;
  }

  usuarioLogado = otp.emailDestino;
  localStorage.setItem("usuarioLogado", usuarioLogado);

  pararTimers();

  otp = {
    codigo: null,
    emailDestino: null,
    expiry: null,
    timerInterval: null,
    cooldownInterval: null,
  };
  sessionStorage.removeItem("otpData");

  esconderTodas();
  get("sistema").classList.remove("hidden");
  iniciarMonitorInatividade();
  atualizarResumo();
  atualizarIcones();
}

async function reenviarOTP() {
  limparMensagem("msg-otp");

  let emailDestino = otp.emailDestino;

  if (!emailDestino) {
    const otpData = sessionStorage.getItem("otpData");
    if (otpData) {
      try {
        const dados = JSON.parse(otpData);
        emailDestino = dados.emailDestino;
        otp.codigo = dados.codigo;
        otp.expiry = dados.expiry;
      } catch (e) {
        console.error("Erro ao restaurar OTP:", e);
      }
    }
  }

  if (!emailDestino) {
    mostrarMensagem(
      "msg-otp",
      "Sessão expirada. Faça login novamente.",
      "erro",
    );
    setTimeout(() => mostrarLogin(), 1600);
    return;
  }

  const btnReenviar = get("btnReenviar");
  btnReenviar.disabled = true;

  mostrarMensagem("msg-otp", "Enviando novo código...", "info");

  const sucesso = await enviarOTP(emailDestino);

  if (sucesso) {
    mostrarMensagem(
      "msg-otp",
      "Novo código enviado. Verifique seu e-mail.",
      "sucesso",
    );
    iniciarTimerOTP();
    iniciarCooldownReenvio();
  } else {
    mostrarMensagem("msg-otp", "Falha ao reenviar. Tente novamente.", "erro");
    btnReenviar.disabled = false;
  }
}

function cancelar2FA() {
  pararTimers();

  otp = {
    codigo: null,
    emailDestino: null,
    expiry: null,
    timerInterval: null,
    cooldownInterval: null,
  };

  mostrarLogin();
}

function iniciarTimerOTP() {
  clearInterval(otp.timerInterval);

  const timerEl = get("timer-otp");

  otp.timerInterval = setInterval(() => {
    const restante = otp.expiry - Date.now();

    if (restante <= 0) {
      clearInterval(otp.timerInterval);
      timerEl.textContent = "Código expirado.";
      timerEl.className = "timer expirado";
      get("btnVerificar").disabled = true;
      return;
    }

    const min = Math.floor(restante / 60000);
    const seg = Math.floor((restante % 60000) / 1000)
      .toString()
      .padStart(2, "0");

    timerEl.textContent = `Código válido por ${min}:${seg}`;
    timerEl.className = `timer${restante < 60000 ? " urgente" : ""}`;
    get("btnVerificar").disabled = false;
  }, 500);
}

function iniciarCooldownReenvio() {
  clearInterval(otp.cooldownInterval);

  const btnReenviar = get("btnReenviar");
  const cooldownMsg = get("cooldownMsg");

  let segundos = 60;

  btnReenviar.disabled = true;
  cooldownMsg.textContent = `(aguarde ${segundos}s)`;

  otp.cooldownInterval = setInterval(() => {
    segundos--;
    cooldownMsg.textContent = `(aguarde ${segundos}s)`;

    if (segundos <= 0) {
      clearInterval(otp.cooldownInterval);
      cooldownMsg.textContent = "";
      btnReenviar.disabled = false;
    }
  }, 1000);
}

function pararTimers() {
  clearInterval(otp.timerInterval);
  clearInterval(otp.cooldownInterval);

  const timerEl = get("timer-otp");
  const cooldownMsg = get("cooldownMsg");

  if (timerEl) {
    timerEl.textContent = "";
  }

  if (cooldownMsg) {
    cooldownMsg.textContent = "";
  }
}

function iniciarMonitorInatividade() {
  if (ultimaAtividadeTimer) {
    clearTimeout(ultimaAtividadeTimer);
  }

  ultimaAtividadeTimer = setTimeout(() => {
    mostrarMensagem(
      "msg-login",
      "Sua sessão expirou por inatividade. Faça login novamente.",
      "info",
    );
    logout();
  }, TEMPO_INATIVIDADE_MS);
}

function resetarTimerInatividade() {
  if (usuarioLogado && get("sistema").classList.contains("hidden") === false) {
    iniciarMonitorInatividade();
  }
}

function restaurarSessao() {
  if (usuarioLogado) {
    const otpData = sessionStorage.getItem("otpData");
    if (otpData) {
      try {
        const dados = JSON.parse(otpData);
        otp.codigo = dados.codigo;
        otp.emailDestino = dados.emailDestino;
        otp.expiry = dados.expiry;

        if (dados.expiry > Date.now()) {
          mostrarVerificacao(dados.emailDestino);
          return;
        } else {
          sessionStorage.removeItem("otpData");
          mostrarMensagem(
            "msg-login",
            "Seu código de verificação expirou. Faça login novamente.",
            "info",
          );
        }
      } catch (e) {
        console.error("Erro ao restaurar OTP:", e);
      }
    }

    esconderTodas();
    get("sistema").classList.remove("hidden");
    iniciarMonitorInatividade();
    atualizarResumo();
    atualizarIcones();
  }
}

function abrirConta() {
  get("exibirEmailAtual").textContent = usuarioLogado || "Não identificado";

  get("formAlterarEmail").reset();
  get("formAlterarSenha").reset();

  limparMensagem("msg-conta-email");
  limparMensagem("msg-conta-senha");

  trocarAba("email");

  get("modalConta").classList.add("aberto");
  atualizarIcones();
}

function fecharConta() {
  get("modalConta").classList.remove("aberto");
}

function trocarAba(aba) {
  get("painelEmail").classList.toggle("hidden", aba !== "email");
  get("painelSenha").classList.toggle("hidden", aba !== "senha");
  get("abaEmailBtn").classList.toggle("ativa", aba === "email");
  get("abaSenhaBtn").classList.toggle("ativa", aba === "senha");
  atualizarIcones();
}

async function alterarEmail(event) {
  event.preventDefault();
  limparMensagem("msg-conta-email");

  const novoEmail = get("novoEmail").value.trim();
  const senhaConfirm = get("senhaConfirmEmail").value;

  if (!dominioPermitido(novoEmail)) {
    mostrarMensagem(
      "msg-conta-email",
      "E-mail não autorizado. Use @ifpb.edu.br ou @academico.ifpb.edu.br.",
      "erro",
    );
    return;
  }

  if (!validarEmail(novoEmail)) {
    mostrarMensagem("msg-conta-email", "Formato de e-mail inválido.", "erro");
    return;
  }

  if (novoEmail === usuarioLogado) {
    mostrarMensagem(
      "msg-conta-email",
      "O novo e-mail deve ser diferente do atual.",
      "erro",
    );
    return;
  }

  const usuarios = lerLocalStorage("usuarios");

  if (usuarios.some((u) => u.email === novoEmail)) {
    mostrarMensagem(
      "msg-conta-email",
      "Este e-mail já está em uso por outra conta.",
      "erro",
    );
    return;
  }

  const usuario = usuarios.find((u) => u.email === usuarioLogado);
  const hashDigitado = await hashSenha(senhaConfirm);

  if (!usuario || hashDigitado !== usuario.hash) {
    mostrarMensagem(
      "msg-conta-email",
      "Senha incorreta. Não foi possível confirmar sua identidade.",
      "erro",
    );
    return;
  }

  usuario.email = novoEmail;
  salvarLocalStorage("usuarios", usuarios);

  usuarioLogado = novoEmail;

  get("exibirEmailAtual").textContent = novoEmail;
  get("formAlterarEmail").reset();

  mostrarMensagem(
    "msg-conta-email",
    "E-mail atualizado com sucesso.",
    "sucesso",
  );
  atualizarResumo();
}

async function alterarSenha(event) {
  event.preventDefault();
  limparMensagem("msg-conta-senha");

  const senhaAtual = get("senhaAtual").value;
  const novaSenha = get("novaSenha").value;
  const confirmarNova = get("confirmarNovaSenha").value;

  const usuarios = lerLocalStorage("usuarios");
  const usuario = usuarios.find((u) => u.email === usuarioLogado);
  const hashAtual = await hashSenha(senhaAtual);

  if (!usuario || hashAtual !== usuario.hash) {
    mostrarMensagem("msg-conta-senha", "Senha atual incorreta.", "erro");
    return;
  }

  if (senhaAtual === novaSenha) {
    mostrarMensagem(
      "msg-conta-senha",
      "A nova senha deve ser diferente da atual.",
      "erro",
    );
    return;
  }

  if (novaSenha !== confirmarNova) {
    mostrarMensagem(
      "msg-conta-senha",
      "As novas senhas não coincidem.",
      "erro",
    );
    return;
  }

  const erroSenha = senhaForte(novaSenha);

  if (erroSenha) {
    mostrarMensagem("msg-conta-senha", erroSenha, "erro");
    return;
  }

  usuario.hash = await hashSenha(novaSenha);
  salvarLocalStorage("usuarios", usuarios);

  get("formAlterarSenha").reset();

  mostrarMensagem("msg-conta-senha", "Senha alterada com sucesso.", "sucesso");
}

function salvarRefugiado(event) {
  event.preventDefault();
  limparMensagem("msg-sistema");

  const nome = get("nomeRef").value.trim();
  const idade = get("idadeRef").value;
  const endereco = get("enderecoRef").value.trim();
  const religiao = get("religiaoRef").value;
  const ideologia = get("ideologiaRef").value;
  const profissao = get("profissaoRef").value.trim();
  const filhos = get("filhosRef").value;
  const renda = get("rendaRef").value;
  const escolaridade = get("escolaridadeRef").value;

  if (!nome || !idade || !endereco || !religiao || !ideologia) {
    mostrarMensagem(
      "msg-sistema",
      "Preencha todos os campos obrigatórios.",
      "erro",
    );
    return;
  }

  const idadeNumero = Number(idade);

  if (!Number.isFinite(idadeNumero) || idadeNumero < 0 || idadeNumero > 120) {
    mostrarMensagem(
      "msg-sistema",
      "Informe uma idade válida entre 0 e 120 anos.",
      "erro",
    );
    return;
  }

  const refugiado = {
    nome,
    idade,
    endereco,
    religiao,
    ideologia,
    profissao,
    filhos,
    renda,
    escolaridade,
  };

  const refugiados = lerLocalStorage("refugiados");
  const indexEdicao = get("indexEdicao").value;

  if (indexEdicao !== "") {
    refugiados[parseInt(indexEdicao, 10)] = refugiado;
    salvarLocalStorage("refugiados", refugiados);
    mostrarMensagem(
      "msg-sistema",
      `"${nome}" atualizado com sucesso.`,
      "sucesso",
    );
    cancelarEdicao(false);
  } else {
    refugiados.push(refugiado);
    salvarLocalStorage("refugiados", refugiados);
    mostrarMensagem(
      "msg-sistema",
      `"${nome}" cadastrado com sucesso.`,
      "sucesso",
    );
  }

  get("formRefugiado").reset();
  atualizarResumo();
  atualizarIcones();
}

function editarRefugiado(index) {
  const refugiados = lerLocalStorage("refugiados");
  const r = refugiados[index];

  if (!r) {
    return;
  }

  get("nomeRef").value = r.nome || "";
  get("idadeRef").value = r.idade || "";
  get("enderecoRef").value = r.endereco || "";
  get("religiaoRef").value = r.religiao || "";
  get("ideologiaRef").value = r.ideologia || "";
  get("profissaoRef").value = r.profissao || "";
  get("filhosRef").value = r.filhos || "";
  get("rendaRef").value = r.renda || "";
  get("escolaridadeRef").value = r.escolaridade || "";

  get("indexEdicao").value = index;
  get("btnSalvar").innerHTML =
    '<i data-lucide="save" aria-hidden="true"></i> Atualizar refugiado';
  get("btnCancelar").classList.remove("hidden");

  fecharLista();

  mostrarMensagem(
    "msg-sistema",
    `Editando: ${r.nome}. Altere os campos necessários e clique em "Atualizar".`,
    "info",
  );

  get("nomeRef").focus();
  atualizarIcones();
}

function cancelarEdicao(limpar = true) {
  get("indexEdicao").value = "";
  get("btnSalvar").innerHTML =
    '<i data-lucide="save" aria-hidden="true"></i> Salvar refugiado';
  get("btnCancelar").classList.add("hidden");

  if (limpar) {
    get("formRefugiado").reset();
    limparMensagem("msg-sistema");
  }

  atualizarIcones();
}

function excluirRefugiado(index) {
  const refugiados = lerLocalStorage("refugiados");
  const nome = refugiados[index]?.nome || "registro selecionado";

  if (!confirm(`Deseja excluir "${nome}"? Esta ação não pode ser desfeita.`)) {
    return;
  }

  refugiados.splice(index, 1);
  salvarLocalStorage("refugiados", refugiados);
  renderizarLista();
  atualizarResumo();
}

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caractere) => {
    const mapa = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return mapa[caractere];
  });
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function obterIniciais(nome) {
  const partes = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (partes.length === 0) {
    return "SR";
  }

  return partes.map((parte) => parte[0].toUpperCase()).join("");
}

function formatarMoeda(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero <= 0) {
    return "R$ 0,00";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function renderizarLista() {
  const refugiados = lerLocalStorage("refugiados");
  const lista = get("listaRefugiados");
  const busca = normalizarTexto(get("buscaRefugiado")?.value || "");

  lista.innerHTML = "";

  const filtrados = refugiados
    .map((refugiado, index) => ({ refugiado, index }))
    .filter(({ refugiado }) => {
      if (!busca) {
        return true;
      }

      const conteudo = normalizarTexto(
        [
          refugiado.nome,
          refugiado.idade,
          refugiado.endereco,
          refugiado.religiao,
          refugiado.ideologia,
          refugiado.profissao,
          refugiado.escolaridade,
        ].join(" "),
      );

      return conteudo.includes(busca);
    });

  if (refugiados.length === 0) {
    lista.innerHTML =
      '<li class="sem-registros">Nenhum refugiado cadastrado ainda.</li>';
    atualizarIcones();
    return;
  }

  if (filtrados.length === 0) {
    lista.innerHTML =
      '<li class="sem-registros">Nenhum registro encontrado para a busca informada.</li>';
    atualizarIcones();
    return;
  }

  filtrados.forEach(({ refugiado: r, index }) => {
    const li = document.createElement("li");
    li.className = "item-refugiado";

    const nome = escaparHTML(r.nome || "Sem nome");
    const idade = escaparHTML(r.idade || "—");
    const endereco = escaparHTML(r.endereco || "Endereço não informado");
    const religiao = escaparHTML(r.religiao || "—");
    const ideologia = escaparHTML(r.ideologia || "—");
    const profissao = escaparHTML(r.profissao || "Não informada");
    const filhos = escaparHTML(r.filhos || "0");
    const renda = escaparHTML(formatarMoeda(r.renda));
    const escolaridade = escaparHTML(r.escolaridade || "Não informada");
    const iniciais = escaparHTML(obterIniciais(r.nome));

    li.innerHTML = `
      <div class="item-topo">
        <div class="avatar-ref">${iniciais}</div>
        <div class="item-titulo">
          <strong>${nome}</strong>
          <span>${idade} anos</span>
        </div>
      </div>

      <div class="item-detalhes">
        <span class="chip"><i data-lucide="map-pin" aria-hidden="true"></i>${endereco}</span>
        <span class="chip"><i data-lucide="landmark" aria-hidden="true"></i>${religiao}</span>
        <span class="chip"><i data-lucide="scale" aria-hidden="true"></i>${ideologia}</span>
        <span class="chip"><i data-lucide="briefcase-business" aria-hidden="true"></i>${profissao}</span>
        <span class="chip"><i data-lucide="baby" aria-hidden="true"></i>Filhos: ${filhos}</span>
        <span class="chip"><i data-lucide="wallet" aria-hidden="true"></i>${renda}</span>
        <span class="chip"><i data-lucide="graduation-cap" aria-hidden="true"></i>${escolaridade}</span>
      </div>

      <div class="acoes-item">
        <button class="btn-editar" onclick="editarRefugiado(${index})">
          <i data-lucide="pencil" aria-hidden="true"></i>
          Editar
        </button>
        <button class="btn-excluir" onclick="excluirRefugiado(${index})">
          <i data-lucide="trash-2" aria-hidden="true"></i>
          Excluir
        </button>
      </div>
    `;

    lista.appendChild(li);
  });

  atualizarIcones();
}

function abrirLista() {
  renderizarLista();
  get("modalLista").classList.add("aberto");

  const busca = get("buscaRefugiado");

  if (busca) {
    busca.focus();
  }

  atualizarIcones();
}

function fecharLista() {
  get("modalLista").classList.remove("aberto");
}

function atualizarResumo() {
  const refugiados = lerLocalStorage("refugiados");
  const totalRefugiados = get("totalRefugiados");
  const usuarioAtualResumo = get("usuarioAtualResumo");

  if (totalRefugiados) {
    totalRefugiados.textContent = refugiados.length;
  }

  if (usuarioAtualResumo) {
    usuarioAtualResumo.textContent = usuarioLogado || "Usuário";
  }
}

window.addEventListener("click", (e) => {
  const modalLista = get("modalLista");
  const modalConta = get("modalConta");

  if (e.target === modalLista) {
    fecharLista();
  }

  if (e.target === modalConta) {
    fecharConta();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    fecharLista();
    fecharConta();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  restaurarSessao();
  atualizarResumo();
  atualizarIcones();
});

document.addEventListener("click", resetarTimerInatividade);
document.addEventListener("keydown", resetarTimerInatividade);
document.addEventListener("mousemove", resetarTimerInatividade);
document.addEventListener("scroll", resetarTimerInatividade);
