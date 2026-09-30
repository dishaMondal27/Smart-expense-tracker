package com.smartexpense.service;

public interface ExportService {

    /**
     * Generates a CSV export of the financial report for the given period.
     *
     * @param period daily, weekly, monthly, yearly
     * @return byte array containing CSV data
     */
    byte[] exportCsv(String period);

    /**
     * Generates a formatted PDF export of the financial report for the given period.
     *
     * @param period daily, weekly, monthly, yearly
     * @return byte array containing PDF data
     */
    byte[] exportPdf(String period);
}
