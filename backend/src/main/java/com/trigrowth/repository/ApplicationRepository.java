package com.trigrowth.repository;

import com.trigrowth.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"project.client", "project.owner", "project.skillsRequired", "freelancer"})
    List<Application> findByProjectId(Long projectId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"project.client", "project.owner", "project.skillsRequired", "freelancer"})
    List<Application> findByFreelancerId(UUID freelancerId);

    long countByProjectId(Long projectId);

    long countByFreelancerId(UUID freelancerId);

    long countByFreelancerIdAndAppliedAtAfter(UUID freelancerId, java.time.Instant appliedAt);

    boolean existsByProjectIdAndFreelancerId(Long projectId, UUID freelancerId);
}
