package com.trigrowth.repository;

import com.trigrowth.model.FreelancerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FreelancerProfileRepository extends JpaRepository<FreelancerProfile, Long> {

    Optional<FreelancerProfile> findByUserId(UUID userId);
}
