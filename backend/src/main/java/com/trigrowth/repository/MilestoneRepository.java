package com.trigrowth.repository;

import com.trigrowth.model.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectIdOrderByIdAsc(Long projectId);
    List<Milestone> findByDueDateBeforeAndStatusNot(java.time.Instant dueDate, Milestone.Status status);
    long countByStatus(Milestone.Status status);
}
