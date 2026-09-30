package com.smartexpense.controller;

import com.smartexpense.dto.BudgetRequest;
import com.smartexpense.dto.BudgetResponse;
import com.smartexpense.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping("/current")
    public ResponseEntity<BudgetResponse> getCurrentBudget() {
        return ResponseEntity.ok(budgetService.getCurrentBudget());
    }

    @GetMapping
    public ResponseEntity<BudgetResponse> getBudgetForMonth(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        return ResponseEntity.ok(budgetService.getBudgetForMonth(month, year));
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> setBudget(@Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.setOrUpdateBudget(request));
    }
}
