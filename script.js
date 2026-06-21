// =============================================
// CONFIGURAÇÃO DO FIREBASE
// =============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3hFDdE-e1kQE6sKBkOeeH12Je7ovA6-4",
  authDomain: "projeto-sisop.firebaseapp.com",
  databaseURL: "https://projeto-sisop-default-rtdb.firebaseio.com",
  projectId: "projeto-sisop",
  storageBucket: "projeto-sisop.firebasestorage.app",
  messagingSenderId: "452794231364",
  appId: "1:452794231364:web:ca353ab44d25d3e1e8aa11",
  measurementId: "G-RXK6YPS293"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =============================================
// NAVEGAÇÃO ENTRE TELAS
// =============================================
function mostrarView(nome) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + nome).classList.add('active');

  document.getElementById('navLock').classList.remove('active');
  document.getElementById('navStats').classList.remove('active');

  if (nome === 'lock') {
    document.getElementById('navLock').classList.add('active');
  } else {
    document.getElementById('navStats').classList.add('active');
  }

  // Se entrou no painel de estatísticas, começa a escutar os logs
  if (nome === 'statsPanel') {
    escutarLogs();
  }
}
window.mostrarView = mostrarView;

// =============================================
// LÓGICA DA FECHADURA (tela 1)
// =============================================
const SENHA = '1234';
let entrada = '';
let cleanupTimer = null;

function updateDisplay(state) {
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById('d' + i);
    d.innerHTML = '';
    d.className = 'digit';
    if (i < entrada.length) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      d.appendChild(dot);
      d.classList.add(state === 'error' ? 'error' : state === 'success' ? 'success' : 'filled');
    }
  }
}

function resetUI() {
  const sub = document.getElementById('subtitle');
  const icon = document.getElementById('lockIcon');
  const svg = document.getElementById('lockSvg');
  sub.className = 'subtitle';
  sub.textContent = 'Digite sua senha';
  icon.className = 'lock-icon';
  svg.setAttribute('stroke', '#2563eb');
}

function salvarLog(status) {
  const agora = new Date();
  const horario = agora.toLocaleString('pt-BR');

  set(ref(db, 'fechadura/comando'), {
    status: status,
    horario: horario
  });

  push(ref(db, 'fechadura/logs'), {
    status: status,
    horario: horario
  });
}

function limparAposDelay(delay) {
  if (cleanupTimer) clearTimeout(cleanupTimer);
  cleanupTimer = setTimeout(() => {
    entrada = '';
    resetUI();
    updateDisplay('normal');
    cleanupTimer = null;
  }, delay);
}

function press(n) {
  if (entrada.length < 4) {
    entrada += n;
    resetUI();
    updateDisplay('normal');
  }
}

function del() {
  entrada = entrada.slice(0, -1);
  resetUI();
  updateDisplay('normal');
}

function confirmar() {
  if (entrada.length === 0) return;
  const sub = document.getElementById('subtitle');
  const icon = document.getElementById('lockIcon');
  const svg = document.getElementById('lockSvg');

  if (entrada === SENHA) {
    sub.className = 'subtitle success';
    sub.textContent = 'Acesso autorizado!';
    icon.className = 'lock-icon success';
    svg.setAttribute('stroke', '#22c55e');
    updateDisplay('success');
    salvarLog('sucesso');
  } else {
    sub.className = 'subtitle error';
    sub.textContent = 'Senha incorreta';
    icon.className = 'lock-icon error';
    svg.setAttribute('stroke', '#ef4444');
    updateDisplay('error');
    salvarLog('falha');
  }

  limparAposDelay(2000);
}

function autofill() {
  entrada = '1234';
  resetUI();
  updateDisplay('normal');
}

window.press = press;
window.del = del;
window.confirmar = confirmar;
window.autofill = autofill;

document.addEventListener('keydown', (e) => {
  // só aplica o teclado físico na view da fechadura
  if (!document.getElementById('view-lock').classList.contains('active')) return;
  if (e.key >= '0' && e.key <= '9') press(e.key);
  else if (e.key === 'Backspace') del();
  else if (e.key === 'Enter') confirmar();
});


// =============================================
// GRÁFICO DE ESTATÍSTICAS (semana / hora)
// =============================================
let modoGrafico = 'semana'; // 'semana' ou 'hora'
let ultimosLogsArray = [];

function trocarModoGrafico(modo) {
  modoGrafico = modo;
  document.getElementById('toggleSemana').classList.toggle('active', modo === 'semana');
  document.getElementById('toggleHora').classList.toggle('active', modo === 'hora');
  document.getElementById('chartTitle').textContent =
    modo === 'semana' ? 'Acessos na semana' : 'Acessos de hoje por hora';
  document.getElementById('chartSubtitle').textContent =
    modo === 'semana' ? 'Segunda a domingo' : 'Últimas 24 horas';
  desenharGrafico(ultimosLogsArray);
}
window.trocarModoGrafico = trocarModoGrafico;

// Converte "dd/mm/aaaa, hh:mm:ss" (toLocaleString pt-BR) em objeto Date
function parseHorarioBR(horarioStr) {
  if (!horarioStr) return null;
  const [dataParte, horaParte] = horarioStr.split(', ');
  if (!dataParte || !horaParte) return null;
  const [dia, mes, ano] = dataParte.split('/').map(Number);
  const [h, m, s] = horaParte.split(':').map(Number);
  return new Date(ano, mes - 1, dia, h, m, s || 0);
}

