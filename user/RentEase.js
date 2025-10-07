// --- Elements
const listingsEl = document.getElementById('listings');
const searchEl = document.getElementById('search');
const typeEl = document.getElementById('type');
const maxPriceEl = document.getElementById('maxPrice');
const priceDisplay = document.getElementById('priceDisplay');
const resetBtn = document.getElementById('reset');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const categoryEl = document.getElementById('category');
const listingTitle = document.getElementById('listingTitle');
const sortEl = document.getElementById('sort');
const loadingEl = document.getElementById('loading');

// Modals
const contactModal = document.getElementById('contactModal');
const openContactBtn = document.getElementById('openContact');
const closeContactBtn = document.getElementById('closeContact');
const sendMsgBtn = document.getElementById('sendMsg');

// Booking
const bookingModal = document.getElementById('bookingModal');
const bookingItem = document.getElementById('bookingItem');
const startDateEl = document.getElementById('startDate');
const endDateEl = document.getElementById('endDate');
const quantityEl = document.getElementById('quantity');
const closeBookingBtn = document.getElementById('closeBooking');
const confirmBookingBtn = document.getElementById('confirmBooking');
const bookingsList = document.getElementById('bookingsList');
const historyList = document.getElementById('historyList');

// Review
const reviewModal = document.getElementById('reviewModal');
const reviewItem = document.getElementById('reviewItem');
const reviewText = document.getElementById('reviewText');
const closeReviewBtn = document.getElementById('closeReview');
const submitReviewBtn = document.getElementById('submitReview');

// Item modal content
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalLocation = document.getElementById('modalLocation');
const modalPrice = document.getElementById('modalPrice');
const modalDesc = document.getElementById('modalDesc');

