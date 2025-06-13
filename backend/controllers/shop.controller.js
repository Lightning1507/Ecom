const pool = require('../db');

const getAllShops = async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['u.role = $1', 'u.locked = $2', 's.store_name IS NOT NULL'];
    let params = ['seller', false];
    let paramIndex = 3;

    // Add search filter
    if (search) {
      whereConditions.push(`(s.store_name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM Users u 
      JOIN Sellers s ON u.user_id = s.seller_id 
      ${whereClause}
    `;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    // Get sellers with their store information
    const sellersQuery = `
      SELECT 
        u.user_id,
        u.full_name,
        s.store_name,
        s.description,
        COALESCE((
          SELECT COUNT(*) 
          FROM Products p 
          WHERE p.seller_id = s.seller_id AND p.visible = true
        ), 0) as products_count,
        COALESCE((
          SELECT AVG(r.rating)::NUMERIC(3,2)
          FROM Reviews r
          JOIN Products p ON r.product_id = p.product_id
          WHERE p.seller_id = s.seller_id
        ), 0) as avg_rating,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          JOIN Products p ON oi.product_id = p.product_id
          WHERE p.seller_id = s.seller_id AND o.status = 'delivered'
        ), 0) as total_sold
      FROM Users u 
      JOIN Sellers s ON u.user_id = s.seller_id 
      ${whereClause}
      ORDER BY products_count DESC, avg_rating DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const sellersResult = await pool.query(sellersQuery, params);

    // Format the data
    const shops = sellersResult.rows.map(seller => ({
      id: seller.user_id,
      name: seller.store_name,
      owner: seller.full_name,
      description: seller.description || 'Welcome to our store!',
      productsCount: parseInt(seller.products_count) || 0,
      rating: parseFloat(seller.avg_rating) || 0,
      totalSold: parseInt(seller.total_sold) || 0,
      status: 'active'
    }));

    res.json({
      success: true,
      shops,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shops'
    });
  }
};

const getShopDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get shop details with comprehensive information
    const shopQuery = `
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        s.store_name,
        s.description,
        COALESCE((
          SELECT COUNT(*) 
          FROM Products p 
          WHERE p.seller_id = s.seller_id AND p.visible = true
        ), 0) as products_count,
        COALESCE((
          SELECT AVG(r.rating)::NUMERIC(3,2)
          FROM Reviews r
          JOIN Products p ON r.product_id = p.product_id
          WHERE p.seller_id = s.seller_id
        ), 0) as avg_rating,
        COALESCE((
          SELECT COUNT(DISTINCT r.review_id)
          FROM Reviews r
          JOIN Products p ON r.product_id = p.product_id
          WHERE p.seller_id = s.seller_id
        ), 0) as total_reviews,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          JOIN Products p ON oi.product_id = p.product_id
          WHERE p.seller_id = s.seller_id AND o.status = 'delivered'
        ), 0) as total_sold
      FROM Users u 
      JOIN Sellers s ON u.user_id = s.seller_id 
      WHERE u.user_id = $1 AND u.role = 'seller' AND u.locked = false AND s.store_name IS NOT NULL
    `;

    const shopResult = await pool.query(shopQuery, [id]);

    if (shopResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shop = shopResult.rows[0];

    // Get shop categories (categories of products they sell)
    const categoriesQuery = `
      SELECT DISTINCT c.name, COUNT(p.product_id) as product_count
      FROM Categories c
      JOIN Product_categories pc ON c.category_id = pc.category_id
      JOIN Products p ON pc.product_id = p.product_id
      WHERE p.seller_id = $1 AND p.visible = true
      GROUP BY c.category_id, c.name
      ORDER BY product_count DESC
      LIMIT 10
    `;

    const categoriesResult = await pool.query(categoriesQuery, [id]);

    // Get recent products (top 6 products)
    const recentProductsQuery = `
      SELECT 
        p.product_id,
        p.name,
        p.price,
        p.img_path,
        COALESCE((
          SELECT AVG(rating)::NUMERIC(3,2)
          FROM Reviews r 
          WHERE r.product_id = p.product_id
        ), 0) as rating,
        COALESCE((
          SELECT SUM(oi.quantity)
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          WHERE oi.product_id = p.product_id AND o.status = 'delivered'
        ), 0) as total_sold
      FROM Products p
      WHERE p.seller_id = $1 AND p.visible = true
      ORDER BY p.product_id DESC
      LIMIT 6
    `;

    const productsResult = await pool.query(recentProductsQuery, [id]);

    // Format the response
    const shopDetails = {
      id: shop.user_id,
      name: shop.store_name,
      owner: shop.full_name,
      email: shop.email,
      phone: shop.phone,
      address: shop.address,
      description: shop.description || 'Welcome to our store!',
      productsCount: parseInt(shop.products_count) || 0,
      rating: parseFloat(shop.avg_rating) || 0,
      totalReviews: parseInt(shop.total_reviews) || 0,
      totalSold: parseInt(shop.total_sold) || 0,
      categories: categoriesResult.rows,
      recentProducts: productsResult.rows.map(product => ({
        id: product.product_id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.img_path,
        rating: parseFloat(product.rating) || 0,
        totalSold: parseInt(product.total_sold) || 0
      })),
      status: 'active'
    };

    res.json({
      success: true,
      shop: shopDetails
    });

  } catch (error) {
    console.error('Error fetching shop details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shop details'
    });
  }
};

const createSellerProfile = async (req, res) => {
  try {
    const { store_name, description } = req.body;
    const userId = req.user.id;

    // Check if user has seller role
    const userResult = await pool.query(
      'SELECT role FROM Users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'seller') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only users with seller role can create a seller profile' 
      });
    }

    // Check if seller profile already exists
    const existingProfile = await pool.query(
      'SELECT * FROM Sellers WHERE seller_id = $1',
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Seller profile already exists' 
      });
    }

    // Create seller profile
    const result = await pool.query(
      'INSERT INTO Sellers (seller_id, store_name, description) VALUES ($1, $2, $3) RETURNING *',
      [userId, store_name, description]
    );

    res.status(201).json({
      success: true,
      message: 'Seller profile created successfully',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Create seller profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating seller profile' 
    });
  }
};

module.exports = {
  getAllShops,
  getShopDetails,
  createSellerProfile
}; 