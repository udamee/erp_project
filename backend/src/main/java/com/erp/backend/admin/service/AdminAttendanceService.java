package com.erp.backend.admin.service;

import com.erp.backend.common.CustomException;
import com.erp.backend.common.ErrorCode;
import com.erp.backend.employee.dto.AbsenceCreateRequestDto;
import com.erp.backend.employee.dto.AttendanceResponseDto;
import com.erp.backend.employee.dto.AttendanceSearchCondition;
import com.erp.backend.employee.dto.AttendanceUpdateRequestDto;
import com.erp.backend.employee.mapper.AttendanceMapper;
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

    @Transactional(readOnly = true)
    public List<AttendanceResponseDto> search(AttendanceSearchCondition condition) {
        return attendanceMapper.search(condition);
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
        AttendanceVO vo = new AttendanceVO();
        vo.setAttendanceId(attendanceId);
        vo.setCheckIn(request.getCheckIn());
        vo.setCheckOut(request.getCheckOut());
        vo.setStatus(request.getStatus());
        vo.setMemo(request.getMemo());

        // 출퇴근이 모두 있으면 근무시간 재계산
        if (request.getCheckIn() != null && request.getCheckOut() != null) {
            vo.setWorkHours(calcWorkHours(request.getCheckIn(), request.getCheckOut()));
        }

        int result = attendanceMapper.updateAttendance(vo);
        if (result == 0) {
            throw new CustomException(ErrorCode.ATTENDANCE_NOT_FOUND);
        }
    }

    // 결근/휴가 등록
    public AttendanceResponseDto adminCreateAbsence(AbsenceCreateRequestDto request) {
        if (attendanceMapper.existsByEmpIdAndDate(request.getEmpId(), request.getWorkDate())) {
            throw new CustomException(ErrorCode.ALREADY_CHECKED_IN);
        }

        AttendanceVO vo = new AttendanceVO();
        vo.setEmpId(request.getEmpId());
        vo.setWorkDate(request.getWorkDate());
        vo.setStatus(request.getStatus()); // ABSENT / LEAVE
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
}
