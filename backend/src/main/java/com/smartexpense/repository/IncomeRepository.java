package com.smartexpense.repository;

import com.smartexpense.entity.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface IncomeRepository extends JpaRepository<Income, Long>, JpaSpecificationExecutor<Income> {

    @Query("SELECT i FROM Income i LEFT JOIN FETCH i.user WHERE i.user.id = :userId")
    List<Income> findByUserId(@Param("userId") Long userId);

    @Query("SELECT i FROM Income i LEFT JOIN FETCH i.user WHERE i.user.id = :userId ORDER BY i.date DESC, i.createdAt DESC")
    List<Income> findByUserIdOrderByDateDescCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT i FROM Income i LEFT JOIN FETCH i.user WHERE i.id = :id AND i.user.id = :userId")
    Optional<Income> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT i FROM Income i LEFT JOIN FETCH i.user WHERE i.user.id = :userId AND i.date BETWEEN :startDate AND :endDate")
    List<Income> findByUserIdAndDateBetween(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT i FROM Income i LEFT JOIN FETCH i.user WHERE i.user.id = :userId AND i.category.id = :categoryId")
    List<Income> findByUserIdAndCategoryId(@Param("userId") Long userId, @Param("categoryId") Long categoryId);

    boolean existsByCategoryId(Long categoryId);
}
