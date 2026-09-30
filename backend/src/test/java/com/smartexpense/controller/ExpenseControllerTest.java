package com.smartexpense.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartexpense.dto.ExpenseRequest;
import com.smartexpense.dto.RegisterRequest;
import com.smartexpense.entity.Category;
import com.smartexpense.entity.User;
import com.smartexpense.repository.CategoryRepository;
import com.smartexpense.repository.ExpenseRepository;
import com.smartexpense.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String user1Token;
    private Long user1Id;
    private String user2Token;
    private Long user2Id;
    private Category testCategory;

    @BeforeEach
    void setUp() throws Exception {
        expenseRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create User 1 and get token
        RegisterRequest user1 = RegisterRequest.builder()
                .name("User One")
                .email("user1@example.com")
                .password("Password123")
                .confirmPassword("Password123")
                .build();

        MvcResult res1 = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user1)))
                .andExpect(status().isCreated())
                .andReturn();

        user1Token = objectMapper.readTree(res1.getResponse().getContentAsString()).get("token").asText();
        user1Id = objectMapper.readTree(res1.getResponse().getContentAsString()).get("id").asLong();

        // 2. Create User 2 and get token
        RegisterRequest user2 = RegisterRequest.builder()
                .name("User Two")
                .email("user2@example.com")
                .password("Password123")
                .confirmPassword("Password123")
                .build();

        MvcResult res2 = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user2)))
                .andExpect(status().isCreated())
                .andReturn();

        user2Token = objectMapper.readTree(res2.getResponse().getContentAsString()).get("token").asText();
        user2Id = objectMapper.readTree(res2.getResponse().getContentAsString()).get("id").asLong();

        // 3. Create a category for user 1
        User u1 = userRepository.findById(user1Id).orElseThrow();
        testCategory = categoryRepository.save(Category.builder()
                .name("Groceries")
                .type("EXPENSE")
                .user(u1)
                .build());
    }

    @Test
    void testCreateExpenseSuccess() throws Exception {
        ExpenseRequest request = ExpenseRequest.builder()
                .amount(new BigDecimal("450.50"))
                .categoryId(testCategory.getId())
                .description("Supermarket shopping")
                .date(LocalDate.now())
                .paymentMethod("UPI")
                .notes("Bought fruits and veggies")
                .build();

        mockMvc.perform(post("/api/expenses")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.amount").value(450.50))
                .andExpect(jsonPath("$.description").value("Supermarket shopping"))
                .andExpect(jsonPath("$.paymentMethod").value("UPI"))
                .andExpect(jsonPath("$.categoryName").value("Groceries"));
    }

    @Test
    void testCreateExpenseValidationFutureDate() throws Exception {
        ExpenseRequest request = ExpenseRequest.builder()
                .amount(new BigDecimal("100.00"))
                .categoryId(testCategory.getId())
                .description("Future item")
                .date(LocalDate.now().plusDays(2))
                .paymentMethod("Cash")
                .build();

        mockMvc.perform(post("/api/expenses")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateExpenseValidationZeroAmount() throws Exception {
        ExpenseRequest request = ExpenseRequest.builder()
                .amount(new BigDecimal("0.00"))
                .categoryId(testCategory.getId())
                .description("Zero amount")
                .date(LocalDate.now())
                .paymentMethod("Cash")
                .build();

        mockMvc.perform(post("/api/expenses")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testDataScopingAcrossUsers() throws Exception {
        // User 1 creates an expense
        ExpenseRequest request = ExpenseRequest.builder()
                .amount(new BigDecimal("1200.00"))
                .categoryId(testCategory.getId())
                .description("User 1 Secret Expense")
                .date(LocalDate.now())
                .paymentMethod("Credit Card")
                .build();

        MvcResult createRes = mockMvc.perform(post("/api/expenses")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long expenseId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asLong();

        // User 1 should see it in list
        mockMvc.perform(get("/api/expenses")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].description").value("User 1 Secret Expense"));

        // User 2 should NOT see user 1's expense
        mockMvc.perform(get("/api/expenses")
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // User 2 cannot access user 1's expense by id
        mockMvc.perform(get("/api/expenses/" + expenseId)
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isNotFound());

        // User 2 cannot delete user 1's expense
        mockMvc.perform(delete("/api/expenses/" + expenseId)
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateAndDeleteExpense() throws Exception {
        // Create
        ExpenseRequest request = ExpenseRequest.builder()
                .amount(new BigDecimal("250.00"))
                .categoryId(testCategory.getId())
                .description("Initial Description")
                .date(LocalDate.now())
                .paymentMethod("Cash")
                .build();

        MvcResult createRes = mockMvc.perform(post("/api/expenses")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long expenseId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asLong();

        // Update
        ExpenseRequest updateReq = ExpenseRequest.builder()
                .amount(new BigDecimal("300.00"))
                .categoryId(testCategory.getId())
                .description("Updated Description")
                .date(LocalDate.now())
                .paymentMethod("UPI")
                .notes("Updated notes")
                .build();

        mockMvc.perform(put("/api/expenses/" + expenseId)
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(300.00))
                .andExpect(jsonPath("$.description").value("Updated Description"))
                .andExpect(jsonPath("$.paymentMethod").value("UPI"));

        // Delete
        mockMvc.perform(delete("/api/expenses/" + expenseId)
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk());

        // Verify deleted
        mockMvc.perform(get("/api/expenses/" + expenseId)
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isNotFound());
    }
}
