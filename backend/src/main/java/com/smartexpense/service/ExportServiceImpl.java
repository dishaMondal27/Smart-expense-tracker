package com.smartexpense.service;

import com.smartexpense.dto.CategoryBreakdownDto;
import com.smartexpense.dto.ReportResponse;
import com.smartexpense.entity.User;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportServiceImpl implements ExportService {

    private final ReportService reportService;
    private final AuthService authService;

    @Override
    public byte[] exportCsv(String period) {
        ReportResponse report = reportService.getReport(period);
        User currentUser = authService.getCurrentUser();

        StringBuilder csv = new StringBuilder();

        // Header / Metadata
        csv.append("SMART EXPENSE TRACKER - FINANCIAL REPORT\n");
        csv.append("Generated For,").append(escapeCsv(currentUser.getName())).append(" (").append(escapeCsv(currentUser.getEmail())).append(")\n");
        csv.append("Generated At,").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n");
        csv.append("Period,").append(escapeCsv(report.getPeriod())).append("\n");
        csv.append("Date Range,").append(report.getStartDate()).append(" to ").append(report.getEndDate()).append("\n\n");

        // High level summary
        csv.append("--- SUMMARY METRICS ---\n");
        csv.append("Metric,Amount (INR)\n");
        csv.append("Total Income,").append(report.getTotalIncome()).append("\n");
        csv.append("Total Expenses,").append(report.getTotalExpenses()).append("\n");
        csv.append("Net Savings,").append(report.getSavings()).append("\n");
        csv.append("Highest Spending Category,").append(escapeCsv(report.getHighestSpendingCategory())).append("\n");
        csv.append("Total Transactions,").append(report.getTransactionCount()).append("\n");
        csv.append("Average Daily Spending,").append(report.getAverageDailySpending()).append("\n\n");

        // Category breakdown
        csv.append("--- EXPENSE CATEGORY BREAKDOWN ---\n");
        csv.append("Category,Total Amount (INR),Percentage (%)\n");
        if (report.getCategoryBreakdown() != null && !report.getCategoryBreakdown().isEmpty()) {
            for (CategoryBreakdownDto item : report.getCategoryBreakdown()) {
                csv.append(escapeCsv(item.getCategoryName())).append(",")
                        .append(item.getAmount()).append(",")
                        .append(item.getPercentage()).append("%\n");
            }
        } else {
            csv.append("No expenses recorded in this period,0,0%\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public byte[] exportPdf(String period) {
        ReportResponse report = reportService.getReport(period);
        User currentUser = authService.getCurrentUser();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(33, 150, 243));
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, new Color(40, 40, 40));
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font cellBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);

            // Document Header
            Paragraph title = new Paragraph("Smart Expense Tracker - Financial Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(4f);
            document.add(title);

            Paragraph meta = new Paragraph(
                    "User: " + currentUser.getName() + " (" + currentUser.getEmail() + ")  |  Period: "
                            + report.getPeriod().toUpperCase() + " (" + report.getStartDate() + " to " + report.getEndDate() + ")",
                    subTitleFont
            );
            meta.setAlignment(Element.ALIGN_CENTER);
            meta.setSpacingAfter(18f);
            document.add(meta);

            // Section 1: Summary Metrics Table
            Paragraph sec1 = new Paragraph("Financial Summary", sectionFont);
            sec1.setSpacingAfter(8f);
            document.add(sec1);

            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[]{60f, 40f});

            addHeaderCell(summaryTable, "Metric", headerFont, new Color(33, 150, 243));
            addHeaderCell(summaryTable, "Amount / Value", headerFont, new Color(33, 150, 243));

            addRowCell(summaryTable, "Total Income", cellFont);
            addRowCell(summaryTable, "₹ " + report.getTotalIncome(), cellBoldFont);

            addRowCell(summaryTable, "Total Expenses", cellFont);
            addRowCell(summaryTable, "₹ " + report.getTotalExpenses(), cellBoldFont);

            addRowCell(summaryTable, "Net Savings", cellFont);
            addRowCell(summaryTable, "₹ " + report.getSavings(), cellBoldFont);

            addRowCell(summaryTable, "Highest Spending Category", cellFont);
            addRowCell(summaryTable, report.getHighestSpendingCategory(), cellFont);

            addRowCell(summaryTable, "Total Transactions", cellFont);
            addRowCell(summaryTable, String.valueOf(report.getTransactionCount()), cellFont);

            addRowCell(summaryTable, "Average Daily Spending", cellFont);
            addRowCell(summaryTable, "₹ " + report.getAverageDailySpending(), cellFont);

            document.add(summaryTable);

            // Section 2: Category Breakdown Table
            Paragraph sec2 = new Paragraph("Category Spending Breakdown", sectionFont);
            sec2.setSpacingBefore(18f);
            sec2.setSpacingAfter(8f);
            document.add(sec2);

            PdfPTable catTable = new PdfPTable(3);
            catTable.setWidthPercentage(100);
            catTable.setWidths(new float[]{50f, 30f, 20f});

            addHeaderCell(catTable, "Category", headerFont, new Color(63, 81, 181));
            addHeaderCell(catTable, "Total Spent", headerFont, new Color(63, 81, 181));
            addHeaderCell(catTable, "Share (%)", headerFont, new Color(63, 81, 181));

            if (report.getCategoryBreakdown() != null && !report.getCategoryBreakdown().isEmpty()) {
                for (CategoryBreakdownDto item : report.getCategoryBreakdown()) {
                    addRowCell(catTable, item.getCategoryName(), cellFont);
                    addRowCell(catTable, "₹ " + item.getAmount(), cellFont);
                    addRowCell(catTable, item.getPercentage() + "%", cellFont);
                }
            } else {
                PdfPCell emptyCell = new PdfPCell(new Phrase("No expenses recorded for this period.", cellFont));
                emptyCell.setColspan(3);
                emptyCell.setPadding(8);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                catTable.addCell(emptyCell);
            }

            document.add(catTable);

            // Footer note
            Paragraph footer = new Paragraph(
                    "\nGenerated automatically by Smart Expense Tracker on "
                            + LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")),
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY)
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF report", e);
            throw new RuntimeException("Error generating PDF report: " + e.getMessage(), e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(6f);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.addCell(cell);
    }

    private void addRowCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "N/A", font));
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private String escapeCsv(String data) {
        if (data == null) {
            return "";
        }
        String escapedData = data.replaceAll("\\R", " ");
        if (data.contains(",") || data.contains("\"") || data.contains("'")) {
            data = data.replace("\"", "\"\"");
            escapedData = "\"" + data + "\"";
        }
        return escapedData;
    }
}
