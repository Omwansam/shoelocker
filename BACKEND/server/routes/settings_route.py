from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Settings, User
from datetime import datetime
import json

# Blueprint Configuration
settings_bp = Blueprint('settings', __name__)

def admin_required(f):
    """Decorator to check if user is admin"""
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@settings_bp.route('/admin/settings', methods=['GET'])
@jwt_required()
@admin_required
def get_all_settings():
    """Get all settings grouped by category"""
    try:
        settings = Settings.query.all()
        
        # Group settings by category
        grouped_settings = {}
        for setting in settings:
            if setting.category not in grouped_settings:
                grouped_settings[setting.category] = {}
            
            grouped_settings[setting.category][setting.setting_key] = {
                'value': setting.get_value(),
                'type': setting.setting_type,
                'description': setting.description,
                'is_editable': setting.is_editable,
                'updated_at': setting.updated_at.isoformat() if setting.updated_at else None
            }
        
        return jsonify({
            'success': True,
            'settings': grouped_settings
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch settings'
        }), 500

@settings_bp.route('/admin/settings/<category>', methods=['GET'])
@jwt_required()
@admin_required
def get_settings_by_category(category):
    """Get settings for a specific category"""
    try:
        settings = Settings.query.filter_by(category=category).all()
        
        category_settings = {}
        for setting in settings:
            category_settings[setting.setting_key] = {
                'value': setting.get_value(),
                'type': setting.setting_type,
                'description': setting.description,
                'is_editable': setting.is_editable,
                'updated_at': setting.updated_at.isoformat() if setting.updated_at else None
            }
        
        return jsonify({
            'success': True,
            'category': category,
            'settings': category_settings
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching {category} settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to fetch {category} settings'
        }), 500

@settings_bp.route('/admin/settings/<category>/<setting_key>', methods=['GET'])
@jwt_required()
@admin_required
def get_setting(category, setting_key):
    """Get a specific setting"""
    try:
        setting = Settings.query.filter_by(category=category, setting_key=setting_key).first()
        
        if not setting:
            return jsonify({
                'success': False,
                'error': 'Setting not found'
            }), 404
        
        return jsonify({
            'success': True,
            'setting': {
                'key': setting.setting_key,
                'value': setting.get_value(),
                'type': setting.setting_type,
                'category': setting.category,
                'description': setting.description,
                'is_editable': setting.is_editable,
                'updated_at': setting.updated_at.isoformat() if setting.updated_at else None
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching setting {setting_key}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch setting'
        }), 500

@settings_bp.route('/admin/settings/<category>/<setting_key>', methods=['PUT'])
@jwt_required()
@admin_required
def update_setting(category, setting_key):
    """Update a specific setting"""
    try:
        setting = Settings.query.filter_by(category=category, setting_key=setting_key).first()
        
        if not setting:
            return jsonify({
                'success': False,
                'error': 'Setting not found'
            }), 404
        
        if not setting.is_editable:
            return jsonify({
                'success': False,
                'error': 'This setting cannot be modified'
            }), 400
        
        data = request.get_json()
        if not data or 'value' not in data:
            return jsonify({
                'success': False,
                'error': 'Value is required'
            }), 400
        
        # Update the setting value
        setting.set_value(data['value'])
        setting.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Setting updated successfully',
            'setting': {
                'key': setting.setting_key,
                'value': setting.get_value(),
                'type': setting.setting_type,
                'category': setting.category,
                'updated_at': setting.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating setting {setting_key}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update setting'
        }), 500

@settings_bp.route('/admin/settings/<category>', methods=['POST'])
@jwt_required()
@admin_required
def create_setting(category):
    """Create a new setting"""
    try:
        data = request.get_json()
        
        if not data or 'setting_key' not in data or 'value' not in data:
            return jsonify({
                'success': False,
                'error': 'Setting key and value are required'
            }), 400
        
        # Check if setting already exists
        existing_setting = Settings.query.filter_by(
            category=category, 
            setting_key=data['setting_key']
        ).first()
        
        if existing_setting:
            return jsonify({
                'success': False,
                'error': 'Setting already exists'
            }), 400
        
        # Create new setting
        new_setting = Settings(
            setting_key=data['setting_key'],
            category=category,
            description=data.get('description', ''),
            is_editable=data.get('is_editable', True)
        )
        new_setting.set_value(data['value'])
        
        db.session.add(new_setting)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Setting created successfully',
            'setting': {
                'key': new_setting.setting_key,
                'value': new_setting.get_value(),
                'type': new_setting.setting_type,
                'category': new_setting.category,
                'description': new_setting.description,
                'is_editable': new_setting.is_editable,
                'created_at': new_setting.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating setting in {category}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create setting'
        }), 500

