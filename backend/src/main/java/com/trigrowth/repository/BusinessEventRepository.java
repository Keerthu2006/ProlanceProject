package com.trigrowth.repository;

import com.trigrowth.model.BusinessEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessEventRepository extends JpaRepository<BusinessEvent, Long> {

    List<BusinessEvent> findByProcessedFalse();

    List<BusinessEvent> findByEntityId(Long entityId);

    List<BusinessEvent> findTop50ByOrderByCreatedAtDesc();
}
