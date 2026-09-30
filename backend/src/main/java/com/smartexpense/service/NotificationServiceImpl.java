package com.smartexpense.service;

import com.smartexpense.dto.NotificationResponse;
import com.smartexpense.entity.Budget;
import com.smartexpense.entity.Expense;
import com.smartexpense.entity.Notification;
import com.smartexpense.entity.User;
import com.smartexpense.exception.ResourceNotFoundException;
import com.smartexpense.repository.BudgetRepository;
import com.smartexpense.repository.ExpenseRepository;
import com.smartexpense.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications() {
        User currentUser = authService.getCurrentUser();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long id) {
        User currentUser = authService.getCurrentUser();
        Notification notification = notificationRepository.findById(id)
                .filter(n -> n.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        notification.setIsRead(true);
        Notification updated = notificationRepository.save(notification);
        log.info("Marked notification ID {} as read for user {}", id, currentUser.getEmail());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void checkAndTriggerBudgetNotification(User user, LocalDate date) {
        if (date == null || user == null) return;

        int month = date.getMonthValue();
        int year = date.getYear();

        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndMonthAndYear(user.getId(), month, year);
        if (budgetOpt.isEmpty() || budgetOpt.get().getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal budgetAmount = budgetOpt.get().getAmount();

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startOfMonth = yearMonth.atDay(1);
        LocalDate endOfMonth = yearMonth.atEndOfMonth();

        List<Expense> monthExpenses = expenseRepository.findByUserIdAndDateBetween(user.getId(), startOfMonth, endOfMonth);
        BigDecimal spentAmount = monthExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double percentUsed = spentAmount
                .multiply(BigDecimal.valueOf(100))
                .divide(budgetAmount, 2, RoundingMode.HALF_UP)
                .doubleValue();

        String monthName = date.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        if (percentUsed >= 100.0) {
            String title = "Budget Exceeded for " + monthName + " " + year;
            String message = String.format("You have spent ₹%.2f (%.1f%% of your ₹%.2f budget). You have exceeded your budget by ₹%.2f!",
                    spentAmount, percentUsed, budgetAmount, spentAmount.subtract(budgetAmount));

            createNotificationIfNotExists(user, "BUDGET_EXCEEDED", title, message);
        } else if (percentUsed >= 80.0) {
            String title = "Budget Warning for " + monthName + " " + year;
            String message = String.format("You have reached %.1f%% of your monthly budget (₹%.2f of ₹%.2f spent). Only ₹%.2f remaining.",
                    percentUsed, spentAmount, budgetAmount, budgetAmount.subtract(spentAmount));

            createNotificationIfNotExists(user, "BUDGET_WARNING", title, message);
        }
    }

    private void createNotificationIfNotExists(User user, String type, String title, String message) {
        // Fetch recent notifications to prevent spamming duplicate unread notifications with the same title
        List<Notification> existing = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        boolean alreadyNotified = existing.stream()
                .anyMatch(n -> n.getType().equals(type) && n.getTitle().equalsIgnoreCase(title));

        if (!alreadyNotified) {
            Notification notification = Notification.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);
            log.info("Triggered {} notification for user {}: {}", type, user.getEmail(), title);
        }
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
