package com.smartexpense.service;

import com.smartexpense.dto.CategoryRequest;
import com.smartexpense.dto.CategoryResponse;
import com.smartexpense.entity.User;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getCategories(String type);

    List<CategoryResponse> getExpenseCategories();

    CategoryResponse getCategoryById(Long id);

    CategoryResponse createCategory(CategoryRequest request);

    CategoryResponse updateCategory(Long id, CategoryRequest request);

    void deleteCategory(Long id);

    void createDefaultCategoriesForUser(User user);
}
