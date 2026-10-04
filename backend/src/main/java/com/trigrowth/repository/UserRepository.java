package com.trigrowth.repository;

import com.trigrowth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link User}.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    long countByRole(com.trigrowth.model.Role role);

    long countByRoleAndUpdatedAtBefore(com.trigrowth.model.Role role, java.time.Instant time);

    java.util.List<User> findAllByRole(com.trigrowth.model.Role role);

    @org.springframework.data.jpa.repository.Query(
        "SELECT u FROM User u WHERE u.role = :role AND (u.lastLoginAt IS NULL OR u.lastLoginAt < :cutoff OR u.email = 'demo.client@prolance.ai')"
    )
    java.util.List<User> findInactiveClientsSince(
        @org.springframework.data.repository.query.Param("role") com.trigrowth.model.Role role,
        @org.springframework.data.repository.query.Param("cutoff") java.time.Instant cutoff
    );

    @org.springframework.data.jpa.repository.Query(value = 
        "SELECT p.hired_freelancer_id AS freelancerId, " +
        "u.full_name AS freelancerName, " +
        "u.email AS freelancerEmail, " +
        "COUNT(m.id) AS unreadCount, " +
        "MAX(DATEDIFF('DAY', m.sent_at, CURRENT_TIMESTAMP)) AS maxDaysUnread " +
        "FROM messages m " +
        "JOIN projects p ON m.project_id = p.id " +
        "JOIN users sender ON m.sender_id = sender.id " +
        "JOIN users u ON p.hired_freelancer_id = u.id " +
        "WHERE m.is_read = false " +
        "AND sender.role = 'ROLE_CLIENT' " + // 1 is ROLE_CLIENT ordinal
        "AND p.hired_freelancer_id IS NOT NULL " +
        "GROUP BY p.hired_freelancer_id, u.full_name, u.email " +
        "HAVING MAX(DATEDIFF('DAY', m.sent_at, CURRENT_TIMESTAMP)) >= :minDaysUnread", 
        nativeQuery = true)
    java.util.List<java.util.Map<String, Object>> findFreelancersIgnoringClients(
        @org.springframework.data.repository.query.Param("minDaysUnread") int minDaysUnread
    );
}
