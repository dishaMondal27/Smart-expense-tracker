package com.smartexpense.service;

import com.smartexpense.dto.BudgetRequest;
import com.smartexpense.dto.BudgetResponse;

public interface BudgetService {
    BudgetResponse getCurrentBudget();
    BudgetResponse getBudgetForMonth(Integer month, Integer year);
    BudgetResponse setOrUpdateBudget(BudgetRequest request);
}
