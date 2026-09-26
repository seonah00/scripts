import {z} from 'zod';
// Use the same schema for model output and server validation. Defaults are for
// legacy saved projects, not optional fields in a newly generated response.
export function structuredFormat(schema:z.ZodType){
 const definition=z.toJSONSchema(schema,{io:'output',target:'draft-7'});
 const clean=(value:unknown):unknown=>{
  if(Array.isArray(value))return value.map(clean);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>key!=='$schema'&&key!=='default').map(([key,item])=>[key,clean(item)]));
  return value;
 };
 return {type:'json_schema',name:'studio_output',strict:true,schema:clean(definition)};
}
