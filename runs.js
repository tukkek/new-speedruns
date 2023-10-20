const API='https://www.speedrun.com/api/v1/'
const RATE=Math.ceil(60*1000/100)
const FILTER=document.querySelector('#filter')
const FILTERED='toponly'
const FROM=document.querySelector('#from')
const TO=document.querySelector('#to')
const COUNT=document.querySelector('#count span')
const FORMAT=Intl.NumberFormat()

var next=API+'runs?status=verified&orderby=verify-date&direction=desc&embed=game,category'
var urls=new Set()
var duration=[-Number.MAX_VALUE,+Number.MAX_VALUE]

function hide(a){
  if(duration[0]<=a.hours&&a.hours<=duration[1]){
    a.classList.remove('hidden')
    return false
  }
  a.classList.add('hidden')
  return true
}

function add(run){
  let level=run['level']
  let href=run['weblink']
  if(level) return
  let a=document.createElement('a')
  a.classList.add('run')
  a.run=run
  a.href=href
  a.target='_blank'
  let name=run['game']['data']['names']['international']
  let category=run['category']['data']['name']
  let time=run['times']['primary_t']
  let hours=Math.round(Math.floor(time/60/60))
  let minutes=Math.round(Math.floor(time/60))
  minutes=minutes%60
  if(minutes<10) minutes='0'+minutes
  time=`${hours}h${minutes}m`
  a.hours=hours+minutes/60
  a.innerHTML=`${name} - ${category}, ${time}`
  hide(a)
  document.body.appendChild(a)
}

async function scan(){
  if(!next) return
  let url=next
  next=false
  let runs=await fetch(url)
  runs=await runs.json()
  for(let r of runs['data'].filter(r=>!urls.has(r['weblink']))){
    urls.add(r['weblink'])
    add(r)
  }
  let page=runs['pagination']['links'][1]||runs['pagination']['links'][0]
  next=page['uri']
  let nruns=document.querySelectorAll('.run').length
  COUNT.textContent=FORMAT.format(nruns)
}

async function rank(a){
  a.classList.add('ranked')
  let game=a.run['game']['data']['id']
  let category=a.run['category']['data']['id']
  let leaderboard=await fetch(API+`leaderboards/${game}/category/${category}`)
  leaderboard=await leaderboard.json()
  let l=leaderboard['data']['runs'].find(l=>l['run']['id']==a.run['id'])
  if(!l) return
  let rank=Number(l['place'])
  a.innerHTML=`#${rank}. ${a.innerHTML}`
  a.classList.add('rank'+rank)
}

async function tick(){
  let runs=Array.from(document.querySelectorAll('a'))
  let r=runs.find(r=>!r.classList.contains('ranked')&&!hide(r))
  if(r) rank(r)
  else scan()
}

function filter(){document.body.classList.toggle(FILTERED)}

function hideall(){
  duration=[Number(FROM.value)||-Number.MAX_VALUE,Number(TO.value)||+Number.MAX_VALUE]
  for(var a of document.querySelectorAll('a')) hide(a)
}

export function setup(){
  if(FILTER.checked) document.body.classList.add(FILTERED)
  hideall()
  setInterval(tick,RATE)
  FILTER.onclick=filter
  FROM.onchange=hideall
  TO.onchange=hideall
}
