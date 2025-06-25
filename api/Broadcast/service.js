// api/Broadcast/service.js
const boom = require("@hapi/boom");
const { transaction } = require("../../system/db/database");
const logger = require("../../system/utils/logger");

const karixService = require("../../system/providers/karix/broadcast");

const Broadcast = require("../../system/models/Broadcast");
const ContactGroupAssociation = require("../../system/models/ContactGroupAssociation");
const Agent = require("../../system/models/Agent");
const BroadcastBatchResult = require("../../system/models/BroadcastBatchResult");
const EndUser = require("../../system/models/EndUser");
const Conversation = require("../../system/models/Conversation");
const Message = require("../../system/models/Message");
const MessageAttachment = require("../../system/models/MessageAttachment");

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

/**
 * Update the broadcast record with final status
 * @private
 */
async function updateBroadcastStatus(broadcastId, status, metrics) {
  if (!broadcastId) return;

  try {
    const updateData = {
      analytics: {
        totalRecipients: metrics.totalContacts,
        successful: metrics.successfulContacts,
        read: 0,
        replied: 0,
        ignored: 0,
        failed: metrics.failedContacts,
        responseAnalytics: {},
      },
      processingMetrics: {
        processingTimeMs: metrics.processingTimeMs,
        batchesTotal: metrics.batchesTotal,
        batchesCompleted: metrics.batchesCompleted,
        batchesFailed: metrics.batchesFailed,
        contactsPerSecond:
          metrics.processingTimeMs > 0
            ? Math.round(
                (metrics.processedContacts / metrics.processingTimeMs) * 1000,
              )
            : 0,
      },
    };

    // Add provider-specific fields
    if (status.batchId) {
      updateData.batchId = status.batchId;
    }

    if (metrics.batchIds && metrics.batchIds.length > 0) {
      updateData.batchIds = metrics.batchIds;
    }

    if (status.messageIds) {
      updateData.messageIds = status.messageIds;
    } else if (metrics.messageIds && metrics.messageIds.length > 0) {
      updateData.messageIds = metrics.messageIds;
    }

    // For Gupshup
    if (metrics.messageIds && metrics.messageIds.length > 0) {
      updateData.gupshupIds = metrics.messageIds;
    }

    // Set the overall status
    if (status.status === "success" || metrics.failedContacts === 0) {
      updateData.status = "SENT";
    } else if (
      status.status === "partial" ||
      (metrics.successfulContacts > 0 && metrics.failedContacts > 0)
    ) {
      updateData.status = "PARTIAL_SENT";
    } else {
      updateData.status = "FAILED";
    }

    await service.update(broadcastId, updateData);
  } catch (error) {
    logger.error(`Failed to update broadcast status: ${error.message}`);
  }
}

/**
 * Helper function to validate broadcast status transitions
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - New status
 */
function validateStatusTransition(currentStatus, newStatus) {
  // Define allowed transitions
  const allowedTransitions = {
    draft: ["scheduled", "active", "cancelled"],
    scheduled: ["active", "paused", "cancelled"],
    active: ["paused", "completed", "cancelled"],
    paused: ["active", "completed", "cancelled"],
    completed: [], // No transitions allowed from completed
    cancelled: [], // No transitions allowed from cancelled
    failed: ["draft"], // Can only retry from failed
  };

  if (!allowedTransitions[currentStatus].includes(newStatus)) {
    throw boom.badRequest(
      `Cannot transition broadcast from '${currentStatus}' to '${newStatus}'`,
    );
  }
}

/**
 * Get broadcast analytics
 * @param {string} broadcastId - Broadcast ID
 * @param {Object} options - Analytics options (start_date, end_date, granularity)
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Broadcast analytics
 */
async function getBroadcastAnalytics(broadcastId, options, businessId) {
  try {
    // Check if broadcast exists and get its details
    const broadcast = await Broadcast.query()
      .withGraphJoined("campaign")
      .where("broadcast.id", broadcastId)
      .first();

    if (!broadcast) {
      throw boom.notFound("Broadcast not found");
    }

    // Verify broadcast belongs to the business
    if (broadcast.campaign.business_id !== businessId) {
      throw boom.forbidden("Access denied to this broadcast");
    }

    // Get the stored analytics
    const analytics = broadcast.analytics || {};

    // Initialize summary if not available
    const summary = {
      total_recipients: analytics.total_recipients || 0,
      total_messages_sent: analytics.total_messages_sent || 0,
      total_messages_delivered: analytics.total_messages_delivered || 0,
      total_messages_read: analytics.total_messages_read || 0,
      total_messages_replied: analytics.total_messages_replied || 0,
      total_messages_ignored: analytics.total_messages_ignored || 0,
      total_messages_failed: analytics.total_messages_failed || 0,
    };

    // If detailed data is requested by granularity, fetch it
    let hourlyData = [];
    let dailyData = [];

    // In a real implementation, you would fetch this from a time-series database or logs
    // For this example, we'll simulate the data

    // For demo purposes, let's generate some hourly data around the broadcast start time
    if (broadcast.actual_start) {
      const startDateTime = new Date(broadcast.actual_start);
      const endDateTime = broadcast.actual_end
        ? new Date(broadcast.actual_end)
        : new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000); // Default to 24 hours later

      // Apply date filters if provided
      const filterStartDate = options.start_date
        ? new Date(options.start_date)
        : startDateTime;
      const filterEndDate = options.end_date
        ? new Date(options.end_date)
        : endDateTime;

      // Generate hourly data
      const currentDateTime = new Date(filterStartDate);
      while (currentDateTime <= filterEndDate) {
        const hourData = {
          hour: currentDateTime.toISOString(),
          messages_sent: Math.floor(Math.random() * 500) + 100,
          messages_delivered: 0,
          messages_read: 0,
          messages_replied: 0,
          messages_ignored: 0,
          messages_failed: 0,
        };

        // Make sure numbers logically decrease (sent -> delivered -> read -> etc.)
        hourData.messages_delivered = Math.floor(
          hourData.messages_sent * (0.9 + Math.random() * 0.1),
        );
        hourData.messages_read = Math.floor(
          hourData.messages_delivered * (0.7 + Math.random() * 0.2),
        );
        hourData.messages_replied = Math.floor(
          hourData.messages_read * (0.3 + Math.random() * 0.4),
        );
        hourData.messages_ignored =
          hourData.messages_read - hourData.messages_replied;
        hourData.messages_failed =
          hourData.messages_sent - hourData.messages_delivered;

        hourlyData.push(hourData);

        // Increment by one hour
        currentDateTime.setHours(currentDateTime.getHours() + 1);
      }

      // Aggregate hourly data into daily data
      const dailyMap = new Map();
      hourlyData.forEach((hour) => {
        const dateKey = hour.hour.split("T")[0]; // Extract just the date part

        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, {
            date: dateKey,
            messages_sent: 0,
            messages_delivered: 0,
            messages_read: 0,
            messages_replied: 0,
            messages_ignored: 0,
            messages_failed: 0,
          });
        }

        const dayData = dailyMap.get(dateKey);
        dayData.messages_sent += hour.messages_sent;
        dayData.messages_delivered += hour.messages_delivered;
        dayData.messages_read += hour.messages_read;
        dayData.messages_replied += hour.messages_replied;
        dayData.messages_ignored += hour.messages_ignored;
        dayData.messages_failed += hour.messages_failed;
      });

      dailyData = Array.from(dailyMap.values());
    }

    return {
      broadcast_id: broadcast.id,
      name: broadcast.name,
      analytics: {
        summary,
        [options.granularity || "hourly"]:
          options.granularity === "daily" ? dailyData : hourlyData,
      },
    };
  } catch (error) {
    logger.error(`Error getting broadcast analytics ${broadcastId}:`, error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to get broadcast analytics");
  }
}

