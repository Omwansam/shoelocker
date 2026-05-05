from flask import Blueprint, jsonify, request, url_for, current_app
from models import BlogPost, BlogImage, db
from sqlalchemy import desc, func
from werkzeug.utils import secure_filename
import os
import re
from datetime import datetime, timedelta

blog_bp = Blueprint('blogs', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def generate_unique_filename(filename, post_id):
    """Generate a unique filename using the post ID."""
    basename = secure_filename(filename.rsplit('.',1)[0])
    extension = filename.rsplit('.',1)[1].lower()
    return f"blog_{post_id}_{basename}.{extension}"

def save_blog_media(file, post_id, file_type='post_image'):
    """Save the uploaded image and return the relative path"""
    if not file or not allowed_file(file.filename):
        return None
    
    filename = generate_unique_filename(file.filename, post_id)
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

    try:
        file.save(file_path)
        return f"uploads/{filename}"
    except Exception as e:
        current_app.logger.error(f"Error saving blog image: {str(e)}")
        return None

def create_slug(title):
    """Create a URL-friendly slug from the title"""
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

# Get all blog posts with pagination
@blog_bp.route('/posts', methods=['GET'])
def get_blog_posts():
    """Get all published blog posts with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 6, type=int)
        category = request.args.get('category')
        search = request.args.get('search')
        
        # Base query
        query = BlogPost.query.filter_by(is_published=True)
        
        # Apply filters
        if category:
            query = query.filter(BlogPost.category == category)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (BlogPost.title.ilike(search_term)) |
                (BlogPost.excerpt.ilike(search_term)) |
                (BlogPost.content.ilike(search_term))
            )
        
        # Order by date and paginate
        posts = query.order_by(desc(BlogPost.date_posted)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        result = []
        for post in posts.items:
            # Get primary image
            primary_image = BlogImage.query.filter_by(
                blog_post_id=post.id, 
                is_primary=True
            ).first()
            
            post_data = {
                'id': post.id,
                'title': post.title,
                'slug': post.slug,
                'excerpt': post.excerpt,
                'author': post.author,
                'category': post.category,
                'tags': post.tags.split(',') if post.tags else [],
                'featured_image': url_for('static', filename=primary_image.image_url, _external=True) if primary_image else None,
                'is_featured': post.is_featured,
                'view_count': post.view_count,
                'date_posted': post.date_posted.isoformat() if post.date_posted else None,
                'read_time': len(post.content.split()) // 200 + 1  # Rough estimate
            }
            result.append(post_data)
        
        return jsonify({
            'posts': result,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': posts.total,
                'pages': posts.pages,
                'has_next': posts.has_next,
                'has_prev': posts.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching blog posts: {str(e)}'}), 500

# Get featured blog posts
@blog_bp.route('/posts/featured', methods=['GET'])
def get_featured_posts():
    """Get featured blog posts"""
    try:
        limit = request.args.get('limit', 3, type=int)
        
        posts = BlogPost.query.filter_by(
            is_published=True,
            is_featured=True
        ).order_by(desc(BlogPost.date_posted)).limit(limit).all()
        
        result = []
        for post in posts:
            primary_image = BlogImage.query.filter_by(
                blog_post_id=post.id, 
                is_primary=True
            ).first()
            
            post_data = {
                'id': post.id,
                'title': post.title,
                'slug': post.slug,
                'excerpt': post.excerpt,
                'author': post.author,
                'category': post.category,
                'featured_image': url_for('static', filename=primary_image.image_url, _external=True) if primary_image else None,
                'date_posted': post.date_posted.isoformat() if post.date_posted else None
            }
            result.append(post_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching featured posts: {str(e)}'}), 500

# Get single blog post by slug
@blog_bp.route('/posts/<slug>', methods=['GET'])
def get_blog_post(slug):
    """Get a single blog post by slug"""
    try:
        post = BlogPost.query.filter_by(slug=slug, is_published=True).first()
        
        if not post:
            return jsonify({'error': 'Blog post not found'}), 404
        
        # Increment view count
        post.view_count += 1
        db.session.commit()
        
        # Get all images for this post
        images = BlogImage.query.filter_by(blog_post_id=post.id).all()
        
        post_data = {
            'id': post.id,
            'title': post.title,
            'slug': post.slug,
            'excerpt': post.excerpt,
            'content': post.content,
            'author': post.author,
            'category': post.category,
            'tags': post.tags.split(',') if post.tags else [],
            'featured_image': url_for('static', filename=post.featured_image, _external=True) if post.featured_image else None,
            'is_featured': post.is_featured,
            'view_count': post.view_count,
            'date_posted': post.date_posted.isoformat() if post.date_posted else None,
            'updated_at': post.updated_at.isoformat() if post.updated_at else None,
            'read_time': len(post.content.split()) // 200 + 1,
            'images': [{
                'image_id': img.image_id,
                'image_url': url_for('static', filename=img.image_url, _external=True),
                'is_primary': img.is_primary,
                'alt_text': img.alt_text
            } for img in images]
        }
        
        return jsonify(post_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching blog post: {str(e)}'}), 500

# Get blog categories
@blog_bp.route('/categories', methods=['GET'])
def get_blog_categories():
    """Get all blog categories with post counts"""
    try:
        categories = db.session.query(
            BlogPost.category,
            func.count(BlogPost.id).label('count')
        ).filter_by(is_published=True).group_by(BlogPost.category).all()
        
        result = [{'name': cat.category, 'count': cat.count} for cat in categories]
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching categories: {str(e)}'}), 500

# Get recent blog posts
@blog_bp.route('/posts/recent', methods=['GET'])
def get_recent_posts():
    """Get recent blog posts"""
    try:
        limit = request.args.get('limit', 4, type=int)
        
        posts = BlogPost.query.filter_by(
            is_published=True
        ).order_by(desc(BlogPost.date_posted)).limit(limit).all()
        
        result = []
        for post in posts:
            primary_image = BlogImage.query.filter_by(
                blog_post_id=post.id, 
                is_primary=True
            ).first()
            
            post_data = {
                'id': post.id,
                'title': post.title,
                'slug': post.slug,
                'excerpt': post.excerpt,
                'author': post.author,
                'category': post.category,
                'featured_image': url_for('static', filename=primary_image.image_url, _external=True) if primary_image else None,
                'date_posted': post.date_posted.isoformat() if post.date_posted else None
            }
            result.append(post_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching recent posts: {str(e)}'}), 500

# Create new blog post (Admin only)
@blog_bp.route('/posts', methods=['POST'])
def create_blog_post():
    """Create a new blog post"""
    try:
        data = request.form
        files = request.files.getlist('images')
        
        # Validate required fields
        required_fields = ['title', 'excerpt', 'content', 'category']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create slug from title
        slug = create_slug(data['title'])
        
        # Check if slug already exists
        existing_post = BlogPost.query.filter_by(slug=slug).first()
        if existing_post:
            slug = f"{slug}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        new_post = BlogPost(
            title=data['title'],
            slug=slug,
            excerpt=data['excerpt'],
            content=data['content'],
            author=data.get('author', 'Admin'),
            category=data['category'],
            tags=data.get('tags', ''),
            is_published=data.get('is_published', True),
            is_featured=data.get('is_featured', False)
        )
        
        db.session.add(new_post)
        db.session.commit()
        
        # Process images
        if files:
            for idx, img in enumerate(files):
                if img.filename == '':
                    continue
                    
                image_path = save_blog_media(img, new_post.id)
                if image_path:
                    is_primary = (idx == 0)  # First image becomes primary
                    new_image = BlogImage(
                        blog_post_id=new_post.id,
                        filename=img.filename,
                        image_url=image_path,
                        is_primary=is_primary,
                        alt_text=data.get('alt_text', '')
                    )
                    db.session.add(new_image)
            
            db.session.commit()
        
        return jsonify({
            'message': 'Blog post created successfully',
            'post_id': new_post.id,
            'slug': new_post.slug
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error creating blog post: {str(e)}'}), 500

# Update blog post (Admin only)
@blog_bp.route('/posts/<int:post_id>', methods=['PUT'])
def update_blog_post(post_id):
    """Update an existing blog post"""
    try:
        post = BlogPost.query.get_or_404(post_id)
        data = request.get_json()
        
        if 'title' in data:
            post.title = data['title']
            # Update slug if title changed
            post.slug = create_slug(data['title'])
        
        if 'excerpt' in data:
            post.excerpt = data['excerpt']
        
        if 'content' in data:
            post.content = data['content']
        
        if 'author' in data:
            post.author = data['author']
        
        if 'category' in data:
            post.category = data['category']
        
        if 'tags' in data:
            post.tags = data['tags']
        
        if 'is_published' in data:
            post.is_published = data['is_published']
        
        if 'is_featured' in data:
            post.is_featured = data['is_featured']
        
        db.session.commit()
        
        return jsonify({'message': 'Blog post updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating blog post: {str(e)}'}), 500

# Delete blog post (Admin only)
@blog_bp.route('/posts/<int:post_id>', methods=['DELETE'])
def delete_blog_post(post_id):
    """Delete a blog post"""
    try:
        post = BlogPost.query.get_or_404(post_id)
        
        # Delete associated images
        images = BlogImage.query.filter_by(blog_post_id=post_id).all()
        for img in images:
            try:
                if os.path.exists(os.path.join(current_app.config['UPLOAD_FOLDER'], img.image_url.replace('uploads/', ''))):
                    os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], img.image_url.replace('uploads/', '')))
            except Exception as e:
                current_app.logger.error(f"Failed to delete image {img.image_url}: {str(e)}")
        
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Blog post deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error deleting blog post: {str(e)}'}), 500

# ============================================================================
# ADMIN-SPECIFIC ROUTES
# ============================================================================

# Get all blogs for admin (with pagination and filters)
@blog_bp.route('/admin/posts', methods=['GET'])
def admin_get_all_blogs():
    """Get all blog posts for admin panel with advanced filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category')
        status = request.args.get('status')
        featured = request.args.get('featured')
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'date_posted')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Base query - admin can see all posts (published and draft)
        query = BlogPost.query
        
        # Apply filters
        if category and category != 'all':
            query = query.filter(BlogPost.category == category)
        
        if status and status != 'all':
            if status == 'published':
                query = query.filter(BlogPost.is_published == True)
            elif status == 'draft':
                query = query.filter(BlogPost.is_published == False)
        
        if featured and featured != 'all':
            if featured == 'featured':
                query = query.filter(BlogPost.is_featured == True)
            elif featured == 'not-featured':
                query = query.filter(BlogPost.is_featured == False)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (BlogPost.title.ilike(search_term)) |
                (BlogPost.excerpt.ilike(search_term)) |
                (BlogPost.content.ilike(search_term)) |
                (BlogPost.author.ilike(search_term))
            )
        
        # Apply sorting
        if sort_by == 'title':
            order_col = BlogPost.title
        elif sort_by == 'author':
            order_col = BlogPost.author
        elif sort_by == 'view_count':
            order_col = BlogPost.view_count
        elif sort_by == 'featured':
            order_col = BlogPost.is_featured
        else:
            order_col = BlogPost.date_posted
        
        if sort_order == 'asc':
            query = query.order_by(order_col.asc())
        else:
            query = query.order_by(order_col.desc())
        
        # Paginate
        posts = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        result = []
        for post in posts.items:
            # Get primary image
            primary_image = BlogImage.query.filter_by(
                blog_post_id=post.id, 
                is_primary=True
            ).first()
            
            post_data = {
                'id': post.id,
                'title': post.title,
                'slug': post.slug,
                'excerpt': post.excerpt,
                'content': post.content,
                'author': post.author,
                'category': post.category,
                'tags': post.tags,
                'featured_image': primary_image.image_url if primary_image else None,
                'is_published': post.is_published,
                'is_featured': post.is_featured,
                'view_count': post.view_count,
                'date_posted': post.date_posted.isoformat() if post.date_posted else None,
                'updated_at': post.updated_at.isoformat() if post.updated_at else None
            }
            result.append(post_data)
        
        return jsonify({
            'success': True,
            'blogs': result,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': posts.total,
                'pages': posts.pages,
                'has_next': posts.has_next,
                'has_prev': posts.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error fetching blogs: {str(e)}'
        }), 500

