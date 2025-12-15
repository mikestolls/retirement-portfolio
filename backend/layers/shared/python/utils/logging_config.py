"""
Shared logging configuration for Lambda handlers
"""
import os
import logging
import boto3

def setup_lambda_logging(suppress_aws_logs=True):
    """
    Configure logging for Lambda handlers with AWS SDK logging control.
    Call this at the top of each Lambda handler to ensure consistent logging.
    
    Args:
        suppress_aws_logs: If True, keeps AWS SDK logs at WARNING level even when DEBUG is set
    
    Returns:
        logger: Configured logger instance
    """
    # Get log level from environment
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    numeric_level = getattr(logging, log_level, logging.INFO)
    
    # Configure root logger
    logger = logging.getLogger()
    logger.setLevel(numeric_level)
    
    # For local development, add console handler if not already present
    if not logger.handlers or os.getenv('DYNAMODB_ENDPOINT_URL'):
        # Remove any existing handlers to avoid duplicates
        logger.handlers.clear()
        
        # Create console handler with formatting
        console_handler = logging.StreamHandler()
        console_handler.setLevel(numeric_level)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(formatter)
        
        # Add handler to logger
        logger.addHandler(console_handler)
    
    # Configure AWS SDK logging only if not suppressing or if explicitly requested
    if not suppress_aws_logs:
        boto3.set_stream_logger('boto3', numeric_level)
        boto3.set_stream_logger('botocore', numeric_level)
        boto3.set_stream_logger('boto3.resources', numeric_level)
    
    # Always suppress noisy AWS SDK logs unless explicitly requested
    if suppress_aws_logs or numeric_level > logging.DEBUG:
        logging.getLogger('boto3').setLevel(logging.WARNING)
        logging.getLogger('botocore').setLevel(logging.WARNING) 
        logging.getLogger('boto3.resources').setLevel(logging.WARNING)
        logging.getLogger('urllib3.connectionpool').setLevel(logging.WARNING)
    
    return logger