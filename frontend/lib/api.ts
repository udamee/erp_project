// lib/api.ts
// 백엔드 ApiResponse<T> 구조와 동일한 공통 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://192.168.1.190:8080';
console.log('[API BASE URL]', BASE_URL);

// 토큰 관리 (학습용으로 localStorage 사용)
export const tokenStorage = {
  get: () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null),
  set: (token: string) => localStorage.setItem('accessToken', token),
  clear: () => localStorage.removeItem('accessToken'),
};

// 공통 fetch 래퍼: JWT 자동 첨부 + 에러 처리
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // 401 = 토큰 만료/없음 → 로그인 페이지로
  if (res.status === 401) {
    tokenStorage.clear();
    if (typeof window !== 'undefined') {
      alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
      window.location.href = '/login';
    }
    throw new Error('인증이 만료되었습니다.');
  }

  const body: ApiResponse<T> = await res.json();

  if (!res.ok || !body.success) {
    // GlobalExceptionHandler가 내려주는 message를 그대로 사용
    throw new Error(body.message || '요청 처리 중 오류가 발생했습니다.');
  }
  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
};

// ===== 도메인 타입 (백엔드 DTO와 매핑) =====

export interface PurchaseOrder {
  poId: number;
  supplierId: number;
  supplierName: string;
  supplierPhone: string | null;
  requestEmpName: string;
  approveEmpName: string | null;
  poDate: string;
  approveDate: string | null;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  totalAmount: number;
  memo: string | null;
  details?: PurchaseOrderDetail[];
}

export interface PurchaseOrderDetail {
  poDetailId: number;
  productId: number;
  productCode: string;
  productName: string;
  unit: string;
  orderQty: number;
  unitPrice: number;
  amount: number;
}

export interface ReceivingDetailInput {
  productId: number;
  productName?: string; // 화면 표시용
  orderQty?: number; // 화면 표시용
  lotNo: string;
  expiryDate: string; // yyyy-MM-dd
  receivedQty: number;
  unitPrice: number;
}

// ===== SALES ORDER =======
export interface SalesOrder {
  soId: number;
  customerId: number;
  customerName: string;
  reqEmployeeId: number;
  reqEmployeeName: string;
  appEmployeeId: number;
  appEmployeeName: string;
  orderDate: string;
  approveDate: string;
  status: 'REQUESTED' | 'APPROVED' | 'SHIPPED' | 'CANCELED';
  totalAmount: number;
  memo: string;
  createdAt: string;
  updatedAt: string;
  detailList?: SalesOrderDetail[];
}

export interface SalesOrderDetail {
  soDetailId: number;
  soId: number;
  productId: number;
  orderQty: number;
  unitPrice: number;
  amount: number;
  productName: string;
}

// ======Shipments=====
export interface Shipment {
  shipmentId: number;
  soId: number;
  shippedEmpId: number;
  employeeName: string;
  shipmentDate: string;
  status: string;
  memo?: string;
  createdAt: string;
}

export interface ShipmentDetail {
  shipmentDetailId: number;
  shipmentId: number;
  salesOrderId: number;
  salesOrderDetailId: number;
  customerName: string;
  orderDate: string;
  shipmentDate: string;
  shippedEmpId: string;
  employeeName: string;
  status: string;
  memo: string;
  productName: string;
  inventoryLotId: number;
  lotNo: string;
  expiryDate: string;
  shippedQty: number;
  productId: number;
}

// ======StockMovement=====
export interface StockMovement {
  movementId: number;
  productId: number;
  productName: string;
  inventoryLotId: number;
  lotNo: string;
  movementType: string;
  sourceType: string;
  sourceId: number;
  beforeQty: number;
  qty: number;
  afterQty: number;
  createdAt: string;
}

export interface StockMovementSearchParams {
  productName?: string;
  lotNo?: string;
  movementType?: string;
  sourceType?: string;
  sourceId?: number;
  startDate?: string;
  endDate?: string;
}

export interface ProductStock {
  productId: number;
  productCode: string;
  productName: string;
  availableQty: number;
  safetyQty: number;
  shippableQty: number;
  stockStatus: string;
}

export interface LotStock {
  inventoryLotId: number;
  productId: number;
  productCode: string;
  productName: string;
  lotNo: string;
  expiryDate: string;
  daysLeft: number;
  qty: number;
  location: string;
  status: string;
}

// ======Notifications=====
export interface NotificationMessage {
  notificationId: number;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  receiver: string;
  content: string;
  dateTime: string;
  isRead: boolean;
}

