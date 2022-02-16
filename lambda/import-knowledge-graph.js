const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const tableName = process.env.TABLE_NAME;

Object.defineProperty(Array.prototype, 'chunk', {
  value: function(chunkSize) {
    var r = [];
    for (var i = 0; i < this.length; i += chunkSize)
      r.push(this.slice(i, i + chunkSize));
    return r;
  }
});

exports.handler = async (event) => {

    console.log(`initial event: ${JSON.stringify(event)}`);

    const itemsToPersist = processItems(event, []);
    const payloadToPut = generatePayloadToPut(itemsToPersist);

    const requestItemList = payloadToPut.chunk(24).map(payload => {
    console.log(`Payload chunk: ${JSON.stringify(payload)}`);
    return {
         RequestItems: {
             [tableName] : payload
         }
    };
    });

    for (let request of requestItemList) {
        const res = await ddb.batchWriteItem(request).promise();
        console.log(`Result: ${JSON.stringify(res)}`);
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};

const processItems = (initArray, resultArray) => {
    let items = initArray.map(item => {
        if (item.children && item.children.length > 0) {
            let array = processItems(item.children, resultArray);
            const resultArrayIds = resultArray.map(item => item.id);
            let arrayWithoutDuplicates = array.filter(item => !resultArrayIds.includes(item.id));
            resultArray = resultArray.concat(arrayWithoutDuplicates);
            item.children = item.children.map(object => object.id);
        }
        return item;
    });
    return resultArray.concat(items);
};

const generatePayloadToPut = (event) => {
    return event.filter(record => (record.id !== undefined))
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