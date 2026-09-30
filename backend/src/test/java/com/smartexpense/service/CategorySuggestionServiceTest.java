package com.smartexpense.service;

import com.smartexpense.dto.CategorySuggestionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CategorySuggestionServiceTest {

    private CategorySuggestionService categorySuggestionService;

    @BeforeEach
    void setUp() {
        categorySuggestionService = new CategorySuggestionServiceImpl();
    }

    @Test
    void testFoodKeywords() {
        CategorySuggestionResponse resp1 = categorySuggestionService.suggestCategory("Swiggy lunch delivery");
        assertNotNull(resp1);
        assertEquals("Food", resp1.getSuggestedCategory());

        CategorySuggestionResponse resp2 = categorySuggestionService.suggestCategory("Zomato dinner with friends");
        assertNotNull(resp2);
        assertEquals("Food", resp2.getSuggestedCategory());

        CategorySuggestionResponse resp3 = categorySuggestionService.suggestCategory("Weekly groceries from Blinkit");
        assertNotNull(resp3);
        assertEquals("Food", resp3.getSuggestedCategory());
    }

    @Test
    void testTransportKeywords() {
        CategorySuggestionResponse resp1 = categorySuggestionService.suggestCategory("Uber ride to office");
        assertNotNull(resp1);
        assertEquals("Transport", resp1.getSuggestedCategory());

        CategorySuggestionResponse resp2 = categorySuggestionService.suggestCategory("Ola cab from railway station");
        assertNotNull(resp2);
        assertEquals("Transport", resp2.getSuggestedCategory());

        CategorySuggestionResponse resp3 = categorySuggestionService.suggestCategory("Petrol refill at HP pump");
        assertNotNull(resp3);
        assertEquals("Transport", resp3.getSuggestedCategory());
    }

    @Test
    void testEntertainmentKeywords() {
        CategorySuggestionResponse resp1 = categorySuggestionService.suggestCategory("Netflix monthly subscription");
        assertNotNull(resp1);
        assertEquals("Entertainment", resp1.getSuggestedCategory());

        CategorySuggestionResponse resp2 = categorySuggestionService.suggestCategory("Spotify premium family pack");
        assertNotNull(resp2);
        assertEquals("Entertainment", resp2.getSuggestedCategory());
    }

    @Test
    void testBillsAndShoppingKeywords() {
        CategorySuggestionResponse resp1 = categorySuggestionService.suggestCategory("Amazon orders for new headphones");
        assertNotNull(resp1);
        assertEquals("Shopping", resp1.getSuggestedCategory());

        CategorySuggestionResponse resp2 = categorySuggestionService.suggestCategory("Airtel wifi monthly broadband bill");
        assertNotNull(resp2);
        assertEquals("Bills", resp2.getSuggestedCategory());
    }

    @Test
    void testUnknownKeywords() {
        CategorySuggestionResponse resp = categorySuggestionService.suggestCategory("random mysterious payment XYZ999");
        assertNotNull(resp);
        assertNull(resp.getSuggestedCategory());
    }

    @Test
    void testEmptyDescription() {
        CategorySuggestionResponse resp = categorySuggestionService.suggestCategory("");
        assertNotNull(resp);
        assertNull(resp.getSuggestedCategory());

        CategorySuggestionResponse respNull = categorySuggestionService.suggestCategory(null);
        assertNotNull(respNull);
        assertNull(respNull.getSuggestedCategory());
    }
}
