package com.pasumai.ecommerce.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.pasumai.ecommerce.entity.Product;
import com.pasumai.ecommerce.repository.ProductRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final Cloudinary cloudinary;

    public ProductService(
            ProductRepository productRepository,
            Cloudinary cloudinary
    ) {
        this.productRepository = productRepository;
        this.cloudinary = cloudinary;
    }

    public Product addProduct(
            Product product,
            MultipartFile imageFile
    ) throws IOException {

        if (imageFile != null && !imageFile.isEmpty()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult =
                    cloudinary.uploader().upload(
                            imageFile.getBytes(),
                            ObjectUtils.asMap(
                                    "folder",
                                    "products"
                            )
                    );

            product.setImage(
                    (String) uploadResult.get("secure_url")
            );
        }

        if (product.getId() == null ||
                product.getId().isBlank()) {

            product.setId(
                    UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, 24)
            );
        }

        return productRepository.save(product);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(String id) {
        return productRepository.findById(id);
    }

    public boolean deleteProduct(String id) {
        if (!productRepository.existsById(id)) {
            return false;
        }
        productRepository.deleteById(id);
        return true;
    }

    public List<Product> searchProducts(String keyword) {
        Pageable pageable = PageRequest.of(0, 6);
        return productRepository.searchProducts(
                keyword == null ? "" : keyword,
                pageable
        );
    }
}