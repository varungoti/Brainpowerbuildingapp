param([Parameter(Mandatory=$true)][string]$ProjectRef)
supabase link --project-ref $ProjectRef
supabase db push
supabase functions deploy --project-ref $ProjectRef
Write-Host "Portal: https://$ProjectRef.supabase.co/functions/v1/portal"
