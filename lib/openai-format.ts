import {z} from 'zod';
// Restrict generation to the same object/array/string shapes validated by Zod.
// Defaults support legacy projects; new model responses must supply every field.
export function structuredFormat(schema:z.ZodType){
 const convert=(node:z.ZodType):Record<string,unknown>=>{
  if(node instanceof z.ZodDefault)return convert(node.removeDefault());
  if(node instanceof z.ZodString)return {type:'string',...(node.minLength!==null?{minLength:node.minLength}:{}),...(node.maxLength!==null?{maxLength:node.maxLength}:{})};
  if(node instanceof z.ZodObject){const shape=node.shape as Record<string,z.ZodType>;return {type:'object',properties:Object.fromEntries(Object.entries(shape).map(([key,item])=>[key,convert(item)])),required:Object.keys(shape),additionalProperties:false};}
  if(node instanceof z.ZodArray)return {type:'array',items:convert(node.element),...(node._def.minLength?{minItems:node._def.minLength.value}:{}),...(node._def.maxLength?{maxItems:node._def.maxLength.value}:{})};
  throw new Error('Unsupported studio output schema');
 };
 return {type:'json_schema',name:'studio_output',strict:true,schema:convert(schema)};
}
