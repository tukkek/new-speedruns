import Dexie from "../lib/dexie.mjs";

const DATE=new Intl.DateTimeFormat().format(Date.now())
const OVERQUOTA='QuotaExceededError'

var database=new Dexie("new-speedruns-cache");
var requests=false

export function setup(){
  database.version(1).stores({requests:'[url+date],date'})
  requests=database.requests
  requests.where('date').notEqual(DATE).delete()
    //.then(n=>console.log('Cleaning cache',n)) //TODO
}

function handle(error){
  let i=error.inner
  if(!(error.name==OVERQUOTA||(i&&i.name==OVERQUOTA))) return
  let c=requests.count()
  requests.clear()
  console.log('Clearing cache',c,requests.count())//TODO test
  throw error
}

export function set(url,reply){
  requests.put({'url':url,'reply':reply,'date':DATE}).catch(handle)
//   console.log('Caching',DATE,url)//TODO
}

export async function get(url){
  let cached=await requests.get({'url':url,'date':DATE})
//   if(cached) console.log('Found',url)//TODO
  return cached&&cached['reply']
}
