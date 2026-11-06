package com.pasumai.ecommerce.controller;

import com.pasumai.ecommerce.service.CloudinaryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class ImageUploadController {

    private final CloudinaryService cloudinaryService;

    public ImageUploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    /**
     * Upload single image file to Cloudinary.
     * Endpoint: POST /api/upload
     * Form-Data: file (MultipartFile), folder (String, optional)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "products") String folder) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please select a valid image file to upload."));
        }

        try {
            String imageUrl = cloudinaryService.uploadImage(file, folder);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("url", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    /**
     * Delete image from Cloudinary using public ID.
     * Endpoint: DELETE /api/upload?publicId=products/xyz123
     */
    @DeleteMapping
    public ResponseEntity<?> deleteImage(@RequestParam("publicId") String publicId) {
        boolean deleted = cloudinaryService.deleteImage(publicId);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Image deleted successfully."));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Failed to delete image or invalid public ID."));
    }
}