// --- Data
const data = {
  property: [
    { id:1, title:'Cozy 1BR near BGC', price:28000, location:'Taguig', type:'apartment', img:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200', description:'Bright 1-bedroom apartment with balcony, 24/7 security.'},
    { id:2, title:'Family Townhouse in QC', price:42000, location:'Quezon City', type:'townhouse', img:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200', description:'Spacious townhouse in a quiet subdivision with garden.'},
  ],
  car: [
    { id:4, title:'Toyota Vios 2021', price:2500, location:'Manila', type:'sedan', img:'https://images.unsplash.com/photo-1605559424843-9d36b7a3d8ec?q=80&w=1200', description:'Fuel-efficient sedan, perfect for city driving.'},
    { id:5, title:'Honda CR-V SUV', price:4000, location:'Cebu', type:'suv', img:'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=1200', description:'Spacious SUV ideal for family trips.'},
  ],
};

const typeOptions = {
  property: ['any','apartment','townhouse'],
  car: ['any','sedan','suv'],
  equipment: ['any','camera','drone'],
};

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let reviews = JSON.parse(localStorage.getItem('reviews')) || {};
let currentBookingTitle = '';
let reviewTarget = '';

// --- Functions
function populateTypes(category) {
  typeEl.innerHTML = typeOptions[category].map(t=>`<option value="${t}">${t}</option>`).join('');
}

function render() {
  loadingEl.style.display = 'block';
  listingsEl.innerHTML = '';
  setTimeout(() => {
    const query = searchEl.value.toLowerCase();
    const filterType = typeEl.value;
    const maxPrice = Number(maxPriceEl.value);
    const category = categoryEl.value;
    const sort = sortEl.value;

    listingTitle.textContent = category==='property'?'Property Listings':'Car Rentals';
    let filtered = [...(data[category]||[])].filter(p=>{
      return (filterType==='any'||p.type===filterType) && p.price<=maxPrice &&
        (!query || `${p.title} ${p.location} ${p.description}`.toLowerCase().includes(query));
    });

    if (sort==='asc') filtered.sort((a,b)=>a.price-b.price);
    if (sort==='desc') filtered.sort((a,b)=>b.price-a.price);

    listingsEl.innerHTML = filtered.map(p=>`
      <div class="card">
        <img src="${p.img}" alt="${p.title}">
        <div class="content">
          <h3>${p.title}
            <button class="favorite ${favorites.includes(p.id)?'active':''}" onclick="toggleFavorite(${p.id})">❤️</button>
          </h3>
          <div class="location">${p.location}</div>
          <div class="price">₱${p.price.toLocaleString()}</div>
          <div class="details">${p.type}</div>
          <button class="view" onclick="openModal('${category}',${p.id})">View</button>
        </div>
      </div>`).join('') || '<p>No results found</p>';
    loadingEl.style.display = 'none';
  },300);
}

function openModal(category,id) {
  const p = data[category].find(x=>x.id===id);
  if (!p) return;
  modalImg.src=p.img; modalTitle.textContent=p.title;
  modalLocation.textContent=p.location;
  modalPrice.textContent='₱'+p.price.toLocaleString();
  modalDesc.textContent=p.description;

  // Hook up booking button
  document.getElementById('openBooking').onclick=()=>{
    modal.classList.remove('active');
    openBooking(p.title);
  };
  modal.classList.add('active');
}

function toggleFavorite(id){
  favorites=favorites.includes(id)?favorites.filter(f=>f!==id):[...favorites,id];
  localStorage.setItem('favorites',JSON.stringify(favorites));
  render();
}

function openBooking(title){
  currentBookingTitle=title;
  bookingItem.textContent="Booking: "+title;
  bookingModal.classList.add('active');
}

function renderBookings(){
  const today=new Date().toISOString().split("T")[0];
  const active=[], history=[];
  bookings.forEach(b=> b.end<today?history.push(b):active.push(b));

  bookingsList.innerHTML = active.length ? active.map(b=>`
    <div class="booking-card">
      <h3>${b.title}</h3>
      <p>${b.start} → ${b.end}</p>
      <p>Qty: ${b.quantity}</p>
    </div>`).join('') : '<p>No active bookings.</p>';

  historyList.innerHTML = history.length ? history.map(b=>`
    <tr>
      <td>${b.title}</td>
      <td>${b.start} → ${b.end}</td>
      <td>Completed</td>
      <td>${reviews[b.title]||"No review yet."}</td>
      <td><button class="contact" onclick="openReview('${b.title}')">Leave Review</button></td>
    </tr>`).join('') : '<tr><td colspan="5">No past rentals.</td></tr>';
}

function openReview(title){
  reviewTarget=title;
  reviewItem.textContent="Review for: "+title;
  reviewText.value=reviews[title]||'';
  reviewModal.classList.add('active');
}

// --- Events
closeModal.onclick=()=>modal.classList.remove('active');
maxPriceEl.oninput=()=>{priceDisplay.textContent=Number(maxPriceEl.value).toLocaleString();render();}
searchEl.oninput=render; typeEl.onchange=render; sortEl.onchange=render;
categoryEl.onchange=()=>{populateTypes(categoryEl.value);render();}
resetBtn.onclick=()=>{searchEl.value='';maxPriceEl.value=50000;priceDisplay.textContent='50,000';sortEl.value='default';populateTypes(categoryEl.value);render();}

closeBookingBtn.onclick=()=>bookingModal.classList.remove('active');
confirmBookingBtn.onclick=()=>{
  if(!startDateEl.value||!endDateEl.value){alert("Select start and end dates");return;}
  bookings.push({title:currentBookingTitle,start:startDateEl.value,end:endDateEl.value,quantity:quantityEl.value});
  localStorage.setItem('bookings',JSON.stringify(bookings));
  renderBookings(); bookingModal.classList.remove('active'); alert("Booking confirmed!");
};

closeReviewBtn.onclick=()=>reviewModal.classList.remove('active');
submitReviewBtn.onclick=()=>{reviews[reviewTarget]=reviewText.value;localStorage.setItem('reviews',JSON.stringify(reviews));renderBookings();reviewModal.classList.remove('active');};

// Init
populateTypes(categoryEl.value); render(); renderBookings();
