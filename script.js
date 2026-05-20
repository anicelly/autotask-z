let tarefas = JSON.parse(localStorage.getItem("tarefasZ")) || [];
let graficoStatus;

const mensagensGoku = [
  "Oi, eu sou o Goku! ⚡",
  "Clique em Tarefas para criar uma missão!",
  "Use o Kanban para arrastar tarefas!",
  "Tarefas vencidas ficam em alerta vermelho!",
  "Ative o tema escuro para aumentar seu poder!",
  "Clique em Exportar para baixar o relatório!",
  "As missões para hoje aparecem no Kanban central!",
  "Organize tudo e alcance o nível máximo! 🔥"
];

let mensagemAtual = 0;

function trocarMensagemGoku() {
  const fala = document.getElementById("falaAssistente");

  if (!fala) return;

  fala.innerText = mensagensGoku[mensagemAtual];

  mensagemAtual++;

  if (mensagemAtual >= mensagensGoku.length) {
    mensagemAtual = 0;
  }
}

function entrar() {
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;

  if (usuario === "admin" && senha === "123") {
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    mostrar("dashboard");
    trocarMensagemGoku();
  } else {
    alert("Usuário ou senha inválidos!");
  }
}

function sair() {
  document.getElementById("app").style.display = "none";
  document.getElementById("login").style.display = "block";
}

function mostrar(pagina) {
  document.querySelectorAll(".pagina").forEach(secao => {
    secao.style.display = "none";
  });

  document.getElementById(pagina).style.display = "block";
  atualizarSistema();
  atualizarFalaPorPagina(pagina);
}

function atualizarFalaPorPagina(pagina) {
  const fala = document.getElementById("falaAssistente");

  if (!fala) return;

  const mensagens = {
    dashboard: "Aqui você acompanha o poder total das suas missões!",
    tarefas: "Cadastre novas missões com data, prioridade e responsável!",
    alertas: "Aqui aparecem missões vencidas e urgentes!",
    kanban: "Arraste as missões entre as colunas para organizar tudo!"
  };

  fala.innerText = mensagens[pagina] || "Vamos organizar suas missões! ⚡";
}

function adicionarTarefa() {
  const titulo = document.getElementById("titulo").value;
  const responsavel = document.getElementById("responsavel").value;
  const data = document.getElementById("data").value;
  const prioridade = document.getElementById("prioridade").value;

  if (!titulo || !responsavel || !data || !prioridade) {
    alert("Preencha todos os campos!");
    return;
  }

  tarefas.push({
    titulo,
    responsavel,
    data,
    prioridade,
    concluida: false,
    criadaEm: new Date().toLocaleString("pt-BR")
  });

  salvar();
  limparCampos();
  atualizarSistema();

  const fala = document.getElementById("falaAssistente");
  if (fala) fala.innerText = "Missão adicionada com sucesso! 🔥";

  alert("Missão adicionada com sucesso!");
}

function concluirTarefa(index) {
  tarefas[index].concluida = true;
  salvar();
  atualizarSistema();

  const fala = document.getElementById("falaAssistente");
  if (fala) fala.innerText = "Muito bem! Missão concluída! ⚡";
}

function reabrirTarefa(index) {
  tarefas[index].concluida = false;
  salvar();
  atualizarSistema();

  const fala = document.getElementById("falaAssistente");
  if (fala) fala.innerText = "Missão reaberta. Vamos finalizar depois!";
}

function excluirTarefa(index) {
  if (confirm("Deseja excluir esta missão?")) {
    tarefas.splice(index, 1);
    salvar();
    atualizarSistema();

    const fala = document.getElementById("falaAssistente");
    if (fala) fala.innerText = "Missão removida do radar!";
  }
}

function calcularStatus(tarefa) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataTarefa = new Date(tarefa.data + "T00:00:00");

  if (tarefa.concluida) return "Concluída";
  if (dataTarefa < hoje) return "Vencida";
  if (dataTarefa.getTime() === hoje.getTime()) return "Para hoje";
  return "Pendente";
}

function classeStatus(status) {
  if (status === "Concluída") return "concluida";
  if (status === "Vencida") return "vencida";
  return "pendente";
}

