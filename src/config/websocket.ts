export const getWebSocketConfig = () => ({
  port: parseInt(process.env.WS_PORT || '3000'),
  heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'),
  maxPayloadSize: parseInt(process.env.WS_MAX_PAYLOAD_SIZE || '1048576'), // 1MB
}); 