/*
admin.js - Mock Admin Dashboard functionality
Uses localStorage as a mock backend. Self-contained.
*/

const VIEWS = ["overview","users","items","bookings","settings","logs"];

// -- Utilities
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const nowStr = () => (new Date()).toISOString();

// -- State (load from localStorage or seed)
let state = {
users: JSON.parse(localStorage.getItem('admin_users')) || [
{ id: 1, name: "Alice Ramos", email: "[alice@example.com](mailto:alice@example.com)", role: "user", active: true },
{ id: 2, name: "Ben Cruz", email: "[ben@example.com](mailto:ben@example.com)", role: "renter", active: true },
{ id: 3, name: "Manager", email: "manager@rentease", role: "admin", active: true }
],
items: JSON.parse(localStorage.getItem('admin_items')) || [
{ id: 1, title: "City Sedan", category: "Vehicle", price: 2500, location: "Manila", active: true },
{ id: 2, title: "Sunny Residences", category: "Apartment", price: 15000, location: "Quezon City", active: true },
{ id: 3, title: "Power Drill", category: "Equipment", price: 800, location: "Makati", active: true }
],
bookings: JSON.parse(localStorage.getItem('admin_bookings')) || [
{ id: 1, item: "City Sedan", user: "[alice@example.com](mailto:alice@example.com)", start: "2025-08-10", end: "2025-08-11", qty:1, status:"Paid" },
{ id: 2, item: "Sunny Residences", user: "[ben@example.com](mailto:ben@example.com)", start: "2025-08-01", end: "2025-08-31", qty:1, status:"Paid" },
{ id: 3, item: "Power Drill", user: "[alice@example.com](mailto:alice@example.com)", start: "2025-07-15", end: "2025-07-15", qty:1, status:"Not Paid" }
],
reviews: JSON.parse(localStorage.getItem('admin_reviews')) || {}
};

function persist(){
localStorage.setItem('admin_users', JSON.stringify(state.users));
localStorage.setItem('admin_items', JSON.stringify(state.items));
localStorage.setItem('admin_bookings', JSON.stringify(state.bookings));
localStorage.setItem('admin_reviews', JSON.stringify(state.reviews));
}

// -- Navigation
$$('.nav-btn').forEach(btn=>{
btn.addEventListener('click', ()=>{
$$('.nav-btn').forEach(b=>b.classList.remove('active'));
btn.classList.add('active');
const view = btn.dataset.view;
showView(view);
});
});

function showView(name){
VIEWS.forEach(v => { const el = $(`#view-${v}`); if(el) el.classList.toggle('active', v===name); });
// refresh stats when switching
renderStats();
if(name==='users') renderUsers();
if(name==='items') renderItems();
if(name==='bookings') renderBookings();
if(name==='logs') renderLogs();
}

