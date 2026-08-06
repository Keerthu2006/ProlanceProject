package com.trigrowth.service;

import com.trigrowth.model.FeatureUsageLog;
import com.trigrowth.model.FreelancerProfile;
import com.trigrowth.model.User;
import com.trigrowth.dto.ProfileUpdateRequest;
import com.trigrowth.repository.FeatureUsageLogRepository;
import com.trigrowth.repository.FreelancerProfileRepository;
import com.trigrowth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FreelancerProfileService {

    private final FreelancerProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final FeatureUsageLogRepository featureUsageLogRepository;
    private final EventCollectorService eventCollectorService;

    @Transactional
    public FreelancerProfile getMyProfile(UUID userId) {
        return profileRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));
            FreelancerProfile profile = FreelancerProfile.builder()
                    .user(user)
                    .build();
            return profileRepository.save(profile);
        });
    }

    @Transactional
    public FreelancerProfile updateProfile(UUID userId, ProfileUpdateRequest request) {
        FreelancerProfile profile = getMyProfile(userId);
        profile.setHeadline(request.headline());
        profile.setBio(request.bio());
        profile.setHourlyRate(request.hourlyRate());
        if (request.skills() != null) {
            profile.setSkills(request.skills());
        }
        profile.setAvailability(request.availability());
        return profileRepository.save(profile);
    }

    public List<FreelancerProfile> getAllFreelancers() {
        return profileRepository.findAll();
    }

    public FreelancerProfile getProfileById(Long id) {
        return profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Freelancer profile not found: " + id));
    }

    @Transactional
    public void logFeatureUsage(UUID userId, String key) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        FeatureUsageLog usageLog = FeatureUsageLog.builder()
                .freelancer(user)
                .featureKey(key)
                .build();
        featureUsageLogRepository.save(usageLog);
        log.debug("Feature usage logged: user={} key={}", userId, key);

        // Emit FEATURE_UNUSED event if adoption rate < 10%
        long totalFreelancers = userRepository.count();
        long usageCount = featureUsageLogRepository.countByFeatureKey(key);
        if (totalFreelancers > 0 && (double) usageCount / totalFreelancers < 0.10) {
            try {
                eventCollectorService.emit("FEATURE_UNUSED", "FEATURE", null,
                        Map.of("featureKey", key,
                               "usageCount", String.valueOf(usageCount),
                               "totalFreelancers", String.valueOf(totalFreelancers)));
            } catch (Exception e) {
                log.warn("Failed to emit FEATURE_UNUSED event for key {}", key, e);
            }
        }
    }
}
