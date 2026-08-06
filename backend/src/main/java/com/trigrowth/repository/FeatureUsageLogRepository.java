package com.trigrowth.repository;

import com.trigrowth.model.FeatureUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FeatureUsageLogRepository extends JpaRepository<FeatureUsageLog, Long> {

    long countByFeatureKey(String featureKey);

    List<FeatureUsageLog> findByFreelancerId(UUID freelancerId);
}
