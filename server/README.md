# Backend
is needed to sign upload urls to let frontend upload user files into a private bucket.

Based on [serverless framework](https://serverless.com) and [AWS Lambda](https://aws.amazon.com/lambda/) as infrastructure.

1. install `sls` & `aws-cli`
2. create .env file:`SERVICE_NAME`, `S3_BUCKET`, `MAX_FILE_SIZE`, `SENTRY_DSN` (optional)```
   ```
   SERVICE_NAME=...
   S3_BUCKET=...
   MAX_FILE_SIZE=10000000
   SENTRY_DSN=
   ```
3. Install plugins
   ```bash
   sls plugin install -n serverless-python-requirements
   sls
   sls deploy
   ```
4. replace upload endpoint in `client/src/FileUpload.tsx`
   ```bash
   pip install -r requirements.txt
   ```
