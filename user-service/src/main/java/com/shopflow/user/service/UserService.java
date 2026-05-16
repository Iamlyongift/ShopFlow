package com.shopflow.user.service;

import com.shopflow.user.entity.User;
import com.shopflow.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id){
       return userRepository.findById(id);
    }

    public User registerUser(User user){
        return userRepository.save(user);
    }
}
