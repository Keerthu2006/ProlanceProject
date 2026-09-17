package com.trigrowth.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.Map;

@Controller
public class ChatController {

    @MessageMapping("/chat.send")
    @SendTo("/topic/chat")
    public Map<String, Object> sendMessage(Map<String, Object> message) {
        // Broadcast incoming chat messages in real time
        // In a full implementation, we'd save this to MessageRepository
        message.put("timestamp", Instant.now().toString());
        return message;
    }
}
