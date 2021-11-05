package com.epam.knowledgegraph.construct;

import org.jetbrains.annotations.NotNull;
import software.amazon.awscdk.core.Construct;
import software.amazon.awscdk.core.RemovalPolicy;
import software.amazon.awscdk.services.s3.Bucket;

import static java.lang.Boolean.TRUE;

public class BucketConstruct extends Construct {

    private final Bucket bucket;

    private BucketConstruct(@NotNull Construct scope,
                            @NotNull String id,
                            @NotNull String bucketName,
                            String indexPage) {
        super(scope, id);

        bucket = Bucket.Builder.create(this, id)
                .websiteIndexDocument(indexPage)
                .bucketName(bucketName)
                .versioned(TRUE)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
    }

    private Bucket getBucket() {
        return bucket;
    }

    public static Bucket constructBucket(@NotNull Construct scope,
                                         @NotNull String id,
                                         @NotNull String bucketName) {
        return new BucketConstruct(scope, id, bucketName, null).getBucket();
    }

    public static Bucket constructWebBucket(@NotNull Construct scope,
                                            @NotNull String id,
                                            @NotNull String bucketName,
                                            @NotNull String indexPage) {
        return new BucketConstruct(scope, id, bucketName, indexPage).getBucket();
    }

}
