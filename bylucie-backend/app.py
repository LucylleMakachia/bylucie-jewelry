"""
E-commerce Backend API with User Verification System
Handles orders, authentication, and verification for both guests and signed-in users.
"""

import os
import random
import json
import logging
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta

# Flask imports
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_migrate import Migrate
import sqlalchemy
from sqlalchemy import text, inspect

# Redis import with error handling
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    print("Redis not installed. Run: pip install redis")
    REDIS_AVAILABLE = False

# Africa's Talking import with error handling
AFRICASTALKING_AVAILABLE = False
AFRICASTALKING_SMS = None
try:
    import africastalking
    AFRICASTALKING_AVAILABLE = True
    print("✅ Africa's Talking imported successfully")
except ImportError as e:
    print(f"❌ Africa's Talking import failed: {e}")
    print("📱 SMS will use console fallback")

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, 
     origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'fallback-secret-key')
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///app.db')
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT_STR = os.getenv('REDIS_PORT', '6379')
REDIS_DB_STR = os.getenv('REDIS_DB', '0')

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
FROM_EMAIL = os.getenv('FROM_EMAIL', '')

# SMS configuration
AT_API_KEY = os.getenv('AT_API_KEY', '')
AT_USERNAME = os.getenv('AT_USERNAME', 'sandbox')
AT_SENDER_ID = os.getenv('AT_SENDER_ID', '')
SMS_ENABLED = os.getenv('SMS_ENABLED', 'false').lower() == 'true'

app.config['JWT_SECRET_KEY'] = JWT_SECRET
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)

# Initialize Redis (with fallback for development)
REDIS_CLIENT = None
if REDIS_AVAILABLE:
    try:
        REDIS_CLIENT = redis.Redis(
            host=REDIS_HOST,
            port=int(REDIS_PORT_STR),
            db=int(REDIS_DB_STR),
            decode_responses=True
        )
        REDIS_CLIENT.ping()
        logger.info("✅ Redis connection successful")
    except (redis.ConnectionError, ValueError) as e:
        logger.error("❌ Redis connection failed: %s", e)
        REDIS_CLIENT = None
else:
    logger.warning("⚠️ Redis not available - using in-memory fallback")

# Initialize Africa's Talking if available
if AFRICASTALKING_AVAILABLE and AT_API_KEY and AT_USERNAME and SMS_ENABLED:
    try:
        africastalking.initialize(AT_USERNAME, AT_API_KEY)
        AFRICASTALKING_SMS = africastalking.SMS
        logger.info("✅ Africa's Talking initialized successfully")
    except Exception as e:  # pylint: disable=broad-except
        logger.error("❌ Africa's Talking initialization failed: %s", e)
        AFRICASTALKING_SMS = None
else:
    if not AFRICASTALKING_AVAILABLE:
        logger.info("ℹ️ Africa's Talking package not available")
    elif not SMS_ENABLED:
        logger.info("ℹ️ SMS verification disabled via configuration")
    else:
        logger.warning("⚠️ Africa's Talking not fully configured")
    AFRICASTALKING_SMS = None

# In-memory fallback for development
MEMORY_STORE = {}


class User(db.Model):
    """User model for authenticated users."""

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    is_verified = db.Column(db.Boolean, default=False)
    verified_at = db.Column(db.DateTime)
    two_factor_secret = db.Column(db.String(32))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship with orders
    orders = db.relationship('Order', backref='user', lazy=True)

    def to_dict(self):
        """Convert user object to dictionary."""
        return {
            'id': self.id,
            'email': self.email,
            'phone': self.phone,
            'is_verified': self.is_verified,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None
        }


