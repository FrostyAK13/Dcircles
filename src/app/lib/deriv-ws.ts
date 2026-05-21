export const APP_ID = '84799';
export const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

export type Tick = {
  quote: number;
  epoch: number;
  id: string;
  symbol: string;
};

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface TickResponse {
  tick?: Tick;
  msg_type: string;
  error?: {
    code: string;
    message: string;
  };
}

export class DerivWS {
  private ws: WebSocket | null = null;
  private onTickCallback: (tick: Tick) => void;
  private onStatusCallback: (status: ConnectionStatus) => void;
  private symbol: string;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(symbol: string, onTick: (tick: Tick) => void, onStatus: (status: ConnectionStatus) => void) {
    this.symbol = symbol;
    this.onTickCallback = onTick;
    this.onStatusCallback = onStatus;
  }

  connect() {
    if (this.ws) this.ws.close();
    
    this.onStatusCallback('connecting');
    this.ws = new WebSocket(DERIV_WS_URL);

    this.ws.onopen = () => {
      this.onStatusCallback('connected');
      this.subscribeToTicks();
    };

    this.ws.onmessage = (event) => {
      const response: TickResponse = JSON.parse(event.data);
      if (response.tick) {
        this.onTickCallback(response.tick);
      }
      if (response.error) {
        console.error('Deriv API Error:', response.error);
        this.onStatusCallback('error');
      }
    };

    this.ws.onclose = () => {
      this.onStatusCallback('disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = () => {
      this.onStatusCallback('error');
    };
  }

  private subscribeToTicks() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ticks: this.symbol,
        subscribe: 1
      }));
    }
  }

  private attemptReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  setSymbol(symbol: string) {
    if (this.symbol === symbol) return;
    this.symbol = symbol;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ forget_all: 'ticks' }));
      this.subscribeToTicks();
    }
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}