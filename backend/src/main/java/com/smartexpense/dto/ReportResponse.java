package com.smartexpense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private String period; // daily, weekly, monthly, yearly
    private String startDate;
    private String endDate;
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal savings;
    private String highestSpendingCategory;
    private Integer transactionCount;
    private BigDecimal averageDailySpending;
    private List<CategoryBreakdownDto> categoryBreakdown;
    private List<SpendingTrendDto> spendingTrends;
}
