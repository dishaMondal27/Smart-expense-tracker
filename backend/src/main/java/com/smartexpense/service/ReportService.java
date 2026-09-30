package com.smartexpense.service;

import com.smartexpense.dto.ReportResponse;

public interface ReportService {
    ReportResponse getReport(String period);
}
