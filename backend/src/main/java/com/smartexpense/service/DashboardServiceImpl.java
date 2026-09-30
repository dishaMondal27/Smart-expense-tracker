package com.smartexpense.service;

import com.smartexpense.dto.BudgetResponse;
import com.smartexpense.dto.DashboardSummaryResponse;
import com.smartexpense.dto.TransactionDto;
import com.smartexpense.entity.Expense;
import com.smartexpense.entity.Income;
import com.smartexpense.entity.User;
import com.smartexpense.repository.ExpenseRepository;
import com.smartexpense.repository.IncomeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final BudgetService budgetService;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        User currentUser = authService.getCurrentUser();
        Long userId = currentUser.getId();

        // 1. Fetch all expenses and incomes for user
        List<Expense> allExpenses = expenseRepository.findByUserId(userId);
        List<Income> allIncomes = incomeRepository.findByUserId(userId);

        BigDecimal totalExpenses = allExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalIncome = allIncomes.stream()
                .map(Income::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Current balance and savings: totalIncome - totalExpenses
        BigDecimal currentBalance = totalIncome.subtract(totalExpenses);
        BigDecimal savings = currentBalance.compareTo(BigDecimal.ZERO) > 0 ? currentBalance : BigDecimal.ZERO;

        // 2. Fetch current monthly budget & remaining budget
        BudgetResponse currentBudget = budgetService.getCurrentBudget();
        BigDecimal monthlyBudget = currentBudget.getBudgetAmount() != null ? currentBudget.getBudgetAmount() : BigDecimal.ZERO;
        BigDecimal remainingBudget = currentBudget.getRemainingAmount() != null ? currentBudget.getRemainingAmount() : BigDecimal.ZERO;

        // 3. Combine recent transactions (expenses + income), sort by date desc then createdAt desc, limit 5
        List<TransactionDto> transactions = new ArrayList<>();

        for (Expense expense : allExpenses) {
            String catName = expense.getCategory() != null ? expense.getCategory().getName() : "Uncategorized";
            transactions.add(TransactionDto.builder()
                    .id(expense.getId())
                    .type("EXPENSE")
                    .amount(expense.getAmount())
                    .description(expense.getDescription())
                    .category(catName)
                    .paymentMethod(expense.getPaymentMethod())
                    .date(expense.getDate())
                    .createdAt(expense.getCreatedAt())
                    .build());
        }

        for (Income income : allIncomes) {
            transactions.add(TransactionDto.builder()
                    .id(income.getId())
                    .type("INCOME")
                    .amount(income.getAmount())
                    .description(income.getDescription() != null && !income.getDescription().trim().isEmpty()
                            ? income.getDescription()
                            : income.getSource())
                    .category(income.getSource())
                    .paymentMethod("Direct")
                    .date(income.getDate())
                    .createdAt(income.getCreatedAt())
                    .build());
        }

        List<TransactionDto> recentTransactions = transactions.stream()
                .sorted(Comparator.comparing(TransactionDto::getDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TransactionDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .collect(Collectors.toList());

        log.info("Calculated dashboard summary for user: {}. Total Income: {}, Total Expenses: {}, Balance: {}",
                currentUser.getEmail(), totalIncome, totalExpenses, currentBalance);

        return DashboardSummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpenses(totalExpenses)
                .currentBalance(currentBalance)
                .monthlyBudget(monthlyBudget)
                .remainingBudget(remainingBudget)
                .savings(savings)
                .recentTransactions(recentTransactions)
                .build();
    }
}
