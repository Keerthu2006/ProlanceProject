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
}
