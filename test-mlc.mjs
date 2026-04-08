import { prebuiltAppConfig } from '@mlc-ai/web-llm';
const qwenMods = prebuiltAppConfig.model_list.filter(m => m.model_id.toLowerCase().includes('qwen'));
console.log(qwenMods.map(m => m.model_id));
