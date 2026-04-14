const USERS_KEY = "users_v1";

const SENHAS_PROIBIDAS = [
  "123456", "123456789", "password", "admin", "qwerty", "abc123", "111111", "123123"
];

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function validarEmailFormato(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function erroSenhaForte(senha) {
  const s = String(senha || "");

  if (s.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
  if (!/[A-Z]/.test(s)) return "A senha deve ter pelo menos 1 letra maiúscula.";
  if (!/[0-9]/.test(s)) return "A senha deve ter pelo menos 1 número.";
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(s)) return "A senha deve ter pelo menos 1 caractere especial.";

  const low = s.toLowerCase();
  if (SENHAS_PROIBIDAS.includes(low)) return "Senha muito comum/proibida. Escolha outra.";

  return null;
}

function gerarSaltBase64() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let str = "";
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str);
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
  const form = document.getElementById("cadastroForm");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "msg";
    msg.textContent = "";

    const email = document.getElementById("email").value.trim().toLowerCase();
    const senha = document.getElementById("senha").value;
    const confirmar = document.getElementById("confirmar").value;

    if (!validarEmailFormato(email)) {
      msg.textContent = "E-mail inválido.";
      msg.classList.add("erro");
      return;
    }

    if (senha !== confirmar) {
      msg.textContent = "As senhas não coincidem.";
      msg.classList.add("erro");
      return;
    }

    const erro = erroSenhaForte(senha);
    if (erro) {
      msg.textContent = erro;
      msg.classList.add("erro");
      return;
    }

    const users = getUsers();
    if (users.some(u => u.email === email)) {
      msg.textContent = "E-mail já cadastrado.";
      msg.classList.add("erro");
      return;
    }

    const salt = gerarSaltBase64();
    const hash = await hashSenhaComSalt(senha, salt);

    users.push({ email, salt, hash, criadoEm: new Date().toISOString() });
    saveUsers(users);

    msg.textContent = "Conta criada! Indo para login...";
    msg.classList.add("ok");

    setTimeout(() => window.location.href = "../login/login.html", 700);
  });
});