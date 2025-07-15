#!/bin/bash

# CloudFormation deployment script
STACK_NAME="retirement-portfolio"
TEMPLATE_FILE="template.yaml"
REGION=${AWS_DEFAULT_REGION:-"us-east-1"}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Deploy the CloudFormation stack
echo "Deploying CloudFormation stack: $STACK_NAME"
aws cloudformation deploy \
    --stack-name $STACK_NAME \
    --template-file $TEMPLATE_FILE \
    --capabilities CAPABILITY_IAM \
    --region $REGION

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "Deployment successful!"
    
    # Get stack outputs
    echo "Stack outputs:"
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query "Stacks[0].Outputs" \
        --output table \
        --region $REGION
else
    echo "Deployment failed."
    exit 1
fi