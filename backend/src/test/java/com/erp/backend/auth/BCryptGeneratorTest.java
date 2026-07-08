package com.erp.backend.auth;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BCryptGeneratorTest {

    @Test
    void generate() {
        String raw = "admin1234";
        System.out.println("HASH = " + new BCryptPasswordEncoder().encode(raw));
    }
}
