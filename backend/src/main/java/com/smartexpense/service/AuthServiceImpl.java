package com.smartexpense.service;

import com.smartexpense.dto.AuthResponse;
import com.smartexpense.dto.LoginRequest;
import com.smartexpense.dto.RegisterRequest;
import com.smartexpense.dto.UserProfileResponse;
import com.smartexpense.entity.User;
import com.smartexpense.exception.BadRequestException;
import com.smartexpense.exception.ResourceNotFoundException;
import com.smartexpense.repository.CategoryRepository;
import com.smartexpense.repository.UserRepository;
import com.smartexpense.security.CustomUserDetails;
import com.smartexpense.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    private static final List<String> DEFAULT_EXPENSE_CATEGORIES = Arrays.asList(
            "Food", "Shopping", "Transport", "Bills", "Entertainment",
            "Education", "Healthcare", "Rent", "Travel", "Other"
    );

    private static final List<String> DEFAULT_INCOME_CATEGORIES = Arrays.asList(
            "Salary", "Freelancing", "Scholarship", "Business", "Gift", "Other"
    );

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // 1. Validate password confirmation
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // 2. Validate email uniqueness
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email address already exists");
        }

        // 3. Create user with hashed password
        User user = User.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new user with ID: {} and email: {}", savedUser.getId(), savedUser.getEmail());

        // 4. Auto-create default categories for this user
        for (String catName : DEFAULT_EXPENSE_CATEGORIES) {
            categoryRepository.save(com.smartexpense.entity.Category.builder()
                    .name(catName)
                    .type("EXPENSE")
                    .user(savedUser)
                    .build());
        }
        for (String catName : DEFAULT_INCOME_CATEGORIES) {
            categoryRepository.save(com.smartexpense.entity.Category.builder()
                    .name(catName)
                    .type("INCOME")
                    .user(savedUser)
                    .build());
        }

        // 5. Generate JWT token
        String token = jwtTokenProvider.generateTokenFromEmail(savedUser.getEmail(), savedUser.getId());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(authentication);

        log.info("User logged in successfully: {}", normalizedEmail);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(userDetails.getId())
                .name(userDetails.getName())
                .email(userDetails.getEmail())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new ResourceNotFoundException("No authenticated user found in current security context");
        }

        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userDetails.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        User user = getCurrentUser();
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profilePictureUrl(user.getProfilePictureUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfilePicture(org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file provided for upload.");
        }

        // Validate max size (2MB = 2 * 1024 * 1024 bytes)
        long maxSizeBytes = 2 * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("File size exceeds 2MB limit.");
        }

        // Validate MIME type / extension (JPEG, PNG, WEBP)
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equalsIgnoreCase("image/jpeg")
                || contentType.equalsIgnoreCase("image/png")
                || contentType.equalsIgnoreCase("image/webp"))) {
            throw new IllegalArgumentException("Invalid file format. Only JPG, PNG, and WEBP images are allowed.");
        }

        try {
            // Save to dedicated uploads directory on disk
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads");
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalFilename != null && originalFilename.lastIndexOf(".") != -1) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            } else if (contentType.contains("png")) {
                extension = ".png";
            } else if (contentType.contains("webp")) {
                extension = ".webp";
            }

            User user = getCurrentUser();
            String filename = "user_" + user.getId() + "_" + System.currentTimeMillis() + extension;
            java.nio.file.Path targetPath = uploadDir.resolve(filename);

            java.nio.file.Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + filename;
            user.setProfilePictureUrl(fileUrl);
            userRepository.save(user);

            log.info("Profile picture updated on disk for user ID: {}, saved as: {}", user.getId(), fileUrl);

            return UserProfileResponse.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .profilePictureUrl(user.getProfilePictureUrl())
                    .createdAt(user.getCreatedAt())
                    .build();
        } catch (java.io.IOException e) {
            log.error("Failed to save uploaded profile image file to disk", e);
            throw new RuntimeException("Failed to process profile image upload.", e);
        }
    }
}
