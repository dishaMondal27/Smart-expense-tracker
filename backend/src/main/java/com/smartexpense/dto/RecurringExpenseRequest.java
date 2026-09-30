package com.smartexpense.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public class RecurringExpenseRequest {

    @NotBlank(message = "Name/Description is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Category is required")
    private Long categoryId;

    @NotBlank(message = "Frequency is required")
    @Pattern(regexp = "(?i)^(MONTHLY|WEEKLY)$", message = "Frequency must be either 'MONTHLY' or 'WEEKLY'")
    private String frequency;

    @NotNull(message = "Next due date is required")
    private LocalDate nextDueDate;

    private String paymentMethod; // Cash, UPI, Credit Card, Debit Card, Net Banking, Other
}
