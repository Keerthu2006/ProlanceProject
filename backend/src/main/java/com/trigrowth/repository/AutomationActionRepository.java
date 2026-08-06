package com.trigrowth.repository;

import com.trigrowth.model.AutomationAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AutomationActionRepository extends JpaRepository<AutomationAction, Long> {

    List<AutomationAction> findByRecommendationId(Long recommendationId);

    List<AutomationAction> findAllByOrderByExecutedAtDesc();
}
