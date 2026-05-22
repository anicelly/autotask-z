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
    imagem: "goku.gif.gif",
    saudacao: "Oi, eu sou o Goku. Vamos completar essas missões!",
    mensagens: ["Uma missão de cada vez.", "Missões vencidas precisam de energia máxima.", "Concluir tarefa também é vitória."]
  },
  bulma: {
    nome: "Bulma",
    marca: "B",
    classe: "assistant-bulma",
    imagem: "bulma.gif.gif",
    saudacao: "Bulma na área. Vou deixar esse painel inteligente.",
    mensagens: ["Dados organizados deixam qualquer plano mais brilhante.", "Relatórios ajudam a provar o progresso.", "Tecnologia boa economiza tempo."]
  },
  kuririn: {
    nome: "Kuririn",
    marca: "K",
    classe: "assistant-kuririn",
    imagem: "kuririn.gif.gif",
    saudacao: "Kuririn pronto. Pequenas vitórias também contam.",
    mensagens: ["Comece pela tarefa menor para ganhar ritmo.", "Consistência vence pressão.", "Marcar como concluída dá satisfação."]
  },
  gohan: {
    nome: "Gohan",
    marca: "悟",
    classe: "assistant-gohan",
    imagem: "gohan.gif.gif",
    saudacao: "Gohan aqui. Vamos estudar o plano e agir com calma.",
    mensagens: ["Priorize com clareza.", "Organização também é treino.", "Um bom painel transforma esforço em estratégia."]
  },
  trunks: {
    nome: "Trunks",
    marca: "T",
    classe: "assistant-trunks",
    imagem: "tranks.gif.gif",
    saudacao: "Trunks chegou do futuro para salvar seus prazos.",
    mensagens: ["Resolver hoje evita emergência amanhã.", "O futuro melhora quando o Kanban está limpo.", "Prazos vencidos são prioridade máxima."]
  }
};

const prioridadePeso = { Alta: 0, Média: 1, Baixa: 2 };

document.addEventListener("DOMContentLoaded", iniciarApp);

function iniciarApp() {
  setTimeout(() => document.getElementById("loader")?.classList.add("is-hidden"), 1500);
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
  escutar("loginForm", "submit", entrar);
  escutar("taskForm", "submit", adicionarTarefa);
  escutar("themeButton", "click", toggleTema);
  escutar("notifyButton", "click", ativarNotificacoes);
  escutar("exportButton", "click", exportarRelatorio);
  escutar("backupButton", "click", exportarBackupJSON);
  escutar("logoutButton", "click", sair);
  escutar("assistantSelect", "change", trocarAssistente);
  escutar("assistantImage", "error", usarAvatarFallback);
  escutar("busca", "input", listarTarefas);
  escutar("filtroStatus", "change", listarTarefas);
  escutar("autoReportButton", "click", exportarRelatorio);
  escutar("autoBackupButton", "click", exportarBackupJSON);
  escutar("autoRadarButton", "click", radarManual);

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
  const usuario = byId("usuario").value.trim();
  const senha = byId("senha").value;

  if (usuario !== "admin" || senha !== "123") {
    toast("Usuário ou senha inválidos.");
    falar("Confira usuário e senha para acessar o painel.");
    return;
  }

  byId("login").style.display = "none";
  byId("app").classList.add("is-visible");
  byId("app").setAttribute("aria-hidden", "false");
  mostrar("dashboard");
  toast("Bem-vinda ao AutoTask Z PRO!");
}

function sair() {
  byId("app").classList.remove("is-visible");
  byId("app").setAttribute("aria-hidden", "true");
  byId("login").style.display = "grid";
  falar("Sessão encerrada. Até a próxima missão.");
}

function mostrar(pagina) {
  paginaAtual = pagina;
  document.querySelectorAll(".pagina").forEach(secao => secao.classList.toggle("active-page", secao.id === pagina));
  document.querySelectorAll("[data-page]").forEach(botao => botao.classList.toggle("active", botao.dataset.page === pagina));
  atualizarSistema();
  atualizarFalaPorPagina(pagina);
}

function atualizarFalaPorPagina(pagina) {
  const nome = assistentes[assistenteAtual].nome;
  const mensagens = {
    dashboard: `${nome}: aqui você acompanha o progresso geral das missões.`,
    tarefas: `${nome}: cadastre e filtre suas missões.`,
    alertas: `${nome}: este radar destaca o que precisa de atenção.`,
    kanban: `${nome}: arraste missões entre as colunas.`,
    automacoes: `${nome}: área PRO com relatórios, backup e radar.`
  };
  falar(mensagens[pagina] || assistentes[assistenteAtual].saudacao);
}

