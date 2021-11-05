const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();

const tableName = process.env.TABLE_NAME;

exports.handler = async (event) => {
    console.log(`Initial event ${JSON.stringify(event)}`);
    
    if (!Array.isArray(event)) {
        throw new Error('Payload should contain array');
    }
    
    const payloadToPut = generatePayloadToPut(event);
    
    const params = {
         RequestItems: {
             [tableName] : payloadToPut
         }
    };
    
    console.log(`Params: ${JSON.stringify(params)}`);
    
    const response = await ddb.batchWriteItem(params).promise();
    console.log(`Response: ${JSON.stringify(response)}`);
    return response;
};

const generatePayloadToPut = (event) => {
    return event.filter(record => (record.masters !== undefined || record.padawans !== undefined) && record.id !== undefined)
        .map(record => {
            return {
                PutRequest: {
                Item: {
                    'id': {
                        S: `${record.id}`
                    },
                    'masters': {
                        SS: record.masters
                    },
                    'padawans': {
                        SS: record.padawans
                    }
                }
            }
        }
        });
}
