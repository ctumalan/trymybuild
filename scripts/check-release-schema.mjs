// Read-only release preflight. Shows schema presence, never credentials or customer rows.
// An application service key can inspect API metadata; it cannot apply SQL migrations.
import {parseEnv} from 'node:util';
import {readFileSync} from 'node:fs';
const config=process.argv[2]?parseEnv(readFileSync(process.argv[2],'utf8')):process.env;
const expected='https://nkrkmfszuntvzjonrznb.supabase.co';
if(config.SUPABASE_URL?.replace(/\/$/,'')!==expected||!config.SUPABASE_SERVICE_ROLE_KEY){
 console.error('Expected TryMyBuild database configuration is unavailable.');process.exit(1);
}
const headers={apikey:config.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+config.SUPABASE_SERVICE_ROLE_KEY};
try{
 const response=await fetch(expected+'/rest/v1/',{headers,signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Schema metadata request failed with HTTP '+response.status);
 const schema=await response.json(),definitions=schema.definitions||{},paths=schema.paths||{};
 const requiredFunctions=['cw_submit_wish','cw_review_wish','cw_workspace_inbox','cw_project_unread','cw_delete_unused_draft','cw_wish_categories'];
 const requiredColumns=[['community_wishes','moderation_status'],['community_wishes','revision'],['account_preferences','selected_interests'],['projects','preview_source'],['projects','preview_source_url'],['projects','preview_captured_at'],['projects','preview_history']];
 const missingFunctions=requiredFunctions.filter(name=>!paths['/rpc/'+name]);
 const missingColumns=requiredColumns.filter(([table,column])=>!definitions[table]?.properties?.[column]).map(parts=>parts.join('.'));
 const ready=missingFunctions.length===0&&missingColumns.length===0;
 console.log(JSON.stringify({databaseProject:'nkrkmfszuntvzjonrznb',metadataRead:true,requiredSchemaPresent:ready,missingFunctions,missingColumns,note:'Presence check only; verify SQL definitions, permissions, and a fresh backup before applying migrations.'},null,2));
 if(!ready)process.exitCode=1;
}catch(error){console.error(error instanceof Error?error.message:'Schema inspection failed.');process.exitCode=1;}
