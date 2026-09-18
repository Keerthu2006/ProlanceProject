package com.trigrowth.controller;

import com.trigrowth.model.Application;
import com.trigrowth.model.Project;
import com.trigrowth.model.User;
import com.trigrowth.repository.ApplicationRepository;
import com.trigrowth.repository.ProjectRepository;
import com.trigrowth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.Instant;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    @PostMapping("/simulate-bid/{projectId}/{freelancerEmail}")
    public ResponseEntity<?> simulateBid(@PathVariable Long projectId, @PathVariable String freelancerEmail) {
        Project p = projectRepository.findById(projectId).orElseThrow();
        User f = userRepository.findByEmail(freelancerEmail).orElseThrow();
        
        Application app = new Application();
        app.setProject(p);
        app.setFreelancer(f);
        app.setCoverLetter("Simulated bid from AI recommendations!");
        app.setProposedAmount(BigDecimal.valueOf(1500));
        app.setStatus(Application.Status.PENDING);
        app.setAppliedAt(Instant.now());
        
        applicationRepository.save(app);
        return ResponseEntity.ok("Bid simulated successfully!");
    }
}
