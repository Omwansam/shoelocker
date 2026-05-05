import os
from werkzeug.utils import secure_filename
from flask import current_app
from pathlib import Path

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


def generate_unique_filename(filename, product_id):
    """Generate a unique filename using the product ID."""
    basename = secure_filename(filename.rsplit('.',1)[0])
    extension = filename.rsplit('.',1)[1].lower()
    return f"product_{product_id}_{basename}.{extension}"


def _product_upload_folder():
    """Always resolve product media to server/static/uploads."""
    static_uploads = Path(current_app.root_path) / "static" / "uploads"
    static_uploads.mkdir(parents=True, exist_ok=True)
    return static_uploads


def _normalize_image_url(filename):
    """Return DB path relative to Flask static root."""
    return f"uploads/{filename}"

###########################################################################################################################################
# Blog media 



def save_product_image(file, product_id):
    """Save the uploaded image and return the relative path."""
    if not file or not allowed_file(file.filename):
        return None

    filename = generate_unique_filename(file.filename, product_id)
    file_path = _product_upload_folder() / filename

    try:
        file.save(file_path)
        return _normalize_image_url(filename)
    except Exception as e:
        current_app.logger.error(f"Error saving product image: {str(e)}")
        return None

def delete_image_file(image_url):
    """
    Safely delete an image file from the filesystem.
    
    Args:
        image_url (str): The URL or path of the image to delete
        
    Returns:
        bool: True if file was deleted successfully, False otherwise
    """
    try:
        if not image_url:
            current_app.logger.warning("Empty image URL provided for deletion")
            return False
            
        # Extract filename securely
        filename = secure_filename(os.path.basename(image_url))
        if not filename:
            current_app.logger.error(f"Invalid filename extracted from URL: {image_url}")
            return False
            
        # Build full path safely
        upload_folder = _product_upload_folder()
        file_path = upload_folder / filename
        
        # Security check - ensure path is within upload folder
        try:
            file_path.resolve().relative_to(upload_folder.resolve())
        except ValueError:
            current_app.logger.error(f"Attempted to delete file outside upload directory: {file_path}")
            return False
            
        # Delete the file
        if file_path.exists():
            file_path.unlink()
            current_app.logger.info(f"Successfully deleted image file: {file_path}")
            return True
            
        current_app.logger.warning(f"Image file not found: {file_path}")
        return False
        
    except Exception as e:
        current_app.logger.error(f"Error deleting image file {image_url}: {str(e)}", exc_info=True)
        return False    