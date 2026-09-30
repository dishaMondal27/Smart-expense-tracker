package com.smartexpense.service;

import com.smartexpense.dto.InsightDto;

import java.util.List;

public interface InsightService {
    List<InsightDto> generateInsights();
}
