package com.smartexpense.service;

import com.smartexpense.dto.BudgetRequest;
import com.smartexpense.dto.BudgetResponse;
import com.smartexpense.entity.Budget;
import com.smartexpense.entity.Expense;
import com.smartexpense.entity.User;
import com.smartexpense.exception.BadRequestException;
import com.smartexpense.repository.BudgetRepository;
import com.smartexpense.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public BudgetResponse getCurrentBudget() {
        LocalDate now = LocalDate.now();
        return getBudgetForMonth(now.getMonthValue(), now.getYear());
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetResponse getBudgetForMonth(Integer month, Integer year) {
        User currentUser = authService.getCurrentUser();
        LocalDate now = LocalDate.now();

        int targetMonth = (month != null) ? month : now.getMonthValue();
        int targetYear = (year != null) ? year : now.getYear();

        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndMonthAndYear(
                currentUser.getId(), targetMonth, targetYear
        );

        BigDecimal budgetAmount = budgetOpt.map(Budget::getAmount).orElse(BigDecimal.ZERO);
        Long budgetId = budgetOpt.map(Budget::getId).orElse(null);

        return calculateBudgetMetrics(budgetId, currentUser.getId(), targetMonth, targetYear, budgetAmount);
    }

    @Override
    @Transactional
    public BudgetResponse setOrUpdateBudget(BudgetRequest request) {
        User currentUser = authService.getCurrentUser();
        LocalDate now = LocalDate.now();

        int targetMonth = (request.getMonth() != null) ? request.getMonth() : now.getMonthValue();
        int targetYear = (request.getYear() != null) ? request.getYear() : now.getYear();

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Budget amount must be greater than zero");
        }

        Budget budget = budgetRepository.findByUserIdAndMonthAndYear(currentUser.getId(), targetMonth, targetYear)
                .orElse(Budget.builder()
                        .user(currentUser)
                        .month(targetMonth)
                        .year(targetYear)
                        .build());

        budget.setAmount(request.getAmount());
        Budget savedBudget = budgetRepository.save(budget);

        log.info("Set budget of {} for user {} for month {}/{}",
                savedBudget.getAmount(), currentUser.getEmail(), targetMonth, targetYear);

        return calculateBudgetMetrics(savedBudget.getId(), currentUser.getId(), targetMonth, targetYear, savedBudget.getAmount());
    }

    private BudgetResponse calculateBudgetMetrics(Long budgetId, Long userId, int month, int year, BigDecimal budgetAmount) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startOfMonth = yearMonth.atDay(1);
        LocalDate endOfMonth = yearMonth.atEndOfMonth();

        List<Expense> monthExpenses = expenseRepository.findByUserIdAndDateBetween(userId, startOfMonth, endOfMonth);

        BigDecimal spentAmount = monthExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remainingAmount = budgetAmount.subtract(spentAmount);

        double percentUsed = 0.0;
        if (budgetAmount.compareTo(BigDecimal.ZERO) > 0) {
            percentUsed = spentAmount
                    .multiply(BigDecimal.valueOf(100))
                    .divide(budgetAmount, 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return BudgetResponse.builder()
                .id(budgetId)
                .month(month)
                .year(year)
                .budgetAmount(budgetAmount)
                .spentAmount(spentAmount)
                .remainingAmount(remainingAmount)
                .percentUsed(percentUsed)
                .build();
    }
}
