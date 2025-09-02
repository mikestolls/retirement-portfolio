@echo off
REM Retirement Portfolio Lambda Deployment Script

set STACK_NAME=retirement-portfolio
set REGION=us-east-1
set S3_BUCKET=%STACK_NAME%-sam-artifacts-%RANDOM%

echo Starting Lambda deployment for Retirement Portfolio...

REM Step 1: Create S3 bucket for SAM artifacts
echo Creating S3 bucket for SAM artifacts...
aws s3 mb s3://%S3_BUCKET% --region %REGION% --profile retirement-portfolio
if %errorlevel% neq 0 goto :error

REM Step 2: Deploy infrastructure (DynamoDB, S3, CloudFront)
echo Deploying infrastructure...
aws cloudformation deploy ^
    --stack-name %STACK_NAME%-infrastructure ^
    --template-file cloudformation/infrastructure.yaml ^
    --region %REGION% ^
    --capabilities CAPABILITY_IAM ^
    --profile retirement-portfolio
if %errorlevel% neq 0 goto :error

REM Step 3: Build and deploy Lambda functions with SAM
echo Building and deploying Lambda functions...
cd backend
call sam build
if %errorlevel% neq 0 goto :error

call sam deploy ^
    --stack-name %STACK_NAME%-lambda ^
    --s3-bucket %S3_BUCKET% ^
    --region %REGION% ^
    --capabilities CAPABILITY_IAM ^
    --parameter-overrides Environment=prod ^
    --profile retirement-portfolio
    
if %errorlevel% neq 0 goto :error
cd ..

REM Step 4: Get API Gateway URL
echo Getting API Gateway URL...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME%-lambda --region %REGION% --query "Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue" --output text --profile retirement-portfolio') do set API_URL=%%i
echo API Gateway URL: %API_URL%

REM Step 5: Build React frontend with API URL
echo Building React frontend...
cd frontend
set REACT_APP_BACKEND_API_URL=%API_URL%api
call npm run build
if %errorlevel% neq 0 goto :error
cd ..

REM Step 6: Get S3 bucket name and upload frontend
echo Uploading frontend to S3...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME%-infrastructure --region %REGION% --query "Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue" --output text --profile retirement-portfolio') do set S3_BUCKET_NAME=%%i
aws s3 sync frontend/build/ s3://%S3_BUCKET_NAME% --delete --profile retirement-portfolio
if %errorlevel% neq 0 goto :error

REM Step 7: Get CloudFront distribution ID and invalidate cache
echo Invalidating CloudFront cache...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME%-infrastructure --region %REGION% --query "Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue" --output text --profile retirement-portfolio') do set CLOUDFRONT_ID=%%i
aws cloudfront create-invalidation --distribution-id %CLOUDFRONT_ID% --paths "/*" --profile retirement-portfolio > nul
if %errorlevel% neq 0 goto :error
echo CloudFront cache invalidation started successfully

REM Step 8: Get final URLs
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME%-infrastructure --region %REGION% --query "Stacks[0].Outputs[?OutputKey==`FrontendURL`].OutputValue" --output text --profile retirement-portfolio') do set FRONTEND_URL=%%i

REM Step 9: Clean up SAM artifacts bucket
echo Cleaning up SAM artifacts bucket...
aws s3 rb s3://%S3_BUCKET% --force --profile retirement-portfolio
if %errorlevel% neq 0 (
    echo Warning: Failed to delete SAM artifacts bucket %S3_BUCKET%
)

echo Deployment complete!
echo.
echo Frontend URL: %FRONTEND_URL%
echo API URL: %API_URL%
echo.
echo Your Retirement Portfolio is now live!
goto :end

:error
echo Deployment failed!
exit /b 1

:end