#include <WiFi.h>
#include <FirebaseESP32.h>

// =============================================
// CONFIGURAÇÕES - PREENCHA AQUI
// =============================================
#define WIFI_SSID     "SEU_WIFI_AQUI"
#define WIFI_PASSWORD "SUA_SENHA_AQUI"

#define FIREBASE_URL  "https://projeto-sisop-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH ""  // deixa vazio pois o banco está em modo de teste

// =============================================
// PINOS DOS LEDs
// =============================================
#define LED_VERDE    26
#define LED_VERMELHO 27

// =============================================
// OBJETOS DO FIREBASE
// =============================================
FirebaseData fbData;
FirebaseConfig config;
FirebaseAuth auth;

String ultimoStatus = "";

void setup() {
  Serial.begin(115200);

  pinMode(LED_VERDE,    OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);

  // Apaga os dois LEDs no início
  digitalWrite(LED_VERDE,    LOW);
  digitalWrite(LED_VERMELHO, LOW);

  // Conecta no Wi-Fi
  Serial.print("Conectando ao Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi conectado! IP: " + WiFi.localIP().toString());

  // Conecta no Firebase
  config.database_url = FIREBASE_URL;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Firebase conectado!");
}

void loop() {
  if (Firebase.ready()) {
    // Lê o campo "fechadura/comando/status" do Firebase
    if (Firebase.getString(fbData, "/fechadura/comando/status")) {
      String status = fbData.stringData();

      // Só age se o status mudou (evita piscar repetido)
      if (status != ultimoStatus) {
        ultimoStatus = status;
        Serial.println("Status recebido: " + status);

        if (status == "sucesso") {
          // Acende LED verde por 3 segundos
          digitalWrite(LED_VERDE,    HIGH);
          digitalWrite(LED_VERMELHO, LOW);
          Serial.println("LED VERDE ligado");
          delay(3000);
          digitalWrite(LED_VERDE, LOW);

        } else if (status == "falha") {
          // Acende LED vermelho por 3 segundos
          digitalWrite(LED_VERDE,    LOW);
          digitalWrite(LED_VERMELHO, HIGH);
          Serial.println("LED VERMELHO ligado");
          delay(3000);
          digitalWrite(LED_VERMELHO, LOW);
        }
      }
    } else {
      Serial.println("Erro ao ler Firebase: " + fbData.errorReason());
    }
  }

  delay(1000); // Verifica o Firebase a cada 1 segundo
}
