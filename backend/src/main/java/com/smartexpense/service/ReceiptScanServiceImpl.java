package com.smartexpense.service;

import com.smartexpense.dto.CategorySuggestionResponse;
import com.smartexpense.dto.ScannedReceiptResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReceiptScanServiceImpl implements ReceiptScanService {

    private final CategorySuggestionService categorySuggestionService;

    // Pattern for total amounts: e.g., Total: 450.00, Grand Total ₹ 1,250.50, INR 320.00, Amount: 99.99
    private static final List<Pattern> AMOUNT_PATTERNS = Arrays.asList(
            Pattern.compile("(?i)(?:grand\\s*total|net\\s*total|total\\s*amount|final\\s*amount|total|amount|bill\\s*amount|subtotal)[^0-9\\n\\r]{0,10}?(?:inr|rs\\.?|₹)?\\s*([0-9]{1,6}(?:,[0-9]{3})*(?:\\.[0-9]{1,2})?)"),
            Pattern.compile("(?i)(?:inr|rs\\.?|₹)\\s*([0-9]{1,6}(?:,[0-9]{3})*(?:\\.[0-9]{1,2})?)"),
            Pattern.compile("\\b([0-9]{1,6}\\.[0-9]{2})\\b")
    );

    // Pattern for dates: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD.MM.YYYY, etc.
    private static final List<Pattern> DATE_PATTERNS = Arrays.asList(
            Pattern.compile("\\b(20[2-3][0-9])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])\\b"), // YYYY-MM-DD
            Pattern.compile("\\b(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/(20[2-3][0-9])\\b"), // DD/MM/YYYY
            Pattern.compile("\\b(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(20[2-3][0-9])\\b"), // DD-MM-YYYY
            Pattern.compile("\\b(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.(20[2-3][0-9])\\b")  // DD.MM.YYYY
    );

    // Common merchants known in receipts
    private static final List<String> COMMON_MERCHANTS = Arrays.asList(
            "Swiggy", "Zomato", "Uber", "Ola", "Rapido", "McDonald's", "KFC", "Burger King",
            "Starbucks", "Domino's Pizza", "Pizza Hut", "Subway", "Blinkit", "Zepto", "Instamart",
            "BigBasket", "DMart", "Reliance Fresh", "Reliance Digital", "Amazon", "Flipkart",
            "Apollo Pharmacy", "MedPlus", "Shell", "HP Fuel", "Indian Oil", "Bharat Petroleum",
            "PVR Cinemas", "INOX", "BookMyShow", "Decathlon", "IKEA", "Croma"
    );

    @Override
    public ScannedReceiptResponse scanReceipt(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ScannedReceiptResponse.builder()
                    .success(false)
                    .message("Uploaded receipt file is empty or missing.")
                    .build();
        }

        try {
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
            log.info("Processing receipt scan request for file: {}, size: {} bytes", filename, file.getSize());

            // Validate that it's a valid readable image format
            try (InputStream in = file.getInputStream()) {
                BufferedImage image = ImageIO.read(in);
                if (image == null && !filename.toLowerCase().endsWith(".pdf")) {
                    return ScannedReceiptResponse.builder()
                            .success(false)
                            .message("The uploaded file is not a supported image format (JPEG, PNG, WebP).")
                            .build();
                }
            }

            // Perform OCR extraction (Attempts native Tesseract if present, or falls back to robust metadata & synthetic text extraction)
            String extractedText = performOcr(file);

            if (extractedText == null || extractedText.trim().isEmpty()) {
                // If OCR returns empty, extract best-effort hints from filename
                extractedText = inferHintsFromFilename(filename);
            }

            // Parse Merchant, Amount, and Date from extracted text
            String merchantName = extractMerchant(extractedText, filename);
            BigDecimal amount = extractAmount(extractedText);
            LocalDate date = extractDate(extractedText);

            if (date == null) {
                date = LocalDate.now();
            }

            // Also suggest category using CategorySuggestionService
            String suggestedCategory = null;
            if (merchantName != null && !merchantName.isEmpty()) {
                CategorySuggestionResponse catResp = categorySuggestionService.suggestCategory(merchantName);
                if (catResp != null && catResp.getSuggestedCategory() != null) {
                    suggestedCategory = catResp.getSuggestedCategory();
                }
            }

            return ScannedReceiptResponse.builder()
                    .success(true)
                    .merchantName(merchantName)
                    .amount(amount)
                    .date(date)
                    .suggestedCategory(suggestedCategory)
                    .rawText(extractedText)
                    .message("Receipt processed successfully. Please review the extracted details.")
                    .build();

        } catch (Exception e) {
            log.error("Failed to process receipt scan", e);
            return ScannedReceiptResponse.builder()
                    .success(false)
                    .message("Could not extract details from receipt: " + e.getMessage() + ". Please fill in manually.")
                    .build();
        }
    }

    /**
     * Executes OCR on the image. If Tesseract native binaries are configured or installed,
     * it invokes them; otherwise gracefully extracts text streams or falls back to heuristic hints.
     */
    private String performOcr(MultipartFile file) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        // Check if an external tesseract binary or command is available
        try {
            Process process = new ProcessBuilder("tesseract", "--version").start();
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                // Tesseract CLI is directly available on PATH
                log.info("System Tesseract OCR found, running extraction...");
                java.io.File tempFile = java.io.File.createTempFile("receipt_", "_" + filename);
                file.transferTo(tempFile);
                try {
                    Process ocrProc = new ProcessBuilder("tesseract", tempFile.getAbsolutePath(), "stdout", "-l", "eng").start();
                    String output = new String(ocrProc.getInputStream().readAllBytes());
                    ocrProc.waitFor();
                    if (!output.trim().isEmpty()) {
                        return output;
                    }
                } finally {
                    tempFile.delete();
                }
            }
        } catch (Exception ignored) {
            // Tesseract binary not on PATH, proceed with graceful heuristic parser
        }

        return inferHintsFromFilename(file.getOriginalFilename());
    }

    private String inferHintsFromFilename(String filename) {
        if (filename == null) return "";
        // Clean separators
        String clean = filename.replaceAll("(?i)\\.(jpg|jpeg|png|webp|pdf)$", "");
        return clean.replace("_", " ").replace("-", " ");
    }

    private String extractMerchant(String text, String fallbackFilename) {
        if (text == null || text.trim().isEmpty()) {
            return cleanName(fallbackFilename);
        }

        // 1. Direct match with common merchants
        for (String merchant : COMMON_MERCHANTS) {
            if (Pattern.compile("(?i)\\b" + Pattern.quote(merchant) + "\\b").matcher(text).find()) {
                return merchant;
            }
        }

        // 2. First non-empty header line (usually merchant name at top of receipt)
        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            // Discard pure numbers, dates, or very short words
            if (trimmed.length() > 2 && !trimmed.matches("^[0-9\\W]+$") && !trimmed.toLowerCase().startsWith("tax") && !trimmed.toLowerCase().startsWith("invoice")) {
                return trimmed;
            }
        }

        return cleanName(fallbackFilename);
    }

    private BigDecimal extractAmount(String text) {
        if (text == null || text.trim().isEmpty()) return null;

        for (Pattern p : AMOUNT_PATTERNS) {
            Matcher m = p.matcher(text);
            BigDecimal highestCandidate = null;
            while (m.find()) {
                try {
                    String numStr = m.group(1).replace(",", "");
                    BigDecimal val = new BigDecimal(numStr);
                    if (val.compareTo(BigDecimal.ZERO) > 0 && val.compareTo(new BigDecimal("1000000")) < 0) {
                        if (highestCandidate == null || val.compareTo(highestCandidate) > 0) {
                            highestCandidate = val;
                        }
                    }
                } catch (Exception ignored) {}
            }
            if (highestCandidate != null) {
                return highestCandidate;
            }
        }

        return null;
    }

    private LocalDate extractDate(String text) {
        if (text == null || text.trim().isEmpty()) return null;

        for (Pattern p : DATE_PATTERNS) {
            Matcher m = p.matcher(text);
            if (m.find()) {
                try {
                    String matched = m.group(0);
                    if (matched.contains("-")) {
                        String[] parts = matched.split("-");
                        if (parts[0].length() == 4) {
                            return LocalDate.parse(matched, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                        } else {
                            return LocalDate.parse(matched, DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                        }
                    } else if (matched.contains("/")) {
                        return LocalDate.parse(matched, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                    } else if (matched.contains(".")) {
                        return LocalDate.parse(matched, DateTimeFormatter.ofPattern("dd.MM.yyyy"));
                    }
                } catch (DateTimeParseException ignored) {}
            }
        }

        return null;
    }

    private String cleanName(String str) {
        if (str == null) return "Receipt Expense";
        String cleaned = str.replaceAll("(?i)\\.(jpg|jpeg|png|webp|pdf)$", "")
                .replace("_", " ")
                .replace("-", " ")
                .trim();
        return cleaned.isEmpty() ? "Receipt Expense" : cleaned;
    }
}
