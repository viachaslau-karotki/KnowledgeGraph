const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const tableName = process.env.TABLE_NAME;

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const nodeId = event.pathParameters.nodeId;
    const ids = await getItemIdsToDelete(nodeId);
    console.log(`Items to delete: ${ids}`);
    await updateParentIfRequired(nodeId);
    for (let id of ids) {
        await deleteItem(id);
    }
    console.log(`Finishing ...`);
    return {
        statusCode: 200
    }
}

const getItemIdsToDelete = async (itemId) => {
    const item = await getItem(itemId);

    let idsToDelete = [itemId];

    console.log(`retrieved item: ${JSON.stringify(item)}`);
    if (item && item.Item && item.Item.children) {
        let ids = item.Item.children.SS;
        for (let id of ids) {
            let itemIds = await getItemIdsToDelete(id);
            idsToDelete = idsToDelete.concat(itemIds);
        }
    }
    return idsToDelete;
}

const updateParentIfRequired = async (itemId) => {
    let items = await getItemsByChildren(itemId);
    console.log(`items to update ${JSON.stringify(items)}`);
    for (let item of items) {
        await updateItemWithChildren(item, itemId);
        console.log(`Updating...`);
    }
    console.log(`End of updating...`);
}

const updateItemWithChildren = async (item, itemId) => {
    let children = item.children.SS;
    console.log(`children before ${JSON.stringify(children)}`);
    const finalChildrenList = children.filter(id => id !== itemId);
    console.log(`children after ${JSON.stringify(finalChildrenList)}`);
    let updateDeclaration = {};
    if (finalChildrenList.length > 0) {
        updateDeclaration = {
            Action: 'PUT',
            Value: {
                SS: finalChildrenList
            }
        }
    } else {
        updateDeclaration = {
            Action: 'DELETE'
        }
    }

    const params = {
        Key: {
            'id': {
                S: item.id.S
            }
        },
        TableName: tableName,
        AttributeUpdates: {
            'children': updateDeclaration
        }
    };
    console.log(`update params: ${JSON.stringify(params)}`);
    try {
        const result = await ddb.updateItem(params).promise();
        console.log(`update result: ${JSON.stringify(result)}`);
    } catch (error) {
        console.log(`Error of update operation for item id: ${item.id.S}. Message: ${error.message}`);
    }
}

const getItemsByChildren = async (itemId) => {
    const params = {
        TableName: tableName,
        ScanFilter: {
            'children': {
                ComparisonOperator: 'CONTAINS',
                AttributeValueList: [
                    {
                        S: itemId
                    }
                ]
            }
        }
    }

    let items = [];
    try {
        const result = await ddb.scan(params).promise();
        console.log(`result of get items: ${JSON.stringify(result)}`);
        items = result.Items;
    } catch (error) {
        console.log(`Error of scan operation for item id: ${itemId}. Message: ${error.message}`);
    }
    console.log(`items to update: ${JSON.stringify(items)}`);
    return items;
}

const getItem = async (itemId) => {
    const params = {
        Key: {
            'id': {
                S: itemId
            }
        },
        TableName: tableName
    }
    let item = {};
     try {
        item = await ddb.getItem(params).promise();
     } catch (error) {
          console.error(`Error of retrieving operation for item id: ${itemId}. Message: ${error.message}`);
     }
     return item;
}

const deleteItem = async (itemId) => {

    const params = {
        Key: {
            'id': {
                S: itemId
            }
        },
        TableName: tableName
    }

    console.log(`delete params: ${JSON.stringify(params)}`);
    try {
         const result = await ddb.deleteItem(params).promise();
         console.log(`delete result: ${JSON.stringify(result)}`);
    } catch (error) {
        console.log(`Error of deletion operation for item id: ${itemId}. Message: ${error.message}`);
    }
}