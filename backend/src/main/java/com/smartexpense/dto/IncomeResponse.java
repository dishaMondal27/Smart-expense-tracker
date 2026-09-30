package com.smartexpense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomeResponse {

    private Long id;
    private Long userId;
    private BigDecimal amount;
    private String source;
    private String description;
    private LocalDate date;
    private LocalDateTime createdAt;
}
