# Pasumai E-commerce Backend — Spring Boot + MySQL

Converted from the original Express + MongoDB (Mongoose) backend.

## ⚠️ Rotate your credentials

Your uploaded project had real, live secrets committed in plain text:
- Cloudinary `api_secret` (in `cloudinary.js`)
- MongoDB Atlas password (in `.env.local`)
- Gmail password (in `.env.local`)

Please **rotate all of these now** (change the passwords / regenerate the Cloudinary secret).
None of these real values were copied into this converted project — only placeholders.

## What changed

| Express / MongoDB (before)                | Spring Boot / MySQL (after)                          |
|---------------------------------------------|-------------------------------------------------------|
| `mongoose.Schema` + `mongoose.model`         | `Fertilizer` JPA `@Entity` (`entity/Fertilizer.java`) |
| Mongoose queries (`find`, `findById`, etc.)  | `FertilizerRepository extends JpaRepository`          |
| MongoDB `_id` (ObjectId, string)             | MySQL `id` (`BIGINT`, auto-increment) — **IDs are now numeric**, not strings |
| `multer` + `multer-storage-cloudinary`       | `Cloudinary` Java SDK, called directly in `FertilizerService` |
| `app.use(cors())`                            | `CorsConfig` (`WebMvcConfigurer`)                     |
| `.env.local`                                 | `application.properties` (supports env var overrides) |
| Route handlers in `index.js`                 | `FertilizerController` + `FertilizerService`          |
| `app.listen(5000, ...)`                      | `server.port=5000` in `application.properties`        |

## Endpoints (unchanged, so your frontend doesn't need to change)

- `POST /add-fertilizer` — multipart form: `name`, `brand`, `category`, `image`
- `GET /fertilizers` — list all
- `GET /fertilizer/{id}` — get one (⚠️ `id` is now a number, e.g. `/fertilizer/1`, not a MongoDB ObjectId string)
- `DELETE /fertilizer/{id}` — delete one
- `GET /search-fertilizers?q=keyword` — search name/brand/category, limited to 6 results

## Setup

1. **Create the MySQL database** (or let it auto-create — see `createDatabaseIfNotExist=true` in `application.properties`):
   ```sql
   CREATE DATABASE pasumai_ecommerce;
   ```

2. **Set your real credentials.** Either edit `src/main/resources/application.properties` directly, or (recommended) set environment variables before running:
   ```bash
   export CLOUDINARY_CLOUD_NAME=your_cloud_name
   export CLOUDINARY_API_KEY=your_api_key
   export CLOUDINARY_API_SECRET=your_api_secret
   ```
   And update `spring.datasource.username` / `spring.datasource.password` for your local MySQL.

3. **Run:**
   ```bash
   mvn spring-boot:run
   ```
   The table `fertilizers` is auto-created on first run (`spring.jpa.hibernate.ddl-auto=update`).

4. **Build a jar:**
   ```bash
   mvn clean package
   java -jar target/ecommerce-backend-1.0.0.jar
   ```

## Notes on behavior differences

- **IDs**: MongoDB used string ObjectIds; MySQL uses auto-increment numeric IDs. Any frontend code comparing/parsing IDs as strings should still work fine since JSON returns them as numbers, but don't assume ObjectId-style 24-char hex strings anymore.
- **Search**: The original used MongoDB `$regex` (substring match, case-insensitive). This is replicated with a JPQL `LIKE` + `LOWER()` query, same behavior.
- **Timestamps**: `timestamps: true` (Mongoose) → `createdAt`/`updatedAt` via Hibernate `@CreationTimestamp`/`@UpdateTimestamp`.
- **Image storage**: Still uses Cloudinary (same as before), just called directly from Java instead of through multer middleware.
