export interface EngineRun {
  _id: string;
  engine: string;
  tenantId: string;
  input: any;
  output: any;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategyEngine {
  runStrategy(input: any): Promise<any>;
}

export interface CopyEngine {
  runCopy(input: any): Promise<any>;
}
