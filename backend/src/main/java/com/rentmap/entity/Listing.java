package com.rentmap.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "listings")
@Data
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_email")
    private String ownerEmail;

    private String title;
    private String type;
    private BigDecimal price;
    private Double area;
    private String location;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    private Double lat;
    private Double lng;

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    private String status = "PENDING";

    @Column(name = "is_vip")
    private Boolean isVip = false;

    @Column(name = "is_rented")
    private Boolean isRented = false;

    private Integer views = 0;
}