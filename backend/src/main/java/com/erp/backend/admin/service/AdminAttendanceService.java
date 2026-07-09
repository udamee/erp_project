package com.erp.backend.admin.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.employee.dto.AbsenceCreateRequestDto;
import com.erp.backend.employee.dto.AttendanceResponseDto;
import com.erp.backend.employee.dto.AttendanceSearchCondition;
import com.erp.backend.employee.dto.AttendanceSummaryDto;
import com.erp.backend.employee.dto.AttendanceUpdateRequestDto;
import com.erp.backend.employee.mapper.AttendanceMapper;
import com.erp.backend.employee.mapper.EmployeeMapper;
import com.erp.backend.employee.util.AttendanceStatus;
import com.erp.backend.employee.util.EmployeeStatus;
import com.erp.backend.employee.vo.AttendanceVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@Service
@Transactional
public class AdminAttendanceService {

    private final AttendanceMapper attendanceMapper;
    private final EmployeeMapper employeeMapper;

    @Transactional(readOnly = true)
    public List<AttendanceResponseDto> search(AttendanceSearchCondition condition) {
        return attendanceMapper.search(condition);
    }

    @Transactional(readOnly = true)
    public List<AttendanceSummaryDto> summarize(AttendanceSearchCondition condition) {
        List<AttendanceSummaryDto> summaries = attendanceMapper.summarize(condition);
        if (condition != null) {
            summaries.forEach(s -> {
                s.setFrom(condition.getFrom());
                s.setTo(condition.getTo());
            });
        }
        return summaries;
    }

    @Transactional(readOnly = true)
    public AttendanceResponseDto getById(Long attendanceId) {
        AttendanceResponseDto dto = attendanceMapper.findById(attendanceId);
        if (dto == null) {
            throw new CustomException(ErrorCode.ATTENDANCE_NOT_FOUND);
        }
        return dto;
    }

    /** 관리자 보정 */
    public void adminUpdateAttendance(Long attendanceId, AttendanceUpdateRequestDto request) {
        if (request.getCheckIn() == null && request.getCheckOut() == null
                && (request.getStatus() == null || request.getStatus().isBlank())
                && request.getMemo() == null) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        AttendanceVO existing = attendanceMapper.findVoById(attendanceId);
        if (existing == null) {
            throw new CustomException(ErrorCode.ATTENDANCE_NOT_FOUND);
        }

        AttendanceVO vo = new AttendanceVO();
        vo.setAttendanceId(attendanceId);
        vo.setCheckIn(request.getCheckIn());
        vo.setCheckOut(request.getCheckOut());
        vo.setStatus(normalizeAttendanceStatus(request.getStatus()));
        vo.setMemo(request.getMemo());

        // 출퇴근이 모두 있으면 근무시간 재계산
        LocalDateTime checkIn = request.getCheckIn() != null ? request.getCheckIn() : existing.getCheckIn();
        LocalDateTime checkOut = request.getCheckOut() != null ? request.getCheckOut() : existing.getCheckOut();
        if (checkIn != null && checkOut != null) {
            validateTimeOrder(checkIn, checkOut);
            vo.setWorkHours(calcWorkHours(checkIn, checkOut));
        }

        int result = attendanceMapper.updateAttendance(vo);
        if (result == 0) {
            throw new CustomException(ErrorCode.ATTENDANCE_NOT_FOUND);
        }
    }

    // 결근/휴가 등록
    public AttendanceResponseDto adminCreateAbsence(AbsenceCreateRequestDto request) {
        validateActiveEmployee(request.getEmpId());
        String status = normalizeAbsenceStatus(request.getStatus());

        if (attendanceMapper.existsByEmpIdAndDate(request.getEmpId(), request.getWorkDate())) {
            throw new CustomException(ErrorCode.ALREADY_CHECKED_IN);
        }

        AttendanceVO vo = new AttendanceVO();
        vo.setEmpId(request.getEmpId());
        vo.setWorkDate(request.getWorkDate());
        vo.setStatus(status); // ABSENT / LEAVE
        vo.setMemo(request.getMemo());
        // check_in/out, work_hours 는 null

        attendanceMapper.insertAttendance(vo);

        return attendanceMapper.findById(vo.getAttendanceId());
    }

    // 근무시간 = 퇴근 - 출근, 시간 단위=소수 2자리까지
    private BigDecimal calcWorkHours(LocalDateTime in, LocalDateTime out) {
        long minutes = Duration.between(in, out).toMinutes();
        return BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private void validateTimeOrder(LocalDateTime checkIn, LocalDateTime checkOut) {
        if (checkOut.isBefore(checkIn)) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
    }

    private String normalizeAttendanceStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return AttendanceStatus.valueOf(status.trim().toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.INVALID_STATUS);
        }
    }

    private String normalizeAbsenceStatus(String status) {
        String normalized = normalizeAttendanceStatus(status);
        if (!AttendanceStatus.ABSENT.name().equals(normalized)
                && !AttendanceStatus.LEAVE.name().equals(normalized)) {
            throw new CustomException(ErrorCode.INVALID_STATUS);
        }
        return normalized;
    }

    private void validateActiveEmployee(Long empId) {
        var employee = employeeMapper.findEmployeeById(empId);
        if (employee == null) {
            throw new CustomException(ErrorCode.EMPLOYEE_NOT_FOUND);
        }
        if (!EmployeeStatus.ACTIVE.name().equals(employee.getStatus())) {
            throw new CustomException(ErrorCode.INVALID_STATUS);
        }
    }
}
