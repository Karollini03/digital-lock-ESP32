# 🔒 Fechadura Digital

Projeto de fechadura eletrônica desenvolvido para a disciplina de Sistemas Operacionais. Combina hardware (ESP32 e snesor PIR) com uma interface web para controle de acesso remoto com autenticação em dois fatores.

---

## 📋 Descrição

O sistema permite abrir uma fechadura física via interface web, mas só libera o acesso se **duas condições forem atendidas ao mesmo tempo**:

1. A senha correta for digitada na interface web
2. O sensor PIR detectar presença física no local

Todos os eventos de acesso (sucesso e falha) são registrados no Firebase com horário, permitindo gerar relatórios e visualizar estatísticas de uso.

---

## 🖥️ Interface Web

A interface atual (`index.html`) contém a tela de senha com:

- Teclado numérico para digitar a senha
- Display de 4 dígitos com feedback visual
- Indicação verde para acesso autorizado
- Indicação vermelha para senha incorreta
- Suporte ao teclado físico do computador
- Layout responsivo (funciona no celular)

---

## 🛠️ Tecnologias

**Hardware**
- ESP32
- Sensor de presença PIR
- LED verde e LED vermelho
- Resistores 470Ω
- Protoboard e jumpers

**Software**
- HTML, CSS e JavaScript (interface web)
- Firebase Realtime Database (banco de dados e logs)
- Arduino IDE (programação da ESP32)

---

## 📁 Estrutura do Projeto

```
fechadura/
├── index.html    # Estrutura da página
├── style.css     # Estilo visual
├── script.js     # Lógica da interface
└── README.md     # Este arquivo
```

> O código da ESP32 (Arduino) será adicionado futuramente na pasta `/esp32`.

---

## 🚀 Como rodar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/fechadura-digital.git
   ```
2. Abra a pasta no VSCode
3. Abra o arquivo `index.html` no navegador

Não precisa instalar nada — é HTML puro.

---

## 🌐 Deploy

O projeto está hospedado na Vercel e pode ser acessado pelo celular como se fosse um app:

1. Abra o link no Chrome
2. Clique nos três pontinhos
3. Selecione **"Adicionar à tela inicial"**

---

## 📅 Cronograma

| Período | Atividade |
|---|---|
| Abril | Montagem do hardware, testes com LEDs e sensor PIR, configuração do Firebase |
| Maio | Interface web, lógica de dois fatores, envio de logs |
| Junho | Estatísticas, testes de estresse, relatório final |
| Julho | Apresentação final |

---

## ⚠️ Principais Riscos

| Risco | Como mitigar |
|---|---|
| Instabilidade de rede | ESP32 reconecta automaticamente ao Wi-Fi |
| Latência do banco | Uso do Firebase Realtime Database |
| Queima de componentes | Testes no simulador Wokwi antes do físico |

---

## 👩‍💻 Autora

Karollini Moraes Nunes— Sistemas Operacionais