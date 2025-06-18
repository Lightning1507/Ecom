const pool = require('../db');

// Get user's cart items (now returns items grouped by seller)
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all carts for the user with their items
    const cartItemsQuery = `
      SELECT * FROM getCartItems($1);
    `;

    const result = await pool.query(cartItemsQuery, [userId]);

    // Group items by seller
    const cartsBySeller = {};
    let totalItems = 0;

    result.rows.forEach(row => {
      if (!cartsBySeller[row.seller_id]) {
        cartsBySeller[row.seller_id] = {
          cart_id: row.cart_id,
          seller_id: row.seller_id,
          store_name: row.store_name,
          items: []
        };
      }

      // Only add items if product exists (not null from LEFT JOIN)
      if (row.product_id) {
        cartsBySeller[row.seller_id].items.push({
          product_id: row.product_id,
          name: row.product_name,
          price: parseInt(row.price),
          quantity: row.quantity,
          img_path: row.img_path,
          stock: row.stock,
          total: parseInt(row.price) * row.quantity
        });
        totalItems += row.quantity;
      }
    });

    res.json({
      success: true,
      carts: Object.values(cartsBySeller),
      totalItems
    });

  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart items'
    });
  }
};
// Add item to cart (creates seller-specific cart if needed)
exports.addToCart = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID or quantity'
      });
    }

    await client.query('BEGIN');

    // Get product details including seller_id
    const productResult = await client.query(
      'SELECT seller_id, stock, visible FROM Products WHERE product_id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];

    if (!product.visible) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    if (product.stock < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock}`
      });
    }

    // Get or create cart for this user and seller
    let cartResult = await client.query(
      'SELECT cart_id FROM Carts WHERE user_id = $1 AND seller_id = $2',
      [userId, product.seller_id]
    );

    let cartId;
    if (cartResult.rows.length === 0) {
      // Create new cart for this seller
      const newCartResult = await client.query(
        'INSERT INTO Carts (user_id, seller_id) VALUES ($1, $2) RETURNING cart_id',
        [userId, product.seller_id]
      );
      cartId = newCartResult.rows[0].cart_id;
    } else {
      cartId = cartResult.rows[0].cart_id;
    }

    // Check if item already exists in cart
    const existingItemResult = await client.query(
      'SELECT quantity FROM Cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );

    if (existingItemResult.rows.length > 0) {
      // Update existing item
      const newQuantity = existingItemResult.rows[0].quantity + quantity;
      
      if (newQuantity > product.stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} items. Total would exceed stock (${product.stock})`
        });
      }

      await client.query(
        'UPDATE Cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3',
        [newQuantity, cartId, productId]
      );
    } else {
      // Add new item
      await client.query(
        'INSERT INTO Cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
        [cartId, productId, quantity]
      );
    }

    await client.query('COMMIT');

    // Get updated total count
    const totalCountResult = await client.query(
      `SELECT get_total_cart_quantity_by_user($1);`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      totalItems: parseInt(totalCountResult.rows[0].total_count)
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to cart'
    });
  } finally {
    client.release();
  }
};

// Update cart item quantity
exports.updateCartItemQuantity = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID or quantity'
      });
    }

    await client.query('BEGIN');

    // Get cart_id for this product and user
    const cartResult = await client.query(
      `SELECT * FROM get_cart_product_stock($1, $2);`,
      [userId, productId]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    const { cart_id: cartId, stock } = cartResult.rows[0];

    if (quantity === 0) {
      // Remove item from cart
      await client.query(
        'DELETE FROM Cart_items WHERE cart_id = $1 AND product_id = $2',
        [cartId, productId]
      );

      // Check if cart is now empty and remove it
      const remainingItemsResult = await client.query(
        'SELECT COUNT(*) as count FROM Cart_items WHERE cart_id = $1',
        [cartId]
      );

      if (parseInt(remainingItemsResult.rows[0].count) === 0) {
        await client.query('DELETE FROM Carts WHERE cart_id = $1', [cartId]);
      }
    } else {
      // Update quantity
      if (quantity > stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${stock}`
        });
      }

      await client.query(
        'UPDATE Cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3',
        [quantity, cartId, productId]
      );
    }

    await client.query('COMMIT');

    // Get updated total count
    const totalCountResult = await client.query(
      `SELECT get_total_cart_quantity_by_user($1);`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Cart updated successfully',
      totalItems: parseInt(totalCountResult.rows[0].total_count)
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating cart'
    });
  } finally {
    client.release();
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    await client.query('BEGIN');

    // Get cart_id for this product and user
    const cartResult = await client.query(
      `SELECT get_cart_id_by_user_and_product($1, $2);`,
      [userId, productId]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    const cartId = cartResult.rows[0].cart_id;

    // Remove item from cart
    await client.query(
      'DELETE FROM Cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );

    // Check if cart is now empty and remove it
    const remainingItemsResult = await client.query(
      'SELECT COUNT(*) as count FROM Cart_items WHERE cart_id = $1',
      [cartId]
    );

    if (parseInt(remainingItemsResult.rows[0].count) === 0) {
      await client.query('DELETE FROM Carts WHERE cart_id = $1', [cartId]);
    }

    await client.query('COMMIT');

    // Get updated total count
    const totalCountResult = await client.query(
      `SELECT get_total_cart_quantity_by_user($1);`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      totalItems: parseInt(totalCountResult.rows[0].total_count)
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing from cart'
    });
  } finally {
    client.release();
  }
};

// Clear entire cart for user
exports.clearCart = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;

    await client.query('BEGIN');

    // Get all cart IDs for the user
    const cartIdsResult = await client.query(
      'SELECT cart_id FROM Carts WHERE user_id = $1',
      [userId]
    );

    if (cartIdsResult.rows.length > 0) {
      const cartIds = cartIdsResult.rows.map(row => row.cart_id);
      
      // Delete all cart items
      await client.query(
        'DELETE FROM Cart_items WHERE cart_id = ANY($1)',
        [cartIds]
      );

      // Delete all carts
      await client.query('DELETE FROM Carts WHERE user_id = $1', [userId]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      totalItems: 0
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing cart'
    });
  } finally {
    client.release();
  }
};

// Get cart count for user
exports.getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const countResult = await pool.query(
      `SELECT get_total_cart_quantity_by_user($1);`,
      [userId]
    );

    res.json({
      success: true,
      totalItems: parseInt(countResult.rows[0].total_count)
    });

  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting cart count'
    });
  }
}; 