function listarTarefas() {
  const lista = document.getElementById("listaTarefas");

  if (!lista) return;

  lista.innerHTML = "";

  if (tarefas.length === 0) {
    lista.innerHTML = `<tr><td colspan="6">Nenhuma missão cadastrada.</td></tr>`;
    return;
  }

  tarefas.forEach((tarefa, index) => {
    const status = calcularStatus(tarefa);

    lista.innerHTML += `
      <tr>
        <td>${tarefa.titulo}</td>
        <td>${tarefa.responsavel}</td>
        <td>${formatarData(tarefa.data)}</td>
        <td>${tarefa.prioridade}</td>
        <td class="${classeStatus(status)}">${status}</td>
        <td>
          ${
            tarefa.concluida
              ? `<button onclick="reabrirTarefa(${index})">Reabrir</button>`
              : `<button onclick="concluirTarefa(${index})">Concluir</button>`
          }
          <button onclick="excluirTarefa(${index})">Excluir</button>
        </td>
      </tr>
    `;
  });
}

function atualizarDashboard() {
  const total = tarefas.length;
  const concluidas = tarefas.filter(t => calcularStatus(t) === "Concluída").length;
  const vencidas = tarefas.filter(t => calcularStatus(t) === "Vencida").length;
  const pendentes = tarefas.filter(t => {
    const status = calcularStatus(t);
    return status === "Pendente" || status === "Para hoje";
  }).length;

  document.getElementById("totalTarefas").innerText = total;
  document.getElementById("concluidas").innerText = concluidas;
  document.getElementById("pendentes").innerText = pendentes;
  document.getElementById("vencidas").innerText = vencidas;
}

function listarAlertas() {
  const lista = document.getElementById("listaAlertas");

  if (!lista) return;

  lista.innerHTML = "";

  if (tarefas.length === 0) {
    lista.innerHTML = `<div class="alerta">Nenhuma missão cadastrada.</div>`;
    return;
  }

  tarefas.forEach(tarefa => {
    const status = calcularStatus(tarefa);

    let cor = "verde";
    let mensagem = "Missão sob controle.";

    if (status === "Vencida") {
      cor = "vermelho";
      mensagem = "Alerta máximo! Missão vencida.";
    } else if (status === "Para hoje") {
      cor = "amarelo";
      mensagem = "Atenção! Essa missão vence hoje.";
    } else if (status === "Concluída") {
      cor = "verde";
      mensagem = "Missão concluída com sucesso.";
    }

    lista.innerHTML += `
      <div class="alerta ${cor}">
        <h3>${tarefa.titulo}</h3>
        <p><b>Responsável:</b> ${tarefa.responsavel}</p>
        <p><b>Data:</b> ${formatarData(tarefa.data)}</p>
        <p><b>Prioridade:</b> ${tarefa.prioridade}</p>
        <p><b>Status:</b> ${status}</p>
        <p>${mensagem}</p>
      </div>
    `;
  });
}

function atualizarGrafico() {
  const ctx = document.getElementById("graficoStatus");

  if (!ctx) return;

  if (graficoStatus) graficoStatus.destroy();

  const concluidas = tarefas.filter(t => calcularStatus(t) === "Concluída").length;
  const vencidas = tarefas.filter(t => calcularStatus(t) === "Vencida").length;
  const pendentes = tarefas.filter(t => {
    const status = calcularStatus(t);
    return status === "Pendente" || status === "Para hoje";
  }).length;

  graficoStatus = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Concluídas", "Pendentes", "Vencidas"],
      datasets: [{
        data: [concluidas, pendentes, vencidas],
        borderWidth: 2
      }]
    }
  });
}

function atualizarKanban() {
  const pendente = document.getElementById("kanbanPendente");
  const hoje = document.getElementById("kanbanHoje");
  const concluida = document.getElementById("kanbanConcluida");

  if (!pendente || !hoje || !concluida) return;

  pendente.innerHTML = "";
  hoje.innerHTML = "";
  concluida.innerHTML = "";

  tarefas.forEach((tarefa, index) => {
    const status = calcularStatus(tarefa);

    const card = `
      <div class="kanban-card" draggable="true" ondragstart="arrastar(event, ${index})">
        <h3>${tarefa.titulo}</h3>
        <p>${tarefa.responsavel}</p>
        <p>${formatarData(tarefa.data)}</p>
        <p>${tarefa.prioridade}</p>
      </div>
    `;

    if (status === "Concluída") {
      concluida.innerHTML += card;
    } else if (status === "Para hoje") {
      hoje.innerHTML += card;
    } else {
      pendente.innerHTML += card;
    }
  });
}