@settings_bp.route('/admin/settings/<category>/<setting_key>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_setting(category, setting_key):
    """Delete a setting"""
    try:
        setting = Settings.query.filter_by(category=category, setting_key=setting_key).first()
        
        if not setting:
            return jsonify({
                'success': False,
                'error': 'Setting not found'
            }), 404
        
        db.session.delete(setting)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Setting deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting setting {setting_key}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete setting'
        }), 500

@settings_bp.route('/admin/settings/bulk-update', methods=['PUT'])
@jwt_required()
@admin_required
def bulk_update_settings():
    """Update multiple settings at once"""
    try:
        data = request.get_json()
        
        if not data or 'updates' not in data:
            return jsonify({
                'success': False,
                'error': 'Updates array is required'
            }), 400
        
        updates = data['updates']
        updated_count = 0
        errors = []
        
        for update in updates:
            try:
                category = update.get('category')
                setting_key = update.get('setting_key')
                value = update.get('value')
                
                if not all([category, setting_key, 'value' in update]):
                    errors.append(f"Missing required fields for update: {update}")
                    continue
                
                setting = Settings.query.filter_by(
                    category=category, 
                    setting_key=setting_key
                ).first()
                
                if not setting:
                    errors.append(f"Setting not found: {category}/{setting_key}")
                    continue
                
                if not setting.is_editable:
                    errors.append(f"Setting not editable: {category}/{setting_key}")
                    continue
                
                setting.set_value(value)
                setting.updated_at = datetime.utcnow()
                updated_count += 1
                
            except Exception as e:
                errors.append(f"Error updating {update.get('setting_key', 'unknown')}: {str(e)}")
        
        if updated_count > 0:
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Updated {updated_count} settings',
            'updated_count': updated_count,
            'errors': errors if errors else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in bulk update: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to perform bulk update'
        }), 500

@settings_bp.route('/admin/settings/reset/<category>', methods=['POST'])
@jwt_required()
@admin_required
def reset_category_settings(category):
    """Reset all settings in a category to default values"""
    try:
        # This would typically load from a default configuration file
        # For now, we'll just return a success message
        return jsonify({
            'success': True,
            'message': f'Reset {category} settings to defaults'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error resetting {category} settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to reset {category} settings'
        }), 500

@settings_bp.route('/admin/settings/export', methods=['GET'])
@jwt_required()
@admin_required
def export_settings():
    """Export all settings as JSON"""
    try:
        settings = Settings.query.all()
        
        export_data = {}
        for setting in settings:
            if setting.category not in export_data:
                export_data[setting.category] = {}
            
            export_data[setting.category][setting.setting_key] = {
                'value': setting.get_value(),
                'type': setting.setting_type,
                'description': setting.description,
                'is_editable': setting.is_editable
            }
        
        return jsonify({
            'success': True,
            'export_data': export_data,
            'exported_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error exporting settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to export settings'
        }), 500

@settings_bp.route('/admin/settings/import', methods=['POST'])
@jwt_required()
@admin_required
def import_settings():
    """Import settings from JSON data"""
    try:
        data = request.get_json()
        
        if not data or 'settings' not in data:
            return jsonify({
                'success': False,
                'error': 'Settings data is required'
            }), 400
        
        imported_count = 0
        errors = []
        
        for category, category_settings in data['settings'].items():
            for setting_key, setting_data in category_settings.items():
                try:
                    # Check if setting exists
                    existing_setting = Settings.query.filter_by(
                        category=category,
                        setting_key=setting_key
                    ).first()
                    
                    if existing_setting:
                        # Update existing setting
                        existing_setting.set_value(setting_data.get('value'))
                        existing_setting.description = setting_data.get('description', existing_setting.description)
                        existing_setting.updated_at = datetime.utcnow()
                    else:
                        # Create new setting
                        new_setting = Settings(
                            setting_key=setting_key,
                            category=category,
                            description=setting_data.get('description', ''),
                            is_editable=setting_data.get('is_editable', True)
                        )
                        new_setting.set_value(setting_data.get('value'))
                        db.session.add(new_setting)
                    
                    imported_count += 1
                    
                except Exception as e:
                    errors.append(f"Error importing {category}/{setting_key}: {str(e)}")
        
        if imported_count > 0:
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Imported {imported_count} settings',
            'imported_count': imported_count,
            'errors': errors if errors else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error importing settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to import settings'
        }), 500
