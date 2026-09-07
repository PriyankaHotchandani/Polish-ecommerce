import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Default configuration: no external incremental cache (this app has no ISR/
// revalidated routes). Add an R2/KV cache override here later if that changes.
export default defineCloudflareConfig();
