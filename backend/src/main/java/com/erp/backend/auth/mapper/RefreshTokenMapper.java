package com.erp.backend.auth.mapper;

import java.time.LocalDateTime;

import com.erp.backend.auth.vo.RefreshTokenVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RefreshTokenMapper {

    // refresh token 저장
    void saveRefreshToken(@Param("jwtId") String jwtId, @Param("empId") Long empId,
            @Param("expiresAt") LocalDateTime expiresAt);

    // jwt 토큰 조회
    RefreshTokenVO findByJwtId(String jwtId);

    // jwt 토큰 삭제
    void deleteByJwtId(String jwtId);
}
