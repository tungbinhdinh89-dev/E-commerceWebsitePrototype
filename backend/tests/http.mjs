import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { spawn, execFileSync } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const php = process.env.PHP_BINARY || join(root, '.tools/php/php.exe')
const envText = await readFile(join(root,'backend/.env'),'utf8')
const configured = Object.fromEntries(envText.split(/\r?\n/).filter((line)=>/^[A-Z_]+=/.test(line)).map((line)=>{const index=line.indexOf('=');return[line.slice(0,index),line.slice(index+1)]}))
const database = process.env.DB_TEST_DATABASE || configured.DB_TEST_DATABASE || `${configured.DB_DATABASE}_test`
assert.ok(database.endsWith('_test') && database !== configured.DB_DATABASE, 'Refusing to test against application database')
const token = randomBytes(8).toString('hex')
const prefix = `it-${token}-`
const environment = { ...process.env, DB_DATABASE: database, APP_SESSION_NAME: `TZTEST${token}`, APP_ENV: 'local' }
const fixture = (action) => execFileSync(php, [join(root,'backend/tests/http-fixtures.php'),action,token],{cwd:root,env:environment,encoding:'utf8'})
const data = JSON.parse(fixture('setup'))
const listener=createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');const port=listener.address().port;await new Promise((resolve)=>listener.close(resolve))
let serverLog=''
const server=spawn(php,['-d','upload_max_filesize=5M','-d','post_max_size=6M','-S',`127.0.0.1:${port}`,'-t',join(root,'backend/public'),join(root,'backend/router.php')],{cwd:root,env:environment,stdio:['ignore','ignore','pipe']})
server.stderr.on('data',(chunk)=>{serverLog=(serverLog+chunk).slice(-6000)})
const base=`http://127.0.0.1:${port}`
class Client {
  cookie='';csrf=''
  async request(path, body, expected=200, csrf=true) {
    const headers={};if(this.cookie)headers.Cookie=this.cookie
    if(body!==undefined){headers['Content-Type']='application/json';if(csrf)headers['X-CSRF-Token']=this.csrf}
    const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)})
    for(const cookie of response.headers.getSetCookie())if(cookie.startsWith(environment.APP_SESSION_NAME+'='))this.cookie=cookie.split(';')[0]
    const text=await response.text()
    assert.equal(response.status,expected,`${path}: ${response.status}: ${text.slice(0,300)}\n${serverLog}`)
    const payload=JSON.parse(text)
    assert.equal(payload.success,expected<400)
    if(payload.data?.csrfToken)this.csrf=payload.data.csrfToken
    return payload.data
  }
  async state(){return this.request('/api/store')}
  async post(action,body={},expected=200){return this.request('/api/store/'+action,body,expected)}
  async list(resource,query=''){return this.request('/api/store/list/'+resource+'?'+query)}
}
let passed=0
async function test(name,work){await work();passed++;console.log('[PASS] '+name)}
const guest=new Client(),admin=new Client(),member=new Client(),other=new Client()
let userId, otherId, orderId, articleId
const memberPassword=randomBytes(12).toString('hex')+'Aa9!'
const record=(title,extra='')=>({id:'',title,body:'Integration test content',extra,image:'',status:'published',createdAt:''})
async function saveContent(group,row){await admin.post('admin-content-save',{group,record:row});return (await admin.list(group,'admin=1&q='+encodeURIComponent(row.title))).items.find((item)=>item.title===row.title)}
async function worker(action,user,id=''){
 const child=spawn(php,[join(root,'backend/tests/order-worker.php'),action,String(user),String(id)],{cwd:root,env:environment,stdio:['ignore','pipe','pipe']})
 let output='',errors='';child.stdout.on('data',(d)=>{output+=d});child.stderr.on('data',(d)=>{errors+=d})
 const [code]=await once(child,'exit');assert.equal(code,0,errors);return JSON.parse(output)
}
try {
 for(let attempt=0;attempt<40;attempt++){try{await fetch(base+'/api/health');break}catch{await new Promise((r)=>setTimeout(r,100))}}
 await test('Guest state exposes no private users, orders, contacts or credentials',async()=>{
   const state=await guest.state();assert.ok(state.products.length>0);assert.equal(state.users.length,0);assert.equal(state.orders.length,0);assert.equal(state.content.contacts.length,0)
   assert.ok(!JSON.stringify(state).includes('password_hash'));assert.ok(!JSON.stringify(state).includes('passwordHash'))
   await guest.request('/api/store/list/users',undefined,401)
 })
 await test('Cookie/CSRF, registration uniqueness and server-assigned member roles',async()=>{
   await member.state();await other.state();await admin.state()
   await guest.request('/api/store/contact',{name:'Test user',email:prefix+'csrf@example.invalid',body:'Integration contact message'},403,false)
   await member.post('register',{name:'Integration member',email:prefix+'member@example.invalid',password:memberPassword,passwordConfirmation:memberPassword,role:'ADMIN'})
   await member.post('register',{name:'Duplicate member',email:prefix+'member@example.invalid',password:memberPassword,passwordConfirmation:memberPassword},409)
   await other.post('register',{name:'Integration other',email:prefix+'other@example.invalid',password:memberPassword,passwordConfirmation:memberPassword})
   await member.post('login',{email:prefix+'member@example.invalid',password:'wrong-password'},401)
   await guest.post('cart-add',{productId:data.product.id,quantity:1})
   await guest.post('login',{email:prefix+'member@example.invalid',password:memberPassword})
   const merged=await guest.state();assert.equal(merged.users[0].role,'MEMBER');assert.equal(merged.carts[merged.session][0].quantity,1)
   await member.post('login',{email:prefix+'member@example.invalid',password:memberPassword});userId=(await member.state()).session
   await other.post('login',{email:prefix+'other@example.invalid',password:memberPassword});otherId=(await other.state()).session
   await admin.post('login',{email:data.email,password:data.password});assert.equal((await admin.state()).users[0].role,'ADMIN')
   await member.post('admin-product-delete',{id:data.product.id},403)
 })
 await test('Persistent favorites, profile and member carts reload from MySQL',async()=>{
   await member.post('favorite',{productId:data.product.id});assert.ok((await member.state()).favorites[userId].includes(data.product.id))
   const favorites=await member.list('products','favorites=1');assert.ok(favorites.items.some((p)=>p.id===data.product.id))
   await member.post('profile',{name:'Integration updated',phone:'0900000000',address:'Integration address 123'})
   assert.equal((await member.state()).users[0].name,'Integration updated')
   await member.post('cart-quantity',{productId:data.product.id,quantity:2})
   await member.post('cart-quantity',{productId:data.product.id,quantity:9999},409)
   assert.equal((await member.state()).carts[userId][0].quantity,2)
 })
 await test('Checkout recomputes money, rolls back mismatches and enforces ownership',async()=>{
   const input={name:'Integration buyer',phone:'0900000000',address:'Integration address 123',note:'Test',coupon:''}
   const before=await member.request('/api/store/item/products/'+data.product.id)
   await member.post('checkout',{...input,expectedTotal:'1.00'},409)
   assert.equal((await member.request('/api/store/item/products/'+data.product.id)).stock,before.stock)
   assert.equal((await member.state()).carts[userId][0].quantity,2)
   orderId=(await member.post('checkout',{...input,price:1,total:1})).result
   const order=await member.request('/api/store/item/orders/'+orderId)
   assert.equal(order.items[0].price,'100000.00');assert.equal(order.items[0].quantity,2);assert.equal((await member.state()).carts[userId].length,0)
   await other.request('/api/store/item/orders/'+orderId,undefined,404)
   await member.post('admin-order-status',{id:orderId,status:'cancelled'},403)
   await admin.post('admin-order-status',{id:orderId,status:'cancelled'})
   await admin.post('admin-order-status',{id:orderId,status:'cancelled'},409)
   assert.equal((await member.request('/api/store/item/products/'+data.product.id)).stock,before.stock)
 })
 await test('CMS data, moderation, contacts and subscriptions persist with scoped access',async()=>{
   const article=await saveContent('articles',record(prefix+'article','Integration'));articleId=article.id
   await member.post('comment',{articleId,body:'Integration comment '+prefix})
   assert.equal((await guest.list('comments','articleId='+articleId)).items.length,0)
   const comments=await admin.list('comments','admin=1&articleId='+articleId)
   await admin.post('admin-content-save',{group:'comments',record:{...comments.items[0],status:'published'}})
   assert.equal((await guest.list('comments','articleId='+articleId)).items.length,1)
   for(const group of ['faqs','company','services','pricing','settings']){
     const created=await saveContent(group,record(prefix+group,group==='pricing'?'150000':''));assert.ok(created?.id)
     await admin.post('admin-content-save',{group,record:{...created,body:'Updated database content'}})
     assert.equal((await admin.list(group,'admin=1&q='+encodeURIComponent(created.title))).items[0].body,'Updated database content')
     await admin.post('admin-content-delete',{group,id:created.id})
   }
   await guest.post('contact',{name:'Integration contact',email:prefix+'contact@example.invalid',body:'Integration contact message'})
   await member.request('/api/store/list/contacts',undefined,403)
   const contacts=await admin.list('contacts','admin=1&q='+encodeURIComponent(prefix))
   assert.equal(contacts.items[0].status,'new')
   await admin.post('admin-content-save',{group:'contacts',record:{...contacts.items[0],status:'resolved'}})
   await guest.post('newsletter',{email:prefix+'newsletter@example.invalid'})
   await guest.post('newsletter',{email:prefix+'newsletter@example.invalid'},409)
 })
 await test('Real image upload and media metadata, no external image URLs',async()=>{
   const image=new FormData();image.append('image',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHj8AAAAASUVORK5CYII=','base64')],{type:'image/png'}),'test.png')
   const result=await fetch(base+'/api/store/admin-upload',{method:'POST',headers:{Cookie:admin.cookie,'X-CSRF-Token':admin.csrf},body:image})
   const payload=await result.json();assert.equal(result.status,200,JSON.stringify(payload));assert.match(payload.data.path,/^\/uploads\/site\/[a-f0-9]+\.png$/)
   const created=await saveContent('media',{...record(prefix+'media'),image:payload.data.path});assert.ok(created.id)
   assert.equal((await fetch(base+payload.data.path)).status,200)
   await admin.post('admin-product-save',{...data.product,image:'https://example.invalid/external.png'},422)
 })
 await test('Concurrent checkouts cannot oversell; concurrent cancellations restore once',async()=>{
   await admin.post('admin-product-save',{...data.product,stock:1})
   await member.post('cart-quantity',{productId:data.product.id,quantity:1});await other.post('cart-quantity',{productId:data.product.id,quantity:1})
   const outcomes=await Promise.all([worker('checkout',userId),worker('checkout',otherId)])
   assert.equal(outcomes.filter((r)=>r.ok).length,1);assert.equal(outcomes.filter((r)=>r.status===409).length,1)
   assert.equal((await member.request('/api/store/item/products/'+data.product.id)).stock,0)
   const winner=outcomes.find((r)=>r.ok)
   const cancellations=await Promise.all([worker('cancel',data.adminId,winner.id),worker('cancel',data.adminId,winner.id)])
   assert.equal(cancellations.filter((r)=>r.ok).length,1);assert.equal(cancellations.filter((r)=>r.status===409).length,1)
   assert.equal((await member.request('/api/store/item/products/'+data.product.id)).stock,1)
 })
 await test('Locked accounts lose their session and logout invalidates authentication',async()=>{
   await admin.post('admin-user-toggle',{id:otherId});assert.equal((await other.state()).session,null)
   await member.post('logout');assert.equal((await member.state()).session,null)
 })
 console.log(`HTTP integration: ${passed} scenarios passed on ${database}.`)
}finally{
 server.kill();await once(server,'exit').catch(()=>{})
 fixture('cleanup')
}
