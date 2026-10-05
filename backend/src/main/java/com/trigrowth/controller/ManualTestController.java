package com.trigrowth.controller;

import com.trigrowth.model.*;
import com.trigrowth.repository.*;
import com.trigrowth.service.EventCollectorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/debug")
@RequiredArgsConstructor
public class ManualTestController {

    private final UserRepository userRepository;
    private final EventCollectorService eventCollectorService;
    private final RevenueSnapshotRepository revenueSnapshotRepository;
    private final ProjectRepository projectRepository;

    @GetMapping("/force-seed-and-scan")
    public ResponseEntity<String> forceScan() throws Exception {
        // Seed Revenue Data
        revenueSnapshotRepository.deleteAll();
        RevenueSnapshot s1 = new RevenueSnapshot();
        s1.setMonth("2026-08"); s1.setTotalRevenue(BigDecimal.valueOf(25000));
        revenueSnapshotRepository.save(s1);
        
        RevenueSnapshot s2 = new RevenueSnapshot();
        s2.setMonth("2026-09"); s2.setTotalRevenue(BigDecimal.valueOf(3000)); // Huge drop
        revenueSnapshotRepository.save(s2);

        // Set all clients to 40 days inactive
        List<User> clients = userRepository.findAllByRole(Role.ROLE_CLIENT);
        for (User c : clients) {
            c.setLastLoginAt(Instant.now().minus(40, ChronoUnit.DAYS));
            userRepository.save(c);
        }
        
        // Force the AI scans right now!
        eventCollectorService.simulateSixHourly();
        eventCollectorService.simulateHourly();
        eventCollectorService.simulateDaily();
        
        return ResponseEntity.ok("Successfully seeded revenue data, forced 40 days inactivity on " + clients.size() + " clients, and triggered all AI scans!");
    }
}
