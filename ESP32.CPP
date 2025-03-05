#include <WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "Xiaomi 12";
const char* password = "ljl123456.zly";
const int webSocketPort = 81;

WebSocketsServer webSocket = WebSocketsServer(webSocketPort);

void setup() {
  Serial.begin(115200);

  // 连接到 Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // 启动 WebSocket 服务器
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.print("WebSocket server started on port ");
  Serial.println(webSocketPort);
}

void loop() {
  webSocket.loop();
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
    }
    break;
    case WStype_TEXT:
      Serial.printf("[%u] Received: %s\n", num, payload);
      // 发送接收到的内容
      String response = "Message received: ";
      response += String((char*)payload);
      webSocket.sendTXT(num, response.c_str());
      break;
  }
}