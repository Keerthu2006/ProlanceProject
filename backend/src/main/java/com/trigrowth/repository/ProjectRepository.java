package com.trigrowth.repository;

import com.trigrowth.model.Project;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @EntityGraph(attributePaths = {"client", "owner", "skillsRequired"}, type = EntityGraph.EntityGraphType.LOAD)
    java.util.Optional<Project> findById(Long id);

    @EntityGraph(attributePaths = {"client", "owner", "skillsRequired"}, type = EntityGraph.EntityGraphType.LOAD)
    List<Project> findByClient_Id(UUID clientId);

    @EntityGraph(attributePaths = {"client", "owner", "skillsRequired"}, type = EntityGraph.EntityGraphType.LOAD)
    List<Project> findByOwner_Id(UUID ownerId);

    @EntityGraph(attributePaths = {"client", "owner", "skillsRequired"}, type = EntityGraph.EntityGraphType.LOAD)
    List<Project> findByStatus(Project.Status status);

    long countByStatus(Project.Status status);

    /**
     * Finds OPEN projects with no applications that are older than cutoff
     * and have no recent BusinessEvent.
     */
    @Query("SELECT p FROM Project p WHERE p.status = com.trigrowth.model.Project.Status.OPEN " +
           "AND p.createdAt < :cutoff " +
           "AND (SELECT COUNT(a) FROM Application a WHERE a.project = p) = 0 " +
           "AND NOT EXISTS (SELECT e FROM BusinessEvent e WHERE e.entityId = p.id " +
           "  AND e.entityType = 'PROJECT' AND e.createdAt > :recentCutoff)")
    List<Project> findOpenWithNoApplicationsOlderThan(
            @Param("cutoff") Instant cutoff,
            @Param("recentCutoff") Instant recentCutoff);
}

