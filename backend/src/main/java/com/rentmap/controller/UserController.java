package com.rentmap.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @GetMapping
    public List<Object> getAllUsers() {
        // Trả về danh sách rỗng để không bị lỗi 404 từ Frontend
        return new ArrayList<>();
    }
}