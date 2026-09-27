export async function register(){
 if(process.env.NEXT_RUNTIME==='nodejs'&&process.env.GV_RUNTIME==='1'){
  const {startExpressionRefresh}=await import('./lib/expression-refresh');
  startExpressionRefresh();
 }
}
