package com.epam.knowledgegraph.construct;

import org.jetbrains.annotations.NotNull;
import software.amazon.awscdk.core.Construct;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.Table;

public class TableConstruct extends Construct {

    private final Table table;

    private TableConstruct(@NotNull Construct scope,
                           @NotNull String id,
                           @NotNull String tableName) {
        super(scope, id);

        table = Table.Builder.create(this, id)
                .partitionKey(Attribute.builder()
                        .type(AttributeType.STRING)
                        .name("id")
                        .build())
                .tableName(tableName)
                .build();
    }

    private Table getTable() {
        return table;
    }

    public static Table constructTable(@NotNull Construct scope,
                                       @NotNull String id,
                                       @NotNull String tableName) {
        return new TableConstruct(scope, id, tableName).getTable();
    }
}
