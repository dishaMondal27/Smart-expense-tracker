package com.smartexpense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsightDto {
    private String type; // CATEGORY_COMPARISON, HIGHEST_CATEGORY, BUDGET_USAGE, SAVINGS_COMPARISON, WEEKEND_VS_WEEKDAY
    private String title;
    private String message;
    private String severity; // INFO, WARNING, SUCCESS
}
