-- Redis Token Bucket Rate Limiter Script
-- KEYS[1]: Rate limit key (e.g. rate:ip:192.168.1.1)
-- ARGV[1]: Max tokens (capacity)
-- ARGV[2]: Refill rate per second
-- ARGV[3]: Current timestamp (seconds)
-- ARGV[4]: Requested tokens (usually 1)

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

-- Get current bucket state
local data = redis.call('HMGET', key, 'tokens', 'last_updated')
local tokens = tonumber(data[1])
local last_updated = tonumber(data[2])

if tokens == nil then
    tokens = capacity
    last_updated = now
else
    -- Compute refilled tokens based on delta time
    local delta = math.max(0, now - last_updated)
    tokens = math.min(capacity, tokens + delta * refill_rate)
    last_updated = now
end

if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
    redis.call('EXPIRE', key, math.ceil(capacity / refill_rate))
    return 1 -- Allowed
else
    return 0 -- Denied (Rate limit exceeded)
end
