package com.trigrowth.service;

import com.trigrowth.model.Message;
import com.trigrowth.model.Project;
import com.trigrowth.model.User;
import com.trigrowth.repository.MessageRepository;
import com.trigrowth.repository.ProjectRepository;
import com.trigrowth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository    userRepository;

    @Transactional(readOnly = true)
    public List<Message> getMessages(Long projectId) {
        return messageRepository.findByProjectIdOrderBySentAtAsc(projectId);
    }

    public Message sendMessage(Long projectId, UUID senderId, String content) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + senderId));

        Message msg = Message.builder()
                .project(project)
                .sender(sender)
                .content(content)
                .sentAt(Instant.now())
                .read(false)
                .build();

        return messageRepository.save(msg);
    }
}
