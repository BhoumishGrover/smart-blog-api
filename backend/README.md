# Blog Updation API

## Setup

1. Install Node.js >=18
2. Install PostgreSQL and pgAdmin
3. In pgAdmin, create a new database named 'blog_api'
4. Run the schema.sql in the database to create the table
5. cd backend
6. npm install
7. Update .env with your PostgreSQL credentials (replace user:password with actual)
8. npm start

## API Endpoints

- POST /articles/scrape : Scrape and store articles
- POST /articles : Create article
- GET /articles : Get all
- GET /articles/:id : Get by id
- PUT /articles/:id : Update
- DELETE /articles/:id : Delete

## Example API Requests/Responses

### POST /articles/scrape
Request: No body
Response: {"message": "5 articles inserted"}

### GET /articles
Response: 
[
  {
    "id": "uuid",
    "title": "Article Title",
    "content": "Article content...",
    "original_url": "https://...",
    "source": "original",
    "created_at": "2023-...",
    "updated_at": "2023-..."
  }
]

### POST /articles
Request: {"title": "New Title", "content": "New content", "original_url": "https://new.com"}
Response: The created article object

### PUT /articles/:id
Request: {"title": "Updated Title", "content": "Updated content", "original_url": "https://updated.com"}
Response: The updated article object (source becomes 'updated')