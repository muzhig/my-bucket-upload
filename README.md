# Upload files to AWS S3 bucket
Files are uploaded directly in a private S3 bucket (using presigned PUT url)
And accessible via temporary presigned urls.
As soon as link expires file is not accessible to public anymore.

## Live demo: [upload.potapov.dev](https://upload.potapov.dev)

## Frontend
- React
- TypeScript
- Uppy (using own url signing API)

### Installation
```bash
npm install
npm run start
```

## Backend
[separate README](server/README.md)  
