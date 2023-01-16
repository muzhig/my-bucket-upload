import json
import os
import uuid

import boto3
from marshmallow import Schema, fields, validate
import sentry_init


class UploadUrlSchema(Schema):
    file_name = fields.Str(required=True, validate=validate.Regexp(r'.+\..+'))
    content_type = fields.Str(required=True, validate=validate.OneOf([
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.text',
     # tsv
      'text/tab-separated-values',
      'text/x-tab-separated-values',
      'text/tab-separated-text',
      'text/x-tab-separated-text',
      'text/tsv',
      'text/x-tsv',
     # json
      'application/json',
      'text/json',
     # json lines
      'application/x-ndjson',
      'application/x-jsonlines',
      'application/jsonlines',
      'application/json-lines',
    ]))
    file_size = fields.Int(required=True, validate=validate.Range(min=0, max=int(os.environ['MAX_FILE_SIZE'])))
    description = fields.Str(required=False)

def generate_presigned_url(file_name, content_type, file_size, description=None):
    s3 = boto3.client('s3')
    extension = os.path.splitext(file_name)[1]
    key = f'uploads/{uuid.uuid4()}{extension}'.format(file_name)
    put_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': os.environ['S3_BUCKET'],
            'Key': key,
            'ContentType': content_type,
            'ContentLength': file_size,
            'ContentDisposition': 'attachment; filename="{}"'.format(file_name),
        },
        ExpiresIn=3600
    )
    get_url = s3.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': os.environ['S3_BUCKET'],
            'Key': key,
        },
        ExpiresIn=3600
    )
    return {"put_url": put_url, "get_url": get_url}

def sign_upload_url(event, context):
    resp_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': True,
    }
    try:
        body = UploadUrlSchema().loads(event['body'])
    except ValidationError as err:
        return {
            'statusCode': 400,
            'headers': resp_headers,
            'body': json.dumps(err.messages)
        }

    urls = generate_presigned_url(**body)

    response = {
        "statusCode": 200,
        "body": json.dumps({
            "url": urls['put_url'],
            "get_url": urls['get_url'],
            "headers": {
                "Content-Type": body['content_type'],
                'Content-Disposition': 'attachment; filename="{}"'.format(body['file_name']),
#                 'amz-meta-description': body['description'],
            },
            "method": "put"
        }),
        "headers": resp_headers,
    }
    return response

    # Use this code if you don't use the http event with the LAMBDA-PROXY
    # integration
    """
    return {
        "message": "Go Serverless v1.0! Your function executed successfully!",
        "event": event
    }
    """
