package com.epam.knowledgegraph.construct;

import org.jetbrains.annotations.NotNull;
import software.amazon.awscdk.core.Construct;
import software.amazon.awscdk.core.Duration;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;

public class FunctionConstruct extends Construct {

    private final Function function;

    private FunctionConstruct(@NotNull Construct scope,
                             @NotNull String id,
                             @NotNull String functionName,
                             @NotNull String handler) {
        super(scope, id);

        function = Function.Builder.create(this, id)
                .functionName(functionName)
                .handler(handler)
                .code(Code.fromAsset("lambda"))
                .runtime(Runtime.NODEJS_14_X)
                .timeout(Duration.seconds(10))
                .build();

    }

    public Function getFunction() {
        return function;
    }

    public static Function constructFunction(@NotNull Construct scope,
                                             @NotNull String id,
                                             @NotNull String functionName,
                                             @NotNull String handler) {
        return new FunctionConstruct(scope, id, functionName,handler).getFunction();
    }
}
