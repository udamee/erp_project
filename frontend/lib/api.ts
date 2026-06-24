// lib/api.ts
// 백엔드 ApiResponse<T> 구조와 동일한 공통 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// 기본값은 localhost. LAN/다른 환경은 frontend/.env.local 의 NEXT_PUBLIC_API_URL 로 덮어쓴다.
// 예) NEXT_PUBLIC_API_URL=http://192.168.1.190:8080
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
console.log('[API BASE URL]', BASE_URL);

// Access Token 관리 (학습용으로 localStorage 사용)
// Refresh Token은 백엔드가 httpOnly 쿠키(path=/api/auth)로 관리하므로 JS에서 다루지 않는다.
export const tokenStorage = {
  get: () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null),
  set: (token: string) => localStorage.setItem('accessToken', token),
  clear: () => localStorage.removeItem('accessToken'),
};

// 로그인 사용자 정보 (헤더 표시·역할 기반 분기용)
export interface AuthUser {
  empId: number;
  loginId: string;
  empName: string;
  role: string;
  deptId: number;
  deptCode?: string;
}

export const userStorage = {
  set: (u: AuthUser) => {
    localStorage.setItem("authUser", JSON.stringify(u));
    localStorage.setItem("empId", String(u.empId));
    localStorage.setItem("loginId", u.loginId);
    localStorage.setItem("empName", u.empName);
    localStorage.setItem("role", u.role);
    localStorage.setItem("deptId", String(u.deptId));
    if (u.deptCode) {
      localStorage.setItem("deptCode", u.deptCode);
    } else {
      localStorage.removeItem("deptCode");
    }
  },
  get: (): AuthUser | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("authUser");
    if (raw) return JSON.parse(raw) as AuthUser;

    const empId = localStorage.getItem("empId");
    const loginId = localStorage.getItem("loginId");
    const empName = localStorage.getItem("empName");
    const role = localStorage.getItem("role");
    const deptId = localStorage.getItem("deptId");

    if (!empId || !loginId || !empName || !role || !deptId) return null;

    return {
      empId: Number(empId),
      loginId,
      empName,
      role,
      deptId: Number(deptId),
      deptCode: localStorage.getItem("deptCode") ?? undefined,
    };
  },
  clear: () => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("empId");
    localStorage.removeItem("loginId");
    localStorage.removeItem("empName");
    localStorage.removeItem("role");
    localStorage.removeItem("deptId");
    localStorage.removeItem("deptCode");
  },
};

// 로그인/재발급 응답 (백엔드 LoginResponseDto와 매핑 — refreshToken은 쿠키라 body에 없음)
export interface LoginResponse {
  accessToken: string;
  empId: number;
  loginId: string;
  empName: string;
  role: string;
  deptId: number;
  deptCode?: string;
}

// 세션 정리 후 로그인 페이지로 이동
function forceLogout(): void {
  tokenStorage.clear();
  userStorage.clear();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// Access Token 만료 시 1회만 재발급 시도 (동시 401이 몰려도 단일 요청으로 합침)
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include", // refreshToken 쿠키 전송
        });
        if (!res.ok) return null;
        const body: ApiResponse<LoginResponse> = await res.json();
        if (!body.success) return null;
        tokenStorage.set(body.data.accessToken);
        userStorage.set(body.data);
        return body.data.accessToken;
      } catch {
        return null;
      }
    })();
    // 결과와 무관하게 다음 사이클을 위해 초기화
    void refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// 공통 fetch 래퍼: JWT 자동 첨부 + 401 시 토큰 재발급 후 1회 재시도
async function request<T>(
    path: string,
    options: RequestInit = {},
    allowRetry = true,
): Promise<T> {
  const token = tokenStorage.get();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include", // 인증 쿠키(refreshToken 등) 동반
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // 401 = Access Token 만료/없음 → (일반 요청만) 재발급 1회 시도 후 재시도, 실패 시 로그인으로
  // allowRetry=false(로그인 등 인증 API)는 이 분기를 건너뛰어, 아래에서 백엔드 메시지를 그대로 던진다.
  if (res.status === 401 && allowRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, options, false);
    forceLogout();
    throw new Error("인증이 만료되었습니다.");
  }

  // 빈 본문(예: 204, 일부 보안 필터의 거부 응답)에도 res.json()이 터지지 않도록 방어
  const text = await res.text();
  let body: ApiResponse<T> | null = null;
  if (text) {
    try {
      body = JSON.parse(text) as ApiResponse<T>;
    } catch {
      body = null; // JSON이 아니면 무시하고 아래에서 상태코드로 처리
    }
  }

  if (!res.ok) {
    // GlobalExceptionHandler 메시지가 있으면 사용, 없으면 상태코드 노출
    throw new Error(body?.message || `요청 처리 중 오류가 발생했습니다. (HTTP ${res.status})`);
  }
  if (body && !body.success) {
    throw new Error(body.message || "요청 처리 중 오류가 발생했습니다.");
  }
  // 성공인데 본문이 없으면(204 등) data 없음
  return (body ? body.data : undefined) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
      request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
      request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
      request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
};

// ===== 인증 API =====

