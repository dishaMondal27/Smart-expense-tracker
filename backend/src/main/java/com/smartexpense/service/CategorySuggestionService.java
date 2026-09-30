package com.smartexpense.service;

import com.smartexpense.dto.CategorySuggestionResponse;

public interface CategorySuggestionService {

    /**
     * Suggests an expense category based on keywords in the given description.
     *
     * @param description user input description
     * @return CategorySuggestionResponse with suggested category or null if no match
     */
    CategorySuggestionResponse suggestCategory(String description);
}