class Order(db.Model):
    """Order model for both guest and user orders."""

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    customer_email = db.Column(db.String(120), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    customer_name = db.Column(db.String(100), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')
    is_guest_order = db.Column(db.Boolean, default=False)
    user_verified = db.Column(db.Boolean, default=False)
    verification_method = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Order items relationship
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        """Convert order object to dictionary."""
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer_email': self.customer_email,
            'customer_name': self.customer_name,
            'total_amount': self.total_amount,
            'status': self.status,
            'is_guest_order': self.is_guest_order,
            'user_verified': self.user_verified,
            'created_at': self.created_at.isoformat()
        }


class OrderItem(db.Model):
    """Order items model."""

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, nullable=False)
    product_name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    size = db.Column(db.String(50), nullable=True)
    color = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        """Convert order item object to dictionary."""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'quantity': self.quantity,
            'price': self.price,
            'size': self.size,
            'color': self.color
        }


class Product(db.Model):
    """Product model for stock management."""

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)
    stock_quantity = db.Column(db.Integer, default=0)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    material = db.Column(db.String(100))
    color = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert product object to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'stock_quantity': self.stock_quantity,
            'description': self.description,
            'category': self.category,
            'material': self.material,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


def send_verification_email(email, code):
    """
    Send verification email using SMTP.

    Args:
        email (str): Recipient email address
        code (str): Verification code to send

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.warning("SMTP not configured - printing code to console: %s", code)
        return True

    try:
        subject = "Your Verification Code"
        body = f"""
        Hello,

        Your verification code is: {code}

        This code will expire in 10 minutes.

        If you didn't request this code, please ignore this email.

        Thank you,
        Your Store Team
        """

        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = email

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info("Verification email sent to %s", email)
        return True
    except Exception as e:  # pylint: disable=broad-except
        logger.error("Failed to send email to %s: %s", email, e)
        logger.info("Verification code for email %s: %s", email, code)
        return False


def send_verification_sms(phone, code):
    """
    Send verification SMS using Africa's Talking.

    Args:
        phone (str): Recipient phone number
        code (str): Verification code to send

    Returns:
        bool: True if SMS sent successfully, False otherwise
    """
    # Always log to console for backup
    logger.info("Verification code for phone %s: %s", phone, code)

    if not AFRICASTALKING_SMS or not SMS_ENABLED:
        logger.warning("SMS service not available - using console fallback")
        return True

    try:
        # Format phone number for Kenya if needed
        if phone.startswith('0'):
            phone = '+254' + phone[1:]
        elif not phone.startswith('+'):
            phone = '+254' + phone

        message = f"Your verification code is: {code}. This code expires in 10 minutes."

        response = AFRICASTALKING_SMS.send(message, [phone], AT_SENDER_ID)
        
        # More robust response handling
        if (response and 
            response.get('SMSMessageData') and 
            response['SMSMessageData'].get('Recipients') and 
            len(response['SMSMessageData']['Recipients']) > 0):
            
            recipient_status = response['SMSMessageData']['Recipients'][0].get('status', 'Unknown')
            if recipient_status == 'Success':
                logger.info("SMS sent successfully to %s", phone)
                return True
            else:
                logger.error("Failed to send SMS to %s: Status %s", phone, recipient_status)
                return False
        else:
            logger.error("Unexpected response format from Africa's Talking: %s", response)
            return False

    except Exception as e:  # pylint: disable=broad-except
        logger.error("Failed to send SMS to %s: %s", phone, e)
        return False


def init_database():
    """Initialize database tables safely."""
    with app.app_context():
        try:
            # Check if tables exist
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            if not existing_tables:
                logger.info("Creating database tables...")
                db.create_all()
                logger.info("Database tables created successfully")
            else:
                logger.info("Database tables already exist")
                
        except Exception as e:
            logger.error("Database initialization error: %s", e)
            raise


# Initialize database
init_database()


@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products."""
    try:
        products = Product.query.all()
        products_data = []
        
        for product in products:
            product_data = {
                'id': product.id,
                'name': product.name,
                'price': float(product.price),
                'stock_quantity': product.stock_quantity,
                'description': product.description or '',
                'category': product.category or 'Uncategorized',
                'inStock': product.stock_quantity > 0,
                'stock': product.stock_quantity,
                'images': ['/images/placeholder.jpg'],
                'imageUrl': '/images/placeholder.jpg',
                'rating': 0,
                'reviewCount': 0,
                'material': product.material or 'Unknown',
                'color': product.color or 'Various'
            }
            products_data.append(product_data)
        
        logger.info("Fetched %d products", len(products_data))
        return jsonify(products_data)
    except Exception as e:
        logger.error("Error fetching products: %s", e)
        return jsonify({"error": "Failed to fetch products"}), 500


