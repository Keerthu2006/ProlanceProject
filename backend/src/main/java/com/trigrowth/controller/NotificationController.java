package com.trigrowth.controller;

import com.trigrowth.model.Notification;
import com.trigrowth.model.User;
import com.trigrowth.repository.UserRepository;
import com.trigrowth.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@AuthenticationPrincipal UserDetails ud) {
        User me = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        return ResponseEntity.ok(notificationService.getForUser(me.getId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal UserDetails ud) {
        User me = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        notificationService.markAllRead(me.getId());
        return ResponseEntity.ok(Map.of("message", "All marked as read"));
    }
}
