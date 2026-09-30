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
public class RecurringExpenseResponse {
    private Long id;
    private Long userId;
    private String name;
    private BigDecimal amount;
    private Long categoryId;
    private String categoryName;
    private String frequency;
    private LocalDate nextDueDate;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
