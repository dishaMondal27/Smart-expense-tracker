package com.smartexpense.service;

import com.smartexpense.dto.ScannedReceiptResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ReceiptScanService {

    /**
     * Scans an uploaded receipt image or document and extracts merchant name, amount, and date.
     *
     * @param file uploaded receipt image
     * @return ScannedReceiptResponse with extracted expense fields
     */
    ScannedReceiptResponse scanReceipt(MultipartFile file);
}