export interface SignupRequest {
  loginId: string;
  password: string;
  empName: string;
  deptId: number;
  email: string;
  phone: string;
}

export const authApi = {
  // 로그인 실패(401 LOGIN_FAILED)는 refresh 재시도 없이 백엔드 메시지를 그대로 노출해야 하므로 allowRetry=false
  login: (loginId: string, password: string) =>
      request<LoginResponse>(
          "/api/auth/login",
          { method: "POST", body: JSON.stringify({ loginId, password }) },
          false,
      ),
  signup: (data: SignupRequest) => api.post<void>("/api/auth/signup", data),
  // 재발급 실패로 로그인 화면에 튕기지 않도록 refresh 재시도는 비활성화
  logout: () =>
      request<void>("/api/auth/logout", { method: "POST" }, false),
  // 본인 비밀번호 변경
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    checkNewPassword: string;
  }) => api.patch<void>("/api/auth/password", data),
};

// ===== 부서 API (회원가입 폼 등) =====

export interface Department {
  deptId: number;
  deptCode: string;
  deptName: string;
}

export const departmentApi = {
  list: () => api.get<Department[]>("/api/departments"),
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
  totalPage?: number;
}

export interface ProductOption {
  productId: number;
  productCode: string;
  productName: string;
  unit: string;
  standardPurchasePrice: number;
}

