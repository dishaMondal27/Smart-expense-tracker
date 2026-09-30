package com.smartexpense.controller;

import com.smartexpense.dto.ExpenseRequest;
import com.smartexpense.dto.ExpenseResponse;
import com.smartexpense.service.CategorySuggestionService;
import com.smartexpense.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final CategorySuggestionService categorySuggestionService;
    private final com.smartexpense.service.ReceiptScanService receiptScanService;

    @PostMapping(value = "/scan-receipt", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<com.smartexpense.dto.ScannedReceiptResponse> scanReceipt(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        com.smartexpense.dto.ScannedReceiptResponse response = receiptScanService.scanReceipt(file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/suggest-category")
    public ResponseEntity<com.smartexpense.dto.CategorySuggestionResponse> suggestCategory(
            @RequestBody com.smartexpense.dto.CategorySuggestionRequest request
    ) {
        String description = request != null ? request.getDescription() : null;
        com.smartexpense.dto.CategorySuggestionResponse response = categorySuggestionService.suggestCategory(description);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String search
    ) {
        List<ExpenseResponse> expenses = expenseService.getExpenses(startDate, endDate, categoryId, paymentMethod, search);
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> getExpenseById(@PathVariable Long id) {
        ExpenseResponse expense = expenseService.getExpenseById(id);
        return ResponseEntity.ok(expense);
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody ExpenseRequest request) {
        ExpenseResponse created = expenseService.createExpense(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request
    ) {
        ExpenseResponse updated = expenseService.updateExpense(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.ok(Map.of("message", "Expense deleted successfully", "id", id.toString()));
    }
}
