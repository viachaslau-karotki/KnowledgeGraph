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
        TableName: tableName
    };

    const response = await ddb.scan(ddbParams).promise();

    const items = response.Items;

    const json = createJsonGraph(items);

    console.log(`db result: ${JSON.stringify(json)}`);
    return json;
};

const createJsonGraph = (items) => {
    let result = [];
    let knowledgeGraph = items.find(element => element.id === 'graph')
    if (knowledgeGraph && knowledgeGraph.children) {
        setChildren(knowledgeGraph,items);
        result.push(knowledgeGraph);
    }
    return result;
}

const setChildren = (root,items) => {

    let childrenElements = root.children.values
        .map(element => {
            let resultElement = items.find(el => el.id === element);
            if (resultElement && resultElement.children) {
                setChildren(resultElement, items);
            } else {
                resultElement.children = [];
            }
            return resultElement;
        });
        console.log(`childElements : ${JSON.stringify(childrenElements)}`);
        root.children = childrenElements;
}
