const API = "http://localhost:3000";

let animais = [];

const lista = document.getElementById("listaAnimais");
const contador = document.getElementById("contador");

function atualizarContador() {
  if (contador) {
    contador.innerHTML =
      "Temos " + animais.length + " animais esperando adoção";
  }
}

function mostrarAnimais(listaFiltrada = animais) {
  if (!lista) return;
  lista.innerHTML = "";
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
}

async function removerAnimal(id) {
  const n = Number(id);
  if (!Number.isFinite(n) || n < 1) return;
  if (!confirm("Remover este animal da lista?")) return;
  try {
    const res = await fetch(API + "/animais/" + n, { method: "DELETE" });
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
        const res = await fetch(API + "/animais", {
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

function filtrar(tipo) {
  if (tipo === "todos") {
    mostrarAnimais();
    return;
  }
  let filtrados = animais.filter(function (a) {
    return a.especie === tipo;
  });
  mostrarAnimais(filtrados);
}

function filtrarPorte(porte) {
  let filtrados = animais.filter(function (a) {
    return a.porte === porte;
  });
  mostrarAnimais(filtrados);
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

async function carregarAnimais() {
  try {
    const res = await fetch(API + "/animais");
    if (!res.ok) throw new Error();
    animais = await res.json();
    mostrarAnimais();
  } catch {
    console.error("Não foi possível carregar os animais do servidor.");
  }
}

carregarAnimais();
