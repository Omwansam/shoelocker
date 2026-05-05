from flask import Blueprint, request, jsonify
from models import BillingInformation

from extensions import db

billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/test', methods=['GET'])
def test_billing():
    return jsonify({"message": "Billing blueprint working!"})


@billing_bp.route('/submit', methods=['POST'])
def submit_billing():
    
    data = request.get_json()

    required_fields = [
        "first_name", "last_name", "country", "street_address",
        "city", "province", "zip_code", "phone", "email"
    ]

    # Check for missing required fields
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    try:
        billing = BillingInformation(
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            company_name=data.get("company_name"),
            country=data.get("country"),
            street_address=data.get("street_address"),
            city=data.get("city"),
            province=data.get("province"),
            zip_code=data.get("zip_code"),
            phone=data.get("phone"),
            email=data.get("email"),
            additional_info=data.get("additional_info")
        )
        db.session.add(billing)
        db.session.commit()
        return jsonify({
            "message": "Billing information saved successfully.",
            "billing_id": billing.billing_id,
            "created_at": billing.created_at
            }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    
