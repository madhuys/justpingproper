/**
 * Migration: Modify broadcast table to make some fields optional
 */

exports.up = function(knex) {
  return knex.schema.alterTable('broadcast', function(table) {
    // Make template_id optional (if it exists and is required)
    table.uuid('template_id').nullable().alter();
    
    // Add optional fields for enhanced broadcast functionality
    table.text('fallback_message').nullable().comment('Fallback message if template fails');
    table.json('custom_parameters').nullable().comment('Custom parameters for broadcast');
    table.timestamp('scheduled_at').nullable().comment('Scheduled broadcast time');
    table.string('priority', 20).defaultTo('normal').comment('Broadcast priority level');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('broadcast', function(table) {
    // Note: We can't easily revert nullable changes without knowing original schema
    // So we'll just remove the new columns
    table.dropColumn('fallback_message');
    table.dropColumn('custom_parameters');
    table.dropColumn('scheduled_at');
    table.dropColumn('priority');
  });
};
