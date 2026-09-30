package com.smartexpense.service;

import com.smartexpense.dto.NotificationResponse;
import com.smartexpense.entity.User;

import java.time.LocalDate;
import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getNotifications();
    NotificationResponse markAsRead(Long id);
    void checkAndTriggerBudgetNotification(User user, LocalDate date);
}
