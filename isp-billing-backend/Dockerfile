FROM php:8.4-apache as builder

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libssl-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite headers ssl

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY . .

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 755 /var/www/html/storage && \
    chmod -R 755 /var/www/html/bootstrap/cache

# Remove sensitive files
RUN rm -rf /var/www/html/.git && \
    rm -rf /var/www/html/.env.* && \
    rm -rf /var/www/html/.gitignore

# ========================
# FINAL STAGE
# ========================
FROM php:8.4-apache

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng6 \
    libjpeg62-turbo \
    libfreetype6 \
    libzip4 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions from builder
COPY --from=builder /usr/local/lib/php/extensions /usr/local/lib/php/extensions
COPY --from=builder /usr/local/etc/php /usr/local/etc/php

# Enable Apache modules
RUN a2enmod rewrite headers ssl

# Set working directory
WORKDIR /var/www/html

# Copy application from builder
COPY --from=builder --chown=www-data:www-data /var/www/html /var/www/html

# Update Apache DocumentRoot to public folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf && \
    sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Security: Remove Apache version header
RUN sed -i 's/^ServerTokens .*/ServerTokens Prod/' /etc/apache2/apache2.conf && \
    sed -i 's/^ServerSignature .*/ServerSignature Off/' /etc/apache2/apache2.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Expose port 80
EXPOSE 80

# Non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /var/www/html
USER appuser

CMD ["apache2-foreground"]
