export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface CoconutStock {
  id: string;
  quantity: number;
  receivedDate: string;
  source: string;
  status: 'received' | 'peeling' | 'completed';
  createdBy: string;
}

export interface PeelingProcess {
  id: string;
  stockId: string;
  startDate: string;
  endDate?: string;
  peelerName: string;
  quantity: number;
  weightAfter?: number;
  huskQuantity?: number;
  createdBy: string;
}

export interface Sale {
  id: string;
  quantity: number;
  price: number;
  date: string;
  customerName: string;
  createdBy: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
