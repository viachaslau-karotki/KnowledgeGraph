const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();

const tableName = process.env.TABLE_NAME;

exports.handler = async (event, context) => {
    console.log(`Initial event ${JSON.stringify(event)}`);
    console.log(`Initial context ${JSON.stringify(context)}`);

    let payload = JSON.parse(event.body);

    if (event.pathParameters && event.pathParameters.nodeId) {
        let parentNode = await getNode(event.pathParameters.nodeId);
        console.log(`Parent node: ${JSON.stringify(parentNode)}`);
        await updateParentNode(parentNode, payload);
        payload = [payload]
    }
    if (!Array.isArray(payload)) {
        throw new Error('Payload should contain array');
    }
    await createOrUpdateNode(payload);
    return {
        "statusCode": 200
    }
};

const updateParentNode = async (parentNodeItem, payload) => {
    payload = [payload];
    let newChildren = payload.filter(record => (record.id !== undefined))
            .map(record => record.id);
    let children = []
    if (parentNodeItem.Item.children) {
        children = parentNodeItem.Item.children.SS;
    }
    const finalChildrenList = children.concat(newChildren);
    console.log(`children list ${finalChildrenList}`);

    console.log(`parent id: ${JSON.stringify(parentNodeItem.Item.id.S)}`);

    const params = {
         Key: {
             'id': {
                 S: parentNodeItem.Item.id.S
             }
         },
         TableName: tableName,
         AttributeUpdates: {
             'children': {
                 Action: 'PUT',
                 Value: {
                     SS: finalChildrenList
                 }
             }
         }
    };

    await ddb.updateItem(params).promise();
}

const getNode = async (nodeId) => {

    const params = {
        Key: {
            'id': {
                S: nodeId
            }
        },
        TableName: tableName
    }

    let parentNode = await ddb.getItem(params).promise();

    if (Object.keys(parentNode).length == 0) {
        throw new Error(`Node with id: ${nodeId} was not found`);
    }

    return parentNode;
}

const createOrUpdateNode = async (payload) => {
    const payloadToPut = generatePayloadToPut(payload);

    const params = {
         RequestItems: {
             [tableName] : payloadToPut
         }
    };

    console.log(`Params: ${JSON.stringify(params)}`);

    const response = await ddb.batchWriteItem(params).promise();
    console.log(`Response: ${JSON.stringify(response)}`);
    return response;
}

const generatePayloadToPut = (payload) => {
    return payload.filter(record => (record.id !== undefined))
        .map(record => {
            let item = {
                'id': {
                        S: record.id
                    }
            }
            if (record.label) {
                item.label = {
                    S: record.id
                }
            }
            if (record.imageUrl) {
                item.imageUrl = {
                    S: record.imageUrl
                }
            }
            if (record.description) {
                item.description = {
                    S: record.description
                }
            }
            if (record.masters && record.masters.length) {
                item.masters = {
                    SS: record.masters
                }
            }
            if (record.padawans && record.padawans.length) {
                item.padawans = {
                    SS: record.padawans
                }
            }
            if (record.projects && record.projects.length) {
                item.projects = {
                    SS: record.projects
                }
            }
            if (record.openPositions && record.openPositions.length) {
                item.openPositions = {
                    SS: record.openPositions
                }
            }
            if (record.tags && record.tags.length) {
                item.tags = {
                    SS: record.tags
                }
            }
            if (record.children && record.children.length) {
                item.children = {
                    SS: record.children
                }
            }
        return {
                PutRequest: {
                    Item: item
                }
        }
        });
}

