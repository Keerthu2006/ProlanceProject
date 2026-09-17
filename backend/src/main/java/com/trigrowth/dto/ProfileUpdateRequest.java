package com.trigrowth.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProfileUpdateRequest(
        String headline,
        String bio,
        BigDecimal hourlyRate,
        List<String> skills,
        String availability,
        String githubUrl,
        String linkedinUrl,
        String portfolioUrl
) {}