// -- GLOBAL SEARCH
$('#globalSearch').addEventListener('input', e=>{
const q = e.target.value.trim().toLowerCase();
if(q.length<2) return;
// quick highlight: switch to relevant view
const userMatch = state.users.find(u=>u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
const itemMatch = state.items.find(i=>i.title.toLowerCase().includes(q));
const bookingMatch = state.bookings.find(b=>b.item.toLowerCase().includes(q) || b.user.toLowerCase().includes(q));
if(userMatch) { $('.nav-btn[data-view="users"]').click(); $('#usersFilter').value=q; renderUsers(); }
else if(itemMatch){ $('.nav-btn[data-view="items"]').click(); $('#itemsFilter').value=q; renderItems(); }
else if(bookingMatch){ $('.nav-btn[data-view="bookings"]').click(); $('#bookingsFilter').value=q; renderBookings(); }
});

// -- STATISTICS & RECENT ACTIVITY
function renderStats(){
const totalUsers = state.users.length;
const totalItems = state.items.length;
const totalBookings = state.bookings.length;
$('#statUsers').textContent = totalUsers;
$('#statItems').textContent = totalItems;
$('#statBookings').textContent = totalBookings;

$('#ov-users').textContent = totalUsers;
$('#ov-items').textContent = totalItems;
$('#ov-bookings').textContent = state.bookings.filter(b=>{
const today = new Date().toISOString().split('T')[0];
return b.end >= today;
}).length;

// mock revenue: sum price * qty for paid bookings
let rev = 0;
state.bookings.forEach(b=>{
if(b.status && b.status.toLowerCase().includes('paid')){
const it = state.items.find(i=>i.title===b.item);
if(it) rev += (it.price||0)*(b.qty||1);
}
});
$('#ov-revenue').textContent = '₱' + rev.toLocaleString();

// recent activity (mix)
const activity = [];
// bookings
state.bookings.slice(-8).reverse().forEach(b=>{
activity.push(`${b.user} booked ${b.item} (${b.start} → ${b.end})`);
});
// items added
state.items.slice(-4).reverse().forEach(i=>{
activity.push(`Item added: ${i.title} (${i.category})`);
});
const list = $('#recentActivity');
list.innerHTML = activity.map(a=>`<li>${a}</li>`).join('');
}

// -- USERS MANAGEMENT
function renderUsers(){
const filter = $('#usersFilter').value.trim().toLowerCase();
const tbody = $('#usersTable');
const rows = state.users.filter(u=>{
if(!filter) return true;
return u.name.toLowerCase().includes(filter) || u.email.toLowerCase().includes(filter) || (u.role||'').toLowerCase().includes(filter);
}).map(u=>`     <tr>       <td>${u.name}</td>       <td>${u.email}</td>       <td>${u.role}</td>       <td>${u.active ? 'Active' : '<span style="color:#e57373">Disabled</span>'}</td>       <td>         <button class="btn small" onclick="editUser(${u.id})">Edit</button>         <button class="btn small" onclick="toggleUser(${u.id})">${u.active ? 'Disable' : 'Enable'}</button>         <button class="btn small" onclick="deleteUser(${u.id})">Delete</button>       </td>     </tr>
  `).join('');
tbody.innerHTML = rows || `<tr><td colspan="5" style="color:var(--muted)">No users found</td></tr>`;
}

window.editUser = function(id){
const user = state.users.find(u=>u.id===id);
openModal(`Edit User: ${user.name}`, `     <label>Name</label><input id="m_name" value="${user.name}">     <label>Email</label><input id="m_email" value="${user.email}">     <label>Role</label>     <select id="m_role">       <option ${user.role==='user'?'selected':''}>user</option>       <option ${user.role==='renter'?'selected':''}>renter</option>       <option ${user.role==='admin'?'selected':''}>admin</option>     </select>     <label><input type="checkbox" id="m_active" ${user.active?'checked':''}/> Active</label>
  `, ()=>{
user.name = $('#m_name').value.trim() || user.name;
user.email = $('#m_email').value.trim() || user.email;
user.role = $('#m_role').value;
user.active = !!$('#m_active').checked;
persist(); renderUsers(); renderStats(); addLog(`User edited: ${user.email}`);
});
};

window.toggleUser = function(id){
const user = state.users.find(u=>u.id===id);
user.active = !user.active;
persist(); renderUsers(); addLog(`${user.active?'Enabled':'Disabled'} user: ${user.email}`);
renderStats();
};

window.deleteUser = function(id){
if(!confirm('Delete user? This is irreversible (mock).')) return;
const idx = state.users.findIndex(u=>u.id===id);
if(idx>=0){ addLog(`Deleted user ${state.users[idx].email}`); state.users.splice(idx,1); persist(); renderUsers(); renderStats(); }
};

$('#addUserBtn').addEventListener('click', ()=>{
openModal('Add User', `     <label>Name</label><input id="m_name" value="">     <label>Email</label><input id="m_email" value="">     <label>Role</label>     <select id="m_role"><option>user</option><option>renter</option><option>admin</option></select>
  `, ()=>{
const name = $('#m_name').value.trim();
const email = $('#m_email').value.trim();
const role = $('#m_role').value;
if(!name||!email) { alert('Name and email required'); return; }
const id = (state.users.reduce((s,u)=>Math.max(s,u.id),0)||0)+1;
state.users.push({id,name,email,role,active:true});
persist(); renderUsers(); renderStats(); addLog(`Added user ${email}`);
});
});

$('#usersFilter').addEventListener('input', renderUsers);

// -- ITEMS MANAGEMENT
function renderItems(){
const filter = $('#itemsFilter').value.trim().toLowerCase();
const tbody = $('#itemsTable');
const rows = state.items.filter(i=>{
if(!filter) return true;
return i.title.toLowerCase().includes(filter) || (i.category||'').toLowerCase().includes(filter) || (i.location||'').toLowerCase().includes(filter);
}).map(i=>`     <tr>       <td>${i.title}</td>       <td>${i.category}</td>       <td>₱${Number(i.price).toLocaleString()}</td>       <td>${i.location}</td>       <td>         <button class="btn small" onclick="editItem(${i.id})">Edit</button>         <button class="btn small" onclick="toggleItem(${i.id})">${i.active?'Disable':'Enable'}</button>         <button class="btn small" onclick="deleteItem(${i.id})">Delete</button>       </td>     </tr>
  `).join('');
tbody.innerHTML = rows || `<tr><td colspan="5" style="color:var(--muted)">No items found</td></tr>`;
}

window.editItem = function(id){
const it = state.items.find(x=>x.id===id);
openModal(`Edit Item: ${it.title}`, `     <label>Title</label><input id="m_title" value="${it.title}">     <label>Category</label><input id="m_cat" value="${it.category}">     <label>Price</label><input id="m_price" value="${it.price}">     <label>Location</label><input id="m_loc" value="${it.location}">     <label><input type="checkbox" id="m_active_item" ${it.active?'checked':''}/> Active</label>
  `, ()=>{
it.title = $('#m_title').value.trim() || it.title;
it.category = $('#m_cat').value.trim() || it.category;
it.price = Number($('#m_price').value) || it.price;
it.location = $('#m_loc').value.trim() || it.location;
it.active = !!$('#m_active_item').checked;
persist(); renderItems(); renderStats(); addLog(`Item edited: ${it.title}`);
});
};

window.toggleItem = function(id){
const it = state.items.find(x=>x.id===id);
it.active = !it.active; persist(); renderItems(); addLog(`${it.active?'Enabled':'Disabled'} item: ${it.title}`); renderStats();
};

window.deleteItem = function(id){
if(!confirm('Delete item?')) return;
const idx = state.items.findIndex(x=>x.id===id);
if(idx>=0){ addLog(`Deleted item ${state.items[idx].title}`); state.items.splice(idx,1); persist(); renderItems(); renderStats(); }
};

$('#addItemBtn').addEventListener('click', ()=>{
openModal('Add Item', `     <label>Title</label><input id="m_title" value="">     <label>Category</label><input id="m_cat" value="">     <label>Price</label><input id="m_price" value="">     <label>Location</label><input id="m_loc" value="">
  `, ()=>{
const title = $('#m_title').value.trim();
const cat = $('#m_cat').value.trim();
const price = Number($('#m_price').value) || 0;
const loc = $('#m_loc').value.trim();
if(!title) { alert('Title required'); return; }
const id = (state.items.reduce((s,i)=>Math.max(s,i.id),0)||0)+1;
state.items.push({id,title,category:cat,price,location:loc,active:true});
persist(); renderItems(); renderStats(); addLog(`Added item ${title}`);
});
});

$('#itemsFilter').addEventListener('input', renderItems);

// -- BOOKINGS
function renderBookings(){
const filter = $('#bookingsFilter').value.trim().toLowerCase();
const tbody = $('#bookingsTable');
const rows = state.bookings.filter(b=>{
if(!filter) return true;
return (b.item||'').toLowerCase().includes(filter) || (b.user||'').toLowerCase().includes(filter) || (b.start||'').includes(filter);
}).map(b=>`     <tr>       <td>${b.item}</td>       <td>${b.user}</td>       <td>${b.start}</td>       <td>${b.end}</td>       <td>${b.qty}</td>       <td>${b.status}</td>       <td>         <button class="btn small" onclick="viewBooking(${b.id})">View</button>         <button class="btn small" onclick="updateBookingStatus(${b.id},'Paid')">Mark Paid</button>         <button class="btn small" onclick="updateBookingStatus(${b.id},'Cancelled')">Cancel</button>       </td>     </tr>
  `).join('');
tbody.innerHTML = rows || `<tr><td colspan="7" style="color:var(--muted)">No bookings</td></tr>`;
}

window.viewBooking = function(id){
const b = state.bookings.find(x=>x.id===id);
openModal(`Booking: ${b.item}`, `     <div class="kv"><strong>User:</strong><span>${b.user}</span></div>     <div class="kv"><strong>Start:</strong><span>${b.start}</span></div>     <div class="kv"><strong>End:</strong><span>${b.end}</span></div>     <div class="kv"><strong>Qty:</strong><span>${b.qty}</span></div>     <div class="kv"><strong>Status:</strong><span>${b.status}</span></div>
  `, ()=>{ /* no save */ });
};

window.updateBookingStatus = function(id, status){
const b = state.bookings.find(x=>x.id===id);
b.status = status;
persist(); renderBookings(); renderStats(); addLog(`Booking ${id} set to ${status}`);
};

// bookings filter
$('#bookingsFilter').addEventListener('input', renderBookings);

// Export bookings CSV
$('#exportBookingsBtn').addEventListener('click', ()=>{
const csv = [
['id','item','user','start','end','qty','status'],
...state.bookings.map(b=>[b.id,b.item,b.user,b.start,b.end,b.qty,b.status])
].map(r=>r.join(',')).join('\n');
const blob = new Blob([csv],{type:'text/csv'}), url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href=url; a.download='bookings.csv'; a.click(); URL.revokeObjectURL(url);
});

// -- SETTINGS
$('#setting-maintenance').checked = JSON.parse(localStorage.getItem('setting-maintenance') || 'false');
$('#setting-allow-guest').checked = JSON.parse(localStorage.getItem('setting-allow-guest') || 'true');
$('#setting-email-notifs').checked = JSON.parse(localStorage.getItem('setting-email-notifs') || 'false');
$('#setting-reviews').checked = JSON.parse(localStorage.getItem('setting-reviews') || 'true');

['setting-maintenance','setting-allow-guest','setting-email-notifs','setting-reviews'].forEach(id=>{
$(`#${id}`).addEventListener('change', e=>{
localStorage.setItem(id, JSON.stringify(e.target.checked));
addLog(`Setting ${id} set to ${e.target.checked}`);
});
});

// -- LOGS
const LOGS_KEY = 'admin_logs';
function addLog(text){
const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
logs.push({t:nowStr(), text});
localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(-200)));
renderLogs();
}
function renderLogs(){
const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]').slice().reverse();
$('#logList').innerHTML = logs.map(l=>`<li>${new Date(l.t).toLocaleString()}: ${l.text}</li>`).join('') || '<li style="color:var(--muted)">No logs</li>';
}

