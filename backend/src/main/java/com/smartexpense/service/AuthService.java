package com.smartexpense.service;

import com.smartexpense.dto.AuthResponse;
import com.smartexpense.dto.LoginRequest;
import com.smartexpense.dto.RegisterRequest;
import com.smartexpense.dto.UserProfileResponse;
import com.smartexpense.entity.User;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    User getCurrentUser();
    UserProfileResponse getCurrentUserProfile();
    UserProfileResponse updateProfilePicture(org.springframework.web.multipart.MultipartFile file);
}
