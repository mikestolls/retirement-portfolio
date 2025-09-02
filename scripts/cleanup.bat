@echo off
REM Retirement Portfolio Cleanup Script

set STACK_NAME=retirement-portfolio
set REGION=us-east-1

echo Starting cleanup of Retirement Portfolio...

REM Step 1: Empty S3 bucket first (required before deletion)
echo Emptying S3 bucket...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME%-infrastructure --region %REGION% --query "Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue" --output text --profile retirement-portfolio 2^>nul') do set S3_BUCKET_NAME=%%i
if defined S3_BUCKET_NAME (
    echo Emptying bucket: %S3_BUCKET_NAME%
    aws s3 rm s3://%S3_BUCKET_NAME% --recursive --profile retirement-portfolio
)

REM Step 2: Delete Lambda stack
echo Deleting Lambda stack...
aws cloudformation delete-stack --stack-name %STACK_NAME%-lambda --region %REGION% --profile retirement-portfolio
aws cloudformation wait stack-delete-complete --stack-name %STACK_NAME%-lambda --region %REGION% --profile retirement-portfolio
if %errorlevel% neq 0 (
    echo Lambda stack deletion failed or timed out
) else (
    echo Lambda stack deleted
)

REM Step 3: Delete infrastructure stack
echo Deleting infrastructure stack...
aws cloudformation delete-stack --stack-name %STACK_NAME%-infrastructure --region %REGION% --profile retirement-portfolio
aws cloudformation wait stack-delete-complete --stack-name %STACK_NAME%-infrastructure --region %REGION% --profile retirement-portfolio
if %errorlevel% neq 0 (
    echo Infrastructure stack deletion failed or timed out
) else (
    echo Infrastructure stack deleted
)

REM Step 4: Delete CloudWatch log groups
echo Deleting CloudWatch log groups...
for /f "tokens=*" %%i in ('aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/%STACK_NAME%" --query "logGroups[].logGroupName" --output text --profile retirement-portfolio 2^>nul') do (
    for %%j in (%%i) do (
        echo Deleting log group: %%j
        aws logs delete-log-group --log-group-name "%%j" --profile retirement-portfolio
    )
)

REM Step 5: Clean up SAM artifacts buckets (optional)
echo 🧹 Cleaning up SAM artifacts buckets...
for /f "tokens=*" %%i in ('aws s3 ls --profile retirement-portfolio ^| findstr "%STACK_NAME%-sam-artifacts"') do (
    set BUCKET_LINE=%%i
    for %%j in (!BUCKET_LINE!) do set SAM_BUCKET=%%j
    echo Deleting SAM bucket: !SAM_BUCKET!
    aws s3 rb s3://!SAM_BUCKET! --force --profile retirement-portfolio
)

echo Cleanup complete!
echo All Retirement Portfolio resources have been deleted.