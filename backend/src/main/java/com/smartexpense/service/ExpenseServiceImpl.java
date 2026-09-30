package com.smartexpense.service;

import com.smartexpense.dto.ExpenseRequest;
import com.smartexpense.dto.ExpenseResponse;
import com.smartexpense.entity.Category;
import com.smartexpense.entity.Expense;
import com.smartexpense.entity.User;
import com.smartexpense.exception.BadRequestException;
import com.smartexpense.exception.ResourceNotFoundException;
import com.smartexpense.repository.CategoryRepository;
import com.smartexpense.repository.ExpenseRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationService notificationService;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpenses(LocalDate startDate, LocalDate endDate, Long categoryId, String paymentMethod, String search) {
        User currentUser = authService.getCurrentUser();

        Specification<Expense> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Eagerly fetch category and user to prevent N+1 queries when mapping to response
            if (query != null && Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("category", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("user", jakarta.persistence.criteria.JoinType.LEFT);
            }

            // 1. Mandatory user scope
            predicates.add(cb.equal(root.get("user").get("id"), currentUser.getId()));

            // 2. Optional date filters
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), endDate));
            }

            // 3. Optional category filter
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            // 4. Optional payment method filter
            if (paymentMethod != null && !paymentMethod.trim().isEmpty() && !"ALL".equalsIgnoreCase(paymentMethod.trim())) {
                predicates.add(cb.equal(cb.lower(root.get("paymentMethod")), paymentMethod.trim().toLowerCase()));
            }

            // 5. Optional search query (description or notes)
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate descPredicate = cb.like(cb.lower(root.get("description")), pattern);
                Predicate notesPredicate = cb.like(cb.lower(root.get("notes")), pattern);
                predicates.add(cb.or(descPredicate, notesPredicate));
            }

            if (query != null) {
                query.orderBy(cb.desc(root.get("date")), cb.desc(root.get("createdAt")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return expenseRepository.findAll(spec).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseById(Long id) {
        User currentUser = authService.getCurrentUser();
        Expense expense = expenseRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        return mapToResponse(expense);
    }

    @Override
    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request) {
        User currentUser = authService.getCurrentUser();

        validateExpenseRequest(request, currentUser.getId());

        Category category = resolveCategory(request.getCategoryId(), currentUser.getId());

        Expense expense = Expense.builder()
                .user(currentUser)
                .category(category)
                .amount(request.getAmount())
                .description(request.getDescription().trim())
                .date(request.getDate())
                .paymentMethod(request.getPaymentMethod().trim())
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .build();

        Expense saved = expenseRepository.save(expense);
        log.info("Created expense with ID: {} for user: {}", saved.getId(), currentUser.getEmail());

        // Check if this expense pushed budget past 80% or 100%
        notificationService.checkAndTriggerBudgetNotification(currentUser, saved.getDate());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ExpenseResponse updateExpense(Long id, ExpenseRequest request) {
        User currentUser = authService.getCurrentUser();

        Expense expense = expenseRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        validateExpenseRequest(request, currentUser.getId());

        Category category = resolveCategory(request.getCategoryId(), currentUser.getId());

        expense.setCategory(category);
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription().trim());
        expense.setDate(request.getDate());
        expense.setPaymentMethod(request.getPaymentMethod().trim());
        expense.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);

        Expense updated = expenseRepository.save(expense);
        log.info("Updated expense with ID: {} for user: {}", updated.getId(), currentUser.getEmail());

        // Check if updated expense triggered budget threshold
        notificationService.checkAndTriggerBudgetNotification(currentUser, updated.getDate());

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteExpense(Long id) {
        User currentUser = authService.getCurrentUser();

        Expense expense = expenseRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        expenseRepository.delete(expense);
        log.info("Deleted expense with ID: {} for user: {}", id, currentUser.getEmail());
    }

    private void validateExpenseRequest(ExpenseRequest request, Long userId) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }
        if (request.getDate() == null) {
            throw new BadRequestException("Expense date is required");
        }
        if (request.getDate().isAfter(LocalDate.now())) {
            throw new BadRequestException("Expense date cannot be in the future");
        }
    }

    private Category resolveCategory(Long categoryId, Long userId) {
        if (categoryId == null) {
            throw new BadRequestException("Category ID is required");
        }
        return categoryRepository.findByIdAndUserIdOrUserIsNull(categoryId, userId)
                .orElseThrow(() -> new BadRequestException("Category not found or does not belong to the user"));
    }

    private ExpenseResponse mapToResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .userId(expense.getUser().getId())
                .categoryId(expense.getCategory() != null ? expense.getCategory().getId() : null)
                .categoryName(expense.getCategory() != null ? expense.getCategory().getName() : "Uncategorized")
                .amount(expense.getAmount())
                .description(expense.getDescription())
                .date(expense.getDate())
                .paymentMethod(expense.getPaymentMethod())
                .notes(expense.getNotes())
                .createdAt(expense.getCreatedAt())
                .build();
    }
}