function arrastar(event, index) {
  event.dataTransfer.setData("index", index);

  const fala = document.getElementById("falaAssistente");
  if (fala) fala.innerText = "Arraste para mudar o status da missão!";
}

function permitirSoltar(event) {
  event.preventDefault();
}

function soltar(event, novoStatus) {
  event.preventDefault();

  const index = event.dataTransfer.getData("index");

  if (novoStatus === "Concluída") {
    tarefas[index].concluida = true;
  } else {
    tarefas[index].concluida = false;

    if (novoStatus === "Para hoje") {
      tarefas[index].data = new Date().toISOString().split("T")[0];
    }
  }

  salvar();
  atualizarSistema();

  const fala = document.getElementById("falaAssistente");
  if (fala) fala.innerText = `Missão movida para: ${novoStatus}!`;
}

function toggleTema() {
  document.body.classList.toggle("dark-mode");

  const fala = document.getElementById("falaAssistente");
  if (fala) fala.innerText = "Tema alterado! Nível de poder atualizado! ⚡";
}

function ativarNotificacoes() {
  Notification.requestPermission().then(permissao => {
    if (permissao === "granted") {
      new Notification("AutoTask Z", {
        body: "Alertas ativados com energia máxima!"
      });
    }
  });
}

function verificarAlertasAutomaticos() {
  tarefas.forEach(tarefa => {
    const status = calcularStatus(tarefa);

    if ((status === "Para hoje" || status === "Vencida") && Notification.permission === "granted") {
      new Notification("Alerta AutoTask Z", {
        body: `${tarefa.titulo} - ${status}`
      });
    }
  });
}

function exportarRelatorio() {
  let conteudo = "RELATÓRIO AUTOTASK Z\n\n";

  tarefas.forEach(tarefa => {
    conteudo += `Missão: ${tarefa.titulo}\n`;
    conteudo += `Responsável: ${tarefa.responsavel}\n`;
    conteudo += `Data: ${formatarData(tarefa.data)}\n`;
    conteudo += `Prioridade: ${tarefa.prioridade}\n`;
    conteudo += `Status: ${calcularStatus(tarefa)}\n`;
    conteudo += `Criada em: ${tarefa.criadaEm}\n`;
    conteudo += "---------------------------\n";
  });

  const arquivo = new Blob([conteudo], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(arquivo);
  link.download = "relatorio-autotask-z.txt";
  link.click();

  const fala = document.getElementById("falaAssistente");
  if (fala) fala.innerText = "Relatório exportado com sucesso!";
}

function carregarDadosExemplo() {
  if (tarefas.length > 0) return;

  tarefas = [
    {
      titulo: "Finalizar dashboard",
      responsavel: "Anicely",
      data: pegarDataFutura(1),
      prioridade: "Alta",
      concluida: false,
      criadaEm: new Date().toLocaleString("pt-BR")
    },
    {
      titulo: "Publicar no GitHub",
      responsavel: "Equipe Dev",
      data: pegarDataFutura(3),
      prioridade: "Média",
      concluida: false,
      criadaEm: new Date().toLocaleString("pt-BR")
    },
    {
      titulo: "Revisar automações",
      responsavel: "Coordenação",
      data: pegarDataFutura(-1),
      prioridade: "Alta",
      concluida: false,
      criadaEm: new Date().toLocaleString("pt-BR")
    }
  ];

  salvar();
}

function pegarDataFutura(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().split("T")[0];
}

function salvar() {
  localStorage.setItem("tarefasZ", JSON.stringify(tarefas));
}

function limparCampos() {
  document.getElementById("titulo").value = "";
  document.getElementById("responsavel").value = "";
  document.getElementById("data").value = "";
  document.getElementById("prioridade").value = "Baixa";
}

function formatarData(data) {
  if (!data) return "";

  const partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function atualizarSistema() {
  listarTarefas();
  atualizarDashboard();
  listarAlertas();
  atualizarGrafico();
  atualizarKanban();
}

carregarDadosExemplo();
atualizarSistema();
trocarMensagemGoku();

setInterval(trocarMensagemGoku, 5000);

setTimeout(() => {
  verificarAlertasAutomaticos();
}, 3000);