# Retirement Portfolio

Retirement portfolio web app running React frontend and Flask backend with DynamoDB storage.

## Features

- Calculate retirement projections based on user inputs
- Store and retrieve retirement portfolios
- Visualize retirement data in a year-by-year table

## Architecture

- **Frontend**: React with Material-UI
- **Backend**: Flask REST API
- **Database**: DynamoDB (local for development, AWS for production)

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
- Table uses `retirement_fund_id` as primary key
- Global Secondary Index on `user_id` with `KEYS_ONLY` projection for efficient queries
- Timestamps (`created_at`, `updated_at`) are managed in application code

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

### Using CloudFormation

1. Deploy using the provided script:

```bash
cd cloudformation
chmod +x deploy.sh
./deploy.sh
```

Or manually with AWS CLI:

```bash
aws cloudformation deploy \
    --stack-name retirement-portfolio \
    --template-file template.yaml \
    --capabilities CAPABILITY_IAM
```

This will create:
- DynamoDB tables with pay-per-request billing

### Environment Variables

For AWS deployment, set these environment variables:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_DEFAULT_REGION`: AWS region (default: us-east-1)

## API Endpoints

- `GET /api/health`: Health check
- `GET /api/get_retirement_data`: Get retirement data
- `POST /api/update_retirement_input`: Update retirement input data