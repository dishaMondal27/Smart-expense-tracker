package com.smartexpense.service;

import com.smartexpense.dto.CategorySuggestionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
@Slf4j
public class CategorySuggestionServiceImpl implements CategorySuggestionService {

    /**
     * Internal data structure to hold keyword mapping rules.
     * Category -> List of keywords / patterns.
     */
    private static final Map<String, List<String>> KEYWORD_CATEGORY_MAP = new LinkedHashMap<>();

    static {
        // Food & Dining
        KEYWORD_CATEGORY_MAP.put("Food", Arrays.asList(
                "swiggy", "zomato", "restaurant", "cafe", "coffee", "starbucks", "mcdonalds", "kfc",
                "burger", "pizza", "dominos", "subway", "dinner", "lunch", "breakfast", "groceries",
                "grocery", "supermarket", "dmart", "blinkit", "zepto", "instamart", "bigbasket",
                "bakery", "chai", "tea", "snack", "fruits", "vegetables", "milk"
        ));

        // Transport & Commute
        KEYWORD_CATEGORY_MAP.put("Transport", Arrays.asList(
                "uber", "ola", "rapido", "metro", "bus", "train", "flight", "airways",
                "indigo", "spicejet", "air india", "petrol", "diesel", "fuel", "gas station",
                "parking", "toll", "fastag", "taxi", "cab", "auto", "railway", "irctc"
        ));

        // Entertainment & Subscriptions
        KEYWORD_CATEGORY_MAP.put("Entertainment", Arrays.asList(
                "netflix", "spotify", "prime video", "hotstar", "disney", "youtube", "cinema",
                "movie", "bookmyshow", "pvr", "inox", "theatre", "concert", "game", "gaming",
                "steam", "playstation", "xbox", "hulu", "apple music", "audible"
        ));

        // Shopping & Retail
        KEYWORD_CATEGORY_MAP.put("Shopping", Arrays.asList(
                "amazon", "flipkart", "myntra", "ajio", "zara", "h&m", "nykaa", "meesho",
                "clothing", "clothes", "shoes", "mall", "electronics", "gadget", "croma",
                "reliance digital", "tata cliq", "ikea"
        ));

        // Bills & Utilities
        KEYWORD_CATEGORY_MAP.put("Bills", Arrays.asList(
                "electricity", "water bill", "wifi", "broadband", "airtel", "jio", "vi",
                "vodafone", "recharge", "gas bill", "utility", "postpaid", "prepaid",
                "maintenance", "dth", "tata play"
        ));

        // Healthcare & Medical
        KEYWORD_CATEGORY_MAP.put("Healthcare", Arrays.asList(
                "pharmacy", "medicine", "apollo", "1mg", "pharmeasy", "doctor", "clinic",
                "hospital", "dentist", "medical", "diagnostic", "lab test", "health checkup"
        ));

        // Education & Learning
        KEYWORD_CATEGORY_MAP.put("Education", Arrays.asList(
                "coursera", "udemy", "course", "tuition", "books", "bookstore", "exam fee",
                "school", "college", "university", "seminar", "training", "edx"
        ));

        // Rent & Housing
        KEYWORD_CATEGORY_MAP.put("Rent", Arrays.asList(
                "rent", "house rent", "apartment rent", "flat rent", "landlord", "brokerage"
        ));

        // Travel & Holidays
        KEYWORD_CATEGORY_MAP.put("Travel", Arrays.asList(
                "hotel", "airbnb", "makemytrip", "goibibo", "booking.com", "resort", "trip",
                "vacation", "holiday", "tour", "visa fee", "luggage", "agoda"
        ));
    }

    @Override
    public CategorySuggestionResponse suggestCategory(String description) {
        if (description == null || description.trim().isEmpty()) {
            return CategorySuggestionResponse.builder()
                    .suggestedCategory(null)
                    .matchedKeyword(null)
                    .build();
        }

        String normalizedDesc = description.trim().toLowerCase();

        for (Map.Entry<String, List<String>> entry : KEYWORD_CATEGORY_MAP.entrySet()) {
            String category = entry.getKey();
            List<String> keywords = entry.getValue();

            for (String kw : keywords) {
                // Word boundary check or substring match for keywords
                String patternString = "\\b" + Pattern.quote(kw.toLowerCase()) + "\\b";
                Pattern pattern = Pattern.compile(patternString, Pattern.CASE_INSENSITIVE);
                if (pattern.matcher(normalizedDesc).find()) {
                    log.debug("Matched keyword '{}' to category '{}' for description: '{}'", kw, category, description);
                    return CategorySuggestionResponse.builder()
                            .suggestedCategory(category)
                            .matchedKeyword(kw)
                            .build();
                }
            }
        }

        // Secondary pass: direct substring match for compound brand names (e.g. "air india", "prime video")
        for (Map.Entry<String, List<String>> entry : KEYWORD_CATEGORY_MAP.entrySet()) {
            String category = entry.getKey();
            for (String kw : entry.getValue()) {
                if (normalizedDesc.contains(kw.toLowerCase())) {
                    log.debug("Substring matched keyword '{}' to category '{}' for description: '{}'", kw, category, description);
                    return CategorySuggestionResponse.builder()
                            .suggestedCategory(category)
                            .matchedKeyword(kw)
                            .build();
                }
            }
        }

        return CategorySuggestionResponse.builder()
                .suggestedCategory(null)
                .matchedKeyword(null)
                .build();
    }
}
