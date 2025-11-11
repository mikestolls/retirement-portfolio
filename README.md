# Retirement Portfolio

Retirement portfolio web app with React frontend and Python backend using AWS Lambda architecture and DynamoDB storage.

## Features

- Calculate retirement projections based on user inputs
- Multi-fund portfolio management per family
- Family member retirement planning
- Budget tracking and management
- Visualize retirement data with projections
- Actual vs projected performance tracking

## Architecture

- **Frontend**: React with Material-UI and Context-based state management
- **Backend**: AWS Lambda functions with Flask dev server for local development
- **Database**: DynamoDB with optimized 4-table structure
- **Deployment**: AWS SAM for Lambda deployment, CloudFormation for infrastructure

## Local Development Setup

### Prerequisites

- Docker and Docker Compose
- Python 3.8+
- Node.js 14+

## Docker Setup Notes

### Network Configuration
- Backend service is accessible at `http://localhost:5000/api` from the host
- Within Docker network, services can reference each other by name (e.g., `http://dynamodb-local:8000`)

### Common Issues & Solutions
- **Import Error**: When using Docker, imports should be relative to the container's working directory (`/app`), not using `backend.` prefix
- **DynamoDB Connection**: Backend must use `http://dynamodb-local:8000` to connect to DynamoDB container
- **Frontend API URL**: Set `REACT_APP_BACKEND_API_URL=http://localhost:5000/api` for browser access

### DynamoDB Notes

The application uses a **4-table structure** for efficient data organization:

#### Table Structure:
- **users**: User accounts with `user_id` primary key
  - GSI: EmailIndex on `email` with `ALL` projection
- **families**: Family information with `family_id` primary key
  - Stores family member data (names, ages, retirement ages, etc.)
- **retirement_funds**: Individual retirement funds with `fund_id` primary key
  - GSI: familyId-index on `family_id` with `KEYS_ONLY` projection for efficient storage
  - Uses BatchGetItem pattern for optimal data retrieval
- **budgets**: Budget information with `budget_id` primary key
  - GSI: familyId-index on `family_id` with `ALL` projection

#### Performance Optimizations:
- **KEYS_ONLY GSI**: Retirement funds GSI only stores keys, reducing storage costs
- **BatchGetItem**: Efficient retrieval of complete fund data after GSI query
- **Family-based grouping**: All data linked through family_id for consistent access patterns
- Timestamps (`created_at`, `updated_at`) managed in application code

### Running the Application

1. Start the application using Docker Compose:

```bash
docker-compose up
```

This will start:
- React frontend on http://localhost:3000
- Flask backend on http://localhost:5000
- DynamoDB Local on http://localhost:8000

### Manual Setup (without Docker)

1. Start DynamoDB Local:

```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

2. Set up the backend:

```bash
cd backend
pip install -r requirements.txt
python scripts/init_dynamodb.py
flask run
```

3. Set up the frontend:

```bash
cd frontend
npm install
npm start
```

## AWS Deployment

### Using SAM (Serverless Application Model)

1. Build and deploy the Lambda functions:

```bash
cd backend
sam build
sam deploy --guided
```

### Using CloudFormation for Infrastructure

1. Deploy infrastructure using the provided template:

```bash
cd cloudformation
aws cloudformation deploy \
    --stack-name retirement-portfolio-infrastructure \
    --template-file infrastructure.yaml \
    --capabilities CAPABILITY_IAM
```

This will create:
- DynamoDB tables with optimized GSI configurations
- S3 bucket for frontend hosting  
- CloudFront distribution for global delivery

### Environment Variables

For AWS deployment, configure these environment variables:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key  
- `AWS_DEFAULT_REGION`: AWS region (default: us-east-1)

## API Endpoints

### User Data
- `GET /api/user_data/{user_id}`: Get complete user data (user, family, funds, budgets)

### Retirement Funds  
- `POST /api/retirement_fund/{fund_id}`: Create or update retirement fund
- `DELETE /api/retirement_fund/{fund_id}`: Delete retirement fund

### Family Information
- `POST /api/family_info/{family_id}`: Update family information

### Budgets
- `POST /api/budget/{budget_id}`: Update budget information

### Health Check
- `GET /api/health`: Health check endpoint