package com.erp.backend.employee.mapper;

import com.erp.backend.employee.dto.AttendanceResponseDto;
import com.erp.backend.employee.dto.AttendanceSearchCondition;
import com.erp.backend.employee.dto.AttendanceSummaryDto;
import com.erp.backend.employee.vo.AttendanceVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface AttendanceMapper {
    int insertAttendance(AttendanceVO vo);

    int updateCheckOut(AttendanceVO vo);

    int updateAttendance(AttendanceVO vo);

    boolean existsByEmpIdAndDate(@Param("empId") Long empId, @Param("workDate") LocalDate workDate);

    AttendanceVO findVoByEmpIdAndDate(@Param("empId") Long empId, @Param("workDate") LocalDate workDate);

    AttendanceVO findVoById(@Param("attendanceId") Long attendanceId);

    AttendanceResponseDto findByEmpIdAndDate(@Param("empId") Long empId, @Param("workDate") LocalDate workDate);

    AttendanceResponseDto findById(@Param("attendanceId") Long attendanceId);

    List<AttendanceResponseDto> findByEmpIdAndPeriod(@Param("empId") Long empId,
                                                     @Param("from") LocalDate from,
                                                     @Param("to") LocalDate to);

    List<AttendanceResponseDto> search(AttendanceSearchCondition condition);

    // 본인 기간 집계 (단건)
    AttendanceSummaryDto summarizeByEmpIdAndPeriod(@Param("empId") Long empId,
                                                   @Param("from") LocalDate from,
                                                   @Param("to") LocalDate to);

    // 관리자용 직원별 집계 (조건 검색)
    List<AttendanceSummaryDto> summarize(AttendanceSearchCondition condition);
}

