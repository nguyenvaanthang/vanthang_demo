package com.rentmap.backend.repository;

import com.rentmap.backend.entity.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {
    List<Listing> findByStatusAndIsRented(String status, Boolean isRented);
    List<Listing> findByOwnerEmail(String ownerEmail);
}