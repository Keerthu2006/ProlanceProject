package com.trigrowth.repository;

import com.trigrowth.model.RevenueSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RevenueSnapshotRepository extends JpaRepository<RevenueSnapshot, Long> {

    List<RevenueSnapshot> findAllByOrderByMonthDesc();

    Optional<RevenueSnapshot> findByMonth(String month);
}
