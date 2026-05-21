const STORAGE_KEY = "autotaskz:tarefas";
const THEME_KEY = "autotaskz:tema";
const ASSISTANT_KEY = "autotaskz:assistente";

let tarefas = carregarTarefas();
let graficoStatus;
let draggedTaskId = null;
let paginaAtual = "dashboard";
let assistenteAtual = "goku";

const assistentes = {
  goku: {
    nome: "Goku",
    marca: "悟",
    classe: "assistant-goku",
    gif: "https://media.giphy.com/media/SPuyENBLQCFCU/giphy.gif",
    saudacao: "Oi, eu sou o Goku. Vamos completar essas missões!",
    mensagens: [
      "Treine o foco: uma missão de cada vez.",
      "Quando a tarefa parece difícil, é sinal de que vale subir de nível.",
      "Arraste os cards no Kanban e deixe o fluxo mais forte.",
      "Missões vencidas precisam de energia máxima agora.",
      "Concluir tarefa também é vitória."
    ]
  },
  bulma: {
    nome: "Bulma",
    marca: "B",
    classe: "assistant-bulma",
    gif: "https://media.giphy.com/media/ExKvS1tChstXi/giphy.gif",
    saudacao: "Bulma na área. Vou deixar esse painel inteligente.",
    mensagens: [
      "Dados organizados deixam qualquer plano mais brilhante.",
      "Revise prioridade e prazo antes de começar.",
      "O dashboard mostra onde mexer primeiro.",
      "Relatórios ajudam a provar o progresso.",
      "Tecnologia boa é aquela que economiza tempo."
    ]
  },
  kuririn: {
    nome: "Kuririn",
    marca: "K",
    classe: "assistant-kuririn",
    gif: "https://media.giphy.com/media/4piHJbgE0rhxm/giphy.gif",
    saudacao: "Kuririn pronto. Pequenas vitórias também contam.",
    mensagens: [
      "Comece pela tarefa menor para ganhar ritmo.",
      "Não subestime uma lista bem cuidada.",
      "Se venceu hoje, coloque no centro do Kanban.",
      "Consistência vence pressão.",
      "Marcar como concluída dá uma satisfação enorme."
    ]
  },
  gohan: {
    nome: "Gohan",
    marca: "悟",
    classe: "assistant-gohan",
    gif: "https://media.giphy.com/media/kgT9TRLM2SwNtqqhXx/giphy.gif",
    saudacao: "Gohan aqui. Vamos estudar o plano e agir com calma.",
    mensagens: [
      "Priorize com clareza antes de atacar a lista.",
      "Um bom painel transforma esforço em estratégia.",
      "Tarefa vencida pede ação objetiva.",
      "Organização também é treino.",
      "Cada missão concluída libera espaço mental."
    ]
  },
  trunks: {
    nome: "Trunks",
    marca: "T",
    classe: "assistant-trunks",
    gif: "https://media.giphy.com/media/lfSoh55Ksl1UENjNlT/giphy.gif",
    saudacao: "Trunks chegou do futuro para salvar seus prazos.",
    mensagens: [
      "Resolver hoje evita uma emergência amanhã.",
      "O futuro melhora quando o Kanban está limpo.",
      "Prazos vencidos são prioridade máxima.",
      "Revise a lista antes que o tempo aperte.",
      "Boa decisão agora vira tranquilidade depois."
    ]
  }
};

const prioridadePeso = {
  Alta: 0,
  Média: 1,
  Baixa: 2
};

document.addEventListener("DOMContentLoaded", iniciarApp);

function iniciarApp() {
  aplicarTemaSalvo();
  conectarEventos();
  aplicarAssistenteSalvo();
  carregarDadosExemplo();
  atualizarSistema();
  falar(assistentes[assistenteAtual].saudacao);
  setInterval(rotacionarMensagem, 7000);
  setTimeout(verificarAlertasAutomaticos, 3000);
}