@app.route('/api/auth/send-guest-verification', methods=['POST'])
def send_guest_verification():
    """
    Send verification code to guest user's email or phone.

    Request Body:
        method (str): 'email' or 'phone'
        email (str): User's email address
        phone (str): User's phone number

    Returns:
        JSON response with success message or error
    """
    data = request.get_json()
    method = data.get('method', 'email')
    email = data.get('email')
    phone = data.get('phone')

    if not email and not phone:
        return jsonify({"error": "Email or phone required"}), 400

    # Generate 6-digit code
    verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])

    # Store with expiration (10 minutes)
    storage_data = json.dumps({
        "code": verification_code,
        "attempts": 0,
        "verified": False
    })

    if REDIS_CLIENT:
        if method == 'email' and email:
            REDIS_CLIENT.setex(f"guest_verify:email:{email}", 600, storage_data)
        elif method == 'phone' and phone:
            REDIS_CLIENT.setex(f"guest_verify:phone:{phone}", 600, storage_data)
    else:
        # Fallback to memory storage
        if method == 'email' and email:
            MEMORY_STORE[f"guest_verify:email:{email}"] = {
                "data": storage_data,
                "expires": datetime.now() + timedelta(minutes=10)
            }
        elif method == 'phone' and phone:
            MEMORY_STORE[f"guest_verify:phone:{phone}"] = {
                "data": storage_data,
                "expires": datetime.now() + timedelta(minutes=10)
            }

    # Send verification code
    success = True
    if method == 'email' and email:
        success = send_verification_email(email, verification_code)
    elif method == 'phone' and phone:
        success = send_verification_sms(phone, verification_code)

    if not success:
        return jsonify({"error": "Failed to send verification code. Please try again."}), 500

    return jsonify({"message": f"Verification code sent via {method}"})


@app.route('/api/auth/verify-guest', methods=['POST'])
def verify_guest():
    """
    Verify guest user's verification code.

    Request Body:
        code (str): 6-digit verification code
        method (str): 'email' or 'phone'
        email (str): User's email address
        phone (str): User's phone number

    Returns:
        JSON response with success message or error
    """
    data = request.get_json()
    code = data.get('code')
    method = data.get('method', 'email')
    email = data.get('email')
    phone = data.get('phone')

    if not code:
        return jsonify({"error": "Verification code required"}), 400

    # Get verification data
    if method == 'email' and email:
        attempt_key = f"guest_verify:email:{email}"
    elif method == 'phone' and phone:
        attempt_key = f"guest_verify:phone:{phone}"
    else:
        return jsonify({"error": "Invalid verification method"}), 400

    attempt_data = None

    if REDIS_CLIENT:
        attempt_data = REDIS_CLIENT.get(attempt_key)
    else:
        # Check memory storage
        if attempt_key in MEMORY_STORE:
            storage = MEMORY_STORE[attempt_key]
            if datetime.now() < storage["expires"]:
                attempt_data = storage["data"]
            else:
                del MEMORY_STORE[attempt_key]

    if not attempt_data:
        return jsonify({"error": "Verification session expired"}), 400

    attempt_data = json.loads(attempt_data)

    # Check attempt limits
    if attempt_data["attempts"] >= 5:
        if REDIS_CLIENT:
            REDIS_CLIENT.delete(attempt_key)
        else:
            MEMORY_STORE.pop(attempt_key, None)
        return jsonify({"error": "Too many attempts. Please request a new code."}), 400

    # Verify code
    if attempt_data["code"] == code:
        # Mark as verified with shorter expiration (1 hour for order completion)
        attempt_data["verified"] = True
        verified_data = json.dumps(attempt_data)

        if REDIS_CLIENT:
            REDIS_CLIENT.setex(attempt_key, 3600, verified_data)
        else:
            MEMORY_STORE[attempt_key] = {
                "data": verified_data,
                "expires": datetime.now() + timedelta(hours=1)
            }

        return jsonify({"message": "Identity verified successfully"})
    else:
        # Increment attempts
        attempt_data["attempts"] += 1
        updated_data = json.dumps(attempt_data)

        if REDIS_CLIENT:
            REDIS_CLIENT.setex(attempt_key, 600, updated_data)
        else:
            MEMORY_STORE[attempt_key] = {
                "data": updated_data,
                "expires": datetime.now() + timedelta(minutes=10)
            }

        return jsonify({"error": "Invalid verification code"}), 400


