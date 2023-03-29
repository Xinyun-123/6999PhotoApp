import json
import boto3
import requests
from requests_aws4auth import AWS4Auth
from datetime import datetime

def indexIntoES(document):
    host = 'https://search-photos-74nx4zowrr3fysyjgk2szko5ue.us-east-1.es.amazonaws.com'
    index = 'photos'
    type = '_doc'
    url = host + '/' + index + '/' + type
    service = 'es'
    region = 'us-east-1'
    headers = { "Content-Type": "application/json" }
    credentials = boto3.Session().get_credentials()
    awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)
    
    r = requests.post(url, auth=awsauth, json=document, headers=headers)
    return r
 
def parseForElasticSearch(bucket,name,res):
    labels = []
    for rec in res['Labels']:
        labels.append(rec['Name'])
    document = {
        "objectKey" : name,
        "bucket" : bucket,
        "createdTimeStamp" : datetime.now().strftime("%y-%m-%d %H:%M:%S"), #"2020-05-02 17:32:55",
        "labels" : labels
        
    }
    print("document: ", document)
    return document
        

def detectRekognitionLabel(bucket,name):
    rek = boto3.client('rekognition')
    response = rek.detect_labels(
        Image={
            'S3Object': {
                'Bucket': bucket,
                'Name': name
            }
        },
        MinConfidence = 95
    )
    return response

def lambda_handler(event, context):
    # TODO implement
    print("event received", event)
    bucket = event["Records"][0]["s3"]["bucket"]["name"]
    name = event["Records"][0]["s3"]["object"]["key"]
    # print(bucket,name)
    res = detectRekognitionLabel(bucket,name)
    # print("res from rekognition", res)
    document = parseForElasticSearch(bucket,name,res)
    
    response = indexIntoES(document)
    data = json.loads(response.content.decode('utf-8'))
    print("res from elastic search: ", data)
    
    return {
        'statusCode': 200,
        'body': json.dumps("upload")
    }
    
    
    