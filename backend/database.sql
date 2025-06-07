----------------------
-- 1. Users (Tích hợp tất cả vai trò)
----------------------
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    address TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'seller', 'admin', 'shipper')),
    locked BOOLEAN DEFAULT FALSE
);

----------------------
-- 2. Seller Profiles
----------------------
CREATE TABLE Sellers (
    seller_id INTEGER PRIMARY KEY REFERENCES Users(user_id),
    store_name VARCHAR(100) NOT NULL,
    description TEXT,
    qr_img_path TEXT
);

----------------------
-- 3. Shipper Profiles
----------------------
CREATE TABLE Shipping_units (
    Shipping_units_id INTEGER PRIMARY KEY REFERENCES Users(user_id),
    company_name VARCHAR(100)
);

----------------------
-- 4. Admin Profiles
----------------------
CREATE TABLE Admins (
    admin_id INTEGER PRIMARY KEY REFERENCES Users(user_id),
    bank_account_number VARCHAR(30),
    bank_account_name VARCHAR(100),
    qr_img_path TEXT
);

----------------------
-- 5. Products
----------------------
CREATE TABLE Products (
    product_id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES Sellers(seller_id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    img_path TEXT,
    price BIGINT NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    visible BOOLEAN DEFAULT TRUE
);

----------------------
-- 6. Categories
----------------------
CREATE TABLE Categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

----------------------
-- 7. Product Categories
----------------------
CREATE TABLE Product_categories (
    product_id INTEGER REFERENCES Products(product_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES Categories(category_id),
    PRIMARY KEY (product_id, category_id)
);

----------------------
-- 8. Carts
----------------------
CREATE TABLE Carts (
    cart_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(user_id), -- Tích hợp ràng buộc unique tại đây
    seller_id INTEGER NOT NULL REFERENCES Sellers(seller_id),
    UNIQUE (user_id, seller_id)
);

----------------------
-- 9. Cart Items
----------------------
CREATE TABLE Cart_items (
    cart_id INTEGER REFERENCES Carts(cart_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES Products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (cart_id, product_id)
);

----------------------
-- 10. Orders
----------------------
CREATE TABLE Orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    seller_id INTEGER NOT NULL REFERENCES Sellers(seller_id), -- Đưa vào trực tiếp
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (
        status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')
    )
);

----------------------
-- 11. Order Items
----------------------
CREATE TABLE Order_items (
    order_id INTEGER REFERENCES Orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES Products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price BIGINT NOT NULL CHECK (price >= 0),
    PRIMARY KEY (order_id, product_id)
);

----------------------
-- 12. Payments
----------------------
CREATE TABLE Payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES Orders(order_id),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(30) NOT NULL CHECK (
        payment_method IN ('cod', 'bank_transfer')
    ),
    amount BIGINT NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) NOT NULL CHECK (
        status IN ('pending', 'completed', 'failed', 'refunded')
    )
);

----------------------
-- 13. Shipments
----------------------
CREATE TABLE Shipments (
    order_id INTEGER NOT NULL UNIQUE REFERENCES Orders(order_id),
    Shipping_units_id INTEGER NOT NULL REFERENCES Shipping_units(Shipping_units_id),
    status VARCHAR(30) NOT NULL CHECK (
        status IN ('preparing', 'in_transit', 'delivered', 'returned')
    ),
    tracking_number VARCHAR(100) UNIQUE,
    estimated_delivery DATE,
    PRIMARY KEY (order_id, Shipping_units_id)
);

----------------------
-- 14. Reviews
----------------------
CREATE TABLE Reviews (
    review_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    img_path TEXT,
    FOREIGN KEY (order_id, product_id) REFERENCES Order_items(order_id, product_id)
);
