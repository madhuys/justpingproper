// Constants for default configurations
const DEFAULT_AI_CONFIG = {
    aiProvider: "gpt",
    model: "gpt-3.5-turbo",
    maxTokens: 2000,
    temperature: 0.7,
    contextInput: "",
    systemPrompt: "",
};

const NODE_TYPE_MAP = {
    message: "text",
    question: "quick_reply",
    list: "list",
    buttons: "buttons",
};

const getNodeTypeForExport = (nodeType) => {
    return NODE_TYPE_MAP[nodeType.toLowerCase()] || "text";
};

const getPostbackText = (sourceNode, targetNode, optionText, nodeToStepMap) => {
    // If no target node, use current node's step
    if (!targetNode) {
        const currentStep = nodeToStepMap[sourceNode.id] || "stop";
        return `${currentStep}/${optionText}`;
    }

    // Get step name for target node
    const stepName = nodeToStepMap[targetNode.id] || "stop";
    return `${stepName}/${optionText}`;
};

const createMessageContent = (node, outgoingEdges, nodes, nodeToStepMap) => {
    const contentGenerators = {
        messageNode: () => ({
            type: "text",
            text: node.data.text,
        }),

        questionNode: () => ({
            type: "quick_reply",
            content: {
                type: "text",
                text: node.data.question ?? "",
            },
            options: generateOptions(node, outgoingEdges, nodes, nodeToStepMap),
        }),

        listNode: () => ({
            type: "list",
            title: node.data.label || "Options List",
            body: node.data.question || "",
            globalButtons: [{ type: "text", title: "Select an Option" }],
            items: [
                {
                    title: node.data.label || "Options List",
                    options: generateOptions(
                        node,
                        outgoingEdges,
                        nodes,
                        nodeToStepMap,
                    ),
                },
            ],
        }),

        buttonsNode: () => ({
            type: "quick_reply",
            content: {
                type: "text",
                text: node.data.text ?? "",
            },
            options: generateOptions(node, outgoingEdges, nodes, nodeToStepMap),
        }),
    };

    // Generate content based on node type, default to unknown
    const generator = contentGenerators[node.type];
    return generator ? generator() : { type: "unknown" };
};

const generateOptions = (node, outgoingEdges, nodes, nodeToStepMap) => {
    const optionsKey = node.type === "buttonsNode" ? "buttons" : "options";
    return (node.data[optionsKey] || []).map((option, optionIndex) => {
        const edge = outgoingEdges.find(
            (e) => e.sourceHandle === `handle-${optionIndex}`,
        );

        if (!edge) {
            // No edge, use current node's step
            const currentStep = nodeToStepMap[node.id] || "stop";
            return {
                type: "text",
                title: option,
                postbackText: `${currentStep}/${option}`,
            };
        }

        const targetNode = nodes.find((n) => n.id === edge.target);
        return {
            type: "text",
            title: option,
            postbackText: getPostbackText(
                node,
                targetNode,
                option,
                nodeToStepMap,
            ),
        };
    });
};

const exportFlow = (flowData) => {
    const { nodes, connections } = flowData;
    // Create node-to-step mapping
    const nodeToStepMap = createNodeToStepMap(nodes);
    // Convert nodes to exportable format
    const finalJson = nodes
        .filter((node) => node.type !== "startNode")
        .map((node) =>
            createExportedNode(node, connections, nodes, nodeToStepMap),
        );
    return finalJson;
};

const createNodeToStepMap = (nodes) => {
    const nodeToStepMap = {};
    let stepCounter = 0;

    nodes.forEach((node) => {
        if (node.type !== "startNode") {
            nodeToStepMap[node.id] = `step${stepCounter}`;
            stepCounter++;
        }
    });

    return nodeToStepMap;
};

const createExportedNode = (node, edges, nodes, nodeToStepMap) => {
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);
    const nodeType = node.type.replace("Node", "");

    // Determine AI takeover configuration
    const isAITakeoverEnabled = node.data.enableAITakeover === true;
    const safeAIConfig = isAITakeoverEnabled
        ? JSON.parse(JSON.stringify(node.data.aiConfig || DEFAULT_AI_CONFIG))
        : null;

    return {
        step: nodeToStepMap[node.id],
        step_name: node.data.stepName || node.data.label || "",
        variable: node.data.variable || "",
        mandatory: node.data.mandatory ? true : false,
        check_post: node.data.checkPost ? node.data.checkPostName : "",
        purpose:
            node.data.purpose ||
            `To handle ${nodeType.toLowerCase()} interaction`,
        enable_ai_takeover: isAITakeoverEnabled,
        regex: node.data.regex || "",
        next_possible_steps: getNextPossibleSteps(
            outgoingEdges,
            nodes,
            nodeToStepMap,
        ),
        type_of_message: getNodeTypeForExport(nodeType),
        message_content: createMessageContent(
            node,
            outgoingEdges,
            nodes,
            nodeToStepMap,
        ),
        media_items: getMediaItems(node),
        ai_config: safeAIConfig,
    };
};

const getNextPossibleSteps = (outgoingEdges, nodes, nodeToStepMap) => {
    if (outgoingEdges.length === 0) return ["stop"];

    return outgoingEdges.map((edge) => {
        const targetNode = nodes.find((n) => n.id === edge.target);
        return targetNode ? nodeToStepMap[edge.target] || "stop" : "stop";
    });
};

const getMediaItems = (node) => {
    const { mediaItems } = node.data;
    return mediaItems && mediaItems.length > 0
        ? mediaItems.map((item) => ({
              type: item.type,
              url: item.url,
              name: item.name,
          }))
        : [];
};

module.exports = {
    exportFlow,
    createMessageContent,
    getNodeTypeForExport,
    getPostbackText,
};
