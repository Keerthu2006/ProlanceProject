package com.trigrowth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * TriGrowth AI – Spring Boot entry point.
 *
 * <p>Enabled features:
 * <ul>
 *   <li>{@code @EnableJpaAuditing}  – auto-populates {@code createdAt} / {@code updatedAt}.</li>
 *   <li>{@code @EnableCaching}      – Redis-backed cache.</li>
 *   <li>{@code @EnableAsync}        – async service methods.</li>
 *   <li>{@code @EnableScheduling}   – cron jobs (trend analysis, AI scoring, etc.).</li>
 * </ul>
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableCaching
@EnableAsync
@EnableScheduling
public class TrigrowthAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrigrowthAiApplication.class, args);
    }
}
