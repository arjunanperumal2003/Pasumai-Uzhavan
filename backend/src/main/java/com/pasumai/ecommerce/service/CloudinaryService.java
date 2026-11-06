package com.pasumai.ecommerce.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    /**
     * Uploads a MultipartFile to Cloudinary in the specified folder.
     * 
     * @param file       The uploaded image file
     * @param folderName The target folder in Cloudinary (e.g., "products")
     * @return Secure URL string of the uploaded image
     * @throws IOException If file reading fails
     */
    public String uploadImage(MultipartFile file, String folderName) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folderName != null && !folderName.isBlank() ? folderName : "products",
                        "resource_type", "auto"
                )
        );

        return (String) uploadResult.get("secure_url");
    }

    /**
     * Deletes an asset from Cloudinary by its public ID.
     * 
     * @param publicId Public ID of the resource in Cloudinary
     * @return true if deletion was successful
     */
    public boolean deleteImage(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return false;
        }

        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            return "ok".equalsIgnoreCase((String) result.get("result"));
        } catch (IOException e) {
            return false;
        }
    }
}