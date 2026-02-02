// =====================================================
// RECOMMENDATION ENGINE
// Machine Learning-based Product Recommendations
// =====================================================

const { query } = require('../config/database');

/**
 * COLLABORATIVE FILTERING RECOMMENDATION ENGINE
 * Based on user purchase history and similar user patterns
 */

/**
 * Get Recommendations for User
 */
const getUserRecommendations = async (userId, limit = 10) => {
    try {
        // Get user's purchase history
        const userPurchasesResult = await query(
            `SELECT DISTINCT p.id, p.category, p.price
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id
             WHERE o.customer_id = $1
             LIMIT 50`,
            [userId]
        );

        if (userPurchasesResult.rows.length === 0) {
            // If no purchase history, return popular products
            return await getPopularProducts(limit);
        }

        const userCategories = [...new Set(userPurchasesResult.rows.map(p => p.category))];
        const userPriceRange = {
            min: Math.min(...userPurchasesResult.rows.map(p => p.price)) * 0.5,
            max: Math.max(...userPurchasesResult.rows.map(p => p.price)) * 1.5
        };

        // Find users with similar purchase patterns
        const similarUsersResult = await query(
            `SELECT DISTINCT o.customer_id, COUNT(*) as similarity_score
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id
             WHERE p.category = ANY($1)
             AND o.customer_id != $2
             GROUP BY o.customer_id
             ORDER BY similarity_score DESC
             LIMIT 20`,
            [userCategories, userId]
        );

        const similarUsers = similarUsersResult.rows.map(r => r.customer_id);

        // Get products liked by similar users
        if (similarUsers.length > 0) {
            const recommendationsResult = await query(
                `SELECT DISTINCT p.id, p.name, p.price, p.rating, p.category, p.image_url,
                        COUNT(*) as popularity_score
                 FROM order_items oi
                 JOIN orders o ON oi.order_id = o.id
                 JOIN products p ON oi.product_id = p.id
                 WHERE o.customer_id = ANY($1)
                 AND p.id NOT IN (
                    SELECT DISTINCT product_id 
                    FROM order_items oi2
                    JOIN orders o2 ON oi2.order_id = o2.id
                    WHERE o2.customer_id = $2
                 )
                 AND p.price BETWEEN $3 AND $4
                 AND p.is_active = true
                 GROUP BY p.id, p.name, p.price, p.rating, p.category, p.image_url
                 ORDER BY popularity_score DESC, p.rating DESC
                 LIMIT $5`,
                [similarUsers, userId, userPriceRange.min, userPriceRange.max, limit]
            );

            return recommendationsResult.rows;
        }

        return [];
    } catch (error) {
        console.error('Get recommendations error:', error);
        return [];
    }
};

/**
 * Get Popular Products (when user has no purchase history)
 */
const getPopularProducts = async (limit = 10) => {
    try {
        const result = await query(
            `SELECT p.id, p.name, p.price, p.rating, p.category, p.image_url,
                    COUNT(oi.id) as order_count
             FROM products p
             LEFT JOIN order_items oi ON p.id = oi.product_id
             WHERE p.is_active = true AND p.deleted_at IS NULL
             GROUP BY p.id
             ORDER BY order_count DESC, p.rating DESC
             LIMIT $1`,
            [limit]
        );

        return result.rows;
    } catch (error) {
        console.error('Get popular products error:', error);
        return [];
    }
};

/**
 * Get Category Recommendations
 * Recommend products from same category user is viewing
 */
const getCategoryRecommendations = async (productId, limit = 5) => {
    try {
        const productResult = await query(
            'SELECT category FROM products WHERE id = $1',
            [productId]
        );

        if (productResult.rows.length === 0) return [];

        const category = productResult.rows[0].category;

        const result = await query(
            `SELECT id, name, price, rating, image_url
             FROM products
             WHERE category = $1
             AND id != $2
             AND is_active = true
             AND deleted_at IS NULL
             ORDER BY rating DESC, id
             LIMIT $3`,
            [category, productId, limit]
        );

        return result.rows;
    } catch (error) {
        console.error('Get category recommendations error:', error);
        return [];
    }
};

/**
 * Calculate Product Similarity Score
 * Based on category, price range, and ratings
 */
const calculateSimilarity = (product1, product2) => {
    let score = 0;

    // Category match: 50%
    if (product1.category === product2.category) {
        score += 50;
    }

    // Price similarity: 30%
    const priceDiff = Math.abs(product1.price - product2.price);
    const maxPrice = Math.max(product1.price, product2.price);
    const priceSimilarity = Math.max(0, 100 - (priceDiff / maxPrice) * 100);
    score += priceSimilarity * 0.3;

    // Rating similarity: 20%
    const ratingDiff = Math.abs(product1.rating - product2.rating);
    const ratingSimilarity = Math.max(0, 100 - (ratingDiff / 5) * 100);
    score += ratingSimilarity * 0.2;

    return Math.round(score);
};

