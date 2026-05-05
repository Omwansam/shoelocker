from extensions import db
from enum import Enum
from datetime import datetime
from sqlalchemy.orm import validates

class OrderStatus(Enum):
    PENDING = 'pending'
    PROCESSING = 'processing'
    SHIPPED = 'shipped'
    DELIVERED = 'delivered'
    CANCELLED = 'cancelled'
    RETURNED = 'returned'

class PaymentStatus(Enum):
    SUCCESS = 'Success'
    FAILED = 'Failed'
    PENDING = 'Pending'
    COMPLETED = 'Completed'
    REFUNDED = 'Refunded'
    EXPIRED = 'Expired'
    CAPTURED = 'Captured'

class DiscountType(Enum):
    REGULAR = 'Regular'
    PERCENTAGE = 'Percentage'
    FIXED = 'Fixed'
    COUPON = 'coupon'

class ShippingStatus(Enum):
    PENDING ='Pending'
    SHIPPED = 'Shipped'
    DELIVERED = 'Delivered'
    CANCELLED = 'Cancelled'

class RefundStatus(Enum):
    REQUESTED = 'requested'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    PROCESSED = 'processed'    

class UserRole(Enum):
    USER = 'user'
    ADMIN = 'admin'
    MANAGER = 'manager'
    STAFF = 'staff'    

##################################################################################
  
##############################################################################################
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(80))
    last_name = db.Column(db.String(80))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    # Role-based field for admin access
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    # Additional fields for user management
    role = db.Column(db.Enum(UserRole), default=UserRole.USER)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    last_login = db.Column(db.DateTime)
    # last_logout = db.Column(db.DateTime)  # Temporarily commented until migration is run


    #Relationships mapping the user to the review
    reviews = db.relationship('Review', back_populates="user")
    #Relationships mapping the user to the orders
    orders = db.relationship('Order', back_populates="user")
    #Relationships mapping the user to the cart
    shopping_cart = db.relationship('ShoppingCart',uselist=False, back_populates="user")
    #Relationships mapping the user to multiple payment methods
    payment_method = db.relationship('PaymentMethod', back_populates="user")
    #Relationship mapping the user to multiple wishlists
    wishlists = db.relationship('Wishlist', back_populates="user")
    wishlist_items = db.relationship(
        "WishlistItem", back_populates="user", cascade="all, delete-orphan"
    )
    #Relationships mapping user to refunds
    refunds = db.relationship('Refund', back_populates="user")


    payments = db.relationship('Payment', back_populates="user")

    transactions = db.relationship('Transaction', back_populates='user')


    @property
    def password(self):
        return self.password_hash
    
    @password.setter
    def password(self, password):
        # In a real application, you would hash the password here
        # For now, we'll just store it directly (not recommended for production)
        self.password_hash = password

    def __repr__(self):
        return f'<User {self.username}>'


class Settings(db.Model):
    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False)
    setting_value = db.Column(db.Text)
    setting_type = db.Column(db.String(50), default='string')  # string, boolean, integer, json
    category = db.Column(db.String(50), default='general')  # general, notifications, security, payments
    description = db.Column(db.Text)
    is_editable = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def __repr__(self):
        return f'<Settings {self.setting_key}: {self.setting_value}>'

    def get_value(self):
        """Get the typed value based on setting_type"""
        if self.setting_type == 'boolean':
            return self.setting_value.lower() in ('true', '1', 'yes', 'on')
        elif self.setting_type == 'integer':
            try:
                return int(self.setting_value)
            except (ValueError, TypeError):
                return 0
        elif self.setting_type == 'json':
            try:
                import json
                return json.loads(self.setting_value)
            except (ValueError, TypeError):
                return {}
        else:
            return self.setting_value

    def set_value(self, value):
        """Set the value and automatically determine type"""
        if isinstance(value, bool):
            self.setting_type = 'boolean'
            self.setting_value = str(value).lower()
        elif isinstance(value, int):
            self.setting_type = 'integer'
            self.setting_value = str(value)
        elif isinstance(value, dict) or isinstance(value, list):
            self.setting_type = 'json'
            import json
            self.setting_value = json.dumps(value)
        else:
            self.setting_type = 'string'
            self.setting_value = str(value)



