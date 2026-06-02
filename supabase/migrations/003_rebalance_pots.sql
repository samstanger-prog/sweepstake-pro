-- Rebalance pots: 12 in Pot A, 12 in Pot B (supports up to 12 unique two-pot draws)
-- Previously 8 Pot A / 16 Pot B — draw failed silently for 9+ participants

UPDATE teams SET pot = 'A' WHERE code IN ('BEL', 'CRO', 'ITA', 'URU');