export interface ReceivableOrder {
  poId: number;
  supplierName: string;
  requestEmpName: string;
  approveEmpName: string;
  approveDate: string;
  totalAmount: number;
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

export interface Customer {
  customerId: number;
  customerName: string;
  customerType: 'PHARMACY' | 'HOSPITAL';
  businessNo: string | null;
  creditLimit: number;
  receivableBalance: number;
  phone: string | null;
  address: string | null;
  status: string;
}

export interface CustomerInput {
  customerName: string;
  customerType: 'PHARMACY' | 'HOSPITAL';
  businessNo?: string;
  creditLimit?: number;
  phone?: string;
  address?: string;
}

export interface MedicalInst {
  name: string;
  type: 'PHARMACY' | 'HOSPITAL';
  phone: string | null;
  address: string | null;
}

export interface BusinessStatus {
  valid: boolean;
  registered: boolean;
  bStt: string | null;
  taxType: string | null;
}

export const customerApi = {
  list: (customerType?: string, status?: string, keyword?: string) => {
    const params = new URLSearchParams();
    if (customerType) params.set('customerType', customerType);
    if (status) params.set('status', status);
    if (keyword) params.set('keyword', keyword);
    const qs = params.toString();
    return api.get<Customer[]>(`/api/customers${qs ? `?${qs}` : ''}`);
  },
  detail: (customerId: number) => api.get<Customer>(`/api/customers/${customerId}`),
  create: (data: CustomerInput) => api.post<void>('/api/customers', data),
  update: (customerId: number, data: CustomerInput) =>
    api.put<void>(`/api/customers/${customerId}`, data),
  searchPharmacy: (sido?: string, sigungu?: string, name?: string) => {
    const params = new URLSearchParams();
    if (sido) params.set('sido', sido);
    if (sigungu) params.set('sigungu', sigungu);
    if (name) params.set('name', name);
    const qs = params.toString();
    return api.get<MedicalInst[]>(`/api/customers/search/pharmacy${qs ? `?${qs}` : ''}`);
  },
  searchHospital: (sido?: string, sigungu?: string, name?: string) => {
    const params = new URLSearchParams();
    if (sido) params.set('sido', sido);
    if (sigungu) params.set('sigungu', sigungu);
    if (name) params.set('name', name);
    const qs = params.toString();
    return api.get<MedicalInst[]>(`/api/customers/search/hospital${qs ? `?${qs}` : ''}`);
  },
  checkBusiness: (businessNo: string) =>
    api.post<BusinessStatus>('/api/customers/check-business', { businessNo }),
};

export interface RecallDrug {
  productName: string;
  entrpsName: string;
  recallReason: string;
  enforceYn: string;
  commandDate: string;
  itemSeq: string;
  bizrno: string;
  stdCd: string;
  inStock: boolean;
  productId: number | null;
}

export const recallApi = {
  list: (pageNo = 1, numOfRows = 50, onlyInStock = false) => {
    const params = new URLSearchParams();
    params.set('pageNo', String(pageNo));
    params.set('numOfRows', String(numOfRows));
    params.set('onlyInStock', String(onlyInStock));
    return api.get<RecallDrug[]>(`/api/recall-drugs?${params.toString()}`);
  },
};

export interface Product {
  productId: number;
  productCode: string;
  productName: string;
  makerName: string | null;
  unit: string;
  standardPurchasePrice: number;
  standardSalesPrice: number;
  isPrescription: string;
  storageType: string;
  status: string;
  updatedAt: string | null;
}

export interface ProductSearchCondition {
  keyword?: string;
  status?: string;
  isPrescription?: string;
  storageType?: string;
}

export interface ProductSyncResult {
  syncType: string;
  startedAt: string;
  finishedAt: string | null;
  basicTotalCount: number;
  detailTotalCount: number;
  ingredientTotalCount: number;
  basicProcessedCount: number;
  detailProcessedCount: number;
  ingredientProcessedCount: number;
}

export const productApi = {
  list: (cond: ProductSearchCondition = {}) => {
    const params = new URLSearchParams();
    if (cond.keyword) params.set('keyword', cond.keyword);
    if (cond.status) params.set('status', cond.status);
    if (cond.isPrescription) params.set('isPrescription', cond.isPrescription);
    if (cond.storageType) params.set('storageType', cond.storageType);
    const qs = params.toString();
    return api.get<Product[]>(`/api/product${qs ? `?${qs}` : ''}`);
  },
  syncAll: () => api.post<ProductSyncResult>('/api/product/sync/all'),
};

export type EmployeeStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INACTIVE' | 'TERMINATED';
export type RoleCode = 'STAFF' | 'MANAGER' | 'ADMIN';

export interface Employee {
  empId: number;
  loginId: string;
  empName: string;
  phone: string | null;
  email: string | null;
  deptId: number | null;
  deptName: string | null;
  roleCode: RoleCode;
  status: EmployeeStatus;
  hireDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EmployeeSearchCondition {
  deptId?: number;
  empName?: string;
  roleCode?: string;
}

export interface EmployeeCreateInput {
  loginId: string;
  password: string;
  empName: string;
  deptId: number;
  phone?: string;
  email?: string;
  roleCode?: RoleCode;
  status?: 'ACTIVE' | 'INACTIVE';
  hireDate?: string;
}

export const employeeApi = {
  list: (condition: EmployeeSearchCondition = {}) => {
    const params = new URLSearchParams();
    if (condition.deptId) params.set('deptId', String(condition.deptId));
    if (condition.empName) params.set('empName', condition.empName);
    if (condition.roleCode) params.set('roleCode', condition.roleCode);
    const qs = params.toString();
    return api.get<Employee[]>(`/api/employees${qs ? `?${qs}` : ''}`);
  },
  detail: (empId: number) => api.get<Employee>(`/api/employees/${empId}`),
  create: (data: EmployeeCreateInput) => api.post<number>('/api/employees', data),
  me: () => api.get<Employee>('/api/employees/me'),
  updateMyInfo: (data: { phone?: string; email?: string }) =>
    api.put<void>('/api/employees/me', data),
  update: (
    empId: number,
    data: { empName?: string; phone?: string; email?: string; deptId?: number; hireDate?: string },
  ) => api.put<void>(`/api/employees/${empId}`, data),
  updateRole: (empId: number, roleCode: RoleCode) =>
    api.patch<void>(`/api/employees/${empId}/role`, { roleCode }),
  updateStatus: (empId: number, status: 'ACTIVE' | 'INACTIVE') =>
    api.patch<void>(`/api/employees/${empId}/status`, { status }),
  resetPassword: (empId: number, newPassword: string) =>
    api.patch<void>(`/api/employees/${empId}/reset-password`, { newPassword }),
};

export const adminEmployeeApi = {
  pending: () => api.get<Employee[]>('/api/admin/employees/pending'),
  approve: (empId: number) => api.post<void>(`/api/admin/employees/${empId}/approve`),
  reject: (empId: number) => api.post<void>(`/api/admin/employees/${empId}/reject`),
  remove: (empId: number) =>
    request<void>(`/api/admin/employees/${empId}`, { method: 'DELETE' }),
};

export interface Attendance {
  attendanceId: number;
  empId: number;
  empName: string;
  deptName?: string | null;
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  status: string;
  memo: string | null;
}

export const attendanceApi = {
  checkIn: () => api.post<Attendance>('/api/attendance/check-in'),
  checkOut: () => api.patch<Attendance>('/api/attendance/check-out'),
  today: () => api.get<Attendance>('/api/attendance/me/today'),
  myList: (from: string, to: string) =>
    api.get<Attendance[]>(`/api/attendance/me?from=${from}&to=${to}`),
};

export interface AdminAttendanceSearch {
  empId?: number;
  deptId?: number;
  from?: string;
  to?: string;
  status?: string;
}

export const adminAttendanceApi = {
  search: (condition: AdminAttendanceSearch = {}) => {
    const params = new URLSearchParams();
    if (condition.empId) params.set('empId', String(condition.empId));
    if (condition.deptId) params.set('deptId', String(condition.deptId));
    if (condition.from) params.set('from', condition.from);
    if (condition.to) params.set('to', condition.to);
    if (condition.status) params.set('status', condition.status);
    const qs = params.toString();
    return api.get<Attendance[]>(`/api/admin/attendance${qs ? `?${qs}` : ''}`);
  },
  detail: (attendanceId: number) => api.get<Attendance>(`/api/admin/attendance/${attendanceId}`),
  update: (attendanceId: number, data: { checkIn?: string; checkOut?: string; status?: string; memo?: string }) =>
    api.put<void>(`/api/admin/attendance/${attendanceId}`, data),
  createAbsence: (data: { empId: number; workDate: string; status: 'ABSENT' | 'LEAVE'; memo?: string }) =>
    api.post<Attendance>('/api/admin/attendance/absence', data),
};
