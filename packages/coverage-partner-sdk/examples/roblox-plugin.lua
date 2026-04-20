--[[
  NeuroSpark Coverage Partner — Roblox reference plugin

  Drop into a Roblox Studio plugin script. When a player completes a
  developmentally-meaningful challenge in any Roblox experience, grant
  brain-region + AI-age-competency credit to their parent's NeuroSpark
  child profile.

  Setup:
    1. Register the partner in NeuroSpark admin → Coverage partners.
    2. Copy the one-time signing secret into the script below.
    3. Each parent device generates an anon token via the NeuroSpark app's
       "Connect Roblox" flow and shares it with the experience (the parent
       app POSTs to /coverage/anon_link to mint the token).

  Notes:
    - HmacSha256 helper relies on a Lua HMAC implementation; many open-source
      ones exist. The standard `crypto-hmac` Roblox library works.
    - HttpService:RequestAsync requires the Roblox game to opt-in to HTTP
      requests in the Game Settings.
    - Cap is per partner per child per day (set in admin UI). Crossing it
      returns HTTP 429.
]]

local HttpService = game:GetService("HttpService")
local CONFIG = {
  baseUrl = "https://api.neurospark.app",
  partnerSlug = "roblox-edu",
  signingSecret = "REPLACE_WITH_HEX_SECRET_FROM_ADMIN", -- 64-char hex
}

-- Replace with a real HMAC-SHA256 implementation.
local function hmacSha256Hex(secret, data)
  -- Pseudo-call: any Lua HMAC library will do.
  return require(script.Parent.HmacSha256)(secret, data)
end

local function fromHex(hex)
  local bytes = {}
  for i = 1, #hex, 2 do bytes[#bytes + 1] = string.char(tonumber(hex:sub(i, i + 1), 16)) end
  return table.concat(bytes)
end

local function creditCoverage(input)
  local payload = {
    partnerSlug = CONFIG.partnerSlug,
    anonToken = input.anonToken,
    partnerEventId = input.partnerEventId,
    durationSeconds = input.durationSeconds,
    modality = input.modality or "screen",
    brainRegion = input.brainRegion,
    competencyIds = input.competencyIds,
  }
  local body = HttpService:JSONEncode(payload)
  local ts = tostring(os.time() * 1000)
  local sig = hmacSha256Hex(fromHex(CONFIG.signingSecret), ts .. "." .. body)
  local ok, response = pcall(HttpService.RequestAsync, HttpService, {
    Url = CONFIG.baseUrl .. "/coverage/credit",
    Method = "POST",
    Headers = {
      ["content-type"] = "application/json",
      ["x-neurospark-signature"] = sig,
      ["x-neurospark-timestamp"] = ts,
    },
    Body = body,
  })
  if not ok then warn("NeuroSpark credit failed:", response); return end
  if not response.Success then warn("NeuroSpark credit non-2xx:", response.StatusCode, response.Body) end
end

return creditCoverage
