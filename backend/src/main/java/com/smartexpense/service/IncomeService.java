package com.smartexpense.service;

import com.smartexpense.dto.IncomeRequest;
import com.smartexpense.dto.IncomeResponse;

import java.time.LocalDate;
import java.util.List;

public interface IncomeService {

    List<IncomeResponse> getIncomes(LocalDate startDate, LocalDate endDate, String source, String search);

    IncomeResponse getIncomeById(Long id);

    IncomeResponse createIncome(IncomeRequest request);

    IncomeResponse updateIncome(Long id, IncomeRequest request);

    void deleteIncome(Long id);
}
