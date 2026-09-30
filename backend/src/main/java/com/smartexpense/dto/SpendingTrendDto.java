package com.smartexpense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingTrendDto {
    private String label; // e.g. "09:00", "Mon", "Day 12", "Jan"
    private String date;  // YYYY-MM-DD or relevant date string
    private BigDecimal expenses;
    private BigDecimal income;
}