@app.route('/api/auth/send-account-verification', methods=['POST'])
@jwt_required()
def send_account_verification():
    """
    Send verification code to authenticated user's email or phone.

    Request Body:
        method (str): 'email' or 'phone'

    Returns:
        JSON response with success message or error
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    method = data.get('method', 'email')

    # Fetch user from database
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Generate 6-digit code
    verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])

    # Store with user context
    storage_data = json.dumps({
        "code": verification_code,
        "attempts": 0,
        "verified": False
    })

    if REDIS_CLIENT:
        REDIS_CLIENT.setex(
            f"account_verify:{user_id}:{method}",
            600,  # 10 minutes
            storage_data
        )
    else:
        MEMORY_STORE[f"account_verify:{user_id}:{method}"] = {
            "data": storage_data,
            "expires": datetime.now() + timedelta(minutes=10)
        }

    # Send via chosen method
    success = True
    if method == 'email':
        success = send_verification_email(user.email, verification_code)
    elif method == 'phone' and user.phone:
        success = send_verification_sms(user.phone, verification_code)
    else:
        return jsonify({"error": "Phone number not available for this user"}), 400

    if not success:
        return jsonify({"error": "Failed to send verification code. Please try again."}), 500

    return jsonify({"message": f"Verification code sent via {method}"})


@app.route('/api/auth/verify-account', methods=['POST'])
@jwt_required()
def verify_account():
    """
    Verify authenticated user's verification code.

    Request Body:
        code (str): 6-digit verification code
        method (str): 'email' or 'phone'

    Returns:
        JSON response with success message or error
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    code = data.get('code')
    method = data.get('method', 'email')

    if not code:
        return jsonify({"error": "Verification code required"}), 400

    # Check verification attempts
    attempt_key = f"account_verify:{user_id}:{method}"
    attempt_data = None

    if REDIS_CLIENT:
        attempt_data = REDIS_CLIENT.get(attempt_key)
    else:
        if attempt_key in MEMORY_STORE:
            storage = MEMORY_STORE[attempt_key]
            if datetime.now() < storage["expires"]:
                attempt_data = storage["data"]
            else:
                del MEMORY_STORE[attempt_key]

    if not attempt_data:
        return jsonify({"error": "Verification session expired"}), 400

    attempt_data = json.loads(attempt_data)

    # Check attempt limits
    if attempt_data["attempts"] >= 5:
        if REDIS_CLIENT:
            REDIS_CLIENT.delete(attempt_key)
        else:
            MEMORY_STORE.pop(attempt_key, None)
        return jsonify({"error": "Too many attempts. Please request a new code."}), 400

    # Verify code
    if attempt_data["code"] == code:
        # Mark user as verified in database
        user = User.query.get(user_id)
        user.is_verified = True
        user.verified_at = datetime.utcnow()
        db.session.commit()

        # Clear verification data
        if REDIS_CLIENT:
            REDIS_CLIENT.delete(attempt_key)
        else:
            MEMORY_STORE.pop(attempt_key, None)

        return jsonify({"message": "Account verified successfully"})
    else:
        # Increment attempts
        attempt_data["attempts"] += 1
        updated_data = json.dumps(attempt_data)

        if REDIS_CLIENT:
            REDIS_CLIENT.setex(attempt_key, 600, updated_data)
        else:
            MEMORY_STORE[attempt_key] = {
                "data": updated_data,
                "expires": datetime.now() + timedelta(minutes=10)
            }

        return jsonify({"error": "Invalid verification code"}), 400


