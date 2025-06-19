#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import random
import datetime
from faker import Faker
import hashlib

# Initialize Faker with Vietnamese locale
fake = Faker('vi_VN')

# Vietnamese product names and categories
vietnamese_categories = [
    'Thời trang nam', 'Thời trang nữ', 'Điện thoại & Phụ kiện', 
    'Máy tính & Laptop', 'Gia dụng & Đời sống', 'Sách & Văn phòng phẩm',
    'Thể thao & Du lịch', 'Mẹ & Bé', 'Làm đẹp & Sức khỏe', 'Thực phẩm & Đồ uống',
    'Xe máy & Ô tô', 'Nhà cửa & Đời sống', 'Điện tử & Công nghệ', 'Giày dép',
    'Túi xách & Ví', 'Đồng hồ & Trang sức', 'Đồ chơi & Trò chơi', 'Pet & Pet Care'
]

vietnamese_product_names = [
    'Áo thun cotton cao cấp', 'Quần jeans skinny', 'Giày sneaker thể thao',
    'Túi xách da thật', 'Đồng hồ thông minh', 'Điện thoại smartphone',
    'Laptop gaming', 'Máy ảnh DSLR', 'Tai nghe bluetooth', 'Loa không dây',
    'Bình giữ nhiệt inox', 'Nồi cơm điện', 'Máy xay sinh tố', 'Bàn làm việc gỗ',
    'Ghế văn phòng ergonomic', 'Sách tiểu thuyết hay', 'Vở học sinh', 'Bút bi cao cấp',
    'Ba lô du lịch', 'Giày thể thao chạy bộ', 'Áo khoác mùa đông', 'Váy đầm công sở',
    'Kem dưỡng da mặt', 'Serum vitamin C', 'Sữa rửa mặt', 'Son môi matte',
    'Thực phẩm chức năng', 'Trà xanh organic', 'Cà phê rang xay', 'Bánh kẹo nhập khẩu',
    'Xe đạp thể thao', 'Kính râm thời trang', 'Dép sandal nữ', 'Dép tông nam'
]

vietnamese_store_names = [
    'Shop Thời Trang Hà Nội', 'Cửa hàng Điện tử Sài Gòn', 'Siêu thị Mini Mart',
    'Shop Giày Dép Đẹp', 'Cửa hàng Mỹ phẩm ABC', 'Shop Đồng hồ Luxury',
    'Thời trang Việt Nam', 'Điện máy Xanh Mini', 'Shop Phụ kiện Tech',
    'Cửa hàng Sách Văn', 'Shop Thể thao 24h', 'Mẹ và Bé Store',
    'Gia dụng Gia đình', 'Shop Coffee & Tea', 'Xe máy Phụ tùng'
]

