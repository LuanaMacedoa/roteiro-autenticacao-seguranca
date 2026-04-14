function mostrarCadastro() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("cadastro").classList.remove("hidden");
}

function mostrarLogin() {
  document.getElementById("cadastro").classList.add("hidden");
  document.getElementById("login").classList.remove("hidden");
}


//testando pagina de crud refugiados (refazer logica dos logins)
function loginTeste(event) {
  event.preventDefault(); 

  document.getElementById("login").classList.add("hidden");
  document.getElementById("cadastro").classList.add("hidden");
  document.getElementById("sistema").classList.remove("hidden");
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

function cadastrarUsuario(event) {
  event.preventDefault();

  const email = document.querySelector("#cadastro input[type='email']").value;
  const senha = document.querySelectorAll("#cadastro input[type='password']")[0].value;
  const confirmarSenha = document.querySelectorAll("#cadastro input[type='password']")[1].value;

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

  alert("Cadastro realizado com sucesso");
}