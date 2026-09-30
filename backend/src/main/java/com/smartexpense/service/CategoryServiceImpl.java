package com.smartexpense.service;

import com.smartexpense.dto.CategoryRequest;
import com.smartexpense.dto.CategoryResponse;
import com.smartexpense.entity.Category;
import com.smartexpense.entity.User;
import com.smartexpense.exception.BadRequestException;
import com.smartexpense.exception.ResourceNotFoundException;
import com.smartexpense.repository.CategoryRepository;
import com.smartexpense.repository.ExpenseRepository;
import com.smartexpense.repository.IncomeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final AuthService authService;

    public static final List<String> DEFAULT_EXPENSE_CATEGORIES = Arrays.asList(
            "Food",
            "Shopping",
            "Transport",
            "Bills",
            "Entertainment",
            "Education",
            "Healthcare",
            "Rent",
            "Travel",
            "Other"
    );

    public static final List<String> DEFAULT_INCOME_CATEGORIES = Arrays.asList(
            "Salary",
            "Freelancing",
            "Scholarship",
            "Business",
            "Gift",
            "Other"
    );

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(String type) {
        User currentUser = authService.getCurrentUser();
        List<Category> categories;

        if (type != null && !type.trim().isEmpty() && !"ALL".equalsIgnoreCase(type.trim())) {
            categories = categoryRepository.findByUserIdOrUserIsNullAndType(currentUser.getId(), type.trim().toUpperCase());
        } else {
            categories = categoryRepository.findByUserIdOrUserIsNull(currentUser.getId());
        }

        return categories.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getExpenseCategories() {
        return getCategories("EXPENSE");
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        User currentUser = authService.getCurrentUser();
        Category category = categoryRepository.findByIdAndUserIdOrUserIsNull(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return mapToResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        User currentUser = authService.getCurrentUser();
        String normalizedName = request.getName().trim();
        String normalizedType = request.getType().trim().toUpperCase();

        if (categoryRepository.existsByUserIdAndNameIgnoreCaseAndType(currentUser.getId(), normalizedName, normalizedType)) {
            throw new BadRequestException("Category '" + normalizedName + "' already exists for " + normalizedType);
        }

        Category category = Category.builder()
                .name(normalizedName)
                .type(normalizedType)
                .user(currentUser)
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Created category '{}' ({}) for user {}", saved.getName(), saved.getType(), currentUser.getEmail());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        User currentUser = authService.getCurrentUser();
        Category category = categoryRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found or you do not have permission to modify it"));

        String normalizedName = request.getName().trim();
        String normalizedType = request.getType().trim().toUpperCase();

        if (!category.getName().equalsIgnoreCase(normalizedName) &&
                categoryRepository.existsByUserIdAndNameIgnoreCaseAndType(currentUser.getId(), normalizedName, normalizedType)) {
            throw new BadRequestException("Category '" + normalizedName + "' already exists for " + normalizedType);
        }

        category.setName(normalizedName);
        category.setType(normalizedType);

        Category updated = categoryRepository.save(category);
        log.info("Updated category ID {} for user {}", updated.getId(), currentUser.getEmail());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        User currentUser = authService.getCurrentUser();
        Category category = categoryRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found or you do not have permission to delete it"));

        // Check if currently used by any expense record
        if (expenseRepository.existsByCategoryId(id)) {
            throw new BadRequestException("Cannot delete category '" + category.getName() + "' because it is currently used by one or more expense records");
        }

        // Check if currently used by any income record
        if (incomeRepository.existsByCategoryId(id)) {
            throw new BadRequestException("Cannot delete category '" + category.getName() + "' because it is currently used by one or more income records");
        }

        categoryRepository.delete(category);
        log.info("Deleted category ID {} for user {}", id, currentUser.getEmail());
    }

    @Override
    @Transactional
    public void createDefaultCategoriesForUser(User user) {
        log.info("Creating default categories for newly registered user: {}", user.getEmail());

        for (String catName : DEFAULT_EXPENSE_CATEGORIES) {
            Category cat = Category.builder()
                    .name(catName)
                    .type("EXPENSE")
                    .user(user)
                    .build();
            categoryRepository.save(cat);
        }

        for (String catName : DEFAULT_INCOME_CATEGORIES) {
            Category cat = Category.builder()
                    .name(catName)
                    .type("INCOME")
                    .user(user)
                    .build();
            categoryRepository.save(cat);
        }
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .build();
    }
}
