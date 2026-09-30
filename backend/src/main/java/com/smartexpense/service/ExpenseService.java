package com.smartexpense.service;

import com.smartexpense.dto.ExpenseRequest;
import com.smartexpense.dto.ExpenseResponse;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseService {

    List<ExpenseResponse> getExpenses(LocalDate startDate, LocalDate endDate, Long categoryId, String paymentMethod, String search);

    ExpenseResponse getExpenseById(Long id);

    ExpenseResponse createExpense(ExpenseRequest request);

    ExpenseResponse updateExpense(Long id, ExpenseRequest request);

    void deleteExpense(Long id);
}