/**
 * Export broadcast analytics
 * @param {string} broadcastId - Broadcast ID
 * @param {Object} options - Export options (format, include_recipients, include_messages)
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Export file information
 */
async function exportBroadcastAnalytics(broadcastId, options, businessId) {
  try {
    // Check if broadcast exists and get its details
    const broadcast = await Broadcast.query()
      .withGraphJoined("campaign")
      .where("broadcast.id", broadcastId)
      .first();

    if (!broadcast) {
      throw boom.notFound("Broadcast not found");
    }

    // Verify broadcast belongs to the business
    if (broadcast.campaign.business_id !== businessId) {
      throw boom.forbidden("Access denied to this broadcast");
    }

    // Get analytics data
    const analytics = await getBroadcastAnalytics(
      broadcastId,
      { granularity: "hourly" },
      businessId,
    );

    // Create temporary directory if it doesn't exist
    const tempDir = path.join(__dirname, "..", "..", "uploads", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Format data for export
    const exportData = [
      ["Broadcast Name", broadcast.name],
      ["Broadcast ID", broadcast.id],
      ["Campaign", broadcast.campaign.name],
      ["Status", broadcast.status],
      ["Scheduled Start", broadcast.scheduled_start || "N/A"],
      ["Actual Start", broadcast.actual_start || "N/A"],
      ["Actual End", broadcast.actual_end || "N/A"],
      [""],
      ["Summary"],
      ["Total Recipients", analytics.analytics.summary.total_recipients],
      ["Total Sent", analytics.analytics.summary.total_messages_sent],
      ["Total Delivered", analytics.analytics.summary.total_messages_delivered],
      ["Total Read", analytics.analytics.summary.total_messages_read],
      ["Total Replied", analytics.analytics.summary.total_messages_replied],
      ["Total Ignored", analytics.analytics.summary.total_messages_ignored],
      ["Total Failed", analytics.analytics.summary.total_messages_failed],
      [""],
      ["Hourly Breakdown"],
      ["Hour", "Sent", "Delivered", "Read", "Replied", "Ignored", "Failed"],
    ];

    // Add hourly data
    analytics.analytics.hourly.forEach((hour) => {
      exportData.push([
        hour.hour,
        hour.messages_sent,
        hour.messages_delivered,
        hour.messages_read,
        hour.messages_replied,
        hour.messages_ignored,
        hour.messages_failed,
      ]);
    });

    // If recipients should be included, add recipient data
    if (options.include_recipients) {
      // In a real implementation, fetch recipient data from database
      // For this example, we'll add placeholder data
      exportData.push([""]);
      exportData.push(["Recipient Details"]);
      exportData.push(["Recipient ID", "Name", "Phone", "Email", "Status"]);
      exportData.push([
        "rec_001",
        "John Doe",
        "+1234567890",
        "john@example.com",
        "delivered",
      ]);
      exportData.push([
        "rec_002",
        "Jane Smith",
        "+0987654321",
        "jane@example.com",
        "read",
      ]);
    }

    // If messages should be included, add message data
    if (options.include_messages) {
      // In a real implementation, fetch message data from database
      // For this example, we'll add placeholder data
      exportData.push([""]);
      exportData.push(["Message Contents"]);
      exportData.push(["Recipient ID", "Message"]);
      exportData.push([
        "rec_001",
        "Hello John, thank you for being a loyal customer. Your discount code is JD123.",
      ]);
      exportData.push([
        "rec_002",
        "Hello Jane, thank you for being a loyal customer. Your discount code is JS456.",
      ]);
    }

    // Create export file based on format
    const timestamp = new Date().toISOString().replace(/[:\-T.Z]/g, "");
    const filename = `broadcast_analytics_${broadcastId}_${timestamp}.${options.format}`;
    const filePath = path.join(tempDir, filename);

    if (options.format === "xlsx") {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(exportData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Broadcast Analytics");

      // Write to file
      XLSX.writeFile(workbook, filePath);
    } else {
      // CSV format
      const csvContent = exportData.map((row) => row.join(",")).join("\n");
      fs.writeFileSync(filePath, csvContent);
    }

    return {
      filename,
      filePath,
      contentType:
        options.format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv",
    };
  } catch (error) {
    logger.error(`Error exporting broadcast analytics ${broadcastId}:`, error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to export broadcast analytics");
  }
}

/**
 * Retarget failed recipients
 * @param {string} broadcastId - Original broadcast ID
 * @param {Object} data - Retargeting data
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - New retargeting broadcast
 */
async function retargetFailedRecipients(broadcastId, data, businessId, userId) {
  return await transaction(async (trx) => {
    try {
      // Check if original broadcast exists and get its details
      const broadcast = await Broadcast.query(trx)
        .withGraphJoined("campaign")
        .where("broadcast.id", broadcastId)
        .first();

      if (!broadcast) {
        throw boom.notFound("Broadcast not found");
      }

      // Verify broadcast belongs to the business
      if (broadcast.campaign.business_id !== businessId) {
        throw boom.forbidden("Access denied to this broadcast");
      }

      // Verify original broadcast has completed
      if (broadcast.status !== "completed") {
        throw boom.badRequest("Can only retarget completed broadcasts");
      }

      // Calculate number of recipients to retarget
      // In a real implementation, this would query the database for failed deliveries
      // For this example, we'll use the analytics data
      const failedCount = broadcast.analytics?.total_messages_failed || 0;
      const undeliveredCount =
        (broadcast.analytics?.total_messages_sent || 0) -
        (broadcast.analytics?.total_messages_delivered || 0);

      let recipientCount = 0;
      if (data.include_errors) recipientCount += failedCount;
      if (data.include_undelivered) recipientCount += undeliveredCount;

      // Create new broadcast based on original
      const retargetData = {
        campaign_id: broadcast.campaign_id,
        name: data.name,
        description: `Retargeting of broadcast ${broadcast.name}`,
        business_channel_id: broadcast.business_channel_id,
        template_id: broadcast.template_id,
        contact_group_id: broadcast.contact_group_id,
        status: "draft",
        schedule_type: "scheduled",
        scheduled_start: data.scheduled_start || null,
        variable_mapping: broadcast.variable_mapping,
        default_message: broadcast.default_message,
        agent_mapping: broadcast.agent_mapping,
        type: broadcast.type || broadcast.metadata?.type || "outbound", // Ensure type field is included
        metadata: {
          ...broadcast.metadata,
          retargeting: {
            original_broadcast_id: broadcastId,
            include_undelivered: data.include_undelivered,
            include_errors: data.include_errors,
          },
        },
        original_broadcast_id: broadcastId,
        created_by: userId,
      };

      // Create the retargeting broadcast
      const retargetBroadcast = await Broadcast.query(trx).insert(retargetData);

      return {
        id: retargetBroadcast.id,
        name: retargetBroadcast.name,
        original_broadcast_id: retargetBroadcast.original_broadcast_id,
        status: retargetBroadcast.status,
        scheduled_start: retargetBroadcast.scheduled_start,
        recipient_count: recipientCount,
        created_at: retargetBroadcast.created_at,
      };
    } catch (error) {
      logger.error(
        `Error creating broadcast for campaign ${campaignId}:`,
        error,
      );
      if (error.isBoom) {
        throw error;
      }
      throw boom.badImplementation("Failed to create broadcast");
    }
  });
}

/**
 * Update an existing broadcast
 * @param {string} broadcastId - Broadcast ID
 * @param {Object} data - Updated broadcast data
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Updated broadcast
 */
async function updateBroadcast(broadcastId, data, businessId) {
  return await transaction(async (trx) => {
    try {
      // Check if broadcast exists and get its details
      const broadcast = await Broadcast.query(trx)
        .withGraphJoined("[campaign, template, contactGroup, businessChannel]")
        .where("broadcast.id", broadcastId)
        .first();

      if (!broadcast) {
        throw boom.notFound("Broadcast not found");
      }

      // Verify broadcast belongs to the business
      if (broadcast.campaign.business_id !== businessId) {
        throw boom.forbidden("Access denied to this broadcast");
      }

      // Can only update broadcasts in draft or scheduled status
      if (!["draft", "scheduled"].includes(broadcast.status)) {
        throw boom.forbidden(
          `Cannot update a broadcast in ${broadcast.status} status`,
        );
      } // Prepare update data
      const updateData = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.variable_mapping !== undefined)
        updateData.variable_mapping = data.variable_mapping;
      if (data.default_message !== undefined)
        updateData.default_message = data.default_message;
      if (data.agent_mapping !== undefined)
        updateData.agent_mapping = data.agent_mapping;
      if (data.schedule_type !== undefined)
        updateData.schedule_type = data.schedule_type;
      if (data.scheduled_start !== undefined)
        updateData.scheduled_start = data.scheduled_start;
      if (data.scheduled_end !== undefined)
        updateData.scheduled_end = data.scheduled_end;
      if (data.metadata !== undefined) updateData.metadata = data.metadata; // Handle type field - store both directly and in metadata
      if (data.type !== undefined) {
        updateData.type = data.type; // Store as direct field
        updateData.metadata = {
          ...broadcast.metadata,
          ...updateData.metadata,
          type: data.type, // Store in metadata for backward compatibility
        };
      }

      updateData.updated_at = new Date().toISOString();

      // Validate agent mapping if provided
      if (data.agent_mapping) {
        for (const buttonKey in data.agent_mapping) {
          const agentId = data.agent_mapping[buttonKey];
          const agent = await Agent.query(trx)
            .where({
              id: agentId,
              business_id: businessId,
            })
            .first();

          if (!agent) {
            throw boom.notFound(
              `Agent with ID ${agentId} not found or doesn't belong to this business`,
            );
          }
        }
      }

      // Update broadcast
      const updatedBroadcast = await Broadcast.query(trx).patchAndFetchById(
        broadcastId,
        updateData,
      );

      return updatedBroadcast;
    } catch (error) {
      logger.error(`Error updating broadcast ${broadcastId}:`, error);
      if (error.isBoom) {
        throw error;
      }
      throw boom.badImplementation("Failed to update broadcast");
    }
  });
}

/**
 * Delete a broadcast
 * @param {string} broadcastId - Broadcast ID
 * @param {string} businessId - Business ID
 * @returns {Promise<boolean>} - Success flag
 */
async function deleteBroadcast(broadcastId, businessId) {
  return await transaction(async (trx) => {
    try {
      // Check if broadcast exists and get its details
      const broadcast = await Broadcast.query(trx)
        .withGraphJoined("campaign")
        .where("broadcast.id", broadcastId)
        .first();

      if (!broadcast) {
        throw boom.notFound("Broadcast not found");
      }

      // Verify broadcast belongs to the business
      if (broadcast.campaign.business_id !== businessId) {
        throw boom.forbidden("Access denied to this broadcast");
      }

      // Can only delete broadcasts in draft status
      if (broadcast.status !== "draft") {
        throw boom.forbidden(
          `Cannot delete a broadcast in ${broadcast.status} status`,
        );
      }

      // Delete the broadcast
      await Broadcast.query(trx).deleteById(broadcastId);

      return true;
    } catch (error) {
      logger.error(`Error deleting broadcast ${broadcastId}:`, error);
      if (error.isBoom) {
        throw error;
      }
      throw boom.badImplementation("Failed to delete broadcast");
    }
  });
}

/**
 * Update broadcast status
 * @param {string} broadcastId - Broadcast ID
 * @param {string} status - New status
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Updated broadcast status
 */
async function updateBroadcastStatus(broadcastId, status, businessId) {
  try {
    // Check if broadcast exists and get its details
    const broadcast = await Broadcast.query()
      .withGraphJoined("campaign")
      .where("broadcast.id", broadcastId)
      .first();

    if (!broadcast) {
      throw boom.notFound("Broadcast not found");
    }

    // Verify broadcast belongs to the business
    if (broadcast.campaign.business_id !== businessId) {
      throw boom.forbidden("Access denied to this broadcast");
    }

    // Validate status transition
    validateStatusTransition(broadcast.status, status);

    // Update status with appropriate timestamp updates
    const updateData = {
      status: status,
      updated_at: new Date().toISOString(),
    };

    // Set appropriate timestamps based on status
    if (status === "active") {
      updateData.actual_start = new Date().toISOString();
    } else if (status === "completed" || status === "cancelled") {
      updateData.actual_end = new Date().toISOString();
    }

    // Update the broadcast
    const updatedBroadcast = await Broadcast.query().patchAndFetchById(
      broadcastId,
      updateData,
    );

    return {
      id: updatedBroadcast.id,
      name: updatedBroadcast.name,
      status: updatedBroadcast.status,
      updated_at: updatedBroadcast.updated_at,
    };
  } catch (error) {
    logger.error(`Error updating broadcast status ${broadcastId}:`, error);
    if (error.isBoom) {
      throw error;
    }
    throw boom.badImplementation("Failed to update broadcast status");
  }
}

/**
 * Clone a broadcast
 * @param {string} broadcastId - Broadcast ID to clone
 * @param {Object} data - Clone data
 * @param {string} businessId - Business ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Cloned broadcast
 */
async function cloneBroadcast(broadcastId, data, businessId, userId) {
  return await transaction(async (trx) => {
    try {
      // Check if broadcast exists and get its details
      const broadcast = await Broadcast.query(trx)
        .withGraphJoined("campaign")
        .where("broadcast.id", broadcastId)
        .first();

      if (!broadcast) {
        throw boom.notFound("Broadcast not found");
      }

      // Verify broadcast belongs to the business
      if (broadcast.campaign.business_id !== businessId) {
        throw boom.forbidden("Access denied to this broadcast");
      } // Create new broadcast based on original
      const cloneData = {
        campaign_id: broadcast.campaign_id,
        name: data.name,
        description: broadcast.description,
        business_channel_id: broadcast.business_channel_id,
        template_id: broadcast.template_id,
        contact_group_id: broadcast.contact_group_id,
        type: broadcast.type || broadcast.metadata?.type || "outbound", // Ensure type field is included
        status: "draft",
        schedule_type: broadcast.schedule_type,
        scheduled_start: data.scheduled_start || null,
        variable_mapping: broadcast.variable_mapping,
        default_message: broadcast.default_message,
        agent_mapping: broadcast.agent_mapping,
        metadata: broadcast.metadata,
        original_broadcast_id: broadcastId,
        created_by: userId,
      };

      // Create the clone
      const clonedBroadcast = await Broadcast.query(trx).insert(cloneData);

      return {
        id: clonedBroadcast.id,
        name: clonedBroadcast.name,
        original_broadcast_id: clonedBroadcast.original_broadcast_id,
        status: clonedBroadcast.status,
        scheduled_start: clonedBroadcast.scheduled_start,
        created_at: clonedBroadcast.created_at,
      };
    } catch (error) {
      logger.error(`Error cloning broadcast ${broadcastId}:`, error);
      if (error.isBoom) {
        throw error;
      }
      throw boom.badImplementation("Failed to clone broadcast");
    }
  });
}

/**
 * Create a broadcast message for a contact group
 * @param {string} campaignId - Campaign identifier
 * @param {Object} data - Broadcast data
 * @param {string} businessId - Business identifier
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} - Created broadcast with stats
 */
const createBroadcast = async (
  campaign,
  businessChannel,
  template,
  contactGroup,
  data,
  businessId,
  userId,
) => {
  const startTime = Date.now();

  // 🔍 DEBUG LOG: Starting broadcast creation process
  logger.info("🚀 [BROADCAST CREATION] Starting broadcast creation process:", {
    operation: "BROADCAST_CREATE_START",
    campaignId: campaign.id,
    businessChannelId: businessChannel.id,
    templateId: template.id,
    contactGroupId: contactGroup.id,
    broadcastName: data.name,
    broadcastType: data.type || "outbound",
    businessId,
    userId,
    startTime: new Date(startTime).toISOString(),
    timestamp: new Date().toISOString(),
  });

  return await transaction(async (trx) => {
    try {
      // Step 2: Create broadcast record
      // 🔍 DEBUG LOG: Step 2 - Creating broadcast record
      logger.info(
        "📝 [BROADCAST CREATION] Step 2: Creating broadcast record:",
        {
          operation: "STEP_2_BROADCAST_RECORD",
          step: "2/8",
          timestamp: new Date().toISOString(),
        },
      );

      const broadcast = await createBroadcastRecord(
        trx,
        data,
        campaign,
        userId,
      );

      // Step 3: Get contacts from contact group
      // 🔍 DEBUG LOG: Step 3 - Getting contacts from group
      logger.info(
        "👥 [BROADCAST CREATION] Step 3: Getting contacts from contact group:",
        {
          operation: "STEP_3_GET_CONTACTS",
          step: "3/8",
          contactGroupId: data.contact_group_id,
          timestamp: new Date().toISOString(),
        },
      );

      const { fullContactDetails, contactCount } = await getContactsFromGroup(
        trx,
        data.contact_group_id,
      );

      // Step 4: Handle empty contact case
      if (contactCount === 0) {
        // 🔍 DEBUG LOG: Empty contact group detected
        logger.warn("⚠️  [BROADCAST CREATION] Empty contact group detected:", {
          operation: "EMPTY_CONTACT_GROUP",
          contactGroupId: data.contact_group_id,
          contactGroupName: contactGroup.name,
          result: "Returning empty response",
          timestamp: new Date().toISOString(),
        });

        return buildEmptyResponse(
          broadcast,
          businessChannel,
          template,
          contactGroup,
        );
      }

      // Step 5: Process conversations for all contacts
      // 🔍 DEBUG LOG: Step 5 - Processing conversations
      logger.info(
        "💬 [BROADCAST CREATION] Step 5: Processing conversations for contacts:",
        {
          operation: "STEP_5_PROCESS_CONVERSATIONS",
          step: "5/8",
          contactCount,
          broadcastId: broadcast.id,
          timestamp: new Date().toISOString(),
        },
      );

      const { conversationData, conversationCount } =
        await processContactConversations({
          trx,
          broadcast,
          businessId,
          contacts: fullContactDetails,
          businessChannel,
          userId,
          template,
          data,
        });

      // Step 6: Send broadcast through provider
      // 🔍 DEBUG LOG: Step 6 - Sending to provider
      logger.info(
        "🌐 [BROADCAST CREATION] Step 6: Sending broadcast through provider:",
        {
          operation: "STEP_6_SEND_TO_PROVIDER",
          step: "6/8",
          provider: businessChannel?.provider_name,
          conversationCount,
          broadcastId: broadcast.id,
          timestamp: new Date().toISOString(),
        },
      );

      const batchData = await sendBroadcastToProvider(
        {
          businessChannel,
          templateData: prepareTemplateData(template, broadcast, data),
          contacts: fullContactDetails,
          broadcastId: broadcast.id,
        },
        trx,
      );

      // Step 7: Create messages for conversations
      // 🔍 DEBUG LOG: Step 7 - Creating messages
      logger.info(
        "📝 [BROADCAST CREATION] Step 7: Creating messages for conversations:",
        {
          operation: "STEP_7_CREATE_MESSAGES",
          step: "7/8",
          conversationCount,
          hasBatchData: !!batchData?.data?.data?.batchResponse,
          broadcastId: broadcast.id,
          timestamp: new Date().toISOString(),
        },
      );

      await createMessagesForConversations({
        conversations: conversationData,
        contacts: fullContactDetails,
        content: template?.content?.body?.text,
        batchData: batchData?.data?.data?.batchResponse,
        variableMapping: broadcast?.variable_mapping?.template,
        senderId: userId,
        trx,
      });

      // Step 7: Update broadcast completion
      // 🔍 DEBUG LOG: Step 8 - Updating completion status
      logger.info(
        "🏁 [BROADCAST CREATION] Step 8: Updating broadcast completion:",
        {
          operation: "STEP_8_UPDATE_COMPLETION",
          step: "8/8",
          broadcastId: broadcast.id,
          conversationCount,
          timestamp: new Date().toISOString(),
        },
      );

      await updateBroadcastCompletion(
        trx,
        broadcast.id,
        conversationCount,
        startTime,
      );

      // Step 8: Build final response
      const finalResponse = buildSuccessResponse(
        broadcast,
        businessChannel,
        template,
        contactGroup,
        conversationCount,
        startTime,
      );

      // 🔍 DEBUG LOG: Broadcast creation completed successfully
      const totalTime = Date.now() - startTime;
      logger.info(
        "🎉 [BROADCAST CREATION] Broadcast creation completed successfully:",
        {
          operation: "BROADCAST_CREATE_SUCCESS",
          broadcastId: broadcast.id,
          broadcastName: broadcast.name,
          totalProcessingTimeMs: totalTime,
          conversationCount,
          finalStatus: "completed",
          performance: finalResponse.performance,
          timestamp: new Date().toISOString(),
        },
      );

      return finalResponse;
    } catch (error) {
      // 🔍 DEBUG LOG: Broadcast creation failed
      const totalTime = Date.now() - startTime;
      logger.error("❌ [BROADCAST CREATION] Broadcast creation failed:", {
        operation: "BROADCAST_CREATE_FAILED",
        error: error.message,
        errorType: error.constructor.name,
        processingTimeMs: totalTime,
        campaignId: campaign.id,
        contactGroupId: data.contact_group_id,
        broadcastName: data.name,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  });
};

/**
 * Create broadcast record in database
 */
const createBroadcastRecord = async (trx, data, campaign, userId) => {
  const now = new Date().toISOString();

  // Determine broadcast type from data or default to 'outbound'
  const broadcastType = data.type || "outbound";
  const broadcastData = {
    campaign_id: campaign.id,
    name: data.name,
    description: data.description || null,
    business_channel_id: data.business_channel_id,
    template_id: data.template_id,
    contact_group_id: data.contact_group_id,
    type: broadcastType, // Store type as direct field (required)
    status: "draft",
    schedule_type: data.schedule_type || "scheduled",
    scheduled_start: data.scheduled_start || null,
    scheduled_end: data.scheduled_end || null,
    variable_mapping: data.variable_mapping || {},
    default_message: data.default_message || null,
    agent_mapping: data.agent_mapping || {},
    metadata: {
      ...data.metadata,
      type: broadcastType, // Store broadcast type in metadata for backward compatibility
    },
    created_by: userId,
    created_at: now,
    updated_at: now,
  }; // 🔍 DEBUG LOG: Broadcast data being inserted
  logger.info("🗃️  [BROADCAST DB INSERT] Creating broadcast record:", {
    table: "broadcast",
    operation: "INSERT",
    data: {
      ...broadcastData,
      // Mask sensitive data for logging but show structure
      variable_mapping: {
        keys: Object.keys(broadcastData.variable_mapping || {}),
        count: Object.keys(broadcastData.variable_mapping || {}).length,
      },
      agent_mapping: {
        keys: Object.keys(broadcastData.agent_mapping || {}),
        count: Object.keys(broadcastData.agent_mapping || {}).length,
        // Show mapping structure without exposing agent IDs
        structure: Object.keys(broadcastData.agent_mapping || {}).reduce(
          (acc, key) => {
            acc[key] = "***agent-id***";
            return acc;
          },
          {},
        ),
      },
    },
    timestamp: now,
  });

  // 🔍 DEBUG LOG: Actual agent mapping being stored (for debugging)
  logger.info("🔑 [BROADCAST DB INSERT] Agent mapping details:", {
    table: "broadcast",
    operation: "AGENT_MAPPING_DEBUG",
    originalInput: {
      hasAgentMapping: !!data.agent_mapping,
      agentMappingType: typeof data.agent_mapping,
      agentMappingKeys: data.agent_mapping
        ? Object.keys(data.agent_mapping)
        : [],
    },
    processedData: {
      hasAgentMapping: !!broadcastData.agent_mapping,
      agentMappingType: typeof broadcastData.agent_mapping,
      agentMappingKeys: Object.keys(broadcastData.agent_mapping || {}),
      isEmptyObject:
        Object.keys(broadcastData.agent_mapping || {}).length === 0,
    },
    timestamp: now,
  });

  const createdBroadcast = await Broadcast.query(trx).insert(broadcastData);
  // 🔍 DEBUG LOG: Broadcast created successfully
  logger.info("✅ [BROADCAST DB INSERT] Broadcast record created:", {
    table: "broadcast",
    operation: "INSERT_SUCCESS",
    broadcastId: createdBroadcast.id,
    name: createdBroadcast.name,
    type: createdBroadcast.type,
    status: createdBroadcast.status,
    storedAgentMapping: {
      hasAgentMapping: !!createdBroadcast.agent_mapping,
      agentMappingType: typeof createdBroadcast.agent_mapping,
      agentMappingKeys: createdBroadcast.agent_mapping
        ? Object.keys(createdBroadcast.agent_mapping)
        : [],
      agentMappingCount: createdBroadcast.agent_mapping
        ? Object.keys(createdBroadcast.agent_mapping).length
        : 0,
      // Show structure without exposing IDs
      structure: createdBroadcast.agent_mapping
        ? Object.keys(createdBroadcast.agent_mapping).reduce((acc, key) => {
            acc[key] = "***agent-id***";
            return acc;
          }, {})
        : {},
    },
    timestamp: new Date().toISOString(),
  });

  return createdBroadcast;
};

/**
 * Get contacts from contact group with their details
 */
const getContactsFromGroup = async (trx, contactGroupId) => {
  // 🔍 DEBUG LOG: Starting contact group lookup
  logger.info("🔍 [CONTACT GROUP LOOKUP] Starting contact retrieval:", {
    table: "contact_group_association",
    operation: "SELECT",
    contactGroupId,
    timestamp: new Date().toISOString(),
  });

  // Get contact associations
  const contactAssociations = await ContactGroupAssociation.query(trx)
    .where("contact_group_id", contactGroupId)
    .select("end_user_id", "field_values");

  // 🔍 DEBUG LOG: Contact associations found
  logger.info("📊 [CONTACT GROUP LOOKUP] Contact associations retrieved:", {
    table: "contact_group_association",
    operation: "SELECT_RESULT",
    contactGroupId,
    associationsCount: contactAssociations.length,
    endUserIds: contactAssociations.map((a) => a.end_user_id),
    timestamp: new Date().toISOString(),
  });

  if (contactAssociations.length === 0) {
    logger.warn("⚠️  [CONTACT GROUP LOOKUP] No contacts found in group:", {
      contactGroupId,
      message: "Contact group is empty or doesn't exist",
    });
    return { fullContactDetails: [], contactCount: 0 };
  }

  // Get end user details
  const endUserIds = contactAssociations.map((assoc) => assoc.end_user_id);

  // 🔍 DEBUG LOG: Looking up end user details
  logger.info("👥 [END USER LOOKUP] Retrieving end user details:", {
    table: "end_user",
    operation: "SELECT",
    endUserIds,
    count: endUserIds.length,
    timestamp: new Date().toISOString(),
  });

  const endUsers = await EndUser.query(trx)
    .whereIn("id", endUserIds)
    .select([
      "id",
      "phone",
      "country_code",
      "email",
      "first_name",
      "last_name",
    ]);

  // 🔍 DEBUG LOG: End users retrieved
  logger.info("✅ [END USER LOOKUP] End users retrieved:", {
    table: "end_user",
    operation: "SELECT_RESULT",
    retrievedCount: endUsers.length,
    expectedCount: endUserIds.length,
    endUsers: endUsers.map((u) => ({
      id: u.id,
      phone: u.phone,
      name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "No name",
    })),
    timestamp: new Date().toISOString(),
  });

  // Map end users for quick lookup
  const endUserMap = endUsers.reduce((map, user) => {
    map[user.id] = user;
    return map;
  }, {});

  // Merge contact data with end user data
  const fullContactDetails = contactAssociations.map((association) => {
    const endUser = endUserMap[association.end_user_id] || {};
    const fieldValues = association.field_values || {};

    return {
      end_user_id: association.end_user_id,
      country_code: fieldValues.country_code || endUser.country_code,
      phone: fieldValues.phone || endUser.phone,
      email: fieldValues.email || endUser.email,
      first_name: fieldValues.first_name || endUser.first_name,
      last_name: fieldValues.last_name || endUser.last_name,
      ...fieldValues,
    };
  });

  // 🔍 DEBUG LOG: Final contact details prepared
  logger.info("🎯 [CONTACT PREPARATION] Final contact details prepared:", {
    operation: "CONTACT_MERGE_COMPLETE",
    totalContacts: fullContactDetails.length,
    sampleContact: fullContactDetails[0]
      ? {
          id: fullContactDetails[0].end_user_id,
          phone: fullContactDetails[0].phone,
          name: `${fullContactDetails[0].first_name || ""} ${
            fullContactDetails[0].last_name || ""
          }`.trim(),
        }
      : null,
    timestamp: new Date().toISOString(),
  });

  return { fullContactDetails, contactCount: contactAssociations.length };
};

/**
 * Generate messages for each conversation
 * @param {Object[]} conversations - List of conversations with end_user_id and id
 * @param {Object[]} contacts - Full contact details (includes end_user_id and their fields)
 * @param {string} content - Message template with placeholders like {{1}}, {{2}}
 * @param {Object} batchData - Array of batch results with mid, statusCode, statusDesc, recepientId
 * @param {Object} variableMapping - Mapping like { "1": "first_name", "2": "last_name" }
 * @param {string} senderId - ID of the user/bot sending the message
 * @param {Object} trx - Objection transaction object
 * @returns {Promise<void>}
 */
async function createMessagesForConversations({
  conversations,
  contacts,
  content,
  batchData = [],
  variableMapping,
  senderId,
  trx,
}) {
  // 🔍 DEBUG LOG: Starting message creation
  logger.info(
    "📝 [MESSAGE CREATION] Starting message creation for conversations:",
    {
      operation: "MESSAGE_BULK_CREATE_START",
      conversationCount: conversations.length,
      contactCount: contacts.length,
      batchDataCount: batchData?.length || 0,
      hasContent: !!content,
      hasVariableMapping: !!variableMapping,
      variableMappingKeys: Object.keys(variableMapping || {}),
      senderId,
      timestamp: new Date().toISOString(),
    },
  );

  // Create a map of end_user_id to contact details for efficient lookups
  const contactMap = contacts.reduce((map, contact) => {
    map[contact.end_user_id] = contact;
    return map;
  }, {});

  // 🔍 DEBUG LOG: Contact mapping created
  logger.info("🗺️  [MESSAGE CREATION] Contact mapping created:", {
    operation: "CONTACT_MAP_CREATED",
    contactMapSize: Object.keys(contactMap).length,
    sampleContactIds: Object.keys(contactMap).slice(0, 3),
    timestamp: new Date().toISOString(),
  });

  // Create multiple maps for matching phone numbers in different formats
  const phoneToMidMap = {};
  if (Array.isArray(batchData)) {
    batchData.forEach((item) => {
      if (item && item.recepientId) {
        // Store with different normalizations to increase match chances
        const cleanPhone = item.recepientId.replace(/[^0-9+]/g, "");
        phoneToMidMap[cleanPhone] = {
          mid: item.mid,
          statusCode: item.statusCode,
          statusDesc: item.statusDesc,
        };

        // Also store without the + prefix
        if (cleanPhone.startsWith("+")) {
          phoneToMidMap[cleanPhone.substring(1)] = {
            mid: item.mid,
            statusCode: item.statusCode,
            statusDesc: item.statusDesc,
          };
        }
      }
    });
  }

  // 🔍 DEBUG LOG: Phone mapping created
  logger.info("📞 [MESSAGE CREATION] Phone to MID mapping created:", {
    operation: "PHONE_MAP_CREATED",
    phoneMapSize: Object.keys(phoneToMidMap).length,
    samplePhones: Object.keys(phoneToMidMap).slice(0, 3),
    timestamp: new Date().toISOString(),
  });

  const now = new Date().toISOString();
  const messages = conversations.map((conversation) => {
    const contact = contactMap[conversation.end_user_id];
    let messageContent = content || ""; // Start with the template text for each message

    // Replace {{1}}, {{2}} etc. with contact fields
    if (variableMapping && messageContent) {
      Object.entries(variableMapping).forEach(([index, fieldName]) => {
        const value = contact?.[fieldName] ?? "";
        const placeholder = `{{${index}}}`;
        messageContent = messageContent.replace(
          new RegExp(placeholder, "g"),
          value,
        );
      });
    }

    // Try multiple ways to match the phone number
    const phoneFormats = [];

    if (contact?.country_code && contact?.phone) {
      // Format 1: +[country_code][phone]
      phoneFormats.push(
        `+${contact.country_code}${contact.phone}`.replace(/[^0-9+]/g, ""),
      );
      // Format 2: [country_code][phone]
      phoneFormats.push(
        `${contact.country_code}${contact.phone}`.replace(/[^0-9+]/g, ""),
      );
    }

    if (contact?.phone) {
      // Format 3: +[phone]
      phoneFormats.push(`+${contact.phone}`.replace(/[^0-9+]/g, ""));
      // Format 4: [phone]
      phoneFormats.push(`${contact.phone}`.replace(/[^0-9+]/g, ""));
    }

    // Find matching batch data for this contact's phone
    let batchInfo = null;
    for (const phoneFormat of phoneFormats) {
      if (phoneToMidMap[phoneFormat]) {
        batchInfo = phoneToMidMap[phoneFormat];
        break;
      }
    }
    return {
      conversation_id: conversation.id,
      sender_type: "system",
      sender_id: senderId,
      content: {
        type: "text",
        text: messageContent,
      },
      content_type: "text",
      metadata: {
        ...(batchInfo
          ? {
              provider_message_id: batchInfo.mid,
              delivery_status:
                batchInfo.statusCode === "200" ? "sent" : "failed",
              status_description: batchInfo.statusDesc,
            }
          : {
              delivery_status: "unknown",
              status_description: "No matching batch data found",
            }),
      },
      is_internal: false,
      created_at: now,
    };
  });

  // 🔍 DEBUG LOG: Messages prepared for insertion
  logger.info(
    "📋 [MESSAGE CREATION] Messages prepared for database insertion:",
    {
      operation: "MESSAGES_PREPARED",
      messageCount: messages.length,
      expectedCount: conversations.length,
      sampleMessage: messages[0]
        ? {
            conversationId: messages[0].conversation_id,
            senderType: messages[0].sender_type,
            contentType: messages[0].content_type,
            hasContent: !!messages[0].content?.text,
            deliveryStatus: messages[0].metadata?.delivery_status,
          }
        : null,
      timestamp: new Date().toISOString(),
    },
  );

  // Bulk insert messages
  if (messages.length > 0) {
    try {
      // 🔍 DEBUG LOG: Inserting messages into database
      logger.info("🔄 [MESSAGE DB INSERT] Inserting messages into database:", {
        table: "message",
        operation: "BULK_INSERT",
        messageCount: messages.length,
        timestamp: new Date().toISOString(),
      });

      await Message.query(trx).insert(messages);

      // 🔍 DEBUG LOG: Messages inserted successfully
      logger.info("✅ [MESSAGE DB INSERT] Messages inserted successfully:", {
        table: "message",
        operation: "BULK_INSERT_SUCCESS",
        insertedCount: messages.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // 🔍 DEBUG LOG: Message insertion failed
      logger.error("❌ [MESSAGE DB INSERT] Failed to insert messages:", {
        table: "message",
        operation: "BULK_INSERT_FAILED",
        error: error.message,
        messageCount: messages.length,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  } else {
    // 🔍 DEBUG LOG: No messages to insert
    logger.warn("⚠️  [MESSAGE CREATION] No messages to insert:", {
      operation: "NO_MESSAGES",
      conversationCount: conversations.length,
      reason: "Message array is empty",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Process conversations for all contacts
 */
const processContactConversations = async (params) => {
  const {
    trx,
    broadcast,
    businessId,
    contacts,
    businessChannel,
    userId,
    data,
  } = params;
  const now = new Date().toISOString();

  // 🔍 DEBUG LOG: Starting conversation processing
  logger.info("💬 [CONVERSATION PROCESSING] Starting conversation creation:", {
    operation: "CONVERSATION_BULK_CREATE_START",
    broadcastId: broadcast.id,
    contactCount: contacts.length,
    businessId,
    businessChannelId: data.business_channel_id,
    timestamp: now,
  });

  // Close existing conversations
  await closeExistingConversations(
    trx,
    contacts.map((c) => c.end_user_id),
    data.business_channel_id,
  );

  // Create conversation template
  const conversationTemplate = {
    business_id: businessId,
    business_channel_id: data.business_channel_id,
    type: "broadcast",
    status: "active", // Changed from "pending" to "active" so it gets picked up by getActiveConversation
    priority: data.priority || "normal",
    category: data.category || "marketing",
    broadcast_id: broadcast.id,
    current_step: "step0",
    metadata: {
      broadcast_type: broadcast.metadata?.type || "outbound",
      initiated_from_broadcast: true,
      broadcast_id: broadcast.id,
    },
    created_by: userId,
    updated_by: userId,
    created_at: now,
    updated_at: now,
  };

  // 🔍 DEBUG LOG: Conversation template created
  logger.info("📋 [CONVERSATION PROCESSING] Conversation template created:", {
    operation: "CONVERSATION_TEMPLATE",
    template: {
      ...conversationTemplate,
      metadata: "Object with broadcast info",
    },
    willCreateCount: contacts.length,
    timestamp: now,
  });

  // Create conversation for each contact
  const conversations = contacts.map((contact) => ({
    ...conversationTemplate,
    end_user_id: contact.end_user_id,
    external_id: `broadcast_${broadcast.id}_${contact.end_user_id}`,
  }));

  // 🔍 DEBUG LOG: About to insert conversations
  logger.info("🔄 [CONVERSATION DB INSERT] Inserting conversations:", {
    table: "conversation",
    operation: "BULK_INSERT",
    count: conversations.length,
    broadcastId: broadcast.id,
    sampleConversation: conversations[0]
      ? {
          end_user_id: conversations[0].end_user_id,
          broadcast_id: conversations[0].broadcast_id,
          status: conversations[0].status,
          current_step: conversations[0].current_step,
          external_id: conversations[0].external_id,
        }
      : null,
    timestamp: now,
  });

  // Insert all conversations
  const createdConversations = await Conversation.query(trx)
    .insert(conversations)
    .returning(["id", "end_user_id"]);

  // 🔍 DEBUG LOG: Conversations created successfully
  logger.info(
    "✅ [CONVERSATION DB INSERT] Conversations created successfully:",
    {
      table: "conversation",
      operation: "BULK_INSERT_SUCCESS",
      insertedCount: createdConversations.length,
      expectedCount: conversations.length,
      broadcastId: broadcast.id,
      conversationIds: createdConversations.map((c) => c.id),
      sampleCreated: createdConversations[0]
        ? {
            id: createdConversations[0].id,
            end_user_id: createdConversations[0].end_user_id,
          }
        : null,
      timestamp: new Date().toISOString(),
    },
  );

  return {
    conversationData: createdConversations,
    conversationCount: createdConversations.length,
  };
};

/**
 * Close existing conversations for contacts
 */
const closeExistingConversations = async (trx, endUserIds, channelId) => {
  // 🔍 DEBUG LOG: Starting to close existing conversations
  logger.info(
    "🔒 [CLOSE CONVERSATIONS] Starting to close existing conversations:",
    {
      table: "conversation",
      operation: "CLOSE_EXISTING_START",
      endUserCount: endUserIds.length,
      channelId,
      sampleEndUserIds: endUserIds.slice(0, 3),
      timestamp: new Date().toISOString(),
    },
  );

  const existingConversations = await Conversation.query(trx)
    .whereIn("end_user_id", endUserIds)
    .andWhere("business_channel_id", channelId)
    .whereNotIn("status", ["closed", "completed"])
    .select(["id", "status", "end_user_id"]);

  // 🔍 DEBUG LOG: Existing conversations found
  logger.info("📊 [CLOSE CONVERSATIONS] Existing conversations found:", {
    table: "conversation",
    operation: "EXISTING_CONVERSATIONS_FOUND",
    existingCount: existingConversations.length,
    channelId,
    conversationStatuses: [
      ...new Set(existingConversations.map((c) => c.status)),
    ],
    conversationIds: existingConversations.map((c) => c.id),
    timestamp: new Date().toISOString(),
  });

  if (existingConversations.length > 0) {
    const conversationIds = existingConversations.map((conv) => conv.id);

    // 🔍 DEBUG LOG: Closing conversations
    logger.info("🔄 [CLOSE CONVERSATIONS] Closing existing conversations:", {
      table: "conversation",
      operation: "CLOSE_CONVERSATIONS_UPDATE",
      conversationIds,
      count: conversationIds.length,
      timestamp: new Date().toISOString(),
    });

    await Conversation.query(trx).whereIn("id", conversationIds).patch({
      status: "closed",
      updated_at: new Date().toISOString(),
    });

    // 🔍 DEBUG LOG: Conversations closed successfully
    logger.info(
      "✅ [CLOSE CONVERSATIONS] Existing conversations closed successfully:",
      {
        table: "conversation",
        operation: "CLOSE_CONVERSATIONS_SUCCESS",
        closedCount: conversationIds.length,
        conversationIds,
        timestamp: new Date().toISOString(),
      },
    );
  } else {
    // 🔍 DEBUG LOG: No conversations to close
    logger.info(
      "ℹ️  [CLOSE CONVERSATIONS] No existing conversations to close:",
      {
        table: "conversation",
        operation: "NO_CONVERSATIONS_TO_CLOSE",
        endUserCount: endUserIds.length,
        channelId,
        timestamp: new Date().toISOString(),
      },
    );
  }
};

/**
 * Prepare template data for provider
 */
const prepareTemplateData = (template, broadcast, data) => ({
  templateId: template?.template_id,
  elementName: template?.template_name,
  content: template?.content,
  content_type: template?.content_type,
  providerData: template?.provider_submissions,
  placeholders: template?.placeholders,
  templateVariables: broadcast?.variable_mapping?.template,
});

/**
 * Send broadcast through provider
 */
const sendBroadcastToProvider = async (params, trx) => {
  const { businessChannel, templateData, contacts, broadcastId } = params;

  const provider = businessChannel?.provider_name?.toLowerCase() || "unknown";

  // 🔍 DEBUG LOG: Starting provider communication
  logger.info(
    "🌐 [PROVIDER COMMUNICATION] Starting broadcast send to provider:",
    {
      operation: "PROVIDER_SEND_START",
      provider,
      broadcastId,
      contactCount: contacts.length,
      businessChannelId: businessChannel?.id,
      templateId: templateData?.templateId,
      templateName: templateData?.elementName,
      hasTemplateContent: !!templateData?.content,
      timestamp: new Date().toISOString(),
    },
  );

  try {
    let statusData;

    switch (provider) {
      case "karix":
        // 🔍 DEBUG LOG: Calling Karix service
        logger.info(
          "📡 [PROVIDER COMMUNICATION] Calling Karix broadcast service:",
          {
            operation: "KARIX_SERVICE_CALL",
            provider: "karix",
            broadcastId,
            contactCount: contacts.length,
            config: {
              hasConfig: !!businessChannel?.config,
              hasPhoneNumbers: !!businessChannel?.config?.phone_numbers?.length,
            },
            timestamp: new Date().toISOString(),
          },
        );

        statusData = await karixService.sendBroadcastMessage(
          businessChannel?.config,
          contacts,
          templateData,
        );

        // 🔍 DEBUG LOG: Karix service response received
        logger.info(
          "📨 [PROVIDER COMMUNICATION] Karix service response received:",
          {
            operation: "KARIX_SERVICE_RESPONSE",
            provider: "karix",
            broadcastId,
            hasResponse: !!statusData,
            hasData: !!statusData?.data,
            status: statusData?.data?.status,
            hasDataDetails: !!statusData?.data?.data,
            timestamp: new Date().toISOString(),
          },
        );

        // Store batch result if successful
        if (statusData?.data?.status && statusData?.data?.data) {
          // 🔍 DEBUG LOG: Storing batch result
          logger.info(
            "💾 [PROVIDER COMMUNICATION] Storing batch result from provider:",
            {
              operation: "BATCH_RESULT_STORE",
              provider: "karix",
              broadcastId,
              batchId: statusData.data.data.batchId,
              status: statusData.data.data.status,
              hasBatchResponse: !!statusData.data.data.batchResponse,
              hasMetrics: !!statusData.data.data.metrics,
              timestamp: new Date().toISOString(),
            },
          );

          await storeBatchResult(
            {
              broadcastId,
              provider: "karix",
              batchId: statusData.data.data.batchId,
              contactCount: contacts.length,
              status: statusData.data.data.status || "success",
              batchResponse: statusData.data.data.batchResponse,
              batchStatus: statusData.data.data.batchStatus,
              batchMessage: statusData.data.data.batchMessage,
              metrics: statusData.data.data.metrics,
            },
            trx,
          );
        } else {
          // 🔍 DEBUG LOG: No batch result to store
          logger.warn(
            "⚠️  [PROVIDER COMMUNICATION] No batch result data to store:",
            {
              operation: "NO_BATCH_RESULT",
              provider: "karix",
              broadcastId,
              hasStatusData: !!statusData,
              hasDataStatus: !!statusData?.data?.status,
              hasDataDetails: !!statusData?.data?.data,
              timestamp: new Date().toISOString(),
            },
          );
        }
        break;

      default:
        logger.error("❌ [PROVIDER COMMUNICATION] Unsupported provider:", {
          operation: "UNSUPPORTED_PROVIDER",
          provider,
          broadcastId,
          supportedProviders: ["karix"],
          timestamp: new Date().toISOString(),
        });
        throw boom.badImplementation(`Unsupported provider: ${provider}`);
    }

    // 🔍 DEBUG LOG: Provider communication successful
    logger.info("✅ [PROVIDER COMMUNICATION] Broadcast sent successfully:", {
      operation: "PROVIDER_SEND_SUCCESS",
      broadcastId,
      provider,
      status: statusData?.data?.status || "unknown",
      hasData: !!statusData?.data,
      timestamp: new Date().toISOString(),
    });

    return {
      status: "success",
      provider,
      data: statusData?.data,
    };
  } catch (error) {
    // 🔍 DEBUG LOG: Provider communication failed
    logger.error("❌ [PROVIDER COMMUNICATION] Provider broadcast failed:", {
      operation: "PROVIDER_SEND_FAILED",
      error: error.message,
      broadcastId,
      provider,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Store batch result in database
 */
const storeBatchResult = async (batchData, trx) => {
  try {
    // 🔍 DEBUG LOG: Starting batch result storage
    logger.info("📦 [BATCH RESULT DB INSERT] Storing batch result:", {
      table: "broadcast_batch_results",
      operation: "INSERT",
      broadcastId: batchData.broadcastId,
      provider: batchData.provider,
      batchId: batchData.batchId,
      status: batchData.status,
      contactCount: batchData.contactCount,
      hasBatchResponse: !!batchData.batchResponse,
      hasMetrics: !!batchData.metrics,
      timestamp: new Date().toISOString(),
    });

    const result = await BroadcastBatchResult.query(trx)
      .insert({
        broadcast_id: batchData.broadcastId,
        status: batchData.status,
        provider: batchData.provider,
        batch_response: batchData.batchResponse || null,
        batch_id: batchData.batchId,
        batch_status: batchData.batchStatus,
        batch_message: batchData.batchMessage,
        metrics: batchData.metrics || null,
        contact_count: batchData.contactCount,
      })
      .returning("id");

    const id = result[0]?.id;

    // 🔍 DEBUG LOG: Batch result stored successfully
    logger.info(
      "✅ [BATCH RESULT DB INSERT] Batch result stored successfully:",
      {
        table: "broadcast_batch_results",
        operation: "INSERT_SUCCESS",
        batchResultId: id,
        broadcastId: batchData.broadcastId,
        provider: batchData.provider,
        batchId: batchData.batchId,
        timestamp: new Date().toISOString(),
      },
    );

    return id;
  } catch (error) {
    // 🔍 DEBUG LOG: Batch result storage failed
    logger.error("❌ [BATCH RESULT DB INSERT] Failed to store batch result:", {
      table: "broadcast_batch_results",
      operation: "INSERT_FAILED",
      error: error.message,
      broadcastId: batchData.broadcastId,
      batchId: batchData.batchId,
      provider: batchData.provider,
      timestamp: new Date().toISOString(),
    });

    // Continue execution even if storage fails
    return null;
  }
};

/**
 * Update broadcast completion status
 */
const updateBroadcastCompletion = async (
  trx,
  broadcastId,
  conversationCount,
  startTime,
) => {
  const endTime = new Date();
  const processingTime = endTime - new Date(startTime);
  const conversationsPerSecond = Math.round(
    conversationCount / (processingTime / 1000),
  );

  // 🔍 DEBUG LOG: Starting broadcast completion update
  logger.info(
    "🏁 [BROADCAST COMPLETION] Updating broadcast completion status:",
    {
      table: "broadcast",
      operation: "UPDATE_COMPLETION",
      broadcastId,
      conversationCount,
      processingTimeMs: processingTime,
      conversationsPerSecond,
      startTime: new Date(startTime).toISOString(),
      endTime: endTime.toISOString(),
      timestamp: new Date().toISOString(),
    },
  );

  const updateData = {
    status: "completed",
    metadata: {
      conversations_created: true,
      conversation_count: conversationCount,
      creation_timestamp: startTime,
      processing_time_ms: processingTime,
      completion_timestamp: endTime.toISOString(),
    },
    analytics: {
      total_recipients: conversationCount,
      conversations_per_second: conversationsPerSecond,
    },
    updated_at: endTime.toISOString(),
  };

  // 🔍 DEBUG LOG: Broadcast completion data prepared
  logger.info("📊 [BROADCAST COMPLETION] Completion data prepared:", {
    table: "broadcast",
    operation: "UPDATE_DATA_PREPARED",
    broadcastId,
    updateData: {
      status: updateData.status,
      conversationCount: updateData.metadata.conversation_count,
      processingTimeMs: updateData.metadata.processing_time_ms,
      totalRecipients: updateData.analytics.total_recipients,
      conversationsPerSecond: updateData.analytics.conversations_per_second,
    },
    timestamp: new Date().toISOString(),
  });

  await Broadcast.query(trx).patch(updateData).where("id", broadcastId);

  // 🔍 DEBUG LOG: Broadcast completion updated successfully
  logger.info(
    "✅ [BROADCAST COMPLETION] Broadcast completion status updated:",
    {
      table: "broadcast",
      operation: "UPDATE_COMPLETION_SUCCESS",
      broadcastId,
      finalStatus: "completed",
      conversationCount,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    },
  );
};

/**
 * Build success response
 */
const buildSuccessResponse = (
  broadcast,
  businessChannel,
  template,
  contactGroup,
  conversationCount,
  startTime,
) => {
  const processingTime = Date.now() - startTime;
  const conversationsPerSecond = Math.round(
    conversationCount / (processingTime / 1000),
  );

  return {
    ...broadcast,
    channel_name: businessChannel.name,
    template_name: template.data?.template_name,
    contact_group_name: contactGroup.name,
    conversation_count: conversationCount,
    message_count: conversationCount,
    performance: {
      processing_time_ms: processingTime,
      conversations_per_second: conversationsPerSecond,
    },
  };
};

/**
 * Build empty response for zero contacts
 */
const buildEmptyResponse = (
  broadcast,
  businessChannel,
  template,
  contactGroup,
) => ({
  ...broadcast,
  channel_name: businessChannel.name,
  template_name: template.data?.template_name,
  contact_group_name: contactGroup.name,
  conversation_count: 0,
  message_count: 0,
  performance: {
    processing_time_ms: 0,
    conversations_per_second: 0,
  },
});

module.exports = {
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
  updateBroadcastStatus,
  cloneBroadcast,
  getBroadcastAnalytics,
  exportBroadcastAnalytics,
  retargetFailedRecipients,
};
