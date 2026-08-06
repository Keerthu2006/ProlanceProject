package com.trigrowth.repository;

import com.trigrowth.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findByLeaderId(UUID leaderId);
}
