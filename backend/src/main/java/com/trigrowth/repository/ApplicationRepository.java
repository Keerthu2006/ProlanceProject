package com.trigrowth.repository;

import com.trigrowth.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByProjectId(Long projectId);

    List<Application> findByFreelancerId(UUID freelancerId);

    long countByProjectId(Long projectId);

    boolean existsByProjectIdAndFreelancerId(Long projectId, UUID freelancerId);
}
