package com.rentmap.backend.controller;

import com.rentmap.backend.entity.Listing;
import com.rentmap.backend.repository.ListingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
@CrossOrigin(origins = "*")
public class ListingController {

    @Autowired
    private ListingRepository listingRepository;

    @GetMapping("/approved")
    public List<Listing> getApprovedListings() {
        return listingRepository.findByStatusAndIsRented("APPROVED", false);
    }

    @PostMapping
    public Listing createListing(@RequestBody Listing listing) {
        return listingRepository.save(listing);
    }

    @PutMapping("/{id}/approve")
    public Listing approveListing(@PathVariable Long id) {
        Listing listing = listingRepository.findById(id).orElseThrow();
        listing.setStatus("APPROVED");
        return listingRepository.save(listing);
    }
}