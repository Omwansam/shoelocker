from flask import Blueprint, jsonify, request
from models import SocialMediaPost, SocialMediaStats, db
from sqlalchemy import desc
import os

social_media_bp = Blueprint('social_media', __name__)

@social_media_bp.route('/posts', methods=['GET'])
def get_social_media_posts():
    """Get all active social media posts"""
    try:
        platform = request.args.get('platform', 'instagram')
        limit = request.args.get('limit', 6, type=int)
        
        posts = SocialMediaPost.query.filter_by(
            platform=platform,
            is_active=True
        ).order_by(desc(SocialMediaPost.posted_at)).limit(limit).all()
        
        result = []
        for post in posts:
            result.append({
                'post_id': post.post_id,
                'platform': post.platform,
                'post_url': post.post_url,
                'image_url': post.image_url,
                'caption': post.caption,
                'likes_count': post.likes_count,
                'comments_count': post.comments_count,
                'posted_at': post.posted_at.isoformat() if post.posted_at else None,
                'is_featured': post.is_featured
            })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/posts/featured', methods=['GET'])
def get_featured_posts():
    """Get featured social media posts"""
    try:
        platform = request.args.get('platform', 'instagram')
        limit = request.args.get('limit', 3, type=int)
        
        posts = SocialMediaPost.query.filter_by(
            platform=platform,
            is_featured=True,
            is_active=True
        ).order_by(desc(SocialMediaPost.posted_at)).limit(limit).all()
        
        result = []
        for post in posts:
            result.append({
                'post_id': post.post_id,
                'platform': post.platform,
                'post_url': post.post_url,
                'image_url': post.image_url,
                'caption': post.caption,
                'likes_count': post.likes_count,
                'comments_count': post.comments_count,
                'posted_at': post.posted_at.isoformat() if post.posted_at else None
            })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/stats', methods=['GET'])
def get_social_media_stats():
    """Get social media statistics"""
    try:
        platform = request.args.get('platform', 'instagram')
        
        stats = SocialMediaStats.query.filter_by(platform=platform).first()
        
        if not stats:
            # Return default stats if none exist
            return jsonify({
                'platform': platform,
                'followers_count': 0,
                'posts_count': 0,
                'engagement_rate': 0.0
            }), 200
        
        return jsonify({
            'platform': stats.platform,
            'followers_count': stats.followers_count,
            'posts_count': stats.posts_count,
            'engagement_rate': stats.engagement_rate,
            'last_updated': stats.last_updated.isoformat() if stats.last_updated else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/posts', methods=['POST'])
def create_social_media_post():
    """Create a new social media post (Admin only)"""
    try:
        data = request.get_json()
        
        required_fields = ['platform', 'post_url', 'image_url']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        new_post = SocialMediaPost(
            platform=data['platform'],
            post_url=data['post_url'],
            image_url=data['image_url'],
            caption=data.get('caption', ''),
            likes_count=data.get('likes_count', 0),
            comments_count=data.get('comments_count', 0),
            is_featured=data.get('is_featured', False)
        )
        
        db.session.add(new_post)
        db.session.commit()
        
        return jsonify({
            'message': 'Social media post created successfully',
            'post_id': new_post.post_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/stats', methods=['POST'])
def create_social_media_stats():
    """Create or update social media statistics (Admin only)"""
    try:
        data = request.get_json()
        
        required_fields = ['platform', 'followers_count', 'posts_count']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if stats already exist for this platform
        existing_stats = SocialMediaStats.query.filter_by(platform=data['platform']).first()
        
        if existing_stats:
            # Update existing stats
            existing_stats.followers_count = data['followers_count']
            existing_stats.posts_count = data['posts_count']
            existing_stats.engagement_rate = data.get('engagement_rate', 0.0)
        else:
            # Create new stats
            new_stats = SocialMediaStats(
                platform=data['platform'],
                followers_count=data['followers_count'],
                posts_count=data['posts_count'],
                engagement_rate=data.get('engagement_rate', 0.0)
            )
            db.session.add(new_stats)
        
        db.session.commit()
        
        return jsonify({'message': 'Social media stats updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
