package com.smartexpense.controller;

import com.smartexpense.dto.ReportResponse;
import com.smartexpense.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<ReportResponse> getReport(
            @RequestParam(defaultValue = "monthly") String period
    ) {
        return ResponseEntity.ok(reportService.getReport(period));
    }
}