@app.route('/api/orders/check-guest-limits', methods=['POST'])
def check_guest_limits():
    """
    Check if guest user has exceeded order limits.

    Request Body:
        email (str): User's email address
        phone (str): User's phone number

    Returns:
        JSON response with limit information
    """
    data = request.get_json()
    email = data.get('email')
    phone = data.get('phone')

    if not email and not phone:
        return jsonify({"error": "Email or phone required"}), 400

    # Query the database for recent orders
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)

    email_orders = 0
    phone_orders = 0

    if email:
        email_orders = Order.query.filter(
            Order.customer_email == email,
            Order.created_at >= twenty_four_hours_ago
        ).count()

    if phone:
        phone_orders = Order.query.filter(
            Order.customer_phone == phone,
            Order.created_at >= twenty_four_hours_ago
        ).count()

    limits = {
        "tooManyOrders": email_orders >= 3 or phone_orders >= 3,
        "suspiciousActivity": email_orders >= 5 or phone_orders >= 5,
        "field": "email" if email_orders >= 3 else "phone" if phone_orders >= 3 else None,
        "emailOrderCount": email_orders,
        "phoneOrderCount": phone_orders
    }

    return jsonify(limits)


@app.route('/api/products/stock-check', methods=['POST'])
def stock_check():
    """
    Check stock availability for multiple products.

    Request Body:
        productIds (list): List of product IDs to check

    Returns:
        JSON object with product IDs as keys and available stock as values
    """
    data = request.get_json()
    product_ids = data.get('productIds', [])

    if not product_ids:
        return jsonify({"error": "Product IDs required"}), 400

    # Query database for product stock
    products = Product.query.filter(Product.id.in_(product_ids)).all()

    stock_data = {}
    for product in products:
        stock_data[product.id] = product.stock_quantity

    # Include products that weren't found (out of stock)
    for product_id in product_ids:
        if product_id not in stock_data:
            stock_data[product_id] = 0

    return jsonify(stock_data)


