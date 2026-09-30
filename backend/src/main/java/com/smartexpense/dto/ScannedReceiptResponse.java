package com.smartexpense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScannedReceiptResponse {
    private String merchantName;
    private BigDecimal amount;
    private LocalDate date;
    private String rawText;
    private String suggestedCategory;
    private boolean success;
    private String message;
}
