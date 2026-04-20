# image-svc

Single endpoint that fans out to **17 image-generation providers** (hosted +
self-hosted + free stock) so the studio orchestrator can run quality A/B and
pick the cheapest provider that meets the brief.

## Providers

| ID | Provider | Best for | Cost (Apr 2026) |
| --- | --- | --- | --- |
| `ideogram` | Ideogram v3 | text-in-image, posters | $0.06 |
| `flux_pro` | FLUX.1.1 Pro Ultra | photoreal hero shots | $0.06 |
| `flux_schnell_self` | FLUX schnell self-hosted | drafts | ~$0.005 |
| `recraft` | Recraft V3 | vector / illustration | $0.04 |
| `openai_gpt_image` | OpenAI gpt-image-1 | infographics | $0.04-0.17 |
| `google_imagen4` | Google Imagen 4 Ultra | multilingual text | $0.06 |
| `stability_sd35` | SD 3.5 Large | cheap photoreal | $0.065 |
| `leonardo` | Leonardo Phoenix 1.0 | game art / illustration | $0.04 |
| `midjourney` | Midjourney v6.1 | aesthetic mood | $0.10 |
| `replicate` | wildcard router | any HF model | usage |
| `fal` | wildcard router | fast inference | usage |
| `together` | FLUX schnell free tier | cheapest hosted | $0.003 |
| `sdxl_self` | SDXL + IPAdapter-FaceID | brand-character consistency | $0 |
| `comfy_self` | ComfyUI workflow runner | custom node graphs | $0 |
| `pexels` | Pexels stock | fallback | free |
| `unsplash` | Unsplash stock | fallback | free |
| `pixabay` | Pixabay stock | fallback | free |

## API

```bash
# generate one
curl -X POST $URL/v1/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"spec":{"prompt":"...","aspect":"9:16","textInImage":true}}'

# A/B compare
curl -X POST $URL/v1/compare \
  -d '{"spec":{"prompt":"..."},"providerIds":["ideogram","flux_pro","recraft"]}'

# list enabled providers
curl $URL/v1/providers -H "Authorization: Bearer $TOKEN"

# month-to-date spend
curl $URL/v1/cost/month -H "Authorization: Bearer $TOKEN"
```

## Smart routing

Request `spec.brandConsistency: "high"` -> SDXL self-host with IPAdapter.
Request `spec.textInImage: true` -> Ideogram first, Recraft, then Imagen.
Request `spec.preferStock: true` -> Pexels / Unsplash / Pixabay.
Otherwise: `DEFAULT_PROVIDER` env var, then FLUX Pro, then Ideogram.

## Cost ceiling

Refuses new jobs when month-to-date spend (logged in `studio_cost_ledger`)
exceeds `IMAGE_SVC_MONTHLY_USD_CAP`.