#####################################################################################################################################################


class Category(db.Model):
    __tablename__ = 'categories'

    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_name = db.Column(db.String(100), nullable=False, unique=True )
    category_description = db.Column(db.Text, nullable=False)
    # Additional field for category management
    name = db.Column(db.String(100), nullable=False, unique=True)  # Alias for category_name

    #Relationship mapping the categories to products
    products = db.relationship('Product', back_populates="category", lazy='dynamic' )

###############################################################################################################################################


class Product(db.Model):
    """Product Table"""
    __tablename__ = 'products'

    product_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # Frontend-facing stable slug id (e.g. "nk-air-max-270")
    product_slug = db.Column(db.String(150), unique=True, index=True)
    product_name= db.Column(db.String(150), nullable=False, unique=True)
    brand = db.Column(db.String(100))
    # Frontend categories: men / women / kids
    storefront_category = db.Column(db.String(50))
    is_new = db.Column(db.Boolean, default=False, nullable=False)
    sizes = db.Column(db.JSON, default=list)
    product_description = db.Column(db.Text, nullable=False)
    # Optional direct image fields used by the storefront card/details UI.
    image = db.Column(db.String(500))
    hover_image = db.Column(db.String(500))
    gallery = db.Column(db.JSON, default=list)
    product_price = db.Column(db.Float, nullable = False)
    stock_quantity = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    #Foreign Key To store categories id
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'))
    #Foreign Key To store supplier id
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.supplier_id'))
    #Relationship mapping the product to the related categories
    category = db.relationship('Category', back_populates="products")
    #Relationship mapping the product to the related supplier
    supplier = db.relationship('Supplier', back_populates="products")
    #Relationships mapping the product to multiple reviews
    reviews = db.relationship('Review', back_populates="product")
    #Relationship mapping products to multiple order items
    order_items = db.relationship('OrderItem', back_populates="product")
    # Relationship with ProductImage
    images = db.relationship('ProductImage', back_populates='product', cascade='all, delete-orphan')

    cart_items = db.relationship('CartItem', back_populates="product")
    wishlist_entries = db.relationship(
        "WishlistItem", back_populates="product", cascade="all, delete-orphan"
    )


#####################################################################################################################################################################################

class Order(db.Model):
    __tablename__ = 'orders'

    order_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_date = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    total_amount = db.Column(db.Float, nullable=False)
    # Frontend uses KES naming heavily; keep a dedicated mirror value.
    total_kes = db.Column(db.Float)
    order_status = db.Column(db.Enum(OrderStatus, name="order_status"), default=OrderStatus.PENDING, nullable=False)
    shipping_address = db.Column(db.Text, nullable=False)
    customer_name = db.Column(db.String(150))
    customer_phone = db.Column(db.String(30))
    customer_email = db.Column(db.String(120))
    city = db.Column(db.String(100))
    county = db.Column(db.String(100))
    courier = db.Column(db.String(100))
    payment_method_label = db.Column(db.String(80))
    mpesa_ref = db.Column(db.String(100))
    staff_notes = db.Column(db.Text)
    timeline = db.Column(db.JSON, default=list)
    # Additional fields for order management
    status = db.Column(db.Enum(OrderStatus, name="status"), default=OrderStatus.PENDING, nullable=False)
    payment_status = db.Column(db.Enum(PaymentStatus, name="payment_status"), default=PaymentStatus.PENDING, nullable=False)


    #Foreign Key To store user id
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))



    #Relationship mapping the order to the related user
    user = db.relationship('User', back_populates="orders")
    #Relationships mapping the order to multiple order items
    order_items = db.relationship('OrderItem', back_populates="order")
    #Relationship to map the order to the payment
    payment = db.relationship('Payment', uselist=False, back_populates="order")
    #Relationship to map order to refunds
    refunds = db.relationship('Refund', back_populates="order")


