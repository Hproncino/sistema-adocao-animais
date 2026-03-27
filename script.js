let animais = []

const lista = document.getElementById("listaAnimais")
const contador = document.getElementById("contador")

function atualizarContador(){
  if(contador){
    contador.innerHTML = "🐾 Temos " + animais.length + " animais esperando adoção"
  }
}

function mostrarAnimais(listaFiltrada = animais){
  if(!lista) return
  lista.innerHTML = ""
  listaFiltrada.forEach(function(animal,index){
    let card = document.createElement("div")
    card.className = "card"
    card.innerHTML = `
      <img src="${animal.foto}">
      <h3>${animal.nome}</h3>
      <p><b>Espécie:</b> ${animal.especie}</p>
      <p><b>Porte:</b> ${animal.porte}</p>
      <p>${animal.descricao}</p>

      <a href="https://wa.me/5511999999999?text=Olá! Tenho interesse em adotar ${animal.nome}" target="_blank">
        <button>💬 Falar com protetor</button>
      </a>

      <button onclick="removerAnimal(${index})">Remover</button>
    `
    lista.appendChild(card)
  })
  atualizarContador()
}

function removerAnimal(index){
  animais.splice(index,1)
  mostrarAnimais()
}

const form = document.getElementById("formAnimal")
if(form){
  form.addEventListener("submit", function(e){
    e.preventDefault()
    let nome = document.getElementById("nome").value
    let especie = document.getElementById("especie").value
    let porte = document.getElementById("porte").value
    let descricao = document.getElementById("descricao").value
    let fotoInput = document.getElementById("foto")
    let arquivo = fotoInput.files[0]
    if(!arquivo){ alert("Escolha uma imagem"); return }
    let leitor = new FileReader()
    leitor.onload = function(evento){
      let imagemBase64 = evento.target.result
      let animal = {nome, especie, porte, descricao, foto: imagemBase64}
      animais.push(animal)
      mostrarAnimais()
      form.reset()
    }
    leitor.readAsDataURL(arquivo)
  })
}

function filtrar(tipo){
  if(tipo === "todos"){ mostrarAnimais(); return }
  let filtrados = animais.filter(a => a.especie === tipo)
  mostrarAnimais(filtrados)
}

function filtrarPorte(porte){
  let filtrados = animais.filter(a => a.porte === porte)
  mostrarAnimais(filtrados)
}

function enviarMensagem(){
  let campo = document.getElementById("mensagem")
  let chat = document.getElementById("chatBox")
  if(!campo || !chat) return
  if(campo.value.trim() === "") return
  let msg = document.createElement("p")
  msg.innerText = "Adotante: " + campo.value
  chat.appendChild(msg)
  chat.scrollTop = chat.scrollHeight
  campo.value = ""
}


document.getElementById("formAnimal").addEventListener("submit", async (e) => {
  e.preventDefault();

  const animal = {
    nome: document.getElementById("nome").value,
    especie: document.getElementById("especie").value,
    porte: document.getElementById("porte").value,
    descricao: document.getElementById("descricao").value
  };

  await fetch("http://localhost:3000/animais", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(animal)
  });

  alert("Animal cadastrado!");
});

async function carregarAnimais() {
  const res = await fetch("http://localhost:3000/animais");
  const animais = await res.json();

  const lista = document.getElementById("listaAnimais");
  lista.innerHTML = "";

  animais.forEach(a => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h3>${a.nome}</h3>
      <p>${a.especie}</p>
      <p>${a.porte}</p>
      <p>${a.descricao}</p>
    `;
    lista.appendChild(div);
  });
}

carregarAnimais();