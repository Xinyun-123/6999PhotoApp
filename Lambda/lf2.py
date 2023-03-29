import json
import boto3
import requests

def clearIndices():
    host = 'https://search-photos-74nx4zowrr3fysyjgk2szko5ue.us-east-1.es.amazonaws.com/photos/'
    res = requests.delete(host)
    res = json.loads(res.content.decode('utf-8'))
    return res   

def searchIndices():
    host = 'https://search-photos-74nx4zowrr3fysyjgk2szko5ue.us-east-1.es.amazonaws.com/photos/_search?q=dog'
    res = requests.get(host)
    res = json.loads(res.content.decode('utf-8'))
    return res

def searchElasticIndex(search):
    photos = []
    for s in search:
        host = 'https://search-photos-74nx4zowrr3fysyjgk2szko5ue.us-east-1.es.amazonaws.com/photos/_search?q='+s
        res = requests.get(host)
        res = json.loads(res.content.decode('utf-8'))
        for item in res["hits"]["hits"]:
            bucket = item["_source"]["bucket"]
            key = item["_source"]["objectKey"]
            photoURL = "https://{0}.s3.amazonaws.com/{1}".format(bucket,key)
            photos.append(photoURL)
    return photos

def prepareForSearch(res):
    photos = []
    if res["interpretations"][0]["intent"]["slots"]["query"] != None:
        photos.append(res["interpretations"][0]["intent"]["slots"]["query"]["value"]["interpretedValue"])
    if res["interpretations"][0]["intent"]["slots"]["query2"] != None:
        photos.append(res["interpretations"][0]["intent"]["slots"]["query2"]["value"]["interpretedValue"])
    return photos

def sendToLex(message):
    client = boto3.client('lexv2-runtime')
    response = client.recognize_text(
            botId='MQ2HVRCLP5', # MODIFY HERE
            botAliasId='TSTALIASID', # MODIFY HERE
            localeId='en_US',
            sessionId='testuser',
            text=message)
    
    msg_from_lex = response.get('messages', [])
    return response
    
def lambda_handler(event, context):
    # TODO implement
    photos = []
    #res = clearIndices() used to clear indexes in ES
    #res = searchIndices() #used to check index
    message = event["params"]["querystring"]["q"]
    resFromLex = sendToLex(message)
    search_labels = prepareForSearch(resFromLex)
    photos = searchElasticIndex(search_labels)
    return {
        'statusCode': 200,
        'body': json.dumps(photos)
    }