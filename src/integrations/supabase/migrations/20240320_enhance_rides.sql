-- Add new columns to rides table
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS is_quick_ride BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_passengers INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS route_preview TEXT,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shared_passengers INTEGER DEFAULT 0;

-- Create quick_routes table
CREATE TABLE IF NOT EXISTS quick_routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    from_coordinates TEXT NOT NULL,
    to_coordinates TEXT NOT NULL,
    distance DECIMAL NOT NULL,
    estimated_duration INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ride_schedules table
CREATE TABLE IF NOT EXISTS ride_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'custom')),
    schedule_days TEXT[],
    schedule_dates TIMESTAMP WITH TIME ZONE[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ride_shares table
CREATE TABLE IF NOT EXISTS ride_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    sharer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shared_with_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rides_is_quick_ride ON rides(is_quick_ride);
CREATE INDEX IF NOT EXISTS idx_rides_is_scheduled ON rides(is_scheduled);
CREATE INDEX IF NOT EXISTS idx_rides_is_shared ON rides(is_shared);
CREATE INDEX IF NOT EXISTS idx_rides_scheduled_for ON rides(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_quick_routes_is_active ON quick_routes(is_active);
CREATE INDEX IF NOT EXISTS idx_ride_schedules_ride_id ON ride_schedules(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_shares_ride_id ON ride_shares(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_shares_sharer_id ON ride_shares(sharer_id);
CREATE INDEX IF NOT EXISTS idx_ride_shares_shared_with_id ON ride_shares(shared_with_id); 