-- ============================================================
-- IMED Placement OS — Messages Table
-- Run this in your Supabase SQL Editor to enable in-app messaging
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast conversation lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages (sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver
  ON messages (receiver_id, read, created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only see messages they sent or received
CREATE POLICY "Users see own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can only insert messages as themselves
CREATE POLICY "Users send messages as themselves"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Service role bypass
CREATE POLICY "Service role full access to messages"
  ON messages FOR ALL
  USING (auth.role() = 'service_role');

-- Enable Realtime for live message delivery
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
