const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01'});
const ddb = new aws.DynamoDB.DocumentClient;

const tableName = process.env.TABLE_NAME;
const bucketName = process.env.BUCKET_NAME;
const fileKey = process.env.FILE_KEY;

exports.handler = async (event) => {
    
    const params = {
        Bucket: bucketName, 
        Key: fileKey
    };
    
    const file = await s3.getObject(params).promise();
    let data = JSON.parse(file.Body.toString());
    console.log(`file content: ${JSON.stringify(data)}`);
    
    const ddbParams = {
        TableName: tableName,
        Select: 'ALL_ATTRIBUTES'
    };
    
    const response = await ddb.scan(ddbParams).promise();

    data[0].children.forEach(branch => {
        const item = response.Items.find(info => info.id === branch.id)
        if (item) {
            branch['masters'] = [...new Set([...branch['masters'] ,...item.masters.values])];
            branch['padawans'] = [...new Set([...branch['padawans'] ,...item.padawans.values])];
        }
    });

    return data;
};