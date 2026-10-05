package com.trigrowth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class UiPathService {

    @Value("${uipath.client-id}")
    private String clientId;

    @Value("${uipath.client-secret}")
    private String clientSecret;

    @Value("${uipath.tenant-name:DefaultTenant}")
    private String tenantName;

    @Value("${uipath.account-logical-name:default}")
    private String accountLogicalName;

    @Value("${uipath.orchestrator-url:https://cloud.uipath.com}")
    private String orchestratorUrl;

    private final RestTemplate restTemplate;

    public UiPathService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Obtains an OAuth2 Access Token from UiPath Identity Server
     */
    public String getAccessToken() {
        String tokenUrl = orchestratorUrl + "/identity_/connect/token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("scope", "OR.Jobs OR.Execution OR.Folders");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("access_token");
            }
        } catch (Exception e) {
            log.error("Failed to get UiPath access token: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Triggers a specific UiPath process/job
     */
    public boolean triggerJob(String processName, Map<String, Object> inputArguments) {
        String token = getAccessToken();
        if (token == null) {
            log.error("Cannot trigger UiPath job, access token is null.");
            return false;
        }

        // UiPath OData URL structure: https://cloud.uipath.com/{accountLogicalName}/{tenantName}/orchestrator_/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs
        String apiUrl = String.format("%s/%s/%s/orchestrator_/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs",
                orchestratorUrl, accountLogicalName, tenantName);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-UIPATH-OrganizationUnitId", "1"); // Default folder ID, might need adjustment based on user setup

        // Format the request body for UiPath StartJobs
        Map<String, Object> startInfo = new HashMap<>();
        startInfo.put("ReleaseKey", processName); // ReleaseKey is typically the process name or key
        startInfo.put("Strategy", "All");
        startInfo.put("InputArguments", formatInputArguments(inputArguments));

        Map<String, Object> body = new HashMap<>();
        body.put("startInfo", startInfo);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            log.info("Triggering UiPath Job: {} with arguments: {}", processName, inputArguments);
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("UiPath Job Triggered Successfully!");
                return true;
            } else {
                log.error("Failed to trigger UiPath job. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Error calling UiPath StartJobs API: {}", e.getMessage());
        }
        return false;
    }

    private String formatInputArguments(Map<String, Object> args) {
        try {
            // UiPath expects InputArguments to be a JSON string of a JSON object
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.writeValueAsString(args);
        } catch (Exception e) {
            return "{}";
        }
    }
}
