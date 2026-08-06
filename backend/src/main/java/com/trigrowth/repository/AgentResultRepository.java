package com.trigrowth.repository;

import com.trigrowth.model.AgentResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentResultRepository extends JpaRepository<AgentResult, Long> {

    List<AgentResult> findByBusinessEventId(Long businessEventId);

    List<AgentResult> findByAgentNameOrderByCreatedAtDesc(String agentName);

    java.util.Optional<AgentResult> findFirstByAgentNameOrderByCreatedAtDesc(String agentName);
}