function adicionarTarefa(event) {
  event.preventDefault();
  const titulo = byId("titulo").value.trim();
  const responsavel = byId("responsavel").value.trim();
  const data = byId("data").value;
  const prioridade = byId("prioridade").value;

  if (!titulo || !responsavel || !data || !prioridade) {
    toast("Preencha todos os campos.");
    return;
  }

  tarefas.push({ id: gerarId(), titulo, responsavel, data, prioridade, concluida: false, criadaEm: new Date().toISOString() });
  salvar();
  limparCampos();
  atualizarSistema();
  falar("Missão adicionada com sucesso.");
  toast("Missão adicionada!");
}

function concluirTarefa(id) {
  const tarefa = encontrarTarefa(id);
  if (!tarefa) return;
  tarefa.concluida = true;
  salvar();
  atualizarSistema();
  toast("Missão concluída!");
}

function reabrirTarefa(id) {
  const tarefa = encontrarTarefa(id);
  if (!tarefa) return;
  tarefa.concluida = false;
  salvar();
  atualizarSistema();
  toast("Missão reaberta.");
}

function excluirTarefa(id) {
  const tarefa = encontrarTarefa(id);
  if (!tarefa || !confirm(`Deseja excluir "${tarefa.titulo}"?`)) return;
  tarefas = tarefas.filter(item => item.id !== id);
  salvar();
  atualizarSistema();
  toast("Missão removida.");
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

function listarTarefas() {
  const lista = byId("listaTarefas");
  const busca = byId("busca")?.value?.toLowerCase() || "";
  const filtro = byId("filtroStatus")?.value || "Todos";
  lista.replaceChildren();

  const filtradas = tarefasOrdenadas().filter(tarefa => {
    const status = calcularStatus(tarefa);
    const texto = `${tarefa.titulo} ${tarefa.responsavel} ${tarefa.prioridade} ${status}`.toLowerCase();
    return texto.includes(busca) && (filtro === "Todos" || status === filtro);
  });

  byId("taskCount").textContent = `${filtradas.length} ${filtradas.length === 1 ? "item" : "itens"}`;

  if (filtradas.length === 0) {
    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.colSpan = 6;
    celula.className = "empty-state";
    celula.textContent = "Nenhuma missão encontrada.";
    linha.append(celula);
    lista.append(linha);
    return;
  }

  filtradas.forEach(tarefa => {
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
    botaoStatus.addEventListener("click", () => tarefa.concluida ? reabrirTarefa(tarefa.id) : concluirTarefa(tarefa.id));

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
  const resumo = obterResumoStatus();
  const total = tarefas.length;
  const percentual = total ? Math.round((resumo.concluidas / total) * 100) : 0;
  byId("totalTarefas").textContent = total;
  byId("concluidas").textContent = resumo.concluidas;
  byId("pendentes").textContent = resumo.pendentes + resumo.hoje;
  byId("vencidas").textContent = resumo.vencidas;
  byId("resumoDia").textContent = montarResumo(resumo);
  byId("progressoTexto").textContent = `${percentual}% concluído`;
  byId("progressoBarra").style.width = `${percentual}%`;
}

function listarAlertas() {
  const lista = byId("listaAlertas");
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
    alerta.innerHTML = `<h3>${escapeHTML(tarefa.titulo)}</h3>`;
    [["Responsável", tarefa.responsavel], ["Data", formatarData(tarefa.data)], ["Prioridade", tarefa.prioridade], ["Status", status]].forEach(([rotulo, valor]) => {
      const p = document.createElement("p");
      p.append(criarNegrito(`${rotulo}: `), document.createTextNode(valor));
      alerta.append(p);
    });
    const mensagem = document.createElement("p");
    mensagem.textContent = mensagemAlerta(status);
    alerta.append(mensagem);
    lista.append(alerta);
  });
}

function atualizarGrafico() {
  const canvas = byId("graficoStatus");
  if (!canvas || typeof Chart === "undefined") return;
  const resumo = obterResumoStatus();
  const data = [resumo.concluidas, resumo.pendentes + resumo.hoje, resumo.vencidas];
  if (graficoStatus) {
    graficoStatus.data.datasets[0].data = data;
    graficoStatus.update();
    return;
  }
  graficoStatus = new Chart(canvas, {
    type: "doughnut",
    data: { labels: ["Concluídas", "Pendentes", "Vencidas"], datasets: [{ data, backgroundColor: ["#15803d", "#ffbf1f", "#c2410c"], borderColor: "#171717", borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
  });
}

function atualizarKanban() {
  const colunas = { Pendente: byId("kanbanPendente"), "Para hoje": byId("kanbanHoje"), "Concluída": byId("kanbanConcluida") };
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
  card.innerHTML = `<h3>${escapeHTML(tarefa.titulo)}</h3><p>${escapeHTML(tarefa.responsavel)}</p><p>${formatarData(tarefa.data)}</p><p>${tarefa.prioridade}</p><p>${status}</p>`;
  return card;
}

function arrastar(event) {
  draggedTaskId = event.currentTarget.dataset.id;
  event.dataTransfer.setData("text/plain", draggedTaskId);
  event.dataTransfer.effectAllowed = "move";
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
  if (novoStatus === "Para hoje") tarefa.data = dataHojeISO();
  salvar();
  atualizarSistema();
  toast(`Missão movida para: ${novoStatus}.`);
}

function limparArraste() {
  draggedTaskId = null;
  document.querySelectorAll(".coluna").forEach(coluna => coluna.classList.remove("is-over"));
}

function toggleTema() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(THEME_KEY, document.body.classList.contains("dark-mode") ? "dark" : "light");
  toast("Tema atualizado.");
}

function aplicarTemaSalvo() {
  if (localStorage.getItem(THEME_KEY) === "dark") document.body.classList.add("dark-mode");
}

function aplicarAssistenteSalvo() {
  const salvo = localStorage.getItem(ASSISTANT_KEY);
  assistenteAtual = assistentes[salvo] ? salvo : "goku";
  byId("assistantSelect").value = assistenteAtual;
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
  const avatar = byId("assistantAvatar");
  const imagem = byId("assistantImage");
  const media = imagem.closest(".assistant-media");
  media.dataset.character = assistenteAtual;
  media.classList.remove("use-fallback");
  imagem.src = assistente.imagem;
  imagem.alt = assistente.nome;
  avatar.className = `assistant-avatar ${assistente.classe}`;
  avatar.textContent = assistente.marca;
  byId("assistantName").textContent = assistente.nome;
}

function usarAvatarFallback() {
  document.querySelector(".assistant-media").classList.add("use-fallback");
}

function ativarNotificacoes() {
  if (!("Notification" in window)) {
    toast("Seu navegador não suporta notificações.");
    return;
  }
  Notification.requestPermission().then(permissao => {
    if (permissao === "granted") {
      new Notification("AutoTask Z PRO", { body: "Alertas ativados com sucesso." });
      toast("Alertas ativados.");
    } else toast("As notificações não foram ativadas.");
  });
}

function verificarAlertasAutomaticos() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  tarefas.forEach(tarefa => {
    const status = calcularStatus(tarefa);
    if (status === "Para hoje" || status === "Vencida") new Notification("Alerta AutoTask Z PRO", { body: `${tarefa.titulo} - ${status}` });
  });
}

function radarManual() {
  const resumo = obterResumoStatus();
  toast(`Radar: ${resumo.vencidas} vencidas e ${resumo.hoje} para hoje.`);
  falar(`Radar concluído. ${resumo.vencidas} vencidas e ${resumo.hoje} para hoje.`);
}

function exportarRelatorio() {
  const linhas = ["RELATÓRIO AUTOTASK Z PRO", `Gerado em: ${new Date().toLocaleString("pt-BR")}`, ""];
  tarefasOrdenadas().forEach(tarefa => linhas.push(`Missão: ${tarefa.titulo}`, `Responsável: ${tarefa.responsavel}`, `Data: ${formatarData(tarefa.data)}`, `Prioridade: ${tarefa.prioridade}`, `Status: ${calcularStatus(tarefa)}`, `Criada em: ${formatarDataHora(tarefa.criadaEm)}`, "---------------------------"));
  baixarArquivo("relatorio-autotask-z-pro.txt", linhas.join("\n"), "text/plain;charset=utf-8");
  toast("Relatório exportado.");
}

function exportarBackupJSON() {
  baixarArquivo("backup-autotask-z-pro.json", JSON.stringify(tarefas, null, 2), "application/json;charset=utf-8");
  toast("Backup JSON baixado.");
}

function carregarDadosExemplo() {
  if (tarefas.length > 0) return;
  tarefas = [
    criarTarefaExemplo("Finalizar dashboard PRO", "Anicely", 1, "Alta"),
    criarTarefaExemplo("Publicar no GitHub Pages", "Equipe Dev", 3, "Média"),
    criarTarefaExemplo("Revisar automações", "Coordenação", -1, "Alta")
  ];
  salvar();
}

function criarTarefaExemplo(titulo, responsavel, dias, prioridade) {
  return { id: gerarId(titulo), titulo, responsavel, data: pegarDataFutura(dias), prioridade, concluida: false, criadaEm: new Date().toISOString() };
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
  } catch { return []; }
}

function salvar() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas)); }
function limparCampos() { byId("taskForm").reset(); byId("prioridade").value = "Baixa"; byId("titulo").focus(); }
function atualizarSistema() { listarTarefas(); atualizarDashboard(); listarAlertas(); atualizarGrafico(); atualizarKanban(); }

