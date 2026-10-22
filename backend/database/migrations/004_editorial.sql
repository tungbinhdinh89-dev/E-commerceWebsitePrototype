CREATE TABLE articles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    author_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    summary TEXT NOT NULL,
    content MEDIUMTEXT NOT NULL,
    thumbnail_path VARCHAR(255) NULL,
    seo_title VARCHAR(200) NULL,
    meta_description VARCHAR(320) NULL,
    keywords VARCHAR(255) NULL,
    status ENUM('draft', 'published', 'hidden') NOT NULL DEFAULT 'draft',
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_articles_slug (slug),
    KEY idx_articles_published (status, published_at, id),
    KEY idx_articles_author (author_id, created_at, id),
    CONSTRAINT chk_articles_publication CHECK (status <> 'published' OR published_at IS NOT NULL),
    CONSTRAINT fk_articles_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'hidden') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_comments_article_status (article_id, status, created_at, id),
    KEY idx_comments_moderation (status, created_at, id),
    CONSTRAINT chk_comments_content CHECK (CHAR_LENGTH(TRIM(content)) > 0),
    CONSTRAINT fk_comments_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
