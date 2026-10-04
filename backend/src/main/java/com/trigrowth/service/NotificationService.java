package com.trigrowth.service;

import com.trigrowth.model.Notification;
import com.trigrowth.model.User;
import com.trigrowth.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void send(User recipient, String title, String message, String type) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        notificationRepository.save(n);

        messagingTemplate.convertAndSend("/topic/notifications/" + recipient.getId(), Map.of(
                "title", title,
                "body", message,
                "type", type
        ));
    }

    public List<Notification> getForUser(UUID userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public void markRead(Long notifId) {
        notificationRepository.findById(notifId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllRead(UUID userId) {
        List<Notification> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        notifs.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifs);
    }
}