/**
 * Get Bundle Recommendations
 * Recommend products that are often bought together
 */
const getBundleRecommendations = async (productId, limit = 3) => {
    try {
        const result = await query(
            `SELECT p2.id, p2.name, p2.price, p2.rating, p2.image_url,
                    COUNT(*) as bundle_count,
                    ROUND(100.0 * COUNT(*) / (
                        SELECT COUNT(*) FROM order_items oi1
                        WHERE oi1.product_id = $1
                    ), 2) as frequency_percent
             FROM order_items oi1
             JOIN order_items oi2 ON oi1.order_id = oi2.order_id
             JOIN products p2 ON oi2.product_id = p2.id
             WHERE oi1.product_id = $1
             AND oi2.product_id != $1
             AND p2.is_active = true
             GROUP BY p2.id, p2.name, p2.price, p2.rating, p2.image_url
             ORDER BY bundle_count DESC
             LIMIT $2`,
            [productId, limit]
        );

        return result.rows;
    } catch (error) {
        console.error('Get bundle recommendations error:', error);
        return [];
    }
};

/**
 * Personalized Product Score
 * Calculate relevance score for user-product pair
 */
const calculatePersonalizedScore = async (userId, productId) => {
    try {
        let score = 0;

        // 1. User purchased similar products: 40%
        const categoryResult = await query(
            `SELECT COUNT(*) as count FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             JOIN products p1 ON oi.product_id = p1.id
             JOIN products p2 ON p2.id = $2
             WHERE o.customer_id = $1 AND p1.category = p2.category`,
            [userId, productId]
        );

        if (categoryResult.rows[0].count > 0) {
            score += 40;
        }

        // 2. Product is trending: 30%
        const trendingResult = await query(
            `SELECT COUNT(*) as order_count FROM order_items
             WHERE product_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
            [productId]
        );

        if (trendingResult.rows[0].order_count > 10) {
            score += 30;
        }

        // 3. Product has high rating: 20%
        const ratingResult = await query(
            `SELECT rating FROM products WHERE id = $1`,
            [productId]
        );

        if (ratingResult.rows[0].rating >= 4) {
            score += 20;
        }

        // 4. User viewed similar products: 10%
        const viewResult = await query(
            `SELECT COUNT(*) as count FROM audit_logs
             WHERE user_id = $1 AND table_name = 'products' 
             AND action = 'view' AND created_at > NOW() - INTERVAL '30 days'`,
            [userId]
        );

        if (viewResult.rows[0].count > 5) {
            score += 10;
        }

        return Math.min(100, score);
    } catch (error) {
        console.error('Calculate personalized score error:', error);
        return 0;
    }
};

/**
 * Save Recommendation to Database
 */
const saveRecommendation = async (userId, productId, score, reason, type) => {
    try {
        await query(
            `INSERT INTO recommendations (user_id, product_id, score, reason, recommendation_type)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [userId, productId, score, reason, type]
        );
    } catch (error) {
        console.error('Save recommendation error:', error);
    }
};

/**
 * Clean up old recommendations (run periodically)
 */
const cleanupOldRecommendations = async () => {
    try {
        await query(
            `DELETE FROM recommendations 
             WHERE created_at < NOW() - INTERVAL '30 days'`
        );
        console.log('Recommendations cleanup completed');
    } catch (error) {
        console.error('Cleanup recommendations error:', error);
    }
};

/**
 * Generate Recommendations Batch
 * Run for all users (daily job)
 */
const generateRecommendationsBatch = async () => {
    try {
        const usersResult = await query(
            `SELECT DISTINCT customer_id FROM orders LIMIT 1000`
        );

        for (const user of usersResult.rows) {
            const recommendations = await getUserRecommendations(user.customer_id, 5);
            
            for (const rec of recommendations) {
                await saveRecommendation(
                    user.customer_id,
                    rec.id,
                    rec.popularity_score || 50,
                    'Collaborative filtering',
                    'user_based'
                );
            }
        }

        console.log('Batch recommendation generation completed');
    } catch (error) {
        console.error('Batch generation error:', error);
    }
};

module.exports = {
    getUserRecommendations,
    getPopularProducts,
    getCategoryRecommendations,
    calculateSimilarity,
    getBundleRecommendations,
    calculatePersonalizedScore,
    saveRecommendation,
    cleanupOldRecommendations,
    generateRecommendationsBatch
};