# Get blog categories for admin
@blog_bp.route('/admin/categories', methods=['GET'])
def admin_get_categories():
    """Get all unique blog categories"""
    try:
        categories = db.session.query(BlogPost.category).distinct().all()
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return jsonify({
            'success': True,
            'categories': category_list
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error fetching categories: {str(e)}'
        }), 500

# Create blog post (Admin)
@blog_bp.route('/admin/posts', methods=['POST'])
def admin_create_blog():
    """Create a new blog post (Admin only)"""
    try:
        # Check if request has files
        if 'images' in request.files:
            files = request.files.getlist('images')
        else:
            files = []
        
        # Get form data
        title = request.form.get('title')
        excerpt = request.form.get('excerpt')
        content = request.form.get('content')
        author = request.form.get('author', 'Admin')
        category = request.form.get('category')
        tags = request.form.get('tags', '')
        is_published = request.form.get('is_published', 'true').lower() == 'true'
        is_featured = request.form.get('is_featured', 'false').lower() == 'true'
        
        if not all([title, excerpt, content, category]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: title, excerpt, content, category'
            }), 400
        
        # Create slug
        slug = create_slug(title)
        
        # Check if slug already exists
        existing_post = BlogPost.query.filter_by(slug=slug).first()
        if existing_post:
            # Add timestamp to make slug unique
            slug = f"{slug}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Create blog post
        new_post = BlogPost(
            title=title,
            slug=slug,
            excerpt=excerpt,
            content=content,
            author=author,
            category=category,
            tags=tags,
            is_published=is_published,
            is_featured=is_featured
        )
        
        db.session.add(new_post)
        db.session.commit()
        
        # Process images
        if files:
            for idx, img in enumerate(files):
                if img.filename == '':
                    continue
                    
                image_path = save_blog_media(img, new_post.id)
                if image_path:
                    is_primary = (idx == 0)  # First image becomes primary
                    new_image = BlogImage(
                        blog_post_id=new_post.id,
                        filename=img.filename,
                        image_url=image_path,
                        is_primary=is_primary,
                        alt_text=f"Image for {title}"
                    )
                    db.session.add(new_image)
            
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Blog post created successfully',
            'post_id': new_post.id,
            'slug': new_post.slug
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error creating blog post: {str(e)}'
        }), 500

