package com.trigrowth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@Tag(name = "AI Chat", description = "AI Chatbot proxy")
public class AiController {

    private final RestTemplate restTemplate;

    @Value("${app.ai-service.base-url:http://localhost:8001}")
    private String aiServiceUrl;

    @PostMapping
    @Operation(summary = "Proxy chat request to AI Service")
    public ResponseEntity<String> chat(@RequestBody Map<String, String> request) {
        String url = aiServiceUrl + "/chat";
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        return ResponseEntity.ok(response.getBody());
    }
}
