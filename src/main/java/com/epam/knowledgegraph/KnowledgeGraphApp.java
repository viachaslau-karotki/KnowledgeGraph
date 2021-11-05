package com.epam.knowledgegraph;

import com.epam.knowledgegraph.stack.KnowledgeGraphStack;
import software.amazon.awscdk.core.App;

public class KnowledgeGraphApp {

    public static void main(final String[] args) {
        App app = new App();

        new KnowledgeGraphStack(app, "KnowledgeGraphStack", null);
        app.synth();
    }
}
