/**
 * Migration: Add QR code support to broadcast table
 */

exports.up = function(knex) {
  return knex.schema.alterTable('broadcast', function(table) {
    table.text('qr_code_data').nullable().comment('QR code data for broadcast');
    table.string('qr_code_url').nullable().comment('URL to QR code image');
    table.boolean('include_qr_code').defaultTo(false).comment('Whether to include QR code in broadcast');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('broadcast', function(table) {
    table.dropColumn('qr_code_data');
    table.dropColumn('qr_code_url');
    table.dropColumn('include_qr_code');
  });
};
