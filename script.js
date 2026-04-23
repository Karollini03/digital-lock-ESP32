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

function limparAposDelay(delay) {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
  }

  cleanupTimer = setTimeout(() => {
    entrada = '';
    resetUI();
    updateDisplay('normal');
    cleanupTimer = null;
  }, delay);
}

function press(n) {
  if (entrada.length < 6) {
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
  } else {
    sub.className = 'subtitle error';
    sub.textContent = 'Senha incorreta';
    icon.className = 'lock-icon error';
    svg.setAttribute('stroke', '#ef4444');
    updateDisplay('error');
  }

  limparAposDelay(2000);
}

function autofill() {
  entrada = '1234';
  resetUI();
  updateDisplay('normal');
}

// Suporte ao teclado físico
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') press(e.key);
  else if (e.key === 'Backspace') del();
  else if (e.key === 'Enter') confirmar();
});