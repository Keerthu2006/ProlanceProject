package com.trigrowth.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.List;

public record ProjectRequest(
        @NotBlank String title,
        String description,
        BigDecimal budgetMin,
        BigDecimal budgetMax,
        List<String> skillsRequired,
        Integer durationDays,
        String projectType,
        Integer teamSize,
        Integer numberOfMilestones,
        java.time.Instant dueDate
) {}
