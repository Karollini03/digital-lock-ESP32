#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =============================================
// CONFIGURAÇÕES - PREENCHA AQUI
// =============================================
#define WIFI_SSID     "wifi-aqui"
#define WIFI_PASSWORD "wifi-aqui"

// URL do Firebase pra ler o status
#define FIREBASE_HOST "projeto-sisop-default-rtdb.firebaseio.com"
#define FIREBASE_PATH "/fechadura/comando/status.json"

// =============================================
// PINOS
// =============================================
#define LED_VERMELHO 26
#define LED_VERDE    27
#define BUZZER       12

String ultimoStatus = "";
WiFiClientSecure clienteSeguro;

void setup() {
  Serial.begin(115200);

  pinMode(LED_VERDE,    OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);
  pinMode(BUZZER,       OUTPUT);

  // Estado inicial — porta fechada
  digitalWrite(LED_VERDE,    LOW);
  digitalWrite(LED_VERMELHO, HIGH);
  digitalWrite(BUZZER,       LOW);

  // Conecta no Wi-Fi
  Serial.print("Conectando ao Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi conectado! IP: " + WiFi.localIP().toString());
    WiFi.setSleep(false); // mantém o Wi-Fi sempre ativo, evita o erro -1
  } else {
    Serial.println("\nFalha ao conectar!");
  }

  // Pula a verificação do certificado SSL (mais rápido e evita travas)
  clienteSeguro.setInsecure();
}

void abrirPorta() {
  Serial.println("Abrindo! LED VERDE + buzzer");
  digitalWrite(LED_VERDE,    HIGH);
  digitalWrite(LED_VERMELHO, LOW);

  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER, HIGH);
    delay(150);
    digitalWrite(BUZZER, LOW);
    delay(150);
  }

  delay(3000);

  digitalWrite(LED_VERDE,    LOW);
  digitalWrite(LED_VERMELHO, HIGH);
  Serial.println("Porta fechada");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    if (http.begin(clienteSeguro, FIREBASE_HOST, 443, FIREBASE_PATH, true)) {
      http.setTimeout(4000);
      int httpCode = http.GET();

      if (httpCode == 200) {
        String payload = http.getString();
        payload.trim();
        payload.replace("\"", "");

        Serial.println("Status lido: " + payload);

        if (payload != ultimoStatus) {
          ultimoStatus = payload;

          if (payload == "sucesso") {
            abrirPorta();

          } else if (payload == "falha") {
            Serial.println("Senha incorreta!");
            for (int i = 0; i < 2; i++) {
              digitalWrite(LED_VERMELHO, LOW);
              delay(150);
              digitalWrite(LED_VERMELHO, HIGH);
              delay(150);
            }
          }
        }
      } else {
        Serial.println("Erro HTTP: " + String(httpCode));
      }

      http.end();
    } else {
      Serial.println("Falha ao iniciar conexão HTTPS");
    }

  } else {
    Serial.println("Wi-Fi desconectado, reconectando...");
    WiFi.reconnect();
  }

  delay(500);
}