##############################################################################################################################################################################

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    order_item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    quantity = db.Column(db.Integer, default=1)
    price = db.Column(db.Float, nullable=False)  # Changed from String to Float
    # Storefront line item attributes
    size = db.Column(db.String(20))
    product_name_snapshot = db.Column(db.String(200))
    product_brand_snapshot = db.Column(db.String(120))
    product_image_snapshot = db.Column(db.String(500))
    discount = db.Column(db.String(100))
    shipping_cost = db.Column(db.String(100))
    tax = db.Column(db.String(100))
    discount_type = db.Column(db.Enum(DiscountType, name="discount_type"), default=DiscountType.REGULAR)
    shipping_status = db.Column(db.Enum(ShippingStatus, name="shipping_status"), default=ShippingStatus.PENDING, nullable=False)
    

    #Foreign Key To store order id
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'), nullable=False)
    #Foreign key to store a product d
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), nullable=False)
    #Relationship mapping the order item to the related order
    order = db.relationship('Order', back_populates="order_items")
    #Relationship mapping the order item to the related product
    product = db.relationship('Product', back_populates="order_items")
    


################################################################################################################################################################################################


class Payment(db.Model):
    __tablename__ = 'payments'

    payment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    payment_amount = db.Column(db.String(100), nullable=False)
    transaction_id = db.Column(db.String(100),unique=True, nullable=False)
    payment_status = db.Column(db.Enum(PaymentStatus, name="payment_status"), default=PaymentStatus.PENDING, nullable=False)
    payment_date = db.Column(db.DateTime, server_default=db.func.current_timestamp())

    #Foreign key to store order id
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'), nullable=False)
    #Foreign key to store payment method id
    payment_method_id = db.Column(db.Integer, db.ForeignKey('payment_methods.payment_method_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) 
    #Relationship mapping the payment to the related order
    order = db.relationship('Order', back_populates="payment")
    #Relationship mapping the payment to the related payment method
    payment_method = db.relationship('PaymentMethod', back_populates="payment")

    payment_responses = db.relationship('PaymentResponse', back_populates='payment')
    transactions = db.relationship('Transaction', back_populates='payment')
    user = db.relationship('User', back_populates='payments')


####################################################################################################################################################################
class PaymentMethod(db.Model):
    __tablename__ = 'payment_methods'

    payment_method_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    card_type = db.Column(db.String(50), nullable=False)
    card_number = db.Column(db.String(50), nullable=False)
    expiration_date = db.Column(db.String(10), nullable=False)
    security_code = db.Column(db.String(5), nullable=False)
    billing_address = db.Column(db.Text, nullable=False)

    #Foreign Key To store user id
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    #Relationship mapping the payment method to the related user
    user = db.relationship('User', back_populates="payment_method")
    #Relationships mapping the payment method to multiple payments
    payment = db.relationship('Payment', back_populates="payment_method")

################################################################################################################################################################################

class PaymentResponse(db.Model):
    __tablename__ = 'payment_response'

    id = db.Column(db.Integer, primary_key=True)
    response_code = db.Column(db.String(10), nullable=False)
    response_description = db.Column(db.String(255))
    merchant_request_id = db.Column(db.String(100))
    checkout_request_id = db.Column(db.String(100))
    result_code = db.Column(db.String(10))
    result_description = db.Column(db.String(255))
    raw_callback = db.Column(db.JSON)  # Stores the complete callback data
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())


    #Foreign Key To store payment id
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.payment_id'), nullable=False)
    #Relationships mapping the payment method to multiple payments responses
    payment = db.relationship('Payment', back_populates="payment_responses")

    def __repr__(self):
        return f'<PaymentResponse {self.id}>'

###############################################################################################################################################################################################

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.String(100), unique=True)
    amount = db.Column(db.Float)
    phone_number = db.Column(db.String(20))
    status = db.Column(db.String(20), default='PENDING')
    mpesa_receipt_number = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())


    #Foreign Key To store payment id
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.payment_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Direct user reference
    #Relationships mapping the payment method to multiple payments responses
    payment = db.relationship('Payment', back_populates="transactions")
    user = db.relationship('User')


    def __repr__(self):
        return f'<Transaction {self.transaction_id}>'



########################################################################################################################################################################################################
class ShoppingCart(db.Model):
    __tablename__ ='shopping_carts'


    shopping_cart_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    shopping_quantity = db.Column(db.Integer, default=1)
    total_price = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    #Foreign Key To store user id
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    

    #Relationship mapping the shopping cart to the related user
    user = db.relationship('User', back_populates="shopping_cart")
    #Relationships mapping the shopping cart to multiple cart items
    cart_items = db.relationship('CartItem', back_populates="shopping_cart")

