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
      // Tenta a próxima URL candidata.
    }
  }

  API = "http://localhost:3000";
  return API;
}

let animais = [];

const lista = document.getElementById("listaAnimais");
const contador = document.getElementById("contador");
const selectAnimalInteresse = document.getElementById("animalInteresse");

function formatarTelefoneBrasil(valor) {
  const digitos = String(valor || "").replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return "(" + digitos.slice(0, 2) + ") " + digitos.slice(2);
  if (digitos.length <= 10) {
    return "(" + digitos.slice(0, 2) + ") " + digitos.slice(2, 6) + "-" + digitos.slice(6);
  }
  return "(" + digitos.slice(0, 2) + ") " + digitos.slice(2, 7) + "-" + digitos.slice(7);
}

function atualizarContador() {
  if (contador) {
    contador.innerHTML =
      "Temos " + animais.length + " animais esperando adoção";
  }
}

function atualizarOpcoesAnimalInteresse() {
  if (!selectAnimalInteresse) return;

  selectAnimalInteresse.innerHTML = "";

  const opcaoInicial = document.createElement("option");
  opcaoInicial.value = "";
  opcaoInicial.textContent = "Selecione o animal de interesse";
  opcaoInicial.disabled = true;
  opcaoInicial.selected = true;
  selectAnimalInteresse.appendChild(opcaoInicial);

  if (!Array.isArray(animais) || animais.length === 0) {
    const opcaoVazia = document.createElement("option");
    opcaoVazia.value = "";
    opcaoVazia.textContent = "Nenhum animal cadastrado";
    opcaoVazia.disabled = true;
    selectAnimalInteresse.appendChild(opcaoVazia);
    return;
  }

  animais.forEach(function (animal) {
    const opcao = document.createElement("option");
    opcao.value = animal.nome;
    opcao.textContent = animal.nome;
    selectAnimalInteresse.appendChild(opcao);
  });
}

function mostrarAnimais(listaFiltrada = animais) {
  if (!lista) return;
  lista.innerHTML = "";
  if (!Array.isArray(listaFiltrada) || listaFiltrada.length === 0) {
    lista.innerHTML = "<p>Nenhum animal encontrado para este filtro.</p>";
    atualizarContador();
    atualizarOpcoesAnimalInteresse();
    return;
  }
  listaFiltrada.forEach(function (animal) {
    let card = document.createElement("div");
    card.className = "card";
    const imgHtml = animal.foto
      ? `<img src="${animal.foto}" alt="${animal.nome}">`
      : `<div class="sem-foto">Sem foto</div>`;
    card.innerHTML = `
      ${imgHtml}
      <h3>${animal.nome}</h3>
      <p><b>Espécie:</b> ${animal.especie}</p>
      <p><b>Porte:</b> ${animal.porte}</p>
      <p>${animal.descricao || ""}</p>

      <a href="https://wa.me/5511999999999?text=Olá! Tenho interesse em adotar ${animal.nome}" target="_blank">
        <button>Falar com o protetor</button>
      </a>

      <button type="button" data-remover-id="${animal.id}">Remover</button>
    `;
    const btnRemover = card.querySelector("[data-remover-id]");
    if (btnRemover) {
      btnRemover.addEventListener("click", function () {
        const raw = btnRemover.getAttribute("data-remover-id");
        if (raw === null || raw === "") return;
        removerAnimal(Number(raw));
      });
    }
    lista.appendChild(card);
  });
  atualizarContador();
  atualizarOpcoesAnimalInteresse();
}

async function removerAnimal(id) {
  const n = Number(id);
  if (!Number.isFinite(n) || n < 1) return;
  if (!confirm("Remover este animal da lista?")) return;
  try {
    const apiBase = await obterApiBase();
    const res = await fetch(apiBase + "/animais/" + n, { method: "DELETE" });
    if (!res.ok) throw new Error();
    await carregarAnimais();
  } catch {
    alert("Não foi possível remover o animal.");
  }
}

const form = document.getElementById("formAnimal");
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    let nome = document.getElementById("nome").value;
    let especie = document.getElementById("especie").value;
    let porte = document.getElementById("porte").value;
    let descricao = document.getElementById("descricao").value;
    let fotoInput = document.getElementById("foto");
    let arquivo = fotoInput.files[0];
    if (!arquivo) {
      alert("Escolha uma imagem");
      return;
    }
    let leitor = new FileReader();
    leitor.onload = async function (evento) {
      let imagemBase64 = evento.target.result;
      try {
        const apiBase = await obterApiBase();
        const res = await fetch(apiBase + "/animais", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome,
            especie,
            porte,
            descricao,
            foto: imagemBase64,
          }),
        });
        if (!res.ok) throw new Error();
        form.reset();
        await carregarAnimais();
        alert("Animal cadastrado!");
      } catch {
        alert("Erro ao cadastrar. Verifique se o servidor e o PostgreSQL estão rodando.");
      }
    };
    leitor.readAsDataURL(arquivo);
  });
}

const formAdotante = document.getElementById("formAdotante");
if (formAdotante) {
  formAdotante.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nomeAdotante = document.getElementById("nomeAdotante");
    const telefoneAdotante = document.getElementById("telefoneAdotante");
    const animalInteresse = document.getElementById("animalInteresse");

    if (!nomeAdotante || !telefoneAdotante || !animalInteresse) {
      alert("Não foi possível capturar os dados do formulário de interesse.");
      return;
    }

    const payload = {
      nome: nomeAdotante.value,
      telefone: telefoneAdotante.value,
      animalInteresse: animalInteresse.value,
    };

    try {
      const apiBase = await obterApiBase();
      const res = await fetch(apiBase + "/interesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      formAdotante.reset();
      alert("Interesse enviado com sucesso!");
    } catch {
      alert("Não foi possível registrar seu interesse agora. Tente novamente.");
    }
  });

  const telefoneAdotanteInput = document.getElementById("telefoneAdotante");
  if (telefoneAdotanteInput) {
    telefoneAdotanteInput.addEventListener("input", function (e) {
      const alvo = e.target;
      if (!alvo) return;
      alvo.value = formatarTelefoneBrasil(alvo.value);
    });
  }
}

async function filtrar(tipo) {
  if (tipo === "todos") {
    await carregarAnimais();
    return;
  }
  await carregarAnimais({ especie: tipo });
}

async function filtrarPorte(porte) {
  await carregarAnimais({ porte: porte });
}

function enviarMensagem() {
  let campo = document.getElementById("mensagem");
  let chat = document.getElementById("chatBox");
  if (!campo || !chat) return;
  if (campo.value.trim() === "") return;
  let msg = document.createElement("p");
  msg.innerText = "Adotante: " + campo.value;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
  campo.value = "";
}

async function carregarAnimais(filtros = {}) {
  try {
    const apiBase = await obterApiBase();
    const params = new URLSearchParams();
    if (filtros.especie) params.append("especie", filtros.especie);
    if (filtros.porte) params.append("porte", filtros.porte);
    if (filtros.nome) params.append("nome", filtros.nome);

    const url = params.toString() ? apiBase + "/animais?" + params.toString() : apiBase + "/animais";
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    animais = await res.json();
    mostrarAnimais();
  } catch (err) {
    console.error("Não foi possível carregar os animais do servidor.", err);
    if (lista) {
      lista.innerHTML = "<p>Não foi possível carregar os animais. Verifique se o servidor está rodando.</p>";
    }
  }
}

carregarAnimais();