function obterResumoStatus() {
  return tarefas.reduce((resumo, tarefa) => {
    const status = calcularStatus(tarefa);
    if (status === "Concluída") resumo.concluidas++;
    if (status === "Pendente") resumo.pendentes++;
    if (status === "Para hoje") resumo.hoje++;
    if (status === "Vencida") resumo.vencidas++;
    return resumo;
  }, { concluidas: 0, pendentes: 0, hoje: 0, vencidas: 0 });
}

function montarResumo(resumo) {
  if (tarefas.length === 0) return "Sem missões cadastradas por enquanto.";
  if (resumo.vencidas > 0) return `${resumo.vencidas} missão(ões) vencida(s) precisam de atenção.`;
  if (resumo.hoje > 0) return `${resumo.hoje} missão(ões) vencem hoje.`;
  return "Tudo sob controle por agora.";
}

function tarefasOrdenadas() {
  return [...tarefas].sort((a, b) => a.data.localeCompare(b.data) || prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade]);
}

function encontrarTarefa(id) { return tarefas.find(tarefa => tarefa.id === id); }
function gerarId(prefixo = "tarefa") { return crypto?.randomUUID ? crypto.randomUUID() : `${prefixo}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function byId(id) { return document.getElementById(id); }
function escutar(id, evento, handler) { const elemento = byId(id); if (elemento) elemento.addEventListener(evento, handler); }
function criarCelula(linha, texto) { const celula = document.createElement("td"); celula.textContent = texto; linha.append(celula); return celula; }
function criarNegrito(texto) { const strong = document.createElement("strong"); strong.textContent = texto; return strong; }
function classeStatus(status) { if (status === "Concluída") return "concluida"; if (status === "Vencida") return "vencida"; return "pendente"; }
function corAlerta(status) { if (status === "Vencida") return "vermelho"; if (status === "Para hoje") return "amarelo"; return "verde"; }
function mensagemAlerta(status) { if (status === "Vencida") return "Alerta máximo: esta missão passou do prazo."; if (status === "Para hoje") return "Atenção: esta missão vence hoje."; if (status === "Concluída") return "Missão concluída com sucesso."; return "Missão sob controle."; }
function rotacionarMensagem() { if (paginaAtual !== "dashboard") return; const mensagens = assistentes[assistenteAtual].mensagens; falar(mensagens[Math.floor(Math.random() * mensagens.length)]); }
function falar(mensagem) { const fala = byId("falaAssistente"); if (fala) fala.textContent = mensagem; }
function pegarDataFutura(dias) { const data = new Date(); data.setDate(data.getDate() + dias); return data.toISOString().split("T")[0]; }
function dataHojeISO() { return new Date().toISOString().split("T")[0]; }
function formatarData(data) { if (!data) return ""; const [ano, mes, dia] = data.split("-"); return `${dia}/${mes}/${ano}`; }
function formatarDataHora(valor) { const data = new Date(valor); return Number.isNaN(data.getTime()) ? valor : data.toLocaleString("pt-BR"); }
function baixarArquivo(nome, conteudo, tipo) { const arquivo = new Blob([conteudo], { type: tipo }); const link = document.createElement("a"); link.href = URL.createObjectURL(arquivo); link.download = nome; link.click(); URL.revokeObjectURL(link.href); }
function toast(mensagem) { const el = byId("toast"); if (!el) return; el.textContent = mensagem; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2800); }
function escapeHTML(texto) { const div = document.createElement("div"); div.textContent = texto; return div.innerHTML; }