##########################################################################################################################################################################

class CartItem(db.Model):
    __tablename__ = 'cart_items'
    cart_item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    price = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    # Storefront requires size-level selections per product.
    size = db.Column(db.String(20))
    product_name_snapshot = db.Column(db.String(200))
    product_brand_snapshot = db.Column(db.String(120))
    product_image_snapshot = db.Column(db.String(500))
    added_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())


    #Foreign Key To store shopping cart id
    shopping_cart_id = db.Column(db.Integer, db.ForeignKey('shopping_carts.shopping_cart_id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), nullable=False)
    #Relationship mapping the cart item to the related shopping cart
    shopping_cart = db.relationship('ShoppingCart', back_populates="cart_items")
    product = db.relationship('Product', back_populates="cart_items")
    




######################################################################################################################################################################################
class Review(db.Model):
    __tablename__ ='reviews'
    
    review_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    rating = db.Column(db.Integer, nullable=False)
    review_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    #Foreign key to store user id 
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'),nullable=False)
    #Foreign key to store product id
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), nullable=False)

    #Relationship mapping the review to the related user
    user = db.relationship('User', back_populates="reviews")
    #Relationship mapping the review to the related product
    product = db.relationship('Product', back_populates="reviews")


########################################################################################################################################################################################
class Wishlist(db.Model):
    __tablename__ ='wishlists'
    
    wishlist_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    #Foreign key to store user id
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    #Relationship mapping the wishlist to the related user
    user = db.relationship('User', back_populates="wishlists")
    


class WishlistItem(db.Model):
    """Per-user saved products (wishlist)."""
    __tablename__ = "wishlist_items"

    wishlist_item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.product_id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())

    user = db.relationship("User", back_populates="wishlist_items")
    product = db.relationship("Product", back_populates="wishlist_entries")

    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),
    )


####################################################################################################################################################

#########################################################################################################################################################################
class Promotion(db.Model):
    __tablename__ ='promotions'

    promotion_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    promotion_code = db.Column(db.String(50),unique=True, nullable=False)
    # Support frontend's custom admin promotions table shape.
    display_name = db.Column(db.String(120))
    discount_type = db.Column(db.Enum(DiscountType, name="discount_type_enum"), default=DiscountType.PERCENTAGE, nullable=False)
    discount_value = db.Column(db.Integer, nullable=False)
    min_spend_kes = db.Column(db.Float, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_seed = db.Column(db.Boolean, default=False, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

###############################################################################################################################################################################

class ProductImage(db.Model):
    """Product Images Table"""
    __tablename__ = 'product_images'

    image_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    image_url = db.Column(db.String(200), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Foreign Key to associate images with a product
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), nullable=False)

    # Relationship mapping images to a product
    product = db.relationship('Product', back_populates='images')

    @validates("image_url")
    def validate_image_url(self, key, image_url):
        """Persist product image paths as static-relative uploads URLs."""
        if not image_url:
            raise ValueError("image_url is required")
        normalized = str(image_url).strip().replace("\\", "/").lstrip("/")
        if normalized.startswith("static/"):
            normalized = normalized[len("static/") :]
        if not normalized.startswith("uploads/"):
            normalized = f"uploads/{normalized.split('/')[-1]}"
        return normalized

###########################################################################################################################################################
class ShippingInformation(db.Model):
    __tablename__ ='shipping_information'

    shipping_info_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    shipping_address = db.Column(db.Text, nullable=False)
    shipping_method = db.Column(db.String(50), nullable=False)
    tracking_number = db.Column(db.String(100),unique=True, nullable=False)
    estimated_delivery = db.Column(db.DateTime, nullable=True)
    actual_delivery = db.Column(db.DateTime, nullable=True)
    shipping_status = db.Column(db.Enum(ShippingStatus, name="shipping_status"), default=ShippingStatus.PENDING, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())


    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'), nullable=False)
    order = db.relationship('Order', backref='shipping_info')


###################################################################################################################################################################################################

class BillingInformation(db.Model):
    __tablename__ = 'billing_information'

    billing_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    company_name = db.Column(db.String(100))
    country = db.Column(db.String(100), nullable=False)
    street_address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    province = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    additional_info = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())

