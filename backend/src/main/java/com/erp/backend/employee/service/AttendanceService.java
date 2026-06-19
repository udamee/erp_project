package com.erp.backend.employee.service;

import com.erp.backend.employee.util.AttendanceStatus;
import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.employee.dto.AttendanceResponseDto;
import com.erp.backend.employee.mapper.AttendanceMapper;
import com.erp.backend.employee.vo.AttendanceVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RequiredArgsConstructor
@Service
@Transactional
public class AttendanceService {
    private final AttendanceMapper attendanceMapper;

    // 근무 기준 시각 (정책)
    private static final LocalTime WORK_START = LocalTime.of(9, 0);
    private static final LocalTime WORK_END = LocalTime.of(18, 0);

    // 출근
    public AttendanceResponseDto checkIn(Long empId) {
        LocalDate today = LocalDate.now();

        // 하루 1건 제약 (DB UNIQUE 와 함께 이중 방어)
        if (attendanceMapper.existsByEmpIdAndDate(empId, today)) {
            throw new CustomException(ErrorCode.ALREADY_CHECKED_IN);
        }

        LocalDateTime now = LocalDateTime.now();

        AttendanceVO vo = new AttendanceVO();
        vo.setEmpId(empId);
        vo.setWorkDate(today);
        vo.setCheckIn(now);
        // 09:00 초과 출근이면 지각
        vo.setStatus(now.toLocalTime().isAfter(WORK_START)
                ? AttendanceStatus.LATE.name()
                : AttendanceStatus.NORMAL.name());

        attendanceMapper.insertAttendance(vo);

        return attendanceMapper.findById(vo.getAttendanceId());
    }

    // 퇴근
    public AttendanceResponseDto checkOut(Long empId) {
        LocalDate today = LocalDate.now();

        AttendanceVO vo = attendanceMapper.findVoByEmpIdAndDate(empId, today);
        if (vo == null || vo.getCheckIn() == null) {
            throw new CustomException(ErrorCode.NOT_CHECKED_IN);
        }
        if (vo.getCheckOut() != null) {
            throw new CustomException(ErrorCode.ALREADY_CHECKED_OUT);
        }

        LocalDateTime now = LocalDateTime.now();
        vo.setCheckOut(now);
        vo.setWorkHours(calcWorkHours(vo.getCheckIn(), now));

        // 18:00 이전 퇴근이고, 지각이 아니었다면 조퇴 처리
        if (now.toLocalTime().isBefore(WORK_END)
                && AttendanceStatus.NORMAL.name().equals(vo.getStatus())) {
            vo.setStatus(AttendanceStatus.EARLY_LEAVE.name());
        }

        attendanceMapper.updateCheckOut(vo);

        return attendanceMapper.findById(vo.getAttendanceId());
    }

    // 직원의 오늘 근태 조회
    @Transactional(readOnly = true)
    public AttendanceResponseDto getToday(Long empId) {
        AttendanceResponseDto dto = attendanceMapper.findByEmpIdAndDate(empId, LocalDate.now());
        if (dto == null) {
            throw new CustomException(ErrorCode.ATTENDANCE_NOT_FOUND);
        }
        return dto;
    }

    //
    @Transactional(readOnly = true)
    public List<AttendanceResponseDto> getMyAttendances(Long empId, LocalDate from, LocalDate to) {
        return attendanceMapper.findByEmpIdAndPeriod(empId, from, to);
    }

    // 근무시간 = 퇴근 - 출근, 시간 단위=소수 2자리까지
    private BigDecimal calcWorkHours(LocalDateTime in, LocalDateTime out) {
        long minutes = Duration.between(in, out).toMinutes();
        return BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }
}
