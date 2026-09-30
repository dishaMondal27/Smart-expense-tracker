package com.smartexpense.controller;

import com.smartexpense.dto.RecurringExpenseRequest;
import com.smartexpense.dto.RecurringExpenseResponse;
import com.smartexpense.service.RecurringExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recurring-expenses")
@RequiredArgsConstructor
public class RecurringExpenseController {

    private final RecurringExpenseService recurringExpenseService;

    @GetMapping
    public ResponseEntity<List<RecurringExpenseResponse>> getRecurringExpenses() {
        return ResponseEntity.ok(recurringExpenseService.getRecurringExpenses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecurringExpenseResponse> getRecurringExpenseById(@PathVariable Long id) {
        return ResponseEntity.ok(recurringExpenseService.getRecurringExpenseById(id));
    }

    @PostMapping
    public ResponseEntity<RecurringExpenseResponse> createRecurringExpense(
            @Valid @RequestBody RecurringExpenseRequest request
    ) {
        RecurringExpenseResponse created = recurringExpenseService.createRecurringExpense(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringExpenseResponse> updateRecurringExpense(
            @PathVariable Long id,
            @Valid @RequestBody RecurringExpenseRequest request
    ) {
        RecurringExpenseResponse updated = recurringExpenseService.updateRecurringExpense(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteRecurringExpense(@PathVariable Long id) {
        recurringExpenseService.deleteRecurringExpense(id);
        return ResponseEntity.ok(Map.of("message", "Recurring expense deleted successfully", "id", id.toString()));
    }

    /**
     * Manual trigger endpoint for testing and on-demand execution of the recurring expense scheduler.
     */
    @PostMapping("/trigger-job")
    public ResponseEntity<Map<String, Object>> triggerScheduledJob() {
        Map<String, Object> result = recurringExpenseService.processDueRecurringExpenses();
        return ResponseEntity.ok(result);
    }
}