###################################################################################################################################################################

class UserShippingInformation(db.Model):
    """User's saved shipping information for quick checkout"""
    __tablename__ = 'user_shipping_information'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    company_name = db.Column(db.String(100))
    country = db.Column(db.String(100), nullable=False)
    street_address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    province = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    additional_info = db.Column(db.Text)
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relationship to user
    user = db.relationship('User', backref='shipping_information')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'company_name': self.company_name,
            'country': self.country,
            'street_address': self.street_address,
            'city': self.city,
            'province': self.province,
            'zip_code': self.zip_code,
            'phone': self.phone,
            'email': self.email,
            'additional_info': self.additional_info,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

###################################################################################################################################################################

class NewsletterSubscriber(db.Model):

    __tablename__ = 'newsletter_subscribers'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    subscribed_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(200))
    token_expires_at = db.Column(db.DateTime)
    ip_address = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
        
class BlogPost(db.Model):
    """Blog Posts Table"""
    __tablename__ = 'blog_posts'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(250), unique=True, nullable=False)
    excerpt = db.Column(db.Text, nullable=False)
    content = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(100), default='Admin')
    category = db.Column(db.String(50), nullable=False)
    tags = db.Column(db.String(200))  # Comma-separated tags
    featured_image = db.Column(db.String(500))
    is_published = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    view_count = db.Column(db.Integer, default=0)
    date_posted = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relationship with images
    images = db.relationship('BlogImage', back_populates='blog_post', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<BlogPost {self.title}>'


class BlogImage(db.Model):
    """Blog Images Table"""
    __tablename__ = 'blog_images'

    image_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    blog_post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id'), nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    alt_text = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relationship with blog post
    blog_post = db.relationship('BlogPost', back_populates='images')

    def __repr__(self):
        return f'<BlogImage {self.filename}>'    

################################################################################################################################################################################################
#dded today
class SocialMediaPost(db.Model):
    """Social Media Posts Table"""
    __tablename__ = 'social_media_posts'

    post_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    platform = db.Column(db.String(50), nullable=False)  # 'instagram', 'facebook', 'twitter', etc.
    post_url = db.Column(db.String(500), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.Text)
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    posted_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    is_featured = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def __repr__(self):
        return f'<SocialMediaPost {self.post_id}>'

class SocialMediaStats(db.Model):
    """Social Media Statistics Table"""
    __tablename__ = 'social_media_stats'

    stat_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    platform = db.Column(db.String(50), nullable=False)
    followers_count = db.Column(db.Integer, default=0)
    posts_count = db.Column(db.Integer, default=0)
    engagement_rate = db.Column(db.Float, default=0.0)
    last_updated = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def __repr__(self):
        return f'<SocialMediaStats {self.platform}>'

################################################################################################################################################################################################
class Refund(db.Model):
    __tablename__ = 'refunds'
    
    refund_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.Enum(RefundStatus), default=RefundStatus.REQUESTED)
    admin_notes = db.Column(db.Text)
    requested_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    processed_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    
    order = db.relationship('Order', back_populates='refunds')
    user = db.relationship('User', back_populates='refunds')

###############################################################################################################################################################################################################
class Coupon(db.Model):
    __tablename__ = 'coupons'
    
    coupon_id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    discount_type = db.Column(db.Enum(DiscountType), nullable=False)
    discount_value = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    valid_from = db.Column(db.DateTime, default=datetime.now)
    valid_to = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    min_order_amount = db.Column(db.Float)
    max_discount_amount = db.Column(db.Float)
    usage_limit = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())


###############################################################################################################################################################################################################
class Supplier(db.Model):
    """Supplier Table"""
    __tablename__ = 'suppliers'

    supplier_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=False)
    website = db.Column(db.String(200))
    rating = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='active')  # active, inactive, suspended
    notes = db.Column(db.Text)
    last_order_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relationships
    products = db.relationship('Product', back_populates='supplier', lazy='dynamic')

    def __repr__(self):
        return f'<Supplier {self.name}>'