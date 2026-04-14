const USERS_KEY = "users_v1";
const SESSION_KEY = "session_email_v1";

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function validarEmailFormato(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function setSession(email) {
  sessionStorage.setItem(SESSION_KEY, email);
}

async function sha256Base64(texto) {
  const buffer = new TextEncoder().encode(texto);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(digest);
  let str = "";
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str);
}

async function hashSenhaComSalt(senha, salt) {
  return sha256Base64(`${salt}:${senha}`);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");

  const sess = sessionStorage.getItem(SESSION_KEY);
  if (sess) window.location.href = "../sistema/sistema.html";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "msg";
    msg.textContent = "";

    const email = document.getElementById("email").value.trim().toLowerCase();
    const senha = document.getElementById("senha").value;

    if (!validarEmailFormato(email)) {
      msg.textContent = "E-mail inválido.";
      msg.classList.add("erro");
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      msg.textContent = "Usuário não encontrado.";
      msg.classList.add("erro");
      return;
    }

    const hash = await hashSenhaComSalt(senha, user.salt);
    if (hash !== user.hash) {
      msg.textContent = "Senha incorreta.";
      msg.classList.add("erro");
      return;
    }

    setSession(email);
    window.location.href = "../sistema/sistema.html";
  });
});