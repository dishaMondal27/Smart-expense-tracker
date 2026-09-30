package com.smartexpense.service;

import com.smartexpense.dto.RecurringExpenseRequest;
import com.smartexpense.dto.RecurringExpenseResponse;

import java.util.List;
import java.util.Map;

public interface RecurringExpenseService {
    List<RecurringExpenseResponse> getRecurringExpenses();
    RecurringExpenseResponse getRecurringExpenseById(Long id);
    RecurringExpenseResponse createRecurringExpense(RecurringExpenseRequest request);
    RecurringExpenseResponse updateRecurringExpense(Long id, RecurringExpenseRequest request);
    void deleteRecurringExpense(Long id);
    Map<String, Object> processDueRecurringExpenses();
}
