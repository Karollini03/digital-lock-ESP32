#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =============================================
// CONFIGURAÇÕES DO WI-FI
// =============================================
#define WIFI_SSID     ""
#define WIFI_PASSWORD "SUA_SENHA_AQUI"

// URL do Firebase pra ler o status
#define FIREBASE_URL "https://projeto-sisop-default-rtdb.firebaseio.com/fechadura/comando/status.json"

// =============================================
// PINOS DOS LEDs
// =============================================
#define LED_VERMELHO 26
#define LED_VERDE    27

String ultimoStatus = "";

void setup() {
  Serial.begin(115200);

  pinMode(LED_VERDE,    OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);

  digitalWrite(LED_VERDE,    LOW);
  digitalWrite(LED_VERMELHO, HIGH);

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
  } else {
    Serial.println("\nFalha ao conectar!");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(FIREBASE_URL);
    int httpCode = http.GET();

    if (httpCode == 200) {
      String payload = http.getString();
      payload.trim();
      // Remove as aspas do JSON tipo: "sucesso" -> sucesso
      payload.replace("\"", "");

      Serial.println("Status lido: " + payload);

      if (payload != ultimoStatus) {
        ultimoStatus = payload;

        if (payload == "sucesso") {
          Serial.println("Abrindo! LED VERDE ligado");
          digitalWrite(LED_VERDE,    HIGH);
          digitalWrite(LED_VERMELHO, LOW);
          delay(3000);
          // Volta pro estado de porta fechada
          digitalWrite(LED_VERDE,    LOW);
          digitalWrite(LED_VERMELHO, HIGH);

        }  else if (payload == "falha") {
          Serial.println("Negado!");
          digitalWrite(LED_VERMELHO, LOW);
          delay(200);
          digitalWrite(LED_VERMELHO, HIGH);
          delay(200);
          digitalWrite(LED_VERMELHO, LOW);
          delay(200);
          digitalWrite(LED_VERMELHO, HIGH); // volta ligado
        }
      }b
    } else {
      Serial.println("Erro HTTP: " + String(httpCode));
    }

    http.end();
  } else {
    Serial.println("Wi-Fi desconectado, reconectando...");
    WiFi.reconnect();
  }

  delay(500);
}
