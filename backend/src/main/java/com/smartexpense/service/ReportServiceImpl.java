package com.smartexpense.service;

import com.smartexpense.dto.CategoryBreakdownDto;
import com.smartexpense.dto.ReportResponse;
import com.smartexpense.dto.SpendingTrendDto;
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
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getReport(String period) {
        User currentUser = authService.getCurrentUser();
        Long userId = currentUser.getId();

        String normalizedPeriod = (period != null && !period.trim().isEmpty())
                ? period.trim().toLowerCase()
                : "monthly";

        LocalDate today = LocalDate.now();
        LocalDate startDate;
        LocalDate endDate = today;

        switch (normalizedPeriod) {
            case "daily":
                startDate = today;
                break;
            case "weekly":
                startDate = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                break;
            case "yearly":
                startDate = LocalDate.of(today.getYear(), Month.JANUARY, 1);
                break;
            case "monthly":
            default:
                normalizedPeriod = "monthly";
                startDate = LocalDate.of(today.getYear(), today.getMonth(), 1);
                break;
        }

        // 1. Fetch expenses and incomes within date range
        List<Expense> expenses = expenseRepository.findByUserIdAndDateBetween(userId, startDate, endDate);
        List<Income> incomes = incomeRepository.findByUserIdAndDateBetween(userId, startDate, endDate);

        // 2. Calculate summary totals
        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalIncome = incomes.stream()
                .map(Income::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal savings = totalIncome.subtract(totalExpenses);

        int transactionCount = expenses.size() + incomes.size();

        long daysCount = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (daysCount < 1) daysCount = 1;

        BigDecimal averageDailySpending = totalExpenses.divide(BigDecimal.valueOf(daysCount), 2, RoundingMode.HALF_UP);

        // 3. Category Breakdown for Expenses
        Map<String, BigDecimal> categoryMap = new HashMap<>();
        for (Expense exp : expenses) {
            String catName = (exp.getCategory() != null && exp.getCategory().getName() != null)
                    ? exp.getCategory().getName()
                    : "Uncategorized";
            categoryMap.put(catName, categoryMap.getOrDefault(catName, BigDecimal.ZERO).add(exp.getAmount()));
        }

        List<CategoryBreakdownDto> categoryBreakdown = new ArrayList<>();
        String highestSpendingCategory = "None";
        BigDecimal maxCategorySpent = BigDecimal.ZERO;

        for (Map.Entry<String, BigDecimal> entry : categoryMap.entrySet()) {
            double pct = 0.0;
            if (totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
                pct = entry.getValue()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(totalExpenses, 2, RoundingMode.HALF_UP)
                        .doubleValue();
            }

            categoryBreakdown.add(CategoryBreakdownDto.builder()
                    .categoryName(entry.getKey())
                    .amount(entry.getValue())
                    .percentage(pct)
                    .build());

            if (entry.getValue().compareTo(maxCategorySpent) > 0) {
                maxCategorySpent = entry.getValue();
                highestSpendingCategory = entry.getKey();
            }
        }

        // Sort categories descending by amount
        categoryBreakdown.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));

        // 4. Generate Spending Trends based on Period
        List<SpendingTrendDto> spendingTrends = buildSpendingTrends(normalizedPeriod, startDate, endDate, expenses, incomes);

        log.info("Generated {} report for user {}: totalIncome={}, totalExpenses={}, highestCategory={}",
                normalizedPeriod, currentUser.getEmail(), totalIncome, totalExpenses, highestSpendingCategory);

        return ReportResponse.builder()
                .period(normalizedPeriod)
                .startDate(startDate.toString())
                .endDate(endDate.toString())
                .totalIncome(totalIncome)
                .totalExpenses(totalExpenses)
                .savings(savings)
                .highestSpendingCategory(highestSpendingCategory)
                .transactionCount(transactionCount)
                .averageDailySpending(averageDailySpending)
                .categoryBreakdown(categoryBreakdown)
                .spendingTrends(spendingTrends)
                .build();
    }

    private List<SpendingTrendDto> buildSpendingTrends(
            String period,
            LocalDate startDate,
            LocalDate endDate,
            List<Expense> expenses,
            List<Income> incomes
    ) {
        List<SpendingTrendDto> trends = new ArrayList<>();

        if ("daily".equals(period)) {
            // Trend for the day: show today
            BigDecimal expSum = expenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal incSum = incomes.stream().map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            trends.add(SpendingTrendDto.builder()
                    .label("Today (" + startDate.toString() + ")")
                    .date(startDate.toString())
                    .expenses(expSum)
                    .income(incSum)
                    .build());
        } else if ("weekly".equals(period)) {
            // Group by day of week Mon -> Sun
            Map<LocalDate, BigDecimal> dailyExp = expenses.stream()
                    .collect(Collectors.groupingBy(Expense::getDate, Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)));
            Map<LocalDate, BigDecimal> dailyInc = incomes.stream()
                    .collect(Collectors.groupingBy(Income::getDate, Collectors.reducing(BigDecimal.ZERO, Income::getAmount, BigDecimal::add)));

            LocalDate d = startDate;
            while (!d.isAfter(endDate)) {
                String dayName = d.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                trends.add(SpendingTrendDto.builder()
                        .label(dayName + " (" + d.getMonthValue() + "/" + d.getDayOfMonth() + ")")
                        .date(d.toString())
                        .expenses(dailyExp.getOrDefault(d, BigDecimal.ZERO))
                        .income(dailyInc.getOrDefault(d, BigDecimal.ZERO))
                        .build());
                d = d.plusDays(1);
            }
        } else if ("monthly".equals(period)) {
            // Group by day of current month: Day 1 -> Day N
            Map<LocalDate, BigDecimal> dailyExp = expenses.stream()
                    .collect(Collectors.groupingBy(Expense::getDate, Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)));
            Map<LocalDate, BigDecimal> dailyInc = incomes.stream()
                    .collect(Collectors.groupingBy(Income::getDate, Collectors.reducing(BigDecimal.ZERO, Income::getAmount, BigDecimal::add)));

            LocalDate d = startDate;
            while (!d.isAfter(endDate)) {
                trends.add(SpendingTrendDto.builder()
                        .label("Day " + d.getDayOfMonth())
                        .date(d.toString())
                        .expenses(dailyExp.getOrDefault(d, BigDecimal.ZERO))
                        .income(dailyInc.getOrDefault(d, BigDecimal.ZERO))
                        .build());
                d = d.plusDays(1);
            }
        } else if ("yearly".equals(period)) {
            // Group by Month: Jan -> Dec
            Map<Integer, BigDecimal> monthlyExp = new HashMap<>();
            Map<Integer, BigDecimal> monthlyInc = new HashMap<>();

            for (Expense exp : expenses) {
                int m = exp.getDate().getMonthValue();
                monthlyExp.put(m, monthlyExp.getOrDefault(m, BigDecimal.ZERO).add(exp.getAmount()));
            }
            for (Income inc : incomes) {
                int m = inc.getDate().getMonthValue();
                monthlyInc.put(m, monthlyInc.getOrDefault(m, BigDecimal.ZERO).add(inc.getAmount()));
            }

            int currentYear = startDate.getYear();
            int maxMonth = (currentYear == LocalDate.now().getYear()) ? LocalDate.now().getMonthValue() : 12;

            for (int m = 1; m <= maxMonth; m++) {
                String mName = Month.of(m).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                trends.add(SpendingTrendDto.builder()
                        .label(mName)
                        .date(LocalDate.of(currentYear, m, 1).toString())
                        .expenses(monthlyExp.getOrDefault(m, BigDecimal.ZERO))
                        .income(monthlyInc.getOrDefault(m, BigDecimal.ZERO))
                        .build());
            }
        }

        return trends;
    }
}
