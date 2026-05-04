const origemAtual = window.location.origin || "";
const CANDIDATAS_API = [origemAtual];

for (let porta = 3000; porta <= 3010; porta += 1) {
  CANDIDATAS_API.push("http://localhost:" + porta);
  CANDIDATAS_API.push("http://127.0.0.1:" + porta);
}

const CANDIDATAS_API_UNICAS = CANDIDATAS_API.filter(function (url, idx, arr) {
  return !!url && arr.indexOf(url) === idx;
});

let API = null;

async function obterApiBase() {
  if (API) return API;

  for (let i = 0; i < CANDIDATAS_API_UNICAS.length; i += 1) {
    const base = CANDIDATAS_API_UNICAS[i];
    try {
      const res = await fetch(base + "/health");
      if (res.ok) {
        API = base;
        return API;
      }
    } catch (_) {
      // Tenta a proxima URL candidata.
    }
  }

  API = "http://localhost:3000";
  return API;
}

const AUTH_STORAGE_KEY = "saa_auth";

function salvarAuth(auth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

const formLogin = document.getElementById("formLogin");
const formRegister = document.getElementById("formRegister");

if (formLogin) {
  formLogin.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const apiBase = await obterApiBase();
      const res = await fetch(apiBase + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      salvarAuth({ token: data.token, role: data.role, email: data.email });
      window.location.href = "index.html";
    } catch {
      alert("Nao foi possivel entrar. Verifique suas credenciais.");
    }
  });
}

if (formRegister) {
  formRegister.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
      const apiBase = await obterApiBase();
      const res = await fetch(apiBase + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error();
      alert("Cadastro realizado. Agora faca login.");
      formRegister.reset();
    } catch {
      alert("Nao foi possivel cadastrar. Email pode ja existir.");
    }
  });
}
