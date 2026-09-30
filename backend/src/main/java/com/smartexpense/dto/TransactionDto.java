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
public class TransactionDto {
    private Long id;
    private String type; // "EXPENSE" or "INCOME"
    private BigDecimal amount;
    private String description;
    private String category; // category name for expense, source for income
    private String paymentMethod; // payment method for expense, "Direct" or null for income
    private LocalDate date;
    private LocalDateTime createdAt;
}
