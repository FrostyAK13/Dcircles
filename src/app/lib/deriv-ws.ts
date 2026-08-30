
export const APP_ID = '84799';
export const DERIV_WS_URL = `wss://api.derivws.com/trading/v1/options/ws/public?app_id=${APP_ID}`;

export type Tick = {
  quote: number;
  epoch: number;
  id: string;
  symbol: string;
};

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface TickResponse {
  tick?: Tick;
  history?: {
    prices: number[];
    times: number[];
  };
  echo_req: {
    ticks_history?: string;
  };
  msg_type: string;
  error?: {
    code: string;
    message: string;
  };
}

export class DerivWS {
  private ws: WebSocket | null = null;
  private onTickCallback: (tick: Tick) => void;
  private onHistoryCallback: (symbol: string, prices: number[]) => void;
  private onStatusCallback: (status: ConnectionStatus) => void;
  private symbols: string[];
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(
    symbols: string | string[], 
    onTick: (tick: Tick) => void, 
    onStatus: (status: ConnectionStatus) => void,
    onHistory: (symbol: string, prices: number[]) => void
  ) {
    this.symbols = Array.isArray(symbols) ? symbols : [symbols];
    this.onTickCallback = onTick;
    this.onStatusCallback = onStatus;
    this.onHistoryCallback = onHistory;
  }

  connect() {
    this.disconnect();
    this.onStatusCallback('connecting');
    
    try {
      this.ws = new WebSocket(DERIV_WS_URL);

      this.ws.onopen = () => {
        this.onStatusCallback('connected');
        this.subscribeAll();
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        const response: TickResponse = JSON.parse(event.data);
        
        if (response.error && Object.keys(response.error).length > 0) {
          // Silent failure handling for production-like dashboard feel
          this.onStatusCallback('error');
          return;
        }

        if (response.msg_type === 'history' && response.history && response.echo_req.ticks_history) {
          this.onHistoryCallback(response.echo_req.ticks_history, response.history.prices);
        }
        
        if (response.msg_type === 'tick' && response.tick) {
          this.onTickCallback(response.tick);
        }
      };

      this.ws.onclose = () => {
        this.onStatusCallback('disconnected');
        this.stopPing();
        this.attemptReconnect();
      };

      this.ws.onerror = () => {
        this.onStatusCallback('error');
      };
    } catch (e) {
      this.onStatusCallback('error');
      this.attemptReconnect();
    }
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ ping: 1 }));
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private subscribeAll() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.symbols.forEach(symbol => {
        this.ws?.send(JSON.stringify({
          ticks_history: symbol,
          style: 'ticks',
          count: 1000,
          end: 'latest',
          subscribe: 1
        }));
      });
    }
  }

  private attemptReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  disconnect() {
    this.stopPing();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }
}
