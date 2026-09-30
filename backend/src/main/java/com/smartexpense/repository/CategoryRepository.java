package com.smartexpense.repository;

import com.smartexpense.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserId(Long userId);
    List<Category> findByUserIdOrUserIsNull(Long userId);
    List<Category> findByUserIdOrUserIsNullAndType(Long userId, String type);
    List<Category> findByUserIdAndType(Long userId, String type);
    List<Category> findByType(String type);
    Optional<Category> findByIdAndUserIdOrUserIsNull(Long id, Long userId);
    Optional<Category> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndNameIgnoreCaseAndType(Long userId, String name, String type);
}
