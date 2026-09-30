package com.smartexpense.service;

import com.smartexpense.dto.RecurringExpenseRequest;
import com.smartexpense.dto.RecurringExpenseResponse;
import com.smartexpense.entity.Category;
import com.smartexpense.entity.Expense;
import com.smartexpense.entity.RecurringExpense;
import com.smartexpense.entity.User;
import com.smartexpense.exception.BadRequestException;
import com.smartexpense.exception.ResourceNotFoundException;
import com.smartexpense.repository.CategoryRepository;
import com.smartexpense.repository.ExpenseRepository;
import com.smartexpense.repository.RecurringExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurringExpenseServiceImpl implements RecurringExpenseService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final NotificationService notificationService;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public List<RecurringExpenseResponse> getRecurringExpenses() {
        User currentUser = authService.getCurrentUser();
        return recurringExpenseRepository.findByUserIdOrderByNextDueDateAsc(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RecurringExpenseResponse getRecurringExpenseById(Long id) {
        User currentUser = authService.getCurrentUser();
        RecurringExpense rec = recurringExpenseRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Recurring expense not found with id: " + id));
        return mapToResponse(rec);
    }

    @Override
    @Transactional
    public RecurringExpenseResponse createRecurringExpense(RecurringExpenseRequest request) {
        User currentUser = authService.getCurrentUser();

        Category category = categoryRepository.findByIdAndUserIdOrUserIsNull(request.getCategoryId(), currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Category not found with id: " + request.getCategoryId()));

        String freq = request.getFrequency().trim().toUpperCase();
        if (!"MONTHLY".equals(freq) && !"WEEKLY".equals(freq)) {
            throw new BadRequestException("Frequency must be either 'MONTHLY' or 'WEEKLY'");
        }

        RecurringExpense rec = RecurringExpense.builder()
                .user(currentUser)
                .category(category)
                .amount(request.getAmount())
                .description(request.getName().trim())
                .frequency(freq)
                .startDate(LocalDate.now())
                .nextDueDate(request.getNextDueDate())
                .isActive(true)
                .build();

        RecurringExpense saved = recurringExpenseRepository.save(rec);
        log.info("Created recurring expense ID {} for user {}", saved.getId(), currentUser.getEmail());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public RecurringExpenseResponse updateRecurringExpense(Long id, RecurringExpenseRequest request) {
        User currentUser = authService.getCurrentUser();

        RecurringExpense rec = recurringExpenseRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Recurring expense not found with id: " + id));

        Category category = categoryRepository.findByIdAndUserIdOrUserIsNull(request.getCategoryId(), currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Category not found with id: " + request.getCategoryId()));

        String freq = request.getFrequency().trim().toUpperCase();
        if (!"MONTHLY".equals(freq) && !"WEEKLY".equals(freq)) {
            throw new BadRequestException("Frequency must be either 'MONTHLY' or 'WEEKLY'");
        }

        rec.setDescription(request.getName().trim());
        rec.setAmount(request.getAmount());
        rec.setCategory(category);
        rec.setFrequency(freq);
        rec.setNextDueDate(request.getNextDueDate());

        RecurringExpense updated = recurringExpenseRepository.save(rec);
        log.info("Updated recurring expense ID {} for user {}", updated.getId(), currentUser.getEmail());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteRecurringExpense(Long id) {
        User currentUser = authService.getCurrentUser();
        RecurringExpense rec = recurringExpenseRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Recurring expense not found with id: " + id));

        recurringExpenseRepository.delete(rec);
        log.info("Deleted recurring expense ID {} for user {}", id, currentUser.getEmail());
    }

    /**
     * Daily scheduled cron job: runs every day at 00:00:00 UTC (midnight).
     * Checks for due recurring expenses where nextDueDate <= today,
     * creates corresponding Expense records, and advances nextDueDate.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    @Override
    public Map<String, Object> processDueRecurringExpenses() {
        LocalDate today = LocalDate.now();
        List<RecurringExpense> dueExpenses = recurringExpenseRepository.findByIsActiveTrueAndNextDueDateLessThanEqual(today);

        log.info("Scheduled job running: found {} due recurring expenses to process for date {}", dueExpenses.size(), today);

        int processedCount = 0;

        for (RecurringExpense rec : dueExpenses) {
            // 1. Create matching Expense record
            Expense expense = Expense.builder()
                    .user(rec.getUser())
                    .category(rec.getCategory())
                    .amount(rec.getAmount())
                    .description(rec.getDescription() + " (Auto-Recurring)")
                    .date(rec.getNextDueDate())
                    .paymentMethod("Auto Debit")
                    .notes("Generated automatically from Recurring Expense #" + rec.getId())
                    .build();

            Expense savedExpense = expenseRepository.save(expense);

            // 2. Trigger budget alert check if threshold crossed
            notificationService.checkAndTriggerBudgetNotification(rec.getUser(), savedExpense.getDate());

            // 3. Advance next due date
            LocalDate nextDue;
            if ("WEEKLY".equalsIgnoreCase(rec.getFrequency())) {
                nextDue = rec.getNextDueDate().plusWeeks(1);
            } else {
                nextDue = rec.getNextDueDate().plusMonths(1);
            }
            rec.setNextDueDate(nextDue);
            recurringExpenseRepository.save(rec);

            processedCount++;
            log.info("Processed recurring expense '{}' (ID: {}). Created Expense ID: {}. Advanced next due date to {}.",
                    rec.getDescription(), rec.getId(), savedExpense.getId(), nextDue);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Processed due recurring expenses successfully");
        result.put("processedCount", processedCount);
        result.put("date", today.toString());
        return result;
    }

    private RecurringExpenseResponse mapToResponse(RecurringExpense rec) {
        return RecurringExpenseResponse.builder()
                .id(rec.getId())
                .userId(rec.getUser().getId())
                .name(rec.getDescription())
                .amount(rec.getAmount())
                .categoryId(rec.getCategory() != null ? rec.getCategory().getId() : null)
                .categoryName(rec.getCategory() != null ? rec.getCategory().getName() : "Uncategorized")
                .frequency(rec.getFrequency())
                .nextDueDate(rec.getNextDueDate())
                .isActive(rec.getIsActive())
                .createdAt(rec.getCreatedAt())
                .build();
    }
}
