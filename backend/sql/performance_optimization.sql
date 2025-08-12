-- Performance optimization for analytics queries
-- Add projection on (TerminalID, MoveDate_pred, MoveHour_pred) for fast window scans

-- This script should be run on your Vertica database to optimize the sunburst and other analytics queries
-- Replace YOUR_TABLE_NAME with the actual table name from your config

-- Create a projection optimized for time-series window queries
CREATE PROJECTION analytics_time_proj AS 
  SELECT TerminalID, MoveDate_pred, MoveHour_pred, MoveType, Desig, TokenCount_pred
  FROM YOUR_TABLE_NAME
  ORDER BY TerminalID, MoveDate_pred, MoveHour_pred
  SEGMENTED BY HASH(TerminalID) ALL NODES;

-- Alternative: If you have massive data, consider a materialized view updated by ETL
-- This would pre-aggregate hourly data for faster analytics queries
/*
CREATE VIEW hourly_aggregates AS
  SELECT 
    TerminalID,
    MoveDate_pred,
    MoveHour_pred,
    MoveType,
    UPPER(COALESCE(NULLIF(Desig, ''), 'UNK')) AS Desig,
    SUM(TokenCount_pred) AS total_tokens
  FROM YOUR_TABLE_NAME
  GROUP BY 1,2,3,4,5;
*/