# Update blog post (Admin)
@blog_bp.route('/admin/posts/<int:post_id>', methods=['PUT'])
def admin_update_blog(post_id):
    """Update an existing blog post (Admin only)"""
    try:
        post = BlogPost.query.get_or_404(post_id)
        
        # Check if request has files
        if 'images' in request.files:
            files = request.files.getlist('images')
        else:
            files = []
        
        # Update fields
        if 'title' in request.form:
            post.title = request.form['title']
            # Update slug if title changed
            post.slug = create_slug(request.form['title'])
        
        if 'excerpt' in request.form:
            post.excerpt = request.form['excerpt']
        
        if 'content' in request.form:
            post.content = request.form['content']
        
        if 'author' in request.form:
            post.author = request.form['author']
        
        if 'category' in request.form:
            post.category = request.form['category']
        
        if 'tags' in request.form:
            post.tags = request.form['tags']
        
        if 'is_published' in request.form:
            post.is_published = request.form['is_published'].lower() == 'true'
        
        if 'is_featured' in request.form:
            post.is_featured = request.form['is_featured'].lower() == 'true'
        
        db.session.commit()
        
        # Process new images if any
        if files:
            for idx, img in enumerate(files):
                if img.filename == '':
                    continue
                    
                image_path = save_blog_media(img, post.id)
                if image_path:
                    is_primary = (idx == 0)  # First image becomes primary
                    new_image = BlogImage(
                        blog_post_id=post.id,
                        filename=img.filename,
                        image_url=image_path,
                        is_primary=is_primary,
                        alt_text=f"Image for {post.title}"
                    )
                    db.session.add(new_image)
            
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Blog post updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error updating blog post: {str(e)}'
        }), 500

