package com.trigrowth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * HTTP client configuration for calling the Python AI micro-service.
 */
@Configuration
public class AiServiceConfig {

    @Value("${app.ai-service.base-url}")
    private String aiServiceBaseUrl;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