// -- Rental History Table with star ratings & reviews (derived from bookings + reviews store)
function renderHistoryTable(){
const today = new Date().toISOString().split('T')[0];
const history = state.bookings.filter(b=>b.end < today);
const tbody = $('#historyList');
tbody.innerHTML = history.length ? history.map(b=>{
const rating = state.reviews[b.item] || 0;
return `<tr>       <td>${b.item}</td>       <td>${b.category||'N/A'}</td>       <td>${formatDate(b.start)}</td>       <td>${formatDate(b.end)}</td>       <td class="${b.status==='Paid'?'status-paid':'status-not-paid'}">${b.status}</td>       <td><div class="stars" data-item="${b.item}">${[1,2,3,4,5].map(n=>`<span data-star="${n}">${n<=rating?'★':'☆'}</span>`).join('')}</div></td>     </tr>`;
}).join('') : '<tr><td colspan="6" style="color:var(--muted)">No past rentals.</td></tr>';
initStarRatings();
}

// star click
function initStarRatings(){
$$('.stars span').forEach(st=>{
st.addEventListener('click', ()=> {
const item = st.parentElement.getAttribute('data-item');
const val = Number(st.getAttribute('data-star'));
state.reviews[item] = val;
persist();
addLog(`Rating set for ${item}: ${val} stars`);
renderHistoryTable();
});
});
}

// helper
function formatDate(s){
try{ const d = new Date(s); return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}); }catch(e){return s}
}

// -- MODAL UTIL
const modalOverlay = $('#modalOverlay');
const modalBody = $('#modalBody');
const modalTitleText = $('#modalTitleText');
const modalCancel = $('#modalCancel');
const modalSave = $('#modalSave');

function openModal(title, htmlBody='', onSave=null){
modalTitleText.textContent = title;
modalBody.innerHTML = htmlBody;
modalOverlay.classList.add('active');
modalSave.onclick = ()=>{
try{ if(onSave) onSave(); }catch(err){alert('Save error: '+err.message)}
modalOverlay.classList.remove('active');
};
modalCancel.onclick = ()=> modalOverlay.classList.remove('active');
}

// -- Initialization and events
function init(){
renderStats();
renderUsers();
renderItems();
renderBookings();
renderLogs();
renderHistoryTable();
// input filters
$('#usersFilter').addEventListener('input', renderUsers);
$('#itemsFilter').addEventListener('input', renderItems);
// quick add logs
addLog('Admin UI initialized');
}

init();

// Expose for console/debug
window._state = state;
window.addLog = addLog;
window.renderHistoryTable = renderHistoryTable;
window.renderBookings = renderBookings;
