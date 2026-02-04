-- Create a function to delete music records that have no associated dances
CREATE OR REPLACE FUNCTION delete_orphaned_music()
RETURNS void AS $$
BEGIN
  DELETE FROM music
  WHERE id NOT IN (
    SELECT DISTINCT music_id FROM dance_music
  );
END;
$$ LANGUAGE plpgsql;