function desenharGrafico(entradas) {
  const svg = document.getElementById('chartSvg');
  if (!svg) return;

  let labels = [];
  let sucessoData = [];
  let falhaData = [];

  if (modoGrafico === 'semana') {
    labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    sucessoData = [0, 0, 0, 0, 0, 0, 0];
    falhaData = [0, 0, 0, 0, 0, 0, 0];

    entradas.forEach(item => {
      const d = parseHorarioBR(item.horario);
      if (!d) return;
      // getDay(): 0=domingo...6=sábado -> reindexa pra Seg=0...Dom=6
      const idx = (d.getDay() + 6) % 7;
      if (item.status === 'sucesso') sucessoData[idx]++;
      else falhaData[idx]++;
    });

  } else {
    labels = ['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h'];
    sucessoData = new Array(8).fill(0);
    falhaData = new Array(8).fill(0);

    const hoje = new Date();

    entradas.forEach(item => {
      const d = parseHorarioBR(item.horario);
      if (!d) return;
      const mesmoDia = d.getDate() === hoje.getDate() &&
                        d.getMonth() === hoje.getMonth() &&
                        d.getFullYear() === hoje.getFullYear();
      if (!mesmoDia) return;
      const idx = Math.floor(d.getHours() / 3);
      if (item.status === 'sucesso') sucessoData[idx]++;
      else falhaData[idx]++;
    });
  }

  renderBarChart(svg, labels, sucessoData, falhaData);
}

function renderBarChart(svg, labels, sucessoData, falhaData) {
  const W = 560, H = 220;
  const padLeft = 28, padBottom = 28, padTop = 10, padRight = 8;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const maxVal = Math.max(1, ...sucessoData, ...falhaData);
  const niceMax = Math.ceil(maxVal * 1.15);

  const groupW = chartW / labels.length;
  const barW = Math.min(18, groupW * 0.32);
  const gap = 4;

  let bars = '';
  let axisLines = '';

  // Linhas de grade horizontais (4 divisões)
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = padTop + chartH - (chartH * i / steps);
    const val = Math.round(niceMax * i / steps);
    axisLines += `
      <line x1="${padLeft}" y1="${y}" x2="${W - padRight}" y2="${y}" stroke="#1f2937" stroke-width="1" />
      <text x="${padLeft - 6}" y="${y + 3}" class="chart-axis-label">${val}</text>
    `;
  }

  labels.forEach((label, i) => {
    const groupX = padLeft + i * groupW + groupW / 2;
    const sucessoH = (sucessoData[i] / niceMax) * chartH;
    const falhaH = (falhaData[i] / niceMax) * chartH;

    const xSucesso = groupX - gap / 2 - barW;
    const xFalha = groupX + gap / 2;

    bars += `
      <rect x="${xSucesso}" y="${padTop + chartH - sucessoH}" width="${barW}" height="${sucessoH}"
            rx="3" fill="#22c55e" opacity="0.9">
        <title>${sucessoData[i]} sucesso(s)</title>
      </rect>
      <rect x="${xFalha}" y="${padTop + chartH - falhaH}" width="${barW}" height="${falhaH}"
            rx="3" fill="#ef4444" opacity="0.9">
        <title>${falhaData[i]} falha(s)</title>
      </rect>
      <text x="${groupX}" y="${H - 6}" class="chart-bar-label">${label}</text>
    `;
  });

  svg.innerHTML = axisLines + bars;
}

let logsJaCarregados = false;

function escutarLogs() {
  if (logsJaCarregados) return; // evita registrar o listener mais de uma vez
  logsJaCarregados = true;

  const logsRef = ref(db, 'fechadura/logs');

  onValue(logsRef, (snapshot) => {
    const dados = snapshot.val();
    const lista = document.getElementById('logList');
    const countSucesso = document.getElementById('countSucesso');
    const countFalha = document.getElementById('countFalha');

    if (!dados) {
      lista.innerHTML = '<div class="log-empty">Nenhum acesso registrado ainda.</div>';
      countSucesso.textContent = '0';
      countFalha.textContent = '0';
      ultimosLogsArray = [];
      desenharGrafico(ultimosLogsArray);
      return;
    }

    // Transforma em array (ordem cronológica, do mais antigo pro mais novo)
    const entradasCronologicas = Object.values(dados);
    ultimosLogsArray = entradasCronologicas;

    // Para a lista, mostra do mais recente pro mais antigo
    const entradas = [...entradasCronologicas].reverse();

    let sucessos = 0;
    let falhas = 0;

    const html = entradas.map(item => {
      const isSucesso = item.status === 'sucesso';
      if (isSucesso) sucessos++; else falhas++;

      return `
        <div class="log-item">
          <div class="log-icon ${isSucesso ? 'success' : 'error'}">
            ${isSucesso ? '✓' : '✕'}
          </div>
          <div class="log-text">${isSucesso ? 'Acesso autorizado' : 'Tentativa negada'}</div>
          <div class="log-time">${item.horario || '--'}</div>
        </div>
      `;
    }).join('');

    lista.innerHTML = html;
    countSucesso.textContent = sucessos;
    countFalha.textContent = falhas;

    desenharGrafico(ultimosLogsArray);
  });
}