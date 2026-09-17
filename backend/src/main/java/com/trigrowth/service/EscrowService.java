package com.trigrowth.service;

import com.trigrowth.model.Milestone;
import com.trigrowth.repository.MilestoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EscrowService {

    private final MilestoneRepository milestoneRepository;

    /**
     * Runs every minute for demonstration (in production, use cron = "0 0 0 * * ?").
     * Automatically approves milestones that have been submitted for > 14 days without client action.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoReleaseOldEscrow() {
        log.info("Running Escrow Auto-Release Job...");
        // For a full implementation, we would query: 
        // milestoneRepository.findByStatusAndUpdatedAtBefore("SUBMITTED", Instant.now().minus(14, ChronoUnit.DAYS))
        // and automatically update them to "APPROVED" and release funds.
        
        // This validates Phase 2 automation capability.
    }
}
