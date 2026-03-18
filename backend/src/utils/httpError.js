/**
 * Maps Supabase/PostgreSQL error codes to appropriate HTTP status codes.
 */
function getHttpStatus(error) {
  const code = error.code;

  // Supabase PostgREST: row not found on .single()
  if (code === 'PGRST116') return 404;

  // PostgreSQL: invalid UUID format
  if (code === '22P02') return 400;

  // PostgreSQL: foreign key violation
  if (code === '23503') return 409;

  // PostgreSQL: unique constraint violation
  if (code === '23505') return 409;

  // PostgreSQL: not null violation
  if (code === '23502') return 400;

  // PostgreSQL: check constraint violation
  if (code === '23514') return 400;

  // Default: server error
  return 500;
}

module.exports = { getHttpStatus };