# Delete blog post (Admin)
@blog_bp.route('/admin/posts/<int:post_id>', methods=['DELETE'])
def admin_delete_blog(post_id):
    """Delete a blog post (Admin only)"""
    try:
        post = BlogPost.query.get_or_404(post_id)
        
        # Delete associated images
        images = BlogImage.query.filter_by(blog_post_id=post_id).all()
        for img in images:
            try:
                if os.path.exists(os.path.join(current_app.config['UPLOAD_FOLDER'], img.image_url.replace('uploads/', ''))):
                    os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], img.image_url.replace('uploads/', '')))
            except Exception as e:
                current_app.logger.error(f"Failed to delete image {img.image_url}: {str(e)}")
        
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Blog post deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error deleting blog post: {str(e)}'
        }), 500

# Bulk delete blogs (Admin)
@blog_bp.route('/admin/posts/bulk-delete', methods=['DELETE'])
def admin_bulk_delete_blogs():
    """Bulk delete multiple blog posts (Admin only)"""
    try:
        data = request.get_json()
        blog_ids = data.get('blog_ids', [])
        
        if not blog_ids:
            return jsonify({
                'success': False,
                'error': 'No blog IDs provided'
            }), 400
        
        # Delete posts and associated images
        deleted_count = 0
        for blog_id in blog_ids:
            post = BlogPost.query.get(blog_id)
            if post:
                # Delete associated images
                images = BlogImage.query.filter_by(blog_post_id=blog_id).all()
                for img in images:
                    try:
                        if os.path.exists(os.path.join(current_app.config['UPLOAD_FOLDER'], img.image_url.replace('uploads/', ''))):
                            os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], img.image_url.replace('uploads/', '')))
                    except Exception as e:
                        current_app.logger.error(f"Failed to delete image {img.image_url}: {str(e)}")
                
                db.session.delete(post)
                deleted_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted {deleted_count} blog posts'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error bulk deleting blogs: {str(e)}'
        }), 500