@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    """
    Create a new order for authenticated user.

    Request Body:
        items (list): Order items
        customerInfo (object): Customer information
        deliveryOption (str): Delivery method
        paymentMethod (str): Payment method
        totalAmount (float): Order total

    Returns:
        JSON response with created order data
    """
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        # Check if user is verified
        user = User.query.get(user_id)
        if not user.is_verified:
            return jsonify({"error": "Account verification required to place orders"}), 403

        # Create order
        order = Order(
            order_number=data.get('orderNumber'),
            user_id=user_id,
            customer_email=data['customerInfo']['email'],
            customer_phone=data['customerInfo']['phone'],
            customer_name=data['customerInfo']['fullName'],
            total_amount=data['totalAmount'],
            is_guest_order=False,
            user_verified=True,
            verification_method='account',
            status='pending'
        )

        db.session.add(order)
        db.session.flush()  # Get order ID

        # Add order items
        for item_data in data['items']:
            item = OrderItem(
                order_id=order.id,
                product_id=item_data['id'],
                product_name=item_data['name'],
                quantity=item_data['quantity'],
                price=item_data['price'],
                size=item_data.get('size'),
                color=item_data.get('color')
            )
            db.session.add(item)

            # Update product stock
            product = Product.query.get(item_data['id'])
            if product:
                if product.stock_quantity < item_data['quantity']:
                    db.session.rollback()
                    return jsonify({"error": f"Insufficient stock for {item_data['name']}"}), 400
                product.stock_quantity -= item_data['quantity']

        db.session.commit()

        return jsonify({
            "message": "Order created successfully",
            "orderId": order.id,
            "orderNumber": order.order_number
        })

    except (ValueError, KeyError, TypeError) as e:
        # Handle data validation errors
        db.session.rollback()
        logger.warning("Data validation error in create_order: %s", e)
        return jsonify({"error": f"Invalid data provided: {str(e)}"}), 400
    except sqlalchemy.exc.SQLAlchemyError as e:
        # Handle database errors
        db.session.rollback()
        logger.error("Database error in create_order: %s", e)
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:  # pylint: disable=broad-except
        # Catch-all for unexpected errors with proper comment
        db.session.rollback()
        logger.error("Unexpected error in create_order: %s", e)
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/orders/guest', methods=['POST'])
def create_guest_order():
    """
    Create a new order for guest user.

    Request Body:
        items (list): Order items
        customerInfo (object): Customer information
        deliveryOption (str): Delivery method
        paymentMethod (str): Payment method
        totalAmount (float): Order total

    Returns:
        JSON response with created order data
    """
    data = request.get_json()

    try:
        # Verify guest identity
        email = data['customerInfo']['email']
        phone = data['customerInfo']['phone']

        # Check if guest is verified
        verification_key = f"guest_verify:email:{email}"
        verification_data = None

        if REDIS_CLIENT:
            verification_data = REDIS_CLIENT.get(verification_key)
        else:
            if verification_key in MEMORY_STORE:
                storage = MEMORY_STORE[verification_key]
                if datetime.now() < storage["expires"]:
                    verification_data = storage["data"]

        if not verification_data:
            return jsonify({"error": "Guest identity verification required"}), 403

        verification_data = json.loads(verification_data)
        if not verification_data.get("verified"):
            return jsonify({"error": "Guest identity verification required"}), 403

        # Create guest order
        order = Order(
            order_number=data.get('orderNumber'),
            user_id=None,
            customer_email=email,
            customer_phone=phone,
            customer_name=data['customerInfo']['fullName'],
            total_amount=data['totalAmount'],
            is_guest_order=True,
            user_verified=True,
            verification_method='guest',
            status='pending'
        )

        db.session.add(order)
        db.session.flush()

        # Add order items
        for item_data in data['items']:
            item = OrderItem(
                order_id=order.id,
                product_id=item_data['id'],
                product_name=item_data['name'],
                quantity=item_data['quantity'],
                price=item_data['price'],
                size=item_data.get('size'),
                color=item_data.get('color')
            )
            db.session.add(item)

            # Update product stock
            product = Product.query.get(item_data['id'])
            if product:
                if product.stock_quantity < item_data['quantity']:
                    db.session.rollback()
                    return jsonify({"error": f"Insufficient stock for {item_data['name']}"}), 400
                product.stock_quantity -= item_data['quantity']

        db.session.commit()

        return jsonify({
            "message": "Guest order created successfully",
            "orderId": order.id,
            "orderNumber": order.order_number
        })

    except (ValueError, KeyError, TypeError) as e:
        # Handle data validation errors
        db.session.rollback()
        logger.warning("Data validation error in create_guest_order: %s", e)
        return jsonify({"error": f"Invalid data provided: {str(e)}"}), 400
    except sqlalchemy.exc.SQLAlchemyError as e:
        # Handle database errors
        db.session.rollback()
        logger.error("Database error in create_guest_order: %s", e)
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:  # pylint: disable=broad-except
        # Catch-all for unexpected errors with proper comment
        db.session.rollback()
        logger.error("Unexpected error in create_guest_order: %s", e)
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify API is running."""
    # Test database connection
    db_status = "healthy"
    try:
        db.session.execute(text('SELECT 1'))
    except sqlalchemy.exc.SQLAlchemyError as e:
        db_status = f"unhealthy: {str(e)}"
        logger.error("Database health check failed: %s", e)

    # Check email configuration
    email_status = "configured" if SMTP_USERNAME and SMTP_PASSWORD else "not configured"

    # Check SMS configuration
    sms_status = "configured" if AFRICASTALKING_SMS and SMS_ENABLED else "not configured"

    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": db_status,
        "email_service": email_status,
        "sms_service": sms_status,
        "redis_available": REDIS_CLIENT is not None
    })


if __name__ == '__main__':
    app.run(debug=True, port=5001, host='127.0.0.1')