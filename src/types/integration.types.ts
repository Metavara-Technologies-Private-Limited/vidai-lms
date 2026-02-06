// Integration.types.ts

export interface IntegrationState {
  [key: string]: {
    connected: boolean;
  };
}

export interface IntegrationContextType {
  integrations: IntegrationState;
  handleConnect: (key: string) => void;
  handleDisconnect: (key: string) => void;
}