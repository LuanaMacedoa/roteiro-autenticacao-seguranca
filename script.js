function mostrarCadastro() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("cadastro").classList.remove("hidden");
}

function mostrarLogin() {
  document.getElementById("cadastro").classList.add("hidden");
  document.getElementById("login").classList.remove("hidden");
}

function abrirLista() {
  const modal = document.getElementById("modalLista");
  modal.style.display = "flex";
}

function fecharLista() {
  const modal = document.getElementById("modalLista");
  modal.style.display = "none";
}

window.onclick = function(event) {
  const modal = document.getElementById("modalLista");
  if (event.target === modal) {
    modal.style.display = "none";
  }
}

//testes seguranças  (modificar:)

function validarEmail(email) {
  return email.includes("@") && email.includes(".");
}

function senhaForte(senha) {
  if (senha.length < 8) return "A senha deve ter no mínimo 8 caracteres";
  if (!/[A-Z]/.test(senha)) return "A senha deve ter pelo menos uma letra maiúscula";
  if (!/[0-9]/.test(senha)) return "A senha deve ter pelo menos um número";
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(senha)) return "A senha deve ter um caractere especial";

  const senhasComuns = ["123456", "password", "admin", "123"];
  if (senhasComuns.includes(senha.toLowerCase())) return "Senha muito comum, escolha outra";

  return null;
}

async function gerarSenhaForte(senha) {
  const codificador = new TextEncoder();
  const dados = codificador.encode(senha);
  const hashBuff = await crypto.subtle.digest('SHA-256', dados);
  const hashArray = Array.from(new Uint8Array(hashBuff));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); 
}

async function cadastrarUsuario(event) {
  event.preventDefault();

  const email = document.querySelector("#cadastro input[type='email']").value;
  const senha = document.querySelectorAll("#cadastro input[type='password']")[0].value;
  const confirmarSenha = document.querySelectorAll("#cadastro input[type='password']")[1].value;
  
  
  const usuariosSalvos = JSON.parse(localStorage.getItem("usuarios")) || [];
  
  const emailExistente = usuariosSalvos.some(usuario => usuario.email === email);

  if (emailExistente){
    alert("E-mail já cadastrado");
    return;
  }

  if (!validarEmail(email)) {
    alert("E-mail inválido");
    return;
  }

  if (senha.trim() === "") {
    alert("Senha é obrigatória");
    return;
  }

  if (senha !== confirmarSenha) {
    alert("As senhas não coincidem");
    return;
  }

  const erroSenha = senhaForte(senha);
  if (erroSenha) {
    alert(erroSenha);
    return;
  }

  const senhaCriptografada = await gerarSenhaForte(senha);

  const novoUsuario = {
    email: email,
    senhaCriptografada: senhaCriptografada 
  };

  usuariosSalvos.push(novoUsuario);
  localStorage.setItem("usuarios", JSON.stringify(usuariosSalvos));

  console.log("Senha segura", senhaCriptografada);

  alert("Cadastro realizado com sucesso");

  mostrarLogin();
}

async function loginTeste(event) {
  event.preventDefault(); 

  const emailDigitado = document.querySelector("#login input[type='email']").value;
  const senhaDigitada = document.querySelector("#login input[type='password']").value;

  const usuariosSalvos = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuarioEncontrado = usuariosSalvos.find(usuario => usuario.email === emailDigitado);

  if (!usuarioEncontrado) {
    alert("E-mail ou senha incorretos."); 
    return; 
  }

  const hashDaSenhaDigitada = await gerarSenhaForte(senhaDigitada);

  if (hashDaSenhaDigitada === usuarioEncontrado.senhaCriptografada) {
    
    alert("Bem-vindo(a) ao sistema!");
    document.getElementById("login").classList.add("hidden");
    document.getElementById("cadastro").classList.add("hidden");
    document.getElementById("sistema").classList.remove("hidden"); 

  } else {
    alert("E-mail ou senha incorretos.");
  }
}

function logout() {
  document.getElementById("sistema").classList.add("hidden");
  document.getElementById("login").classList.remove("hidden");
  
  document.querySelector("#login input[type='email']").value = "";
  document.querySelector("#login input[type='password']").value = "";
}