function conectarEventos() {
  document.getElementById("loginForm").addEventListener("submit", entrar);
  document.getElementById("taskForm").addEventListener("submit", adicionarTarefa);
  document.getElementById("themeButton").addEventListener("click", toggleTema);
  document.getElementById("notifyButton").addEventListener("click", ativarNotificacoes);
  document.getElementById("exportButton").addEventListener("click", exportarRelatorio);
  document.getElementById("logoutButton").addEventListener("click", sair);
  document.getElementById("assistantSelect").addEventListener("change", trocarAssistente);
  document.getElementById("assistantGif").addEventListener("error", usarAvatarFallback);

  document.querySelectorAll("[data-page]").forEach(botao => {
    botao.addEventListener("click", () => mostrar(botao.dataset.page));
  });

  document.querySelectorAll("[data-drop-status]").forEach(coluna => {
    coluna.addEventListener("dragover", permitirSoltar);
    coluna.addEventListener("dragleave", () => coluna.classList.remove("is-over"));
    coluna.addEventListener("drop", event => soltar(event, coluna.dataset.dropStatus));
  });
}

function entrar(event) {
  event.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;

  if (usuario !== "admin" || senha !== "123") {
    alert("Usuário ou senha inválidos.");
    falar("Confira usuário e senha para acessar o painel.");
    return;
  }

  document.getElementById("login").style.display = "none";
  document.getElementById("app").classList.add("is-visible");
  document.getElementById("app").setAttribute("aria-hidden", "false");
  mostrar("dashboard");
}

function sair() {
  document.getElementById("app").classList.remove("is-visible");
  document.getElementById("app").setAttribute("aria-hidden", "true");
  document.getElementById("login").style.display = "grid";
  falar("Sessão encerrada. Até a próxima missão.");
}

function mostrar(pagina) {
  paginaAtual = pagina;

  document.querySelectorAll(".pagina").forEach(secao => {
    secao.classList.toggle("active-page", secao.id === pagina);
  });

  document.querySelectorAll("[data-page]").forEach(botao => {
    botao.classList.toggle("active", botao.dataset.page === pagina);
  });

  atualizarSistema();
  atualizarFalaPorPagina(pagina);
}

function atualizarFalaPorPagina(pagina) {
  const nome = assistentes[assistenteAtual].nome;
  const mensagens = {
    dashboard: `${nome}: aqui você acompanha o progresso geral das missões.`,
    tarefas: `${nome}: cadastre novas missões com data, prioridade e responsável.`,
    alertas: `${nome}: este radar destaca o que precisa de atenção.`,
    kanban: `${nome}: arraste missões entre as colunas para manter o fluxo em dia.`
  };

  falar(mensagens[pagina] || assistentes[assistenteAtual].saudacao);
}

function adicionarTarefa(event) {
  event.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const responsavel = document.getElementById("responsavel").value.trim();
  const data = document.getElementById("data").value;
  const prioridade = document.getElementById("prioridade").value;

  if (!titulo || !responsavel || !data || !prioridade) {
    alert("Preencha todos os campos.");
    return;
  }

  tarefas.push({
    id: gerarId(),
    titulo,
    responsavel,
    data,
    prioridade,
    concluida: false,
    criadaEm: new Date().toISOString()
  });

  salvar();
  limparCampos();
  atualizarSistema();
  falar("Missão adicionada com sucesso.");
}

function concluirTarefa(id) {
  const tarefa = encontrarTarefa(id);
  if (!tarefa) return;

  tarefa.concluida = true;
  salvar();
  atualizarSistema();
  falar("Muito bem. Missão concluída.");
}

function reabrirTarefa(id) {
  const tarefa = encontrarTarefa(id);
  if (!tarefa) return;

  tarefa.concluida = false;
  salvar();
  atualizarSistema();
  falar("Missão reaberta para continuar depois.");
}

function excluirTarefa(id) {
  const tarefa = encontrarTarefa(id);
  if (!tarefa || !confirm(`Deseja excluir "${tarefa.titulo}"?`)) return;

  tarefas = tarefas.filter(item => item.id !== id);
  salvar();
  atualizarSistema();
  falar("Missão removida do painel.");
}

