package com.epam.knowledgegraph.stack;

import com.epam.knowledgegraph.construct.BucketConstruct;
import com.epam.knowledgegraph.construct.FunctionConstruct;
import com.epam.knowledgegraph.construct.TableConstruct;
import software.amazon.awscdk.core.App;
import software.amazon.awscdk.core.CfnParameter;
import software.amazon.awscdk.core.Stack;
import software.amazon.awscdk.core.StackProps;
import software.amazon.awscdk.services.apigateway.*;
import software.amazon.awscdk.services.cloudfront.*;
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.s3.Bucket;

import java.util.Optional;

import static java.lang.Boolean.TRUE;
import static java.util.Collections.singletonList;

public class KnowledgeGraphStack extends Stack {

    public KnowledgeGraphStack(final App scope, final String id, final StackProps props) {
        super(scope, id, props);

        Function retrieveGraphLambda = FunctionConstruct.constructFunction(this, "RetrieveGraphLambda", "RetrieveGraphLambda", "get-knowledge-graph.handler");
        Function updateGraphLambda = FunctionConstruct.constructFunction(this, "UpdateGraphLambda", "UpdateGraphLambda", "update-knowledge-graph.handler");

        Table graphTable = TableConstruct.constructTable(this, "GraphTable", "GraphTable");
        graphTable.grantReadData(retrieveGraphLambda);
        graphTable.grantReadWriteData(updateGraphLambda);
        updateGraphLambda.addEnvironment("TABLE_NAME",graphTable.getTableName());
        retrieveGraphLambda.addEnvironment("TABLE_NAME",graphTable.getTableName());

        String bucketName = retrieveParameter("bucketName").orElse("knowledge-graph-bucket");
        Bucket bucket = BucketConstruct.constructBucket(this, "KnowledgeGraph", bucketName);
        bucket.grantRead(retrieveGraphLambda);
        retrieveGraphLambda.addEnvironment("BUCKET_NAME",bucket.getBucketName());
        retrieveGraphLambda.addEnvironment("FILE_KEY","KnowledgeGraph.json");

        LambdaIntegration retrieveGraphLambdaIntegration = LambdaIntegration.Builder.create(retrieveGraphLambda)
                .integrationResponses(singletonList(IntegrationResponse.builder()
                        .statusCode("200")
                        .build()))
                .proxy(Boolean.FALSE)
                .build();

        LambdaIntegration updateGraphLambdaIntegration = LambdaIntegration.Builder.create(updateGraphLambda)
                .integrationResponses(singletonList(IntegrationResponse.builder()
                        .statusCode("200")
                        .build()))
                .proxy(Boolean.FALSE)
                .build();

        RestApi restApi = RestApi.Builder.create(this,"KnowledgeGraphApiGateway")
                .restApiName("KnowledgeGraphApiGateway")
                .apiKeySourceType(ApiKeySourceType.HEADER)
                .build();
        IApiKey apiKey = restApi.addApiKey("KnowledgeGraphApiKey", ApiKeyOptions.builder().apiKeyName("KnowledgeGraphApiKey").build());

        Resource resource = restApi.getRoot().addResource("knowledge-graph");

        resource.addMethod("GET", retrieveGraphLambdaIntegration, MethodOptions.builder()
                .methodResponses(singletonList(MethodResponse.builder()
                        .statusCode("200")
                        .build()))
                .apiKeyRequired(TRUE)
                .build());

        resource.addMethod("PUT", updateGraphLambdaIntegration, MethodOptions.builder()
                .methodResponses(singletonList(MethodResponse.builder()
                        .statusCode("200")
                        .build()))
                .apiKeyRequired(TRUE)
                .build());

        Deployment knowledgeGraphDeployment = Deployment.Builder.create(this, "KnowledgeGraphDeployment").api(restApi).build();
        Stage prodStage = new Stage(this, "Production", StageProps.builder()
                .stageName("Prod")
                .deployment(knowledgeGraphDeployment)
                .build());
        restApi.setDeploymentStage(prodStage);

        UsagePlan usagePlan = restApi.addUsagePlan("KnowledgeGraph", UsagePlanProps.builder()
                .apiStages(singletonList(UsagePlanPerApiStage.builder()
                        .api(restApi)
                        .stage(prodStage)
                        .build()))
                .build());
        usagePlan.addApiKey(apiKey);

        Behavior behavior = Behavior.builder()
                .isDefaultBehavior(TRUE)
                .build();

        String siteBucketName = retrieveParameter("siteBucketName").orElse("site-knowledge-graph-bucket");
        Bucket siteBucket = BucketConstruct.constructWebBucket(this, "KnowledgeGraphUI", siteBucketName, "index.html");

        SourceConfiguration sourceConfig = SourceConfiguration.builder()
                .s3OriginSource(
                     S3OriginConfig.builder()
                        .s3BucketSource(siteBucket)
                        .build()
                ).behaviors(singletonList(behavior))
                .build();
        CloudFrontWebDistribution.Builder.create(this, "KnowledgeGraphDistribution")
                .originConfigs(singletonList(sourceConfig))
                .build();

    }

    private Optional<String> retrieveParameter(String parameterName) {
        CfnParameter parameter = CfnParameter.Builder.create(this, parameterName)
                .type("String")
                .build();
        return Optional.ofNullable(parameter.getValueAsString());
    }

}
