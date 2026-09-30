package com.smartexpense.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartexpense.dto.IncomeRequest;
import com.smartexpense.dto.RegisterRequest;
import com.smartexpense.repository.ExpenseRepository;
import com.smartexpense.repository.IncomeRepository;
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
class IncomeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private IncomeRepository incomeRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String user1Token;
    private Long user1Id;
    private String user2Token;
    private Long user2Id;

    @BeforeEach
    void setUp() throws Exception {
        incomeRepository.deleteAll();
        expenseRepository.deleteAll();
        userRepository.deleteAll();

        // Register User 1
        RegisterRequest user1 = RegisterRequest.builder()
                .name("Income User One")
                .email("incomeuser1@example.com")
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

        // Register User 2
        RegisterRequest user2 = RegisterRequest.builder()
                .name("Income User Two")
                .email("incomeuser2@example.com")
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
    }

    @Test
    void testCreateIncomeSuccess() throws Exception {
        IncomeRequest request = IncomeRequest.builder()
                .amount(new BigDecimal("75000.00"))
                .source("Salary")
                .date(LocalDate.now())
                .description("Monthly corporate paycheck")
                .build();

        mockMvc.perform(post("/api/income")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.amount").value(75000.00))
                .andExpect(jsonPath("$.source").value("Salary"))
                .andExpect(jsonPath("$.description").value("Monthly corporate paycheck"));
    }

    @Test
    void testCreateIncomeValidationZeroAmount() throws Exception {
        IncomeRequest request = IncomeRequest.builder()
                .amount(new BigDecimal("0.00"))
                .source("Salary")
                .date(LocalDate.now())
                .description("Invalid zero")
                .build();

        mockMvc.perform(post("/api/income")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateIncomeValidationFutureDate() throws Exception {
        IncomeRequest request = IncomeRequest.builder()
                .amount(new BigDecimal("5000.00"))
                .source("Freelancing")
                .date(LocalDate.now().plusDays(3))
                .description("Future income")
                .build();

        mockMvc.perform(post("/api/income")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testIncomeDataScopingBetweenUsers() throws Exception {
        // User 1 creates income
        IncomeRequest request = IncomeRequest.builder()
                .amount(new BigDecimal("12000.00"))
                .source("Freelancing")
                .date(LocalDate.now())
                .description("User 1 Consulting project")
                .build();

        MvcResult createRes = mockMvc.perform(post("/api/income")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long incomeId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asLong();

        // User 1 sees it
        mockMvc.perform(get("/api/income")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].description").value("User 1 Consulting project"));

        // User 2 cannot see it in list
        mockMvc.perform(get("/api/income")
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // User 2 cannot access user 1's income by id
        mockMvc.perform(get("/api/income/" + incomeId)
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isNotFound());

        // User 2 cannot delete user 1's income
        mockMvc.perform(delete("/api/income/" + incomeId)
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateAndDeleteIncome() throws Exception {
        // 1. Create
        IncomeRequest createReq = IncomeRequest.builder()
                .amount(new BigDecimal("2000.00"))
                .source("Gift")
                .date(LocalDate.now())
                .description("Birthday gift")
                .build();

        MvcResult res = mockMvc.perform(post("/api/income")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long incomeId = objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asLong();

        // 2. Update
        IncomeRequest updateReq = IncomeRequest.builder()
                .amount(new BigDecimal("2500.00"))
                .source("Gift")
                .date(LocalDate.now())
                .description("Updated Birthday gift from Aunt")
                .build();

        mockMvc.perform(put("/api/income/" + incomeId)
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(2500.00))
                .andExpect(jsonPath("$.description").value("Updated Birthday gift from Aunt"));

        // 3. Delete
        mockMvc.perform(delete("/api/income/" + incomeId)
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk());

        // 4. Verify gone
        mockMvc.perform(get("/api/income/" + incomeId)
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isNotFound());
    }
}
