package com.trigrowth.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "teams")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"password","authorities","hibernateLazyInitializer","handler","accountNonExpired","accountNonLocked","credentialsNonExpired","enabled"})
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "leader_id")
    private User leader;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"password","authorities","hibernateLazyInitializer","handler","accountNonExpired","accountNonLocked","credentialsNonExpired","enabled"})
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "team_members",
            joinColumns = @JoinColumn(name = "team_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> members = new HashSet<>();

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
