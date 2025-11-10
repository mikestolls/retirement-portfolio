"""
Shared logging configuration for Lambda handlers
"""
import os
import logging
import boto3

def setup_lambda_logging():
    """
    Configure logging for Lambda handlers with AWS SDK logging control.
    Call this at the top of each Lambda handler to ensure consistent logging.
    
    Returns:
        logger: Configured logger instance
    """
    # Get log level from environment
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    numeric_level = getattr(logging, log_level, logging.INFO)
    
    # Configure root logger
    logger = logging.getLogger()
    logger.setLevel(numeric_level)
    
    # Configure AWS SDK logging
    boto3.set_stream_logger('boto3', numeric_level)
    boto3.set_stream_logger('botocore', numeric_level)
    boto3.set_stream_logger('boto3.resources', numeric_level)
    
    # Suppress noisy AWS SDK logs unless DEBUG level
    if numeric_level > logging.DEBUG:
        logging.getLogger('boto3').setLevel(logging.WARNING)
        logging.getLogger('botocore').setLevel(logging.WARNING) 
        logging.getLogger('boto3.resources').setLevel(logging.WARNING)
        logging.getLogger('urllib3.connectionpool').setLevel(logging.WARNING)
    
    return logger