export interface AlertMessage {
  alertId: number;
  receiver: string;
  content: string;
  dateTime: string;
  alertType?: string;
  alertLevel?: 'INFO' | 'WARNING' | 'CRITICAL';
  isRead: boolean;
  productId?: number;
  inventoryLotId?: number;
  productName?: string;
  lotNo?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// ===== API 함수 =====

export const purchaseOrderApi = {
  list: (status?: string, supplierId?: number) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (supplierId) params.set('supplierId', String(supplierId));
    const qs = params.toString();
    return api.get<PurchaseOrder[]>(`/api/purchase-orders${qs ? `?${qs}` : ''}`);
  },
  detail: (poId: number) => api.get<PurchaseOrder>(`/api/purchase-orders/${poId}`),
  suppliers: () => api.get<{ supplierId: number; supplierName: string }[]>('/api/purchase-orders/suppliers'),
  products: () => api.get<Record<string, unknown>[]>('/api/purchase-orders/products'),
  create: (data: {
    supplierId: number;
    memo?: string;
    details: { productId: number; orderQty: number; unitPrice: number }[];
  }) => api.post<number>('/api/purchase-orders', data),
  approve: (poId: number) => api.put<void>(`/api/purchase-orders/${poId}/approve`),
  reject: (poId: number, rejectReason: string) =>
    api.put<void>(`/api/purchase-orders/${poId}/reject`, { rejectReason }),
  listPaging: (status: string, page: number, size = 10) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('size', String(size));
    return api.get<PageResult<PurchaseOrder>>(`/api/purchase-orders/paging?${params}`);
  },
  statusCounts: () => api.get<Record<string, number>>('/api/purchase-orders/status-counts'),
};

export const receivingApi = {
  receivableList: () => api.get<Record<string, unknown>[]>('/api/receivings'),
  detailsByPoId: (poId: number) => api.get<PurchaseOrderDetail[]>(`/api/receivings/${poId}/details`),
  process: (data: { poId: number; memo?: string; details: ReceivingDetailInput[] }) =>
    api.post<void>('/api/receivings', data),
};

export const salesOrderApi = {
  list: (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const qs = params.toString();
    return api.get<SalesOrder[]>(`/api/sales-order${qs ? `?${qs}` : ''}`);
  },
  listPaging: (status: string, page: number, size = 10) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('size', String(size));
    return api.get<PageResult<SalesOrder>>(`/api/sales-order/paging?${params}`);
  },
  statusCount: () => api.get<Record<string, number>>(`/api/sales-order/status-count`),
  detail: (soId: number) => api.get<SalesOrder>(`/api/sales-order/${soId}/details`),
  customers: () => api.get<{ customerId: number; customerName: string }[]>(`/api/sales-order/customers`),
  products: () => api.get<Record<string, unknown>[]>(`/api/sales-order/products`),
  approve: (soId: number, data: { employeeId: number }) => api.patch<void>(`/api/sales-order/${soId}/approve`, data),
  create: (data: {
    customerId: number;
    employeeId: number;
    memo?: string;
    details: { productId: number; orderQty: number }[];
  }) => api.post<number>('/api/sales-order', data),
};

export const shipmentApi = {
  list: (salesOrderId?: number, status?: string, employeeName?: string) => {
    const params = new URLSearchParams();
    if (salesOrderId) params.set('salesOrderId', String(salesOrderId));
    if (status) params.set('status', status);
    if (employeeName) params.set('employeeName', employeeName);
    const qs = params.toString();
    return api.get<Shipment[]>(`/api/shipment${qs ? `?${qs}` : ''}`);
  },
  listPaging: (page: number, size = 10, status?: string, salesOrderId?: number, employeeName?: string) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    if (status) params.set('status', status);
    if (salesOrderId) params.set('salesOrderId', String(salesOrderId));
    if (employeeName) params.set('employeeName', employeeName);
    return api.get<PageResult<Shipment>>(`/api/shipment?${params}`);
  },
  statusCount: () => api.get<Record<string, number>>(`/api/shipment/status-count`),
  detail: (shipmentId: number, status?: string) => {
    const params = new URLSearchParams();
    if (status) {
      params.set('status', status);
    }
    const query = params.toString();
    return api.get<ShipmentDetail[]>(`/api/shipment/${shipmentId}${query ? `?${query}` : ''}`);
  },
  verify: (salesOrderId: number) => api.get<unknown[]>(`/api/shipment/verify/${salesOrderId}`),
  process: (salesOrderId: number, employeeId: number) => {
    const param = new URLSearchParams();
    param.set('salesOrderId', String(salesOrderId));
    param.set('employeeId', String(employeeId));
    return api.post(`/api/shipment/process?${param}`);
  },
};

export const stockMovementApi = {
  search: (data: StockMovementSearchParams) => {
    return api.post<StockMovement[]>(`/api/shipment/stock-movement`, data);
  },
  searchProductList: () => api.get<ProductStock[]>(`/api/shipment/product-stock`),
  searchLotStockList: () => api.get<LotStock[]>(`/api/shipment/lot-stock`),
};

export const alertApi = {
  markRead: (alertId: number, loginId: number) => {
    const param = new URLSearchParams();
    param.set('loginId', String(loginId));
    const qs = param.toString();
    return api.put<void>(`/api/alert/${alertId}${qs ? `?${qs}` : ''}`);
  },
};
