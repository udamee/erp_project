// lib/api.ts
// 백엔드 ApiResponse<T> 구조와 동일한 공통 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Access Token 관리 (학습용으로 localStorage 사용)
// Refresh Token은 백엔드가 httpOnly 쿠키(path=/api/auth)로 관리하므로 JS에서 다루지 않는다.
export const tokenStorage = {
  get: () => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null),
  set: (token: string) => localStorage.setItem("accessToken", token),
  clear: () => localStorage.removeItem("accessToken"),
};

// 로그인 사용자 정보 (헤더 표시·역할 기반 분기용)
export interface AuthUser {
  empId: number;
  loginId: string;
  empName: string;
  role: string;
  deptId: number;
}

export const userStorage = {
  set: (u: AuthUser) => localStorage.setItem("authUser", JSON.stringify(u)),
  get: (): AuthUser | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("authUser");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },
  clear: () => localStorage.removeItem("authUser"),
};

// 로그인/재발급 응답 (백엔드 LoginResponseDto와 매핑 — refreshToken은 쿠키라 body에 없음)
export interface LoginResponse {
  accessToken: string;
  empId: number;
  loginId: string;
  empName: string;
  role: string;
  deptId: number;
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
      "Content-Type": "application/json",
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
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";
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
  orderQty?: number;    // 화면 표시용
  lotNo: string;
  expiryDate: string;   // yyyy-MM-dd
  receivedQty: number;
  unitPrice: number;
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
    if (status) params.set("status", status);
    if (supplierId) params.set("supplierId", String(supplierId));
    const qs = params.toString();
    return api.get<PurchaseOrder[]>(`/api/purchase-orders${qs ? `?${qs}` : ""}`);
  },
  detail: (poId: number) => api.get<PurchaseOrder>(`/api/purchase-orders/${poId}`),
  suppliers: () =>
    api.get<{ supplierId: number; supplierName: string }[]>("/api/purchase-orders/suppliers"),
  products: () => api.get<Record<string, unknown>[]>("/api/purchase-orders/products"),
  create: (data: {
    supplierId: number;
    memo?: string;
    details: { productId: number; orderQty: number; unitPrice: number }[];
  }) => api.post<number>("/api/purchase-orders", data),
  approve: (poId: number) => api.put<void>(`/api/purchase-orders/${poId}/approve`),
  reject: (poId: number, rejectReason: string) =>
    api.put<void>(`/api/purchase-orders/${poId}/reject`, { rejectReason }),
  listPaging: (status: string, page: number, size = 10) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    return api.get<PageResult<PurchaseOrder>>(`/api/purchase-orders/paging?${params}`);
  },
  statusCounts: () =>
    api.get<Record<string, number>>("/api/purchase-orders/status-counts"),
};

export const receivingApi = {
  receivableList: () => api.get<Record<string, unknown>[]>("/api/receivings"),
  detailsByPoId: (poId: number) =>
    api.get<PurchaseOrderDetail[]>(`/api/receivings/${poId}/details`),
  process: (data: { poId: number; memo?: string; details: ReceivingDetailInput[] }) =>
    api.post<void>("/api/receivings", data),
};

// ===== 인사(HR) 도메인 =====

export type EmployeeStatus = "PENDING" | "ACTIVE" | "REJECTED" | "INACTIVE" | "TERMINATED";
export type RoleCode = "STAFF" | "MANAGER" | "ADMIN";

// 백엔드 EmployeeResponseDto와 매핑
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