vietnamese_company_names = [
    'Vận chuyển Nhanh Express', 'Giao hàng Tiết kiệm', 'Viettel Post',
    'VNPost Express', 'J&T Express Vietnam', 'GHN - Giao hàng Nhanh',
    'BEST Express VN', 'Kerry Express', 'Ninja Van Vietnam', 'Ahamove Logistics'
]

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_mock_data():
    output_lines = []
    output_lines.append("-- Vietnamese Mock Data for Ecommerce Database")
    output_lines.append("-- Generated on: " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    output_lines.append("-- Note: This script assumes SERIAL columns start from 1 and increment sequentially")
    output_lines.append("")
    
    # Define counts for each user type
    NUM_CUSTOMERS = 10000
    NUM_SELLERS = 2000  
    NUM_ADMINS = 50
    NUM_SHIPPERS = 500
    NUM_PRODUCTS = 15000
    NUM_ORDERS = 20000
    NUM_CARTS_MAX = 5000  # Max customers with carts
    
    # Calculate expected user_id ranges (SERIAL starts from 1)
    customer_start_id = 1
    customer_end_id = customer_start_id + NUM_CUSTOMERS - 1
    
    seller_start_id = customer_end_id + 1
    seller_end_id = seller_start_id + NUM_SELLERS - 1
    
    admin_start_id = seller_end_id + 1
    admin_end_id = admin_start_id + NUM_ADMINS - 1
    
    shipper_start_id = admin_end_id + 1
    shipper_end_id = shipper_start_id + NUM_SHIPPERS - 1
    
    output_lines.append(f"-- Expected user_id ranges:")
    output_lines.append(f"-- Customers: {customer_start_id}-{customer_end_id}")
    output_lines.append(f"-- Sellers: {seller_start_id}-{seller_end_id}")
    output_lines.append(f"-- Admins: {admin_start_id}-{admin_end_id}")
    output_lines.append(f"-- Shippers: {shipper_start_id}-{shipper_end_id}")
    output_lines.append("")
    
    # Generate Users - user_id is SERIAL, so we don't specify it
    # The order of insertion determines the user_id values
    output_lines.append("-- Users Data (SERIAL user_id will be auto-generated)")
    
    # Generate Customers first (will get user_ids 1-10000)
    for _ in range(NUM_CUSTOMERS):
        username = fake.user_name() + str(random.randint(1, 999))
        password = hash_password("password123")
        full_name = fake.name()
        email = fake.email()
        phone = fake.phone_number()[:20]
        address = fake.address().replace('\n', ', ')
        
        output_lines.append(f"INSERT INTO Users (username, password, full_name, email, phone, address, role, locked) VALUES ('{username}', '{password}', '{full_name}', '{email}', '{phone}', '{address}', 'customer', FALSE);")
    
    # Generate Sellers next (will get user_ids 10001-12000)
    for _ in range(NUM_SELLERS):
        username = "seller_" + fake.user_name() + str(random.randint(1, 999))
        password = hash_password("seller123")
        full_name = fake.name()
        email = fake.email()
        phone = fake.phone_number()[:20]
        address = fake.address().replace('\n', ', ')
        
        output_lines.append(f"INSERT INTO Users (username, password, full_name, email, phone, address, role, locked) VALUES ('{username}', '{password}', '{full_name}', '{email}', '{phone}', '{address}', 'seller', FALSE);")
    
    # Generate Admins next (will get user_ids 12001-12050)
    for _ in range(NUM_ADMINS):
        username = "admin_" + fake.user_name() + str(random.randint(1, 999))
        password = hash_password("admin123")
        full_name = fake.name()
        email = fake.email()
        phone = fake.phone_number()[:20]
        address = fake.address().replace('\n', ', ')
        
        output_lines.append(f"INSERT INTO Users (username, password, full_name, email, phone, address, role, locked) VALUES ('{username}', '{password}', '{full_name}', '{email}', '{phone}', '{address}', 'admin', FALSE);")
    
    # Generate Shippers last (will get user_ids 12051-12550)
    for _ in range(NUM_SHIPPERS):
        username = "shipper_" + fake.user_name() + str(random.randint(1, 999))
        password = hash_password("shipper123")
        full_name = fake.name()
        email = fake.email()
        phone = fake.phone_number()[:20]
        address = fake.address().replace('\n', ', ')
        
        output_lines.append(f"INSERT INTO Users (username, password, full_name, email, phone, address, role, locked) VALUES ('{username}', '{password}', '{full_name}', '{email}', '{phone}', '{address}', 'shipper', FALSE);")
    
    output_lines.append("")
    
    # Generate Sellers table - seller_id references the seller Users
    output_lines.append("-- Sellers Data (seller_id references Users.user_id)")
    for seller_user_id in range(seller_start_id, seller_end_id + 1):
        store_name = random.choice(vietnamese_store_names)
        description = f"Cửa hàng chuyên bán {random.choice(['thời trang', 'điện tử', 'gia dụng', 'thực phẩm', 'phụ kiện'])} chất lượng cao với giá cả hợp lý. Cam kết hàng chính hãng 100%."
        qr_img_path = f"/uploads/qr/seller_{seller_user_id}.png"
        
        output_lines.append(f"INSERT INTO Sellers (seller_id, store_name, description, qr_img_path) VALUES ({seller_user_id}, '{store_name}', '{description}', '{qr_img_path}');")
    
    output_lines.append("")
    
    # Generate Shipping_units table - shipping_units_id references the shipper Users
    output_lines.append("-- Shipping Units Data (shipping_units_id references Users.user_id)")
    for shipper_user_id in range(shipper_start_id, shipper_end_id + 1):
        company_name = random.choice(vietnamese_company_names)
        output_lines.append(f"INSERT INTO Shipping_units (shipping_units_id, company_name) VALUES ({shipper_user_id}, '{company_name}');")
    
    output_lines.append("")
    
    # Generate Admins table - admin_id references the admin Users
    output_lines.append("-- Admins Data (admin_id references Users.user_id)")
    for admin_user_id in range(admin_start_id, admin_end_id + 1):
        bank_account_number = ''.join([str(random.randint(0, 9)) for _ in range(12)])
        bank_account_name = fake.name()
        qr_img_path = f"/uploads/qr/admin_{admin_user_id}.png"
        
        output_lines.append(f"INSERT INTO Admins (admin_id, bank_account_number, bank_account_name, qr_img_path) VALUES ({admin_user_id}, '{bank_account_number}', '{bank_account_name}', '{qr_img_path}');")
    
    output_lines.append("")
    
    # Generate Categories - category_id is SERIAL (will be 1-18)
    output_lines.append("-- Categories Data (SERIAL category_id will be auto-generated)")
    num_categories = len(vietnamese_categories)
    for category in vietnamese_categories:
        output_lines.append(f"INSERT INTO Categories (name) VALUES ('{category}');")
    
    output_lines.append("")
    
    # Generate Products - product_id is SERIAL (will be 1-15000)
    output_lines.append("-- Products Data (SERIAL product_id will be auto-generated)")
    for _ in range(NUM_PRODUCTS):
        # Pick a random seller from the seller range
        seller_id = random.randint(seller_start_id, seller_end_id)
        name = random.choice(vietnamese_product_names) + f" #{random.randint(1, 999)}"
        description = f"Sản phẩm chất lượng cao, được nhập khẩu từ {random.choice(['Nhật Bản', 'Hàn Quốc', 'Thái Lan', 'Trung Quốc', 'Việt Nam'])}. Bảo hành {random.randint(6, 24)} tháng."
        img_path = f"/uploads/products/product_{random.randint(1, 999999)}.jpg"
        price = random.randint(50000, 5000000)  # 50k to 5M VND
        stock = random.randint(0, 100)
        visible = random.choice([True, True, True, False])  # 75% visible
        
        output_lines.append(f"INSERT INTO Products (seller_id, name, description, img_path, price, stock, visible) VALUES ({seller_id}, '{name}', '{description}', '{img_path}', {price}, {stock}, {visible});")
    
    output_lines.append("")
    
    # Generate Product_categories - references SERIAL product_ids and category_ids
    output_lines.append("-- Product Categories Data")
    for product_id in range(1, NUM_PRODUCTS + 1):  # product_ids will be 1-15000
        # Each product belongs to 1-3 categories
        num_cats = random.randint(1, 3)
        selected_categories = random.sample(range(1, num_categories + 1), num_cats)
        for category_id in selected_categories:
            output_lines.append(f"INSERT INTO Product_categories (product_id, category_id) VALUES ({product_id}, {category_id});")
    
    output_lines.append("")
    
    # Generate Carts - cart_id is SERIAL
    output_lines.append("-- Carts Data (SERIAL cart_id will be auto-generated)")
    cart_counter = 0
    
    # Create carts for some customers with some sellers
    selected_customers = random.sample(range(customer_start_id, customer_end_id + 1), NUM_CARTS_MAX)
    for customer_id in selected_customers:
        # Each customer can have carts with 1-3 different sellers
        num_sellers = random.randint(1, 3)
        selected_sellers = random.sample(range(seller_start_id, seller_end_id + 1), num_sellers)
        for seller_id in selected_sellers:
            output_lines.append(f"INSERT INTO Carts (user_id, seller_id) VALUES ({customer_id}, {seller_id});")
            cart_counter += 1
    
    output_lines.append("")
    
    # Generate Cart_items - references SERIAL cart_ids and product_ids
    output_lines.append("-- Cart Items Data")
    for cart_id in range(1, cart_counter + 1):  # cart_ids will be 1-cart_counter
        # Each cart has 1-5 products
        num_items = random.randint(1, 5)
        selected_products = random.sample(range(1, NUM_PRODUCTS + 1), num_items)
        
        for product_id in selected_products:
            quantity = random.randint(1, 5)
            output_lines.append(f"INSERT INTO Cart_items (cart_id, product_id, quantity) VALUES ({cart_id}, {product_id}, {quantity});")
    
    output_lines.append("")
    
    # Generate Orders - order_id is SERIAL (will be 1-20000)
    output_lines.append("-- Orders Data (SERIAL order_id will be auto-generated)")
    
    for _ in range(NUM_ORDERS):
        # Pick random customer and seller
        user_id = random.randint(customer_start_id, customer_end_id)
        seller_id = random.randint(seller_start_id, seller_end_id)
        
        # 50% chance of having a shipper
        shipping_units_id = random.randint(shipper_start_id, shipper_end_id) if random.choice([True, False]) else None
        
        tracking_number = f"VN{random.randint(100000000, 999999999)}"
        shipping_status = random.choice(['preparing', 'in_transit', 'delivered', 'returned'])
        estimated_delivery = fake.date_between(start_date='today', end_date='+30d')
        order_date = fake.date_time_between(start_date='-60d', end_date='now')
        status = random.choice(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
        
        if shipping_units_id:
            output_lines.append(f"INSERT INTO Orders (user_id, seller_id, Shipping_units_id, tracking_number, shipping_status, estimated_delivery, order_date, status) VALUES ({user_id}, {seller_id}, {shipping_units_id}, '{tracking_number}', '{shipping_status}', '{estimated_delivery}', '{order_date}', '{status}');")
        else:
            output_lines.append(f"INSERT INTO Orders (user_id, seller_id, tracking_number, shipping_status, estimated_delivery, order_date, status) VALUES ({user_id}, {seller_id}, '{tracking_number}', '{shipping_status}', '{estimated_delivery}', '{order_date}', '{status}');")
    
    output_lines.append("")
    
    # Generate Order_items - references SERIAL order_ids and product_ids
    output_lines.append("-- Order Items Data")
    order_product_pairs = []
    
    for order_id in range(1, NUM_ORDERS + 1):  # order_ids will be 1-20000
        # Each order has 1-5 products
        num_items = random.randint(1, 5)
        selected_products = random.sample(range(1, NUM_PRODUCTS + 1), num_items)
        
        for product_id in selected_products:
            quantity = random.randint(1, 3)
            price = random.randint(50000, 5000000)
            output_lines.append(f"INSERT INTO Order_items (order_id, product_id, quantity, price) VALUES ({order_id}, {product_id}, {quantity}, {price});")
            # Store for reviews generation
            order_product_pairs.append((order_id, product_id))
    
    output_lines.append("")
    
    # Generate Payments - payment_id is SERIAL, order_id references Orders
    output_lines.append("-- Payments Data (SERIAL payment_id will be auto-generated)")
    
    for order_id in range(1, NUM_ORDERS + 1):  # order_ids will be 1-20000
        payment_date = fake.date_time_between(start_date='-60d', end_date='now')
        payment_method = random.choice(['cod', 'bank_transfer'])
        amount = random.randint(100000, 10000000)
        status = random.choice(['pending', 'completed', 'failed', 'refunded'])
        
        output_lines.append(f"INSERT INTO Payments (order_id, payment_date, payment_method, amount, status) VALUES ({order_id}, '{payment_date}', '{payment_method}', {amount}, '{status}');")
    
    output_lines.append("")
    
    # Generate Reviews - review_id is SERIAL
    output_lines.append("-- Reviews Data (SERIAL review_id will be auto-generated)")
    
    vietnamese_comments = [
        "Sản phẩm rất tốt, chất lượng như mô tả",
        "Giao hàng nhanh, đóng gói cẩn thận", 
        "Giá cả hợp lý, sẽ mua lại lần sau",
        "Chất lượng ổn, đúng như hình ảnh",
        "Shop phục vụ tận tình, sản phẩm đẹp",
        "Hàng chính hãng, rất hài lòng",
        "Đóng gói kỹ càng, giao hàng đúng hẹn",
        "Sản phẩm đúng mô tả, chất lượng tốt",
        "Giá rẻ mà chất lượng cao, recommend",
        "Shop uy tín, sẽ ủng hộ dài dài"
    ]
    
    # Generate reviews for 75% of order items
    num_reviews = int(len(order_product_pairs) * 0.75)
    selected_order_products = random.sample(order_product_pairs, num_reviews)
    
    for order_id, product_id in selected_order_products:
        # Pick a random customer for the review
        user_id = random.randint(customer_start_id, customer_end_id)
        rating = random.randint(3, 5)  # Mostly positive reviews
        comment = random.choice(vietnamese_comments)
        img_path = f"/uploads/reviews/review_{random.randint(1, 999999)}.jpg" if random.choice([True, False]) else None
        
        if img_path:
            output_lines.append(f"INSERT INTO Reviews (order_id, product_id, user_id, rating, comment, img_path) VALUES ({order_id}, {product_id}, {user_id}, {rating}, '{comment}', '{img_path}');")
        else:
            output_lines.append(f"INSERT INTO Reviews (order_id, product_id, user_id, rating, comment) VALUES ({order_id}, {product_id}, {user_id}, {rating}, '{comment}');")
    
    return output_lines

def main():
    print("Generating Vietnamese mock data for ecommerce database...")
    print("Dataset size:")
    print("- 10,000 Customers")
    print("- 2,000 Sellers") 
    print("- 50 Admins")
    print("- 500 Shippers")
    print("- 15,000 Products")
    print("- 20,000 Orders")
    print("- ~15,000 Reviews")
    print("- ~5,000 Shopping Carts")
    print("\nThis may take a few minutes to generate...")
    
    # Generate the mock data
    sql_statements = generate_mock_data()
    
    # Write to file
    output_file = 'mock_data.sql'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_statements))
    
    print(f"\nMock data generated successfully!")
    print(f"Total SQL statements: {len(sql_statements):,}")
    print(f"Output file: {output_file}")
    print(f"File size: {len('\n'.join(sql_statements)):,} characters")
    print(f"File size: {len('\n'.join(sql_statements)) / 1024 / 1024:.1f} MB")

if __name__ == "__main__":
    main()