function mostrarCadastro() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("cadastro").classList.remove("hidden");
}

function mostrarLogin() {
  document.getElementById("cadastro").classList.add("hidden");
  document.getElementById("login").classList.remove("hidden");
}