function calcularStatus(tarefa) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataTarefa = new Date(`${tarefa.data}T00:00:00`);

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
  const taskCount = document.getElementById("taskCount");
  lista.replaceChildren();
  taskCount.textContent = `${tarefas.length} ${tarefas.length === 1 ? "item" : "itens"}`;

  if (tarefas.length === 0) {
    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.colSpan = 6;
    celula.className = "empty-state";
    celula.textContent = "Nenhuma missão cadastrada.";
    linha.append(celula);
    lista.append(linha);
    return;
  }

  tarefasOrdenadas().forEach(tarefa => {
    const status = calcularStatus(tarefa);
    const linha = document.createElement("tr");

    criarCelula(linha, tarefa.titulo);
    criarCelula(linha, tarefa.responsavel);
    criarCelula(linha, formatarData(tarefa.data));
    criarCelula(linha, tarefa.prioridade);

    const statusCelula = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = `status ${classeStatus(status)}`;
    statusBadge.textContent = status;
    statusCelula.append(statusBadge);
    linha.append(statusCelula);

    const acoes = document.createElement("td");
    const botaoStatus = document.createElement("button");
    botaoStatus.type = "button";
    botaoStatus.textContent = tarefa.concluida ? "Reabrir" : "Concluir";
    botaoStatus.addEventListener("click", () => {
      tarefa.concluida ? reabrirTarefa(tarefa.id) : concluirTarefa(tarefa.id);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.type = "button";
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.addEventListener("click", () => excluirTarefa(tarefa.id));

    acoes.append(botaoStatus, botaoExcluir);
    linha.append(acoes);
    lista.append(linha);
  });
}

function atualizarDashboard() {
  const statusResumo = obterResumoStatus();

  document.getElementById("totalTarefas").textContent = tarefas.length;
  document.getElementById("concluidas").textContent = statusResumo.concluidas;
  document.getElementById("pendentes").textContent = statusResumo.pendentes + statusResumo.hoje;
  document.getElementById("vencidas").textContent = statusResumo.vencidas;
  document.getElementById("resumoDia").textContent = montarResumo(statusResumo);
}

function listarAlertas() {
  const lista = document.getElementById("listaAlertas");
  lista.replaceChildren();

  if (tarefas.length === 0) {
    const alerta = document.createElement("article");
    alerta.className = "alerta";
    alerta.textContent = "Nenhuma missão cadastrada.";
    lista.append(alerta);
    return;
  }

  tarefasOrdenadas().forEach(tarefa => {
    const status = calcularStatus(tarefa);
    const alerta = document.createElement("article");
    alerta.className = `alerta ${corAlerta(status)}`;

    const titulo = document.createElement("h3");
    titulo.textContent = tarefa.titulo;
    alerta.append(titulo);

    [
      ["Responsável", tarefa.responsavel],
      ["Data", formatarData(tarefa.data)],
      ["Prioridade", tarefa.prioridade],
      ["Status", status]
    ].forEach(([rotulo, valor]) => {
      const paragrafo = document.createElement("p");
      paragrafo.append(criarNegrito(`${rotulo}: `), document.createTextNode(valor));
      alerta.append(paragrafo);
    });

    const mensagem = document.createElement("p");
    mensagem.textContent = mensagemAlerta(status);
    alerta.append(mensagem);
    lista.append(alerta);
  });
}

function atualizarGrafico() {
  const canvas = document.getElementById("graficoStatus");
  if (!canvas || typeof Chart === "undefined") return;

  const statusResumo = obterResumoStatus();
  const data = [
    statusResumo.concluidas,
    statusResumo.pendentes + statusResumo.hoje,
    statusResumo.vencidas
  ];

  if (graficoStatus) {
    graficoStatus.data.datasets[0].data = data;
    graficoStatus.update();
    return;
  }

  graficoStatus = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Concluídas", "Pendentes", "Vencidas"],
      datasets: [{
        data,
        backgroundColor: ["#15803d", "#ffbf1f", "#c2410c"],
        borderColor: "#171717",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function atualizarKanban() {
  const colunas = {
    Pendente: document.getElementById("kanbanPendente"),
    "Para hoje": document.getElementById("kanbanHoje"),
    "Concluída": document.getElementById("kanbanConcluida")
  };

  Object.values(colunas).forEach(coluna => coluna.replaceChildren());

  tarefasOrdenadas().forEach(tarefa => {
    const status = calcularStatus(tarefa);
    const destino = status === "Vencida" ? "Pendente" : status;
    colunas[destino].append(criarKanbanCard(tarefa, status));
  });
}

function criarKanbanCard(tarefa, status) {
  const card = document.createElement("article");
  card.className = "kanban-card";
  card.draggable = true;
  card.dataset.id = tarefa.id;
  card.addEventListener("dragstart", arrastar);
  card.addEventListener("dragend", limparArraste);

  const titulo = document.createElement("h3");
  titulo.textContent = tarefa.titulo;
  card.append(titulo);

  [tarefa.responsavel, formatarData(tarefa.data), tarefa.prioridade, status].forEach(valor => {
    const paragrafo = document.createElement("p");
    paragrafo.textContent = valor;
    card.append(paragrafo);
  });

  return card;
}

function arrastar(event) {
  draggedTaskId = event.currentTarget.dataset.id;
  event.dataTransfer.setData("text/plain", draggedTaskId);
  event.dataTransfer.effectAllowed = "move";
  falar("Solte em uma coluna para mudar o status da missão.");
}

function permitirSoltar(event) {
  event.preventDefault();
  event.currentTarget.classList.add("is-over");
}

function soltar(event, novoStatus) {
  event.preventDefault();
  event.currentTarget.classList.remove("is-over");

  const id = event.dataTransfer.getData("text/plain") || draggedTaskId;
  const tarefa = encontrarTarefa(id);
  if (!tarefa) return;

  tarefa.concluida = novoStatus === "Concluída";

  if (novoStatus === "Para hoje") {
    tarefa.data = dataHojeISO();
  }

  salvar();
  atualizarSistema();
  falar(`Missão movida para: ${novoStatus}.`);
}

function limparArraste() {
  draggedTaskId = null;
  document.querySelectorAll(".coluna").forEach(coluna => coluna.classList.remove("is-over"));
}

function toggleTema() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(THEME_KEY, document.body.classList.contains("dark-mode") ? "dark" : "light");
  falar("Tema atualizado.");
}

function aplicarTemaSalvo() {
  if (localStorage.getItem(THEME_KEY) === "dark") {
    document.body.classList.add("dark-mode");
  }
}

function aplicarAssistenteSalvo() {
  const salvo = localStorage.getItem(ASSISTANT_KEY);
  assistenteAtual = assistentes[salvo] ? salvo : "goku";
  document.getElementById("assistantSelect").value = assistenteAtual;
  renderizarAssistente();
}

function trocarAssistente(event) {
  assistenteAtual = assistentes[event.target.value] ? event.target.value : "goku";
  localStorage.setItem(ASSISTANT_KEY, assistenteAtual);
  renderizarAssistente();
  falar(assistentes[assistenteAtual].saudacao);
}

function renderizarAssistente() {
  const assistente = assistentes[assistenteAtual];
  const avatar = document.getElementById("assistantAvatar");
  const gif = document.getElementById("assistantGif");
  const media = gif.closest(".assistant-media");

  media.classList.remove("use-fallback");
  gif.src = assistente.gif;
  gif.alt = assistente.nome;
  avatar.className = `assistant-avatar ${assistente.classe}`;
  avatar.textContent = assistente.marca;
  document.getElementById("assistantName").textContent = assistente.nome;
}

function usarAvatarFallback() {
  document.querySelector(".assistant-media").classList.add("use-fallback");
}

function ativarNotificacoes() {
  if (!("Notification" in window)) {
    alert("Seu navegador não suporta notificações.");
    return;
  }

  Notification.requestPermission().then(permissao => {
    if (permissao === "granted") {
      new Notification("AutoTask Z", {
        body: "Alertas ativados com sucesso."
      });
      falar("Alertas do navegador ativados.");
    } else {
      falar("As notificações não foram ativadas.");
    }
  });
}

function verificarAlertasAutomaticos() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  tarefas.forEach(tarefa => {
    const status = calcularStatus(tarefa);

    if (status === "Para hoje" || status === "Vencida") {
      new Notification("Alerta AutoTask Z", {
        body: `${tarefa.titulo} - ${status}`
      });
    }
  });
}

function exportarRelatorio() {
  const linhas = [
    "RELATÓRIO AUTOTASK Z",
    `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    ""
  ];

  tarefasOrdenadas().forEach(tarefa => {
    linhas.push(
      `Missão: ${tarefa.titulo}`,
      `Responsável: ${tarefa.responsavel}`,
      `Data: ${formatarData(tarefa.data)}`,
      `Prioridade: ${tarefa.prioridade}`,
      `Status: ${calcularStatus(tarefa)}`,
      `Criada em: ${formatarDataHora(tarefa.criadaEm)}`,
      "---------------------------"
    );
  });

  const arquivo = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = "relatorio-autotask-z.txt";
  link.click();
  URL.revokeObjectURL(link.href);
  falar("Relatório exportado com sucesso.");
}

function carregarDadosExemplo() {
  if (tarefas.length > 0) return;

  tarefas = [
    criarTarefaExemplo("Finalizar dashboard", "Anicely", 1, "Alta"),
    criarTarefaExemplo("Publicar no GitHub", "Equipe Dev", 3, "Média"),
    criarTarefaExemplo("Revisar automações", "Coordenação", -1, "Alta")
  ];

  salvar();
}

function criarTarefaExemplo(titulo, responsavel, dias, prioridade) {
  return {
    id: gerarId(titulo),
    titulo,
    responsavel,
    data: pegarDataFutura(dias),
    prioridade,
    concluida: false,
    criadaEm: new Date().toISOString()
  };
}

function carregarTarefas() {
  try {
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY)) || JSON.parse(localStorage.getItem("tarefasZ")) || [];

    return dados.map((tarefa, index) => ({
      id: tarefa.id || `${Date.now()}-${index}`,
      titulo: tarefa.titulo || "Missão sem nome",
      responsavel: tarefa.responsavel || "Sem responsável",
      data: tarefa.data || dataHojeISO(),
      prioridade: tarefa.prioridade || "Baixa",
      concluida: Boolean(tarefa.concluida),
      criadaEm: tarefa.criadaEm || new Date().toISOString()
    }));
  } catch {
    return [];
  }
}

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
}

function limparCampos() {
  document.getElementById("taskForm").reset();
  document.getElementById("prioridade").value = "Baixa";
  document.getElementById("titulo").focus();
}

function atualizarSistema() {
  listarTarefas();
  atualizarDashboard();
  listarAlertas();
  atualizarGrafico();
  atualizarKanban();
}

function obterResumoStatus() {
  return tarefas.reduce((resumo, tarefa) => {
    const status = calcularStatus(tarefa);

    if (status === "Concluída") resumo.concluidas += 1;
    if (status === "Pendente") resumo.pendentes += 1;
    if (status === "Para hoje") resumo.hoje += 1;
    if (status === "Vencida") resumo.vencidas += 1;

    return resumo;
  }, {
    concluidas: 0,
    pendentes: 0,
    hoje: 0,
    vencidas: 0
  });
}

function montarResumo(resumo) {
  if (tarefas.length === 0) return "Sem missões cadastradas por enquanto.";
  if (resumo.vencidas > 0) return `${resumo.vencidas} missão(ões) vencida(s) precisam de atenção.`;
  if (resumo.hoje > 0) return `${resumo.hoje} missão(ões) vencem hoje.`;
  return "Tudo sob controle por agora.";
}

function tarefasOrdenadas() {
  return [...tarefas].sort((a, b) => {
    const data = a.data.localeCompare(b.data);
    if (data !== 0) return data;
    return prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade];
  });
}

function encontrarTarefa(id) {
  return tarefas.find(tarefa => tarefa.id === id);
}

function gerarId(prefixo = "tarefa") {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefixo}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function criarCelula(linha, texto) {
  const celula = document.createElement("td");
  celula.textContent = texto;
  linha.append(celula);
  return celula;
}

function criarNegrito(texto) {
  const strong = document.createElement("strong");
  strong.textContent = texto;
  return strong;
}

function corAlerta(status) {
  if (status === "Vencida") return "vermelho";
  if (status === "Para hoje") return "amarelo";
  return "verde";
}

function mensagemAlerta(status) {
  if (status === "Vencida") return "Alerta máximo: esta missão passou do prazo.";
  if (status === "Para hoje") return "Atenção: esta missão vence hoje.";
  if (status === "Concluída") return "Missão concluída com sucesso.";
  return "Missão sob controle.";
}

function rotacionarMensagem() {
  if (paginaAtual !== "dashboard") return;

  const mensagens = assistentes[assistenteAtual].mensagens;
  const proxima = mensagens[Math.floor(Math.random() * mensagens.length)];
  falar(proxima);
}

function falar(mensagem) {
  const fala = document.getElementById("falaAssistente");
  if (fala) fala.textContent = mensagem;
}

function pegarDataFutura(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().split("T")[0];
}

function dataHojeISO() {
  return new Date().toISOString().split("T")[0];
}

function formatarData(data) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString("pt-BR");
}
