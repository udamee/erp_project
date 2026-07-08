package com.erp.backend.employee.mapper;

import com.erp.backend.employee.dto.AttendanceResponseDto;
import com.erp.backend.employee.dto.AttendanceSearchCondition;
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

    AttendanceResponseDto findByEmpIdAndDate(@Param("empId") Long empId, @Param("workDate") LocalDate workDate);

    AttendanceResponseDto findById(@Param("attendanceId") Long attendanceId);

    List<AttendanceResponseDto> findByEmpIdAndPeriod(@Param("empId") Long empId,
                                                     @Param("from") LocalDate from,
                                                     @Param("to") LocalDate to);

    List<AttendanceResponseDto> search(AttendanceSearchCondition condition);
}

