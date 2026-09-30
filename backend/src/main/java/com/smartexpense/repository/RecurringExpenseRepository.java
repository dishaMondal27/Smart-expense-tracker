package com.smartexpense.repository;

import com.smartexpense.entity.RecurringExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, Long> {

    @Query("SELECT r FROM RecurringExpense r LEFT JOIN FETCH r.category LEFT JOIN FETCH r.user WHERE r.user.id = :userId ORDER BY r.nextDueDate ASC")
    List<RecurringExpense> findByUserIdOrderByNextDueDateAsc(@Param("userId") Long userId);

    @Query("SELECT r FROM RecurringExpense r LEFT JOIN FETCH r.category LEFT JOIN FETCH r.user WHERE r.user.id = :userId AND r.isActive = true")
    List<RecurringExpense> findByUserIdAndIsActiveTrue(@Param("userId") Long userId);

    @Query("SELECT r FROM RecurringExpense r LEFT JOIN FETCH r.category LEFT JOIN FETCH r.user WHERE r.id = :id AND r.user.id = :userId")
    Optional<RecurringExpense> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT r FROM RecurringExpense r LEFT JOIN FETCH r.category LEFT JOIN FETCH r.user WHERE r.isActive = true AND r.nextDueDate <= :dueDate")
    List<RecurringExpense> findByIsActiveTrueAndNextDueDateLessThanEqual(@Param("dueDate") LocalDate dueDate);
}
