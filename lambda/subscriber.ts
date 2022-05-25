const { DynamoDB } = require('aws-sdk');

exports.handler = async function(event:any) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  let records: any[] = event.Records;
  const dynamo = new DynamoDB();
  
  for(let index in records) {
    let payload = JSON.parse(records[index].body);
    let id = records[index].md5OfBody;
    
    var params = {
      TableName: process.env.tableName,
      Item: {
        'id' : {S: id},
        'message' : {S: payload.data}
      }
    };
    
    await dynamo.putItem(params, function(err:any, data:any) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Success", data);
      }
    }).promise();
  }
};