export const employeeApi = {
  // 직원 목록 (DEPT_HR) — 검색 조건은 쿼리스트링
  list: (condition: EmployeeSearchCondition = {}) => {
    const params = new URLSearchParams();
    if (condition.deptId) params.set("deptId", String(condition.deptId));
    if (condition.empName) params.set("empName", condition.empName);
    if (condition.roleCode) params.set("roleCode", condition.roleCode);
    const qs = params.toString();
    return api.get<Employee[]>(`/api/employees${qs ? `?${qs}` : ""}`);
  },
  detail: (empId: number) => api.get<Employee>(`/api/employees/${empId}`),
  // 마이페이지
  me: () => api.get<Employee>("/api/employees/me"),
  updateMyInfo: (data: { phone?: string; email?: string }) =>
    api.put<void>("/api/employees/me", data),

  // ===== ADMIN 전용 계정·권한 관리 =====
  // 직원 정보 수정 (이름/연락처/이메일/부서/입사일)
  update: (
    empId: number,
    data: { empName?: string; phone?: string; email?: string; deptId?: number; hireDate?: string },
  ) => api.put<void>(`/api/employees/${empId}`, data),
  // 역할 변경
  updateRole: (empId: number, roleCode: RoleCode) =>
    api.patch<void>(`/api/employees/${empId}/role`, { roleCode }),
  // 계정 활성/비활성
  updateStatus: (empId: number, status: "ACTIVE" | "INACTIVE") =>
    api.patch<void>(`/api/employees/${empId}/status`, { status }),
  // 비밀번호 초기화
  resetPassword: (empId: number, newPassword: string) =>
    api.patch<void>(`/api/employees/${empId}/reset-password`, { newPassword }),
};

// 사원 승인/거절/삭제 (HR 매니저 + ADMIN) — /api/admin/employees
export const adminEmployeeApi = {
  pending: () => api.get<Employee[]>("/api/admin/employees/pending"),
  approve: (empId: number) => api.post<void>(`/api/admin/employees/${empId}/approve`),
  reject: (empId: number) => api.post<void>(`/api/admin/employees/${empId}/reject`),
  remove: (empId: number) =>
    request<void>(`/api/admin/employees/${empId}`, { method: "DELETE" }),
};

// ===== 근태(Attendance) 도메인 =====

// 백엔드 AttendanceResponseDto와 매핑
export interface Attendance {
  attendanceId: number;
  empId: number;
  empName: string;
  deptName?: string | null; // 관리자 근태 검색에서만 채워짐
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  status: string;
  memo: string | null;
}

export const attendanceApi = {
  checkIn: () => api.post<Attendance>("/api/attendance/check-in"),
  checkOut: () => api.patch<Attendance>("/api/attendance/check-out"),
  today: () => api.get<Attendance>("/api/attendance/me/today"),
  // 기간별 본인 근태 (yyyy-MM-dd)
  myList: (from: string, to: string) =>
    api.get<Attendance[]>(`/api/attendance/me?from=${from}&to=${to}`),
};

// ===== 관리자 근태 (MANAGER·ADMIN) =====

export interface AdminAttendanceSearch {
  empId?: number;
  deptId?: number;
  from?: string; // yyyy-MM-dd
  to?: string;
  status?: string;
}

export const adminAttendanceApi = {
  search: (c: AdminAttendanceSearch = {}) => {
    const p = new URLSearchParams();
    if (c.empId) p.set("empId", String(c.empId));
    if (c.deptId) p.set("deptId", String(c.deptId));
    if (c.from) p.set("from", c.from);
    if (c.to) p.set("to", c.to);
    if (c.status) p.set("status", c.status);
    const qs = p.toString();
    return api.get<Attendance[]>(`/api/admin/attendance${qs ? `?${qs}` : ""}`);
  },
  detail: (attendanceId: number) => api.get<Attendance>(`/api/admin/attendance/${attendanceId}`),
  // 근태 보정 (checkIn/checkOut은 yyyy-MM-ddTHH:mm)
  update: (attendanceId: number, data: { checkIn?: string; checkOut?: string; status?: string; memo?: string }) =>
    api.put<void>(`/api/admin/attendance/${attendanceId}`, data),
  // 결근/휴가 직접 등록
  createAbsence: (data: { empId: number; workDate: string; status: "ABSENT" | "LEAVE"; memo?: string }) =>
    api.post<Attendance>("/api/admin/attendance/absence", data),
};