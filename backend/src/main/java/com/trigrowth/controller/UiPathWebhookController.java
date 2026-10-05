package com.trigrowth.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/webhooks/uipath")
@Slf4j
public class UiPathWebhookController {

    /**
     * Receives callbacks from UiPath Orchestrator when a job completes or fails
     */
    @PostMapping
    public ResponseEntity<Void> handleUiPathWebhook(@RequestBody Map<String, Object> payload) {
        log.info("Received UiPath Webhook: {}", payload);

        // UiPath usually sends EventType (e.g. "job.completed", "job.faulted")
        String eventType = (String) payload.get("Type");
        
        if ("job.completed".equalsIgnoreCase(eventType)) {
            log.info("UiPath Automation Job Completed Successfully!");
            // Here you can parse payload.get("Job") to find out which specific job finished
            // and update the ProLance dashboard status (e.g., Recommendation marked as ACTIONED).
            
        } else if ("job.faulted".equalsIgnoreCase(eventType)) {
            log.error("UiPath Automation Job Faulted/Failed.");
        }

        return ResponseEntity.ok().build();
    }
}