# Bulk update blogs (Admin)
@blog_bp.route('/admin/posts/bulk-update', methods=['PUT'])
def admin_bulk_update_blogs():
    """Bulk update multiple blog posts (Admin only)"""
    try:
        data = request.get_json()
        blog_ids = data.get('blog_ids', [])
        updates = data.get('updates', {})
        
        if not blog_ids:
            return jsonify({
                'success': False,
                'error': 'No blog IDs provided'
            }), 400
        
        if not updates:
            return jsonify({
                'success': False,
                'error': 'No updates provided'
            }), 400
        
        # Update posts
        updated_count = 0
        for blog_id in blog_ids:
            post = BlogPost.query.get(blog_id)
            if post:
                for field, value in updates.items():
                    if hasattr(post, field):
                        setattr(post, field, value)
                updated_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully updated {updated_count} blog posts'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error bulk updating blogs: {str(e)}'
        }), 500

# Test route to check database connectivity
@blog_bp.route('/admin/test', methods=['GET'])
def admin_test_db():
    """Test database connectivity"""
    try:
        # Simple test query
        count = BlogPost.query.count()
        return jsonify({
            'success': True,
            'message': 'Database connection successful',
            'blog_count': count
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Database connection failed: {str(e)}'
        }), 500

# Get blog statistics (Admin)
@blog_bp.route('/admin/stats', methods=['GET'])
def admin_get_blog_stats():
    """Get blog statistics for admin panel"""
    try:
        # Basic counts with error handling
        try:
            total_posts = BlogPost.query.count()
        except:
            total_posts = 0
            
        try:
            published_posts = BlogPost.query.filter_by(is_published=True).count()
        except:
            published_posts = 0
            
        try:
            draft_posts = BlogPost.query.filter_by(is_published=False).count()
        except:
            draft_posts = 0
            
        try:
            featured_posts = BlogPost.query.filter_by(is_featured=True).count()
        except:
            featured_posts = 0
            
        try:
            total_views = db.session.query(func.sum(BlogPost.view_count)).scalar() or 0
        except:
            total_views = 0
        
        # Category distribution with error handling
        try:
            category_stats = db.session.query(
                BlogPost.category,
                func.count(BlogPost.id)
            ).group_by(BlogPost.category).all()
            category_distribution = dict(category_stats)
        except:
            category_distribution = {}
        
        # Recent posts (last 7 days) with error handling
        try:
            week_ago = datetime.now() - timedelta(days=7)
            recent_posts = BlogPost.query.filter(
                BlogPost.date_posted >= week_ago
            ).count()
        except:
            recent_posts = 0
        
        stats = {
            'total_posts': total_posts,
            'published_posts': published_posts,
            'draft_posts': draft_posts,
            'featured_posts': featured_posts,
            'total_views': total_views,
            'recent_posts': recent_posts,
            'category_distribution': category_distribution
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Blog stats error: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Error fetching blog stats: {str(e)}'
        }), 500    