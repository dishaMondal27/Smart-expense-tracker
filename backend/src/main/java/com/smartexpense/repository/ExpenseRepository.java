package com.smartexpense.repository;

import com.smartexpense.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.category LEFT JOIN FETCH e.user WHERE e.user.id = :userId")
    List<Expense> findByUserId(@Param("userId") Long userId);

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.category LEFT JOIN FETCH e.user WHERE e.user.id = :userId ORDER BY e.date DESC, e.createdAt DESC")
    List<Expense> findByUserIdOrderByDateDescCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.category LEFT JOIN FETCH e.user WHERE e.id = :id AND e.user.id = :userId")
    Optional<Expense> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.category LEFT JOIN FETCH e.user WHERE e.user.id = :userId AND e.date BETWEEN :startDate AND :endDate")
    List<Expense> findByUserIdAndDateBetween(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.category LEFT JOIN FETCH e.user WHERE e.user.id = :userId AND e.category.id = :categoryId")
    List<Expense> findByUserIdAndCategoryId(@Param("userId") Long userId, @Param("categoryId") Long categoryId);

    boolean existsByCategoryId(Long categoryId);
}
