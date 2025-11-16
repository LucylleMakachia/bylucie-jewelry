"""
Alembic environment configuration for Flask-Migrate.

This module configures Alembic to work with Flask-SQLAlchemy
for database migrations.
"""
import logging
import sys
import os
from logging.config import fileConfig

# Import all modules at the top level
from flask import current_app
from alembic import context
from sqlalchemy import MetaData

# Add current directory to Python path to help with imports
sys.path.append(os.getcwd())

config = context.config  # pylint: disable=no-member

if config.config_file_name is not None:
    fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')


def get_engine():
    """
    Get SQLAlchemy engine from Flask application.
    
    Returns:
        sqlalchemy.engine.Engine: Database engine instance
        
    Raises:
        RuntimeError: If unable to access database engine
    """
    try:
        # Try to use current_app if we're in a Flask context
        if current_app:
            return _get_engine_from_app(current_app)
        
        # Import your app instance directly from app.py
        from app import app  # pylint: disable=import-outside-toplevel
        
        with app.app_context():
            return _get_engine_from_app(app)
            
    except ImportError as error:
        logger.error("Failed to import app from app.py: %s", error)
        raise RuntimeError("Could not import Flask application") from error
    except Exception as error:
        logger.error("Failed to get database engine: %s", error)
        raise RuntimeError("Could not access database engine") from error


def _get_engine_from_app(app_instance):
    """Extract engine from Flask app instance."""
    migrate_extension = app_instance.extensions.get('migrate')
    if not migrate_extension:
        raise RuntimeError("Flask-Migrate extension not found")
        
    database = migrate_extension.db
    
    # Try different engine access patterns
    if hasattr(database, 'get_engine'):
        return database.get_engine()
    if hasattr(database, 'engine'):
        return database.engine
    return database.get_engine()


def get_engine_url():
    """
    Get database URL from engine for Alembic configuration.
    
    Returns:
        str: Database URL string
    """
    try:
        engine = get_engine()
        # Handle different SQLAlchemy URL rendering methods
        if hasattr(engine.url, 'render_as_string'):
            return engine.url.render_as_string(hide_password=False).replace('%', '%%')
        return str(engine.url).replace('%', '%%')
    except Exception as error:
        logger.error("Failed to get engine URL: %s", error)
        raise


# Configure Alembic with database URL
try:
    config.set_main_option('sqlalchemy.url', get_engine_url())
except Exception as error:  # pylint: disable=broad-except
    logger.warning("Could not set sqlalchemy.url: %s", error)

# Get target database instance
TARGET_DB = None
try:
    TARGET_DB = current_app.extensions['migrate'].db
except (AttributeError, KeyError):
    TARGET_DB = None


def get_metadata():
    """
    Get SQLAlchemy metadata for autogenerate support.
    
    Returns:
        sqlalchemy.MetaData: Database metadata object
    """
    if not TARGET_DB:
        # Import the db instance directly from your app.py
        try:
            from app import db  # pylint: disable=import-outside-toplevel
            return db.metadata
        except ImportError as error:
            logger.warning("Could not import db from app.py: %s", error)
            # Create empty metadata as last resort
            return MetaData()
    
    try:
        if hasattr(TARGET_DB, 'metadatas') and TARGET_DB.metadatas:
            return TARGET_DB.metadatas[None]
        if hasattr(TARGET_DB, 'metadata'):
            return TARGET_DB.metadata
        return TARGET_DB.metadata
    except AttributeError:
        # Final fallback
        return MetaData()


def run_migrations_offline():
    """
    Run migrations in 'offline' mode.
    
    This configures the context with just a URL and not an Engine.
    """
    url = config.get_main_option("sqlalchemy.url")
    if not url:
        url = get_engine_url()
        
    context.configure(  # pylint: disable=no-member
        url=url,
        target_metadata=get_metadata(),
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():  # pylint: disable=no-member
        context.run_migrations()  # pylint: disable=no-member


def run_migrations_online():
    """
    Run migrations in 'online' mode.
    
    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    def process_revision_directives(migration_context, revision, directives):
        """
        Prevent auto-migration when no schema changes detected.
        
        Args:
            migration_context: Migration context
            revision: Revision information
            directives: Migration directives
        """
        del migration_context, revision  # Unused arguments
        if getattr(config.cmd_opts, 'autogenerate', False):
            script = directives[0]
            if script.upgrade_ops.is_empty():
                directives.clear()
                logger.info('No changes in schema detected.')

    # Get configuration arguments safely
    conf_args = {}
    try:
        migrate_ext = current_app.extensions['migrate']
        conf_args = getattr(migrate_ext, 'configure_args', {}) or {}
    except (AttributeError, KeyError):
        pass

    # Add revision directive processor if not present
    if 'process_revision_directives' not in conf_args:
        conf_args['process_revision_directives'] = process_revision_directives

    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(  # pylint: disable=no-member
            connection=connection,
            target_metadata=get_metadata(),
            **conf_args
        )

        with context.begin_transaction():  # pylint: disable=no-member
            context.run_migrations()  # pylint: disable=no-member


if context.is_offline_mode():  # pylint: disable=no-member
    run_migrations_offline()
else:
    run_migrations_online()