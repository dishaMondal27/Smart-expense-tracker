package com.smartexpense.service;

import com.smartexpense.dto.BudgetResponse;
import com.smartexpense.dto.InsightDto;
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
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class InsightServiceImpl implements InsightService {

    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final BudgetService budgetService;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public List<InsightDto> generateInsights() {
        User currentUser = authService.getCurrentUser();
        Long userId = currentUser.getId();

        LocalDate today = LocalDate.now();
        YearMonth currentYearMonth = YearMonth.of(today.getYear(), today.getMonth());
        YearMonth prevYearMonth = currentYearMonth.minusMonths(1);

        LocalDate currentStart = currentYearMonth.atDay(1);
        LocalDate currentEnd = currentYearMonth.atEndOfMonth();

        LocalDate prevStart = prevYearMonth.atDay(1);
        LocalDate prevEnd = prevYearMonth.atEndOfMonth();

        // Current Month Expenses & Income
        List<Expense> currentExpenses = expenseRepository.findByUserIdAndDateBetween(userId, currentStart, currentEnd);
        List<Income> currentIncomes = incomeRepository.findByUserIdAndDateBetween(userId, currentStart, currentEnd);

        // Previous Month Expenses & Income
        List<Expense> prevExpenses = expenseRepository.findByUserIdAndDateBetween(userId, prevStart, prevEnd);
        List<Income> prevIncomes = incomeRepository.findByUserIdAndDateBetween(userId, prevStart, prevEnd);

        List<InsightDto> insights = new ArrayList<>();

        // 1. Highest Spending Category this month
        buildHighestCategoryInsight(currentExpenses, insights);

        // 2. Category spending compared to previous month (% change)
        buildCategoryComparisonInsights(currentExpenses, prevExpenses, insights);

        // 3. Budget usage percentage
        buildBudgetUsageInsight(insights);

        // 4. Savings compared to previous month
        buildSavingsComparisonInsight(currentIncomes, currentExpenses, prevIncomes, prevExpenses, insights);

        // 5. Weekend vs weekday average spending
        buildWeekendVsWeekdayInsight(currentExpenses, insights);

        // Fallback friendly message if no data exists
        if (insights.isEmpty()) {
            insights.add(InsightDto.builder()
                    .type("INFO")
                    .title("Getting Started with Insights")
                    .message("Record more income and expense transactions to unlock comparative financial insights and spending habits.")
                    .severity("INFO")
                    .build());
        }

        return insights;
    }

    private void buildHighestCategoryInsight(List<Expense> currentExpenses, List<InsightDto> insights) {
        if (currentExpenses.isEmpty()) return;

        Map<String, BigDecimal> categoryMap = new HashMap<>();
        BigDecimal totalSpent = BigDecimal.ZERO;

        for (Expense exp : currentExpenses) {
            String catName = exp.getCategory() != null ? exp.getCategory().getName() : "General";
            categoryMap.put(catName, categoryMap.getOrDefault(catName, BigDecimal.ZERO).add(exp.getAmount()));
            totalSpent = totalSpent.add(exp.getAmount());
        }

        Map.Entry<String, BigDecimal> topCategory = categoryMap.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);

        if (topCategory != null && totalSpent.compareTo(BigDecimal.ZERO) > 0) {
            double pct = topCategory.getValue()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(totalSpent, 1, RoundingMode.HALF_UP)
                    .doubleValue();

            insights.add(InsightDto.builder()
                    .type("HIGHEST_CATEGORY")
                    .title("Top Spending Category")
                    .message(String.format("'%s' is your highest expenditure this month at ₹%.2f (accounting for %.1f%% of all spending).",
                            topCategory.getKey(), topCategory.getValue(), pct))
                    .severity("INFO")
                    .build());
        }
    }

    private void buildCategoryComparisonInsights(List<Expense> currentExpenses, List<Expense> prevExpenses, List<InsightDto> insights) {
        if (currentExpenses.isEmpty() || prevExpenses.isEmpty()) return;

        Map<String, BigDecimal> currentCatMap = new HashMap<>();
        for (Expense exp : currentExpenses) {
            String catName = exp.getCategory() != null ? exp.getCategory().getName() : "General";
            currentCatMap.put(catName, currentCatMap.getOrDefault(catName, BigDecimal.ZERO).add(exp.getAmount()));
        }

        Map<String, BigDecimal> prevCatMap = new HashMap<>();
        for (Expense exp : prevExpenses) {
            String catName = exp.getCategory() != null ? exp.getCategory().getName() : "General";
            prevCatMap.put(catName, prevCatMap.getOrDefault(catName, BigDecimal.ZERO).add(exp.getAmount()));
        }

        // Find the category with the most significant % increase or decrease
        String significantCat = null;
        double maxChangePct = 0.0;
        boolean isIncrease = true;

        for (Map.Entry<String, BigDecimal> entry : currentCatMap.entrySet()) {
            String cat = entry.getKey();
            BigDecimal currAmt = entry.getValue();
            BigDecimal prevAmt = prevCatMap.get(cat);

            if (prevAmt != null && prevAmt.compareTo(BigDecimal.ZERO) > 0) {
                double change = currAmt.subtract(prevAmt)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(prevAmt, 1, RoundingMode.HALF_UP)
                        .doubleValue();

                if (Math.abs(change) > Math.abs(maxChangePct)) {
                    maxChangePct = change;
                    significantCat = cat;
                    isIncrease = change >= 0;
                }
            }
        }

        if (significantCat != null && Math.abs(maxChangePct) >= 1.0) {
            String action = isIncrease ? "increased" : "decreased";
            String severity = isIncrease ? (maxChangePct > 20 ? "WARNING" : "INFO") : "SUCCESS";
            insights.add(InsightDto.builder()
                    .type("CATEGORY_COMPARISON")
                    .title("Category Trend vs Last Month")
                    .message(String.format("Your '%s' expenses %s by %.1f%% compared with last month.",
                            significantCat, action, Math.abs(maxChangePct)))
                    .severity(severity)
                    .build());
        }
    }

    private void buildBudgetUsageInsight(List<InsightDto> insights) {
        try {
            BudgetResponse budget = budgetService.getCurrentBudget();
            if (budget != null && budget.getBudgetAmount() != null && budget.getBudgetAmount().compareTo(BigDecimal.ZERO) > 0) {
                double pct = budget.getPercentUsed() != null ? budget.getPercentUsed() : 0.0;
                String severity = pct >= 100.0 ? "WARNING" : pct >= 80.0 ? "WARNING" : "SUCCESS";

                String message;
                if (pct >= 100.0) {
                    message = String.format("You have exceeded your monthly budget by %.1f%% (spent ₹%.2f of ₹%.2f).",
                            (pct - 100.0), budget.getSpentAmount(), budget.getBudgetAmount());
                } else if (pct >= 80.0) {
                    message = String.format("You have reached %.1f%% of your monthly budget. Only ₹%.2f remaining.",
                            pct, budget.getRemainingAmount());
                } else {
                    message = String.format("You have used %.1f%% of your monthly budget so far with ₹%.2f remaining.",
                            pct, budget.getRemainingAmount());
                }

                insights.add(InsightDto.builder()
                        .type("BUDGET_USAGE")
                        .title("Monthly Budget Status")
                        .message(message)
                        .severity(severity)
                        .build());
            }
        } catch (Exception e) {
            log.warn("Could not calculate budget usage insight", e);
        }
    }

    private void buildSavingsComparisonInsight(
            List<Income> currentIncomes,
            List<Expense> currentExpenses,
            List<Income> prevIncomes,
            List<Expense> prevExpenses,
            List<InsightDto> insights
    ) {
        BigDecimal currInc = currentIncomes.stream().map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal currExp = currentExpenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal currSavings = currInc.subtract(currExp);

        BigDecimal prevInc = prevIncomes.stream().map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal prevExp = prevExpenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal prevSavings = prevInc.subtract(prevExp);

        if (prevInc.compareTo(BigDecimal.ZERO) > 0 || prevExp.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = currSavings.subtract(prevSavings);
            boolean savedMore = diff.compareTo(BigDecimal.ZERO) >= 0;

            String message;
            if (savedMore) {
                message = String.format("Your net savings this month are ₹%.2f higher compared to last month.", diff);
            } else {
                message = String.format("Your net savings this month are ₹%.2f lower compared to last month.", diff.abs());
            }

            insights.add(InsightDto.builder()
                    .type("SAVINGS_COMPARISON")
                    .title("Savings vs Last Month")
                    .message(message)
                    .severity(savedMore ? "SUCCESS" : "INFO")
                    .build());
        }
    }

    private void buildWeekendVsWeekdayInsight(List<Expense> currentExpenses, List<InsightDto> insights) {
        if (currentExpenses.isEmpty()) return;

        BigDecimal weekendSum = BigDecimal.ZERO;
        int weekendCount = 0;

        BigDecimal weekdaySum = BigDecimal.ZERO;
        int weekdayCount = 0;

        Set<LocalDate> weekendDays = new HashSet<>();
        Set<LocalDate> weekdayDays = new HashSet<>();

        for (Expense exp : currentExpenses) {
            DayOfWeek day = exp.getDate().getDayOfWeek();
            if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
                weekendSum = weekendSum.add(exp.getAmount());
                weekendDays.add(exp.getDate());
            } else {
                weekdaySum = weekdaySum.add(exp.getAmount());
                weekdayDays.add(exp.getDate());
            }
        }

        weekendCount = Math.max(weekendDays.size(), 1);
        weekdayCount = Math.max(weekdayDays.size(), 1);

        if (weekendSum.compareTo(BigDecimal.ZERO) > 0 && weekdaySum.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal avgWeekend = weekendSum.divide(BigDecimal.valueOf(weekendCount), 2, RoundingMode.HALF_UP);
            BigDecimal avgWeekday = weekdaySum.divide(BigDecimal.valueOf(weekdayCount), 2, RoundingMode.HALF_UP);

            String message;
            if (avgWeekend.compareTo(avgWeekday) > 0) {
                BigDecimal diff = avgWeekend.subtract(avgWeekday);
                message = String.format("Your weekend daily spending (avg ₹%.2f) is ₹%.2f higher than your weekday average (₹%.2f).",
                        avgWeekend, diff, avgWeekday);
            } else {
                BigDecimal diff = avgWeekday.subtract(avgWeekend);
                message = String.format("Your weekday daily spending (avg ₹%.2f) is ₹%.2f higher than your weekend average (₹%.2f).",
                        avgWeekday, diff, avgWeekend);
            }

            insights.add(InsightDto.builder()
                    .type("WEEKEND_VS_WEEKDAY")
                    .title("Weekend vs Weekday Spending")
                    .message(message)
                    .severity("INFO")
                    .build());
        }